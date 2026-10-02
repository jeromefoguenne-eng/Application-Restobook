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

  const [invoices, setInvoices] = useState(() => {
    try {
      const rId = currentUser?.restaurantId || 'resto_demo_central';
      const saved = localStorage.getItem(`restobook_invoices_${rId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'FAC-20260929-001',
        invoiceNumber: 'FAC-20260929-001',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        dateFormatted: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(Date.now() - 3600000 * 2)),
        tableNumber: 2,
        serverName: 'Julie',
        items: [
          { name: 'Entrecôte grillée', quantity: 2, unitPrice: 24.50, total: 49.00 },
          { name: 'Vin rouge Bordeaux', quantity: 1, unitPrice: 18.00, total: 18.00 },
          { name: 'Café Espresso', quantity: 2, unitPrice: 2.50, total: 5.00 }
        ],
        totalAmount: 72.00,
        currency: '€',
        currencyCode: 'EUR',
        paymentMethod: 'card',
        paymentMethodLabel: 'Carte Bancaire',
        splitCount: 1,
        vatRate: 10,
        vatAmount: 6.55,
        netAmount: 65.45
      },
      {
        id: 'FAC-20260929-002',
        invoiceNumber: 'FAC-20260929-002',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        dateFormatted: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(Date.now() - 3600000)),
        tableNumber: 5,
        serverName: 'Thomas',
        items: [
          { name: 'Salade César', quantity: 1, unitPrice: 13.50, total: 13.50 },
          { name: 'Filet de Bar rôti', quantity: 1, unitPrice: 22.00, total: 22.00 },
          { name: 'Tiramisu Maison', quantity: 1, unitPrice: 7.50, total: 7.50 },
          { name: 'Eau Minérale 1L', quantity: 1, unitPrice: 4.50, total: 4.50 }
        ],
        totalAmount: 47.50,
        currency: '€',
        currencyCode: 'EUR',
        paymentMethod: 'cash',
        paymentMethodLabel: 'Espèces',
        splitCount: 1,
        vatRate: 10,
        vatAmount: 4.32,
        netAmount: 43.18
      }
    ];
  });

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
        invoices: updates.invoices !== undefined ? updates.invoices : invoices,
        restaurantName: updates.restaurantName !== undefined ? updates.restaurantName : restaurantName,
        currency: updates.currency !== undefined ? updates.currency : currency
      };
      // 1. Sauvegarde locale (offline-first)
      localStorage.setItem(`restobook_state_${rId}`, JSON.stringify(stateToSave));
      if (updates.invoices !== undefined) {
        localStorage.setItem(`restobook_invoices_${rId}`, JSON.stringify(updates.invoices));
      }

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
        if (msg.payload.invoices) setInvoices(msg.payload.invoices);
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
      case 'RESERVATIONS_RESET':
        setReservations(msg.payload.reservations || []);
        saveRestoState({ reservations: msg.payload.reservations || [] });
        break;

      case 'INVOICE_CREATED':
        if (msg.payload.invoices) {
          setInvoices(msg.payload.invoices);
          saveRestoState({ invoices: msg.payload.invoices });
        }
        break;

      case 'INVOICES_CLEARED':
        setInvoices([]);
        saveRestoState({ invoices: [] });
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
            invoices,
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

  const handleServerMessageRef = useRef(handleServerMessage);
  useEffect(() => {
    handleServerMessageRef.current = handleServerMessage;
  });

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
          handleServerMessageRef.current?.(msg);
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
  }, [currentUser?.restaurantId, sessionId, activeMode]);

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

    // Réinitialisation immédiate des alarmes lors d'un switch de restaurant
    setActiveAlarms([]);
    setLatestAlarm(null);
    soundEngine.stopKitchenAlarm();

    // Charger l'état sauvegardé en localStorage pour ce restaurant
    try {
      const savedRaw = localStorage.getItem(`restobook_state_${currentRestoId}`);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed.tables) setTables(parsed.tables);
        if (parsed.tickets) {
          const uniqueTickets = (parsed.tickets || []).filter(
            (t, idx, self) => idx === self.findIndex(o => o.id === t.id)
          );
          setTickets(uniqueTickets);
        } else {
          setTickets([]);
        }
        if (parsed.menuCategories) setMenuCategories(parsed.menuCategories);
        if (parsed.menuItems) setMenuItems(parsed.menuItems);
        if (parsed.reservations) setReservations(parsed.reservations || []);
        if (parsed.invoices) setInvoices(parsed.invoices || []);
        if (parsed.restaurantName) setRestaurantName(parsed.restaurantName);
        if (parsed.currency) setCurrency(parsed.currency);
      } else {
        // Nouveau projet de restaurant : Carte et plan 100% indépendants
        const initialTables = JSON.parse(JSON.stringify(mockTables || []));
        const initialCategories = JSON.parse(JSON.stringify(mockMenuCategories || []));
        let initialMenuItems = [];

        if (currentRestoId === 'resto_demo_central') {
          initialMenuItems = JSON.parse(JSON.stringify(mockMenuItems || []));
        } else {
          // Pour chaque nouveau projet, cloner le catalogue de base avec des identifiants uniques propres à CE restaurant
          initialMenuItems = (mockMenuItems || []).map((it, idx) => ({
            ...it,
            id: `item_${currentRestoId}_${idx + 1}`,
            available: true,
            isAvailable: true
          }));
        }

        setTables(initialTables);
        setTickets([]);
        setMenuCategories(initialCategories);
        setMenuItems(initialMenuItems);
        setReservations([]);
        setInvoices([]);

        const initialState = {
          tables: initialTables,
          tickets: [],
          menuCategories: initialCategories,
          menuItems: initialMenuItems,
          reservations: [],
          invoices: [],
          restaurantName: currentUser?.restaurantName || 'Mon Restaurant',
          currency: currentUser?.currency || AVAILABLE_CURRENCIES[0]
        };

        localStorage.setItem(`restobook_state_${currentRestoId}`, JSON.stringify(initialState));
        cloudSync.publishProjectState(currentRestoId, initialState);
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
      if (cloudState.invoices) setInvoices(cloudState.invoices);
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
      handleServerMessageRef.current?.(msg);
    });

    return () => {
      unsubStatus();
      unsubState();
      unsubMsg();
      cloudSync.disconnect();
    };
  }, [currentUser?.restaurantId]);

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
    const tableObj = tables.find(t => t.id === tableId || String(t.id) === String(tableId) || String(t.number) === String(tableId));
    const tableNumber = tableObj?.number || '1';

    const newTicket = {
      id: `ticket_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      orderId: `order_${Date.now()}`,
      tableId,
      tableNumber,
      serverName: orderData.serverName || 'Serveur 1',
      coursePhase: orderData.coursePhase || 'plats',
      status: 'waiting',
      items: (orderData.items || []).map((item, idx) => {
        const itemPrice = parseFloat(item.unitPrice ?? item.price ?? 0) || 0;
        const qty = parseInt(item.quantity, 10) || 1;
        return {
          id: `item_${Date.now()}_${idx}`,
          itemId: item.itemId || item.menuItemId || `menu_${idx}`,
          name: item.name || 'Article',
          quantity: qty,
          price: itemPrice,
          unitPrice: itemPrice,
          phase: item.phase || orderData.coursePhase || 'plats',
          selectedModifiers: item.selectedModifiers || [],
          customKitchenNote: item.customKitchenNote || '',
          status: 'pending'
        };
      }),
      createdAt: new Date().toISOString()
    };

    const updatedTables = tables.map(t => {
      if (t.id === tableId || String(t.id) === String(tableId) || (tableNumber && (t.number === tableNumber || String(t.number) === String(tableNumber)))) {
        return {
          ...t,
          status: 'OCCUPIED',
          currentOrder: {
            id: newTicket.orderId,
            items: newTicket.items,
            totalAmount: newTicket.items.reduce((s, it) => s + (it.unitPrice * it.quantity), 0)
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

  const closeTableBill = (tableId, invoiceData = null) => {
    const tableObj = tables.find(t => t.id === tableId || t.number === tableId || String(t.id) === String(tableId) || String(t.number) === String(tableId));
    const tableNum = tableObj?.number;

    const updatedTables = tables.map(t => {
      if (t.id === tableId || t.number === tableId || String(t.id) === String(tableId) || (tableNum && (t.number === tableNum || String(t.number) === String(tableNum)))) {
        return {
          ...t,
          status: 'free',
          currentOrder: null
        };
      }
      return t;
    });

    const isTableTicket = (t) => {
      if (t.tableId === tableId || String(t.tableId) === String(tableId)) return true;
      if (tableNum && (t.tableNumber === tableNum || String(t.tableNumber) === String(tableNum))) return true;
      return false;
    };

    const updatedTickets = tickets.filter(t => !isTableTicket(t));
    setTickets(updatedTickets);

    const updatedAlarms = activeAlarms.filter(a => 
      a.tableId !== tableId && 
      String(a.tableId) !== String(tableId) &&
      a.tableNumber !== tableId && 
      String(a.tableNumber) !== String(tableId) &&
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

    let updatedInvoices = invoices;
    if (invoiceData) {
      updatedInvoices = [invoiceData, ...invoices];
      setInvoices(updatedInvoices);
      saveRestoState({ tables: updatedTables, tickets: updatedTickets, invoices: updatedInvoices });
      broadcastAction('INVOICE_CREATED', { invoices: updatedInvoices, newInvoice: invoiceData, tables: updatedTables });
    } else {
      saveRestoState({ tables: updatedTables, tickets: updatedTickets });
      broadcastAction('TABLE_BILLED', { tables: updatedTables, activeAlarms: updatedAlarms });
    }
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

  const resetReservations = (service = null) => {
    let updatedReservations;
    if (service) {
      updatedReservations = reservations.filter(r => r.service !== service);
    } else {
      updatedReservations = [];
    }
    setReservations(updatedReservations);
    saveRestoState({ reservations: updatedReservations });
    broadcastAction('RESERVATIONS_RESET', { reservations: updatedReservations });
  };

  const clearInvoices = () => {
    setInvoices([]);
    saveRestoState({ invoices: [] });
    broadcastAction('INVOICES_CLEARED', { invoices: [] });
  };

  const addMenuItem = (itemData) => {
    const rId = currentUser?.restaurantId || sessionId;
    const isAvail = itemData.available !== undefined 
      ? Boolean(itemData.available) 
      : (itemData.isAvailable !== undefined ? Boolean(itemData.isAvailable) : true);

    const newItem = {
      id: `item_${rId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      available: isAvail,
      isAvailable: isAvail,
      ...itemData,
      price: Number(itemData.price) || 0
    };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    saveRestoState({ menuItems: updated });
    broadcastAction('MENU_UPDATED', { menuItems: updated });
  };

  const updateMenuItem = (itemData) => {
    const updated = menuItems.map(it => {
      if (it.id === itemData.id) {
        const isAvail = itemData.available !== undefined 
          ? Boolean(itemData.available) 
          : (itemData.isAvailable !== undefined ? Boolean(itemData.isAvailable) : Boolean(it.available ?? it.isAvailable ?? true));
        return {
          ...it,
          ...itemData,
          available: isAvail,
          isAvailable: isAvail,
          price: itemData.price !== undefined ? (Number(itemData.price) || 0) : it.price
        };
      }
      return it;
    });
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
    const updated = menuItems.map(it => {
      if (it.id === itemId) {
        const nextAvail = !(it.available ?? it.isAvailable ?? true);
        return { ...it, available: nextAvail, isAvailable: nextAvail };
      }
      return it;
    });
    setMenuItems(updated);
    saveRestoState({ menuItems: updated });
    broadcastAction('MENU_UPDATED', { menuItems: updated });
  };

  const addMenuCategory = (categoryData) => {
    const rId = currentUser?.restaurantId || sessionId;
    const newCat = {
      id: `cat_${rId}_${Date.now()}`,
      name: categoryData.name.trim(),
      icon: categoryData.icon || '🍽️',
      order: menuCategories.length + 1
    };
    const updated = [...menuCategories, newCat];
    setMenuCategories(updated);
    saveRestoState({ menuCategories: updated });
    broadcastAction('MENU_CATEGORIES_UPDATED', { menuCategories: updated });
    return newCat;
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
        resetReservations,
        invoices,
        clearInvoices,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        addMenuCategory,
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
