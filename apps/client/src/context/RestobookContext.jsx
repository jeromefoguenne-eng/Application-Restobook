import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { soundEngine } from '../utils/soundEngine';
import { cloudSync } from '../utils/cloudSync';
import { useAuth } from './AuthContext';
import { mockTables, mockMenuItems, mockMenuCategories } from '../../../../packages/shared/src/mocks/seedData.js';

const RestobookContext = createContext(null);

const getHostUrl = () => {
  try {
    if (typeof window === 'undefined' || !window.location) return 'localhost';
    const host = window.location.hostname;
    if (!host || host === 'localhost' || window.location.protocol === 'file:') {
      return 'localhost';
    }
    return host;
  } catch (e) {
    return 'localhost';
  }
};

const DEFAULT_SERVER_URL = `ws://${getHostUrl()}:4001`;

export const AVAILABLE_CURRENCIES = [
  { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (FCFA)', flag: '🇧🇯' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', name: 'Dollar US ($)', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling (£)', flag: '🇬🇧' },
  { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse (CHF)', flag: '🇨🇭' },
  { code: 'CAD', symbol: 'CA$', name: 'Dollar Canadien (CA$)', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonais (¥)', flag: '🇯🇵' },
  { code: 'MAD', symbol: 'DH', name: 'Dirham Marocain (DH)', flag: '🇲🇦' }
];

export const RestobookProvider = ({ children }) => {
  const { currentUser, activePoste } = useAuth();
  const clientIdRef = useRef('client_' + Math.random().toString(36).substring(2, 9));

  const [activeMode, setActiveMode] = useState('duo'); // 'salle' | 'cuisine' | 'duo'
  const [sessionId, setSessionId] = useState('resto_demo_central');
  const [pairingCode, setPairingCode] = useState('CENTRAL-2026');
  const [connected, setConnected] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currency, setCurrency] = useState(AVAILABLE_CURRENCIES[0]);
  const [restaurantName, setRestaurantName] = useState('Bistrot Le Central');

  const [tables, setTables] = useState(() => JSON.parse(JSON.stringify(mockTables || [])));
  const [tickets, setTickets] = useState([]);
  const [menuCategories, setMenuCategories] = useState(() => JSON.parse(JSON.stringify(mockMenuCategories || [])));
  const [menuItems, setMenuItems] = useState(() => JSON.parse(JSON.stringify(mockMenuItems || [])));
  const [reservations, setReservations] = useState([
    {
      id: 'res_1',
      customerName: 'Dupont Marc',
      phone: '+33 6 12 34 56 78',
      guests: 4,
      time: '20:00',
      service: 'soir',
      tableId: 'table_2',
      status: 'confirmed',
      notes: 'Anniversaire de mariage'
    }
  ]);
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [latestAlarm, setLatestAlarm] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Synchroniser activeMode avec le poste choisi
  useEffect(() => {
    if (activePoste) {
      setActiveMode(activePoste);
    }
  }, [activePoste]);

  // Sauvegarder l'état du restaurant en localStorage ET dans le Cloud (retained)
  const saveRestoState = (updates = {}) => {
    const rId = currentUser?.restaurantId || sessionId;
    try {
      const stateToSave = {
        tables: updates.tables !== undefined ? updates.tables : tables,
        tickets: updates.tickets !== undefined ? updates.tickets : tickets,
        menuCategories: updates.menuCategories !== undefined ? updates.menuCategories : menuCategories,
        menuItems: updates.menuItems !== undefined ? updates.menuItems : menuItems,
        reservations: updates.reservations !== undefined ? updates.reservations : reservations,
        restaurantName: updates.restaurantName !== undefined ? updates.restaurantName : restaurantName,
        currency: updates.currency !== undefined ? updates.currency : currency
      };
      // 1. Sauvegarde locale (offline-first)
      localStorage.setItem(`restobook_state_${rId}`, JSON.stringify(stateToSave));

      // 2. Sauvegarde persistante dans le Cloud mondial (retained) pour TOUS les appareils
      cloudSync.publishProjectState(rId, stateToSave);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const enableSound = () => {
    soundEngine.init();
    soundEngine.playBellChime();
    setSoundEnabled(true);
  };

  // Traitement d'un message reçu (depuis Cloud MQTT, BroadcastChannel ou WebSocket)
  const handleServerMessage = useCallback((msg) => {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'SESSION_INITIALIZED':
      case 'SYNC_STATE':
        if (msg.payload.tables) setTables(msg.payload.tables);
        if (msg.payload.tickets) {
          const initialTickets = (msg.payload.tickets || []).filter(
            (t, idx, self) => idx === self.findIndex(o => o.id === t.id)
          );
          setTickets(initialTickets);
        }
        if (msg.payload.menuCategories) setMenuCategories(msg.payload.menuCategories);
        if (msg.payload.menuItems) setMenuItems(msg.payload.menuItems);
        if (msg.payload.reservations) setReservations(msg.payload.reservations);
        if (msg.payload.activeAlarms) setActiveAlarms(msg.payload.activeAlarms);
        if (msg.payload.pairingCode) setPairingCode(msg.payload.pairingCode);
        if (msg.payload.name) setRestaurantName(msg.payload.name);
        if (msg.payload.currency) {
          const match = AVAILABLE_CURRENCIES.find(c => c.code === msg.payload.currency.code);
          setCurrency(match || msg.payload.currency);
        }
        break;

      case 'RESTAURANT_NAME_UPDATED':
        if (msg.payload.name) {
          setRestaurantName(msg.payload.name);
          saveRestoState({ restaurantName: msg.payload.name });
        }
        break;

      case 'CURRENCY_CHANGED':
        if (msg.payload.currency) {
          const match = AVAILABLE_CURRENCIES.find(c => c.code === msg.payload.currency.code);
          const newCurr = match || msg.payload.currency;
          setCurrency(newCurr);
          saveRestoState({ currency: newCurr });
        }
        break;

      case 'ORDER_CREATED':
        setTickets(prev => {
          const newTicket = msg.payload.ticket;
          if (!newTicket) return prev;
          if (prev.some(t => t.id === newTicket.id)) {
            return prev.map(t => t.id === newTicket.id ? newTicket : t);
          }
          const updated = [...prev, newTicket];
          saveRestoState({ tickets: updated });
          return updated;
        });
        if (msg.payload.tables) {
          setTables(msg.payload.tables);
          saveRestoState({ tables: msg.payload.tables });
        }
        soundEngine.playOrderSentTone();
        break;

      case 'TICKET_REORDERED':
        setTickets(msg.payload.tickets);
        saveRestoState({ tickets: msg.payload.tickets });
        break;

      case 'TICKET_UPDATED':
        setTickets(prev => {
          const updated = prev.map(t => t.id === msg.payload.ticket.id ? msg.payload.ticket : t);
          saveRestoState({ tickets: updated });
          return updated;
        });
        break;

      // 🚨 RÉCEPTION D'UNE ALARME DE CUISINE
      case 'ORDER_READY': {
        const { ticket, tables: updatedTables, activeAlarms: updatedAlarms, alarm } = msg.payload;
        if (updatedTables) {
          setTables(updatedTables);
          saveRestoState({ tables: updatedTables });
        }
        const finalAlarms = updatedAlarms || [];
        setActiveAlarms(finalAlarms);
        if (ticket) {
          setTickets(prev => {
            const updated = prev.map(t => t.id === ticket.id ? ticket : t);
            saveRestoState({ tickets: updated });
            return updated;
          });
        }
        const currentAlarm = alarm || (finalAlarms.length > 0 ? finalAlarms[finalAlarms.length - 1] : null);
        setLatestAlarm(currentAlarm);

        // Déclencher le carillon et l'alarme
        soundEngine.startKitchenAlarm();
        break;
      }

      // 🔕 ACQUITTEMENT PAR LE SERVEUR
      case 'ORDER_ACKNOWLEDGED': {
        const { activeAlarms: updatedAlarms, tables: updatedTables } = msg.payload;
        if (updatedTables) {
          setTables(updatedTables);
          saveRestoState({ tables: updatedTables });
        }
        if (updatedAlarms) {
          setActiveAlarms(updatedAlarms);
          if (updatedAlarms.length === 0) {
            soundEngine.stopKitchenAlarm();
            setLatestAlarm(null);
          } else {
            setLatestAlarm(updatedAlarms[updatedAlarms.length - 1]);
          }
        }
        break;
      }

      case 'TABLES_LAYOUT_UPDATED':
        setTables(msg.payload.tables);
        saveRestoState({ tables: msg.payload.tables });
        break;

      case 'TABLE_BILLED':
        setTables(msg.payload.tables);
        setActiveAlarms(msg.payload.activeAlarms || []);
        saveRestoState({ tables: msg.payload.tables });
        break;

      case 'RESERVATION_ADDED':
        setReservations(msg.payload.reservations);
        saveRestoState({ reservations: msg.payload.reservations });
        break;

      case 'MENU_UPDATED':
        if (msg.payload.menuItems) {
          setMenuItems(msg.payload.menuItems);
          saveRestoState({ menuItems: msg.payload.menuItems });
        }
        break;

      case 'REQUEST_FULL_SYNC':
        // Un nouvel appareil rejoint le restaurant : on lui répond avec notre état complet
        cloudSync.publish({
          type: 'SYNC_STATE',
          restaurantId: currentUser?.restaurantId || sessionId,
          senderId: clientIdRef.current,
          payload: {
            tables,
            tickets,
            menuCategories,
            menuItems,
            reservations,
            activeAlarms,
            name: restaurantName,
            currency
          }
        });
        break;

      default:
        break;
    }
  }, [currentUser, sessionId, tables, tickets, menuCategories, menuItems, reservations, activeAlarms, restaurantName, currency]);

  // Diffusion d'une action à toutes les tablettes du restaurant
  const broadcastAction = (type, payload) => {
    const currentRestoId = currentUser?.restaurantId || sessionId;
    const msg = {
      type,
      payload,
      restaurantId: currentRestoId,
      senderId: clientIdRef.current,
      timestamp: Date.now()
    };

    // 1. Diffusion Cloud Realtime mondial WSS + BroadcastChannel
    cloudSync.publish(msg);

    // 2. Envoi sur serveur WebSocket local si actif
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  // Connexion WebSocket au serveur local
  const connectWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const ws = new WebSocket(DEFAULT_SERVER_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({
          type: 'JOIN_SESSION',
          payload: {
            sessionId: currentUser?.restaurantId || sessionId,
            role: activeMode
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleServerMessage(msg);
        } catch (e) {
          console.error('Error parsing incoming WS message:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 3000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      // Standalone mode normal
    }
  }, [currentUser, sessionId, activeMode, handleServerMessage]);

  // Initialisation et liaison Cloud lors de la connexion du restaurant
  useEffect(() => {
    const currentRestoId = currentUser?.restaurantId || 'resto_demo_central';
    setSessionId(currentRestoId);

    if (currentUser?.restaurantName) {
      setRestaurantName(currentUser.restaurantName);
    }
    if (currentUser?.currency) {
      const match = AVAILABLE_CURRENCIES.find(c => c.code === currentUser.currency.code);
      setCurrency(match || currentUser.currency);
    }
    if (currentUser?.restaurantCode) {
      setPairingCode(currentUser.restaurantCode);
    }

    // Charger l'état sauvegardé en localStorage pour ce restaurant
    try {
      const savedRaw = localStorage.getItem(`restobook_state_${currentRestoId}`);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed.tables) setTables(parsed.tables);
        if (parsed.tickets) setTickets(parsed.tickets);
        if (parsed.menuCategories) setMenuCategories(parsed.menuCategories);
        if (parsed.menuItems) setMenuItems(parsed.menuItems);
        if (parsed.reservations) setReservations(parsed.reservations);
        if (parsed.restaurantName) setRestaurantName(parsed.restaurantName);
        if (parsed.currency) setCurrency(parsed.currency);
      }
    } catch (e) {
      console.warn('Erreur lecture cache local restaurant:', e);
    }

    // Connexion au Cloud Realtime mondial WSS pour ce restaurant
    cloudSync.connectRestaurant(currentRestoId);

    const unsubStatus = cloudSync.onStatusChange((status) => {
      setCloudConnected(status);
    });

    // Réception de l'état persistant complet envoyé par le Cloud WSS (retained)
    const unsubState = cloudSync.onStateSync((cloudState) => {
      if (!cloudState) return;
      console.log(`☁️ État du restaurant synchronisé depuis le Cloud pour [${currentRestoId}]`);
      if (cloudState.tables) setTables(cloudState.tables);
      if (cloudState.tickets) {
        const uniqueTickets = (cloudState.tickets || []).filter(
          (t, idx, self) => idx === self.findIndex(o => o.id === t.id)
        );
        setTickets(uniqueTickets);
      }
      if (cloudState.menuCategories) setMenuCategories(cloudState.menuCategories);
      if (cloudState.menuItems) setMenuItems(cloudState.menuItems);
      if (cloudState.reservations) setReservations(cloudState.reservations);
      if (cloudState.restaurantName) setRestaurantName(cloudState.restaurantName);
      if (cloudState.currency) setCurrency(cloudState.currency);

      try {
        localStorage.setItem(`restobook_state_${currentRestoId}`, JSON.stringify(cloudState));
      } catch (e) {}
    });

    const unsubMsg = cloudSync.onMessage((msg) => {
      if (!msg) return;
      // Ne pas traiter ses propres messages
      if (msg.senderId === clientIdRef.current) return;
      // Isolation absolue par restaurantId
      if (msg.restaurantId && msg.restaurantId !== currentRestoId) return;
      handleServerMessage(msg);
    });

    return () => {
      unsubStatus();
      unsubState();
      unsubMsg();
      cloudSync.disconnect();
    };
  }, [currentUser?.restaurantId, handleServerMessage]);

  // Connexion au WebSocket local
  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      soundEngine.stopKitchenAlarm();
    };
  }, [connectWs]);

  // ACTIONS UTILISATEUR

  const createOrder = (orderData) => {
    const tableId = orderData.tableId;
    const newTicket = {
      id: `ticket_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      orderId: `order_${Date.now()}`,
      tableId,
      tableNumber: tables.find(t => t.id === tableId)?.number || '1',
      serverName: orderData.serverName || 'Serveur 1',
      coursePhase: 'plats',
      status: 'waiting',
      items: orderData.items.map((item, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        selectedModifiers: item.selectedModifiers || [],
        customKitchenNote: item.customKitchenNote || '',
        status: 'pending'
      })),
      createdAt: new Date().toISOString()
    };

    const updatedTables = tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'OCCUPIED',
          currentOrder: {
            id: newTicket.orderId,
            items: newTicket.items,
            totalAmount: newTicket.items.reduce((s, it) => s + (it.price * it.quantity), 0)
          }
        };
      }
      return t;
    });

    setTables(updatedTables);
    setTickets(prev => {
      const updated = [...prev, newTicket];
      saveRestoState({ tables: updatedTables, tickets: updated });
      return updated;
    });

    broadcastAction('ORDER_CREATED', { ticket: newTicket, tables: updatedTables });
    soundEngine.playOrderSentTone();
  };

  const reorderTickets = (orderedTicketIds) => {
    const newTickets = [...tickets].sort((a, b) => {
      const idxA = orderedTicketIds.indexOf(a.id);
      const idxB = orderedTicketIds.indexOf(b.id);
      return (idxA > -1 ? idxA : 999) - (idxB > -1 ? idxB : 999);
    });

    setTickets(newTickets);
    saveRestoState({ tickets: newTickets });
    broadcastAction('TICKET_REORDERED', { tickets: newTickets });
  };

  const toggleItemPrepared = (ticketId, itemId) => {
    let updatedTicket = null;
    const newTickets = tickets.map(t => {
      if (t.id === ticketId) {
        const newItems = t.items.map(it => {
          if (it.id === itemId) {
            return { ...it, status: it.status === 'ready' ? 'pending' : 'ready' };
          }
          return it;
        });
        updatedTicket = { ...t, items: newItems };
        return updatedTicket;
      }
      return t;
    });

    setTickets(newTickets);
    saveRestoState({ tickets: newTickets });
    if (updatedTicket) {
      broadcastAction('TICKET_UPDATED', { ticket: updatedTicket });
    }
  };

  const markOrderReady = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const updatedTicket = {
      ...ticket,
      status: 'ready',
      items: ticket.items.map(it => ({ ...it, status: 'ready' }))
    };

    const newTickets = tickets.map(t => t.id === ticketId ? updatedTicket : t);
    setTickets(newTickets);

    const updatedTables = tables.map(t => {
      if (t.id === ticket.tableId || t.number === ticket.tableNumber || String(t.number) === String(ticket.tableNumber)) {
        return { ...t, status: 'ready' };
      }
      return t;
    });
    setTables(updatedTables);

    const alarmPayload = {
      ticketId,
      tableId: ticket.tableId,
      tableNumber: ticket.tableNumber,
      serverName: ticket.serverName,
      items: ticket.items,
      itemsCount: ticket.items?.length || 0,
      createdAt: new Date().toISOString()
    };

    const updatedAlarms = [...activeAlarms.filter(a => a.ticketId !== ticketId), alarmPayload];
    setActiveAlarms(updatedAlarms);
    setLatestAlarm(alarmPayload);

    saveRestoState({ tickets: newTickets, tables: updatedTables });
    broadcastAction('ORDER_READY', { ticket: updatedTicket, tables: updatedTables, activeAlarms: updatedAlarms, alarm: alarmPayload });
    soundEngine.startKitchenAlarm();
  };

  const acknowledgeOrder = (ticketId, tableId) => {
    // 1. Filtrer les alarmes actives correspondant à ce ticket OU à cette table
    const updatedAlarms = activeAlarms.filter(a => {
      if (ticketId && a.ticketId === ticketId) return false;
      if (tableId && (
        a.tableId === tableId || 
        a.tableNumber === tableId || 
        String(a.tableNumber) === String(tableId) ||
        String(a.tableId) === String(tableId)
      )) return false;
      return true;
    });
    setActiveAlarms(updatedAlarms);

    // 2. Trouver la table concernée pour la repasser en 'occupied'
    const targetTableId = tableId;
    const relatedTicket = ticketId ? tickets.find(t => t.id === ticketId) : null;
    const relatedTableId = relatedTicket?.tableId;
    const relatedTableNumber = relatedTicket?.tableNumber;

    const updatedTables = tables.map(t => {
      const matches = 
        (targetTableId && (t.id === targetTableId || t.number === targetTableId || String(t.number) === String(targetTableId))) ||
        (relatedTableId && (t.id === relatedTableId || t.number === relatedTableId || String(t.number) === String(relatedTableId))) ||
        (relatedTableNumber && (t.number === relatedTableNumber || String(t.number) === String(relatedTableNumber)));

      if (matches) {
        return { ...t, status: 'occupied' };
      }
      return t;
    });
    setTables(updatedTables);

    // 3. Couper l'alarme sonore et masquer la bannière si aucune alarme restante
    if (updatedAlarms.length === 0) {
      soundEngine.stopKitchenAlarm();
      setLatestAlarm(null);
    } else {
      setLatestAlarm(updatedAlarms[updatedAlarms.length - 1]);
    }

    // 4. Sauvegarde et diffusion
    saveRestoState({ tables: updatedTables });
    broadcastAction('ORDER_ACKNOWLEDGED', { 
      activeAlarms: updatedAlarms, 
      tables: updatedTables,
      acknowledgedTicketId: ticketId,
      acknowledgedTableId: tableId
    });
  };

  const updateTableLayout = (newTables) => {
    setTables(newTables);
    saveRestoState({ tables: newTables });
    broadcastAction('TABLES_LAYOUT_UPDATED', { tables: newTables });
  };

  const deleteTable = (tableId) => {
    const updated = tables.filter(t => t.id !== tableId);
    setTables(updated);
    saveRestoState({ tables: updated });
    broadcastAction('TABLES_LAYOUT_UPDATED', { tables: updated });
  };

  const closeTableBill = (tableId) => {
    const tableObj = tables.find(t => t.id === tableId || t.number === tableId);
    const tableNum = tableObj?.number;

    const updatedTables = tables.map(t => {
      if (t.id === tableId || t.number === tableId) {
        return {
          ...t,
          status: 'free',
          currentOrder: null
        };
      }
      return t;
    });

    const updatedAlarms = activeAlarms.filter(a => 
      a.tableId !== tableId && 
      a.tableNumber !== tableId && 
      (!tableNum || (a.tableNumber !== tableNum && String(a.tableNumber) !== String(tableNum)))
    );
    setTables(updatedTables);
    setActiveAlarms(updatedAlarms);
    if (updatedAlarms.length === 0) {
      soundEngine.stopKitchenAlarm();
      setLatestAlarm(null);
    } else {
      setLatestAlarm(updatedAlarms[updatedAlarms.length - 1]);
    }
    saveRestoState({ tables: updatedTables });
    broadcastAction('TABLE_BILLED', { tables: updatedTables, activeAlarms: updatedAlarms });
  };

  const addReservation = (reservation) => {
    const updatedReservations = [
      ...reservations,
      {
        ...reservation,
        id: `res_${Date.now()}`,
        status: 'confirmed'
      }
    ];
    setReservations(updatedReservations);
    saveRestoState({ reservations: updatedReservations });
    broadcastAction('RESERVATION_ADDED', { reservations: updatedReservations });
  };

  const addMenuItem = (itemData) => {
    const newItem = {
      id: `item_${Date.now()}`,
      available: true,
      ...itemData
    };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    saveRestoState({ menuItems: updated });
    broadcastAction('MENU_UPDATED', { menuItems: updated });
  };

  const updateMenuItem = (itemData) => {
    const updated = menuItems.map(it => it.id === itemData.id ? { ...it, ...itemData } : it);
    setMenuItems(updated);
    saveRestoState({ menuItems: updated });
    broadcastAction('MENU_UPDATED', { menuItems: updated });
  };

  const deleteMenuItem = (itemId) => {
    const updated = menuItems.filter(it => it.id !== itemId);
    setMenuItems(updated);
    saveRestoState({ menuItems: updated });
    broadcastAction('MENU_UPDATED', { menuItems: updated });
  };

  const toggleItemAvailability = (itemId) => {
    const updated = menuItems.map(it => it.id === itemId ? { ...it, available: !it.available } : it);
    setMenuItems(updated);
    saveRestoState({ menuItems: updated });
    broadcastAction('MENU_UPDATED', { menuItems: updated });
  };

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    saveRestoState({ currency: newCurrency });
    broadcastAction('CURRENCY_CHANGED', { currency: newCurrency });
  };

  const changeRestaurantName = (newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setRestaurantName(trimmed);
    saveRestoState({ restaurantName: trimmed });
    broadcastAction('RESTAURANT_NAME_UPDATED', { name: trimmed });
  };

  const formatPrice = (amount) => {
    const val = Number(amount || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: currency.code === 'XOF' ? 0 : 2,
      maximumFractionDigits: currency.code === 'XOF' ? 0 : 2
    });

    if (['USD', 'CAD', 'GBP', 'JPY'].includes(currency.code)) {
      return `${currency.symbol} ${val}`;
    }
    return `${val} ${currency.symbol}`;
  };

  return (
    <RestobookContext.Provider
      value={{
        activeMode,
        setActiveMode,
        sessionId,
        setSessionId,
        pairingCode,
        connected,
        cloudConnected,
        soundEnabled,
        enableSound,
        tables,
        tickets,
        menuCategories,
        menuItems,
        reservations,
        activeAlarms,
        latestAlarm,
        createOrder,
        reorderTickets,
        toggleItemPrepared,
        markOrderReady,
        acknowledgeOrder,
        updateTableLayout,
        deleteTable,
        closeTableBill,
        addReservation,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        currency,
        changeCurrency,
        formatPrice,
        AVAILABLE_CURRENCIES,
        restaurantName,
        changeRestaurantName
      }}
    >
      {children}
    </RestobookContext.Provider>
  );
};

export const useRestobook = () => {
  const context = useContext(RestobookContext);
  if (!context) {
    throw new Error('useRestobook must be used within a RestobookProvider');
  }
  return context;
};
