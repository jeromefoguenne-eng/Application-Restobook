import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { soundEngine } from '../utils/soundEngine';

const RestobookContext = createContext(null);

const DEFAULT_SERVER_URL = window.location.hostname === 'localhost' 
  ? 'ws://localhost:4001' 
  : `ws://${window.location.hostname}:4001`;

export const AVAILABLE_CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro (€)', flag: '🇪🇺' },
  { code: 'USD', symbol: '$', name: 'Dollar US ($)', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling (£)', flag: '🇬🇧' },
  { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse (CHF)', flag: '🇨🇭' },
  { code: 'CAD', symbol: 'CA$', name: 'Dollar Canadien (CA$)', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonais (¥)', flag: '🇯🇵' },
  { code: 'MAD', symbol: 'DH', name: 'Dirham Marocain (DH)', flag: '🇲🇦' }
];

export const RestobookProvider = ({ children }) => {
  const [activeMode, setActiveMode] = useState('duo'); // 'salle' | 'cuisine' | 'duo'
  const [sessionId, setSessionId] = useState('RESTO-LE-CENTRAL');
  const [pairingCode, setPairingCode] = useState('834912');
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currency, setCurrency] = useState(AVAILABLE_CURRENCIES[0]);
  const [restaurantName, setRestaurantName] = useState('Bistrot Le Central');

  const [tables, setTables] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [latestAlarm, setLatestAlarm] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const enableSound = () => {
    soundEngine.init();
    soundEngine.playBellChime();
    setSoundEnabled(true);
  };

  // Connexion WebSocket au serveur Cloud
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
            sessionId,
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
        }, 2000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      console.warn('Erreur connexion WebSocket:', err);
    }
  }, [sessionId, activeMode]);

  // Traitement des messages du serveur
  const handleServerMessage = (msg) => {
    switch (msg.type) {
      case 'SESSION_INITIALIZED':
        setTables(msg.payload.tables || []);
        // Déduplication absolue des tickets par ID
        const initialTickets = (msg.payload.tickets || []).filter(
          (t, idx, self) => idx === self.findIndex(o => o.id === t.id)
        );
        setTickets(initialTickets);
        setMenuCategories(msg.payload.menuCategories || []);
        setMenuItems(msg.payload.menuItems || []);
        setReservations(msg.payload.reservations || []);
        setActiveAlarms(msg.payload.activeAlarms || []);
        if (msg.payload.pairingCode) setPairingCode(msg.payload.pairingCode);
        if (msg.payload.name) setRestaurantName(msg.payload.name);
        if (msg.payload.currency) {
          const match = AVAILABLE_CURRENCIES.find(c => c.code === msg.payload.currency.code);
          setCurrency(match || msg.payload.currency);
        }
        break;

      case 'RESTAURANT_NAME_UPDATED':
        if (msg.payload.name) setRestaurantName(msg.payload.name);
        break;

      case 'CURRENCY_CHANGED':
        if (msg.payload.currency) {
          const match = AVAILABLE_CURRENCIES.find(c => c.code === msg.payload.currency.code);
          setCurrency(match || msg.payload.currency);
        }
        break;

      case 'ORDER_CREATED':
        setTickets(prev => {
          const newTicket = msg.payload.ticket;
          if (!newTicket) return prev;
          if (prev.some(t => t.id === newTicket.id)) {
            return prev.map(t => t.id === newTicket.id ? newTicket : t);
          }
          return [...prev, newTicket];
        });
        if (msg.payload.tables) setTables(msg.payload.tables);
        soundEngine.playOrderSentTone();
        break;

      case 'TICKET_REORDERED':
        setTickets(msg.payload.tickets);
        break;

      case 'TICKET_UPDATED':
        setTickets(prev => prev.map(t => t.id === msg.payload.ticket.id ? msg.payload.ticket : t));
        break;

      // 🚨 RÉCEPTION D'UNE ALARME DE CUISINE
      case 'ORDER_READY': {
        const { ticket, tables: updatedTables, activeAlarms: updatedAlarms } = msg.payload;
        if (updatedTables) setTables(updatedTables);
        if (updatedAlarms) setActiveAlarms(updatedAlarms);
        setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
        setLatestAlarm(msg.payload);

        // Déclencher le carillon et l'alarme
        soundEngine.startKitchenAlarm();
        break;
      }

      // 🔕 ACQUITTEMENT PAR LE SERVEUR
      case 'ORDER_ACKNOWLEDGED': {
        const { activeAlarms: updatedAlarms, tables: updatedTables } = msg.payload;
        if (updatedTables) setTables(updatedTables);
        if (updatedAlarms) {
          setActiveAlarms(updatedAlarms);
          if (updatedAlarms.length === 0) {
            soundEngine.stopKitchenAlarm();
            setLatestAlarm(null);
          }
        }
        break;
      }

      case 'TABLES_LAYOUT_UPDATED':
        setTables(msg.payload.tables);
        break;

      case 'TABLE_BILLED':
        setTables(msg.payload.tables);
        setActiveAlarms(msg.payload.activeAlarms);
        break;

      case 'RESERVATION_ADDED':
        setReservations(msg.payload.reservations);
        break;

      case 'MENU_UPDATED':
        if (msg.payload.menuItems) setMenuItems(msg.payload.menuItems);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      soundEngine.stopKitchenAlarm();
    };
  }, [connectWs]);

  // Actions émettant vers le Cloud
  const sendWs = (type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const createOrder = (orderData) => {
    sendWs('CREATE_ORDER', orderData);
  };

  const reorderTickets = (orderedTicketIds) => {
    sendWs('REORDER_TICKETS', { orderedTicketIds });
  };

  const toggleItemPrepared = (ticketId, itemId) => {
    sendWs('TOGGLE_ITEM', { ticketId, itemId });
  };

  const markOrderReady = (ticketId) => {
    sendWs('MARK_ORDER_READY', { ticketId });
  };

  const acknowledgeOrder = (ticketId, tableId) => {
    sendWs('ACKNOWLEDGE_ORDER', { ticketId, tableId });
    soundEngine.stopKitchenAlarm();
    setLatestAlarm(null);
  };

  const updateTableLayout = (newTables) => {
    setTables(newTables);
    sendWs('UPDATE_TABLES_LAYOUT', { tables: newTables });
  };

  const closeTableBill = (tableId) => {
    sendWs('CLOSE_TABLE_BILL', { tableId });
  };

  const addReservation = (reservation) => {
    sendWs('ADD_RESERVATION', reservation);
  };

  const addMenuItem = (itemData) => {
    sendWs('ADD_MENU_ITEM', itemData);
  };

  const updateMenuItem = (itemData) => {
    sendWs('UPDATE_MENU_ITEM', { item: itemData });
  };

  const deleteMenuItem = (itemId) => {
    sendWs('DELETE_MENU_ITEM', { itemId });
  };

  const toggleItemAvailability = (itemId) => {
    sendWs('TOGGLE_ITEM_AVAILABILITY', { itemId });
  };

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    sendWs('CHANGE_CURRENCY', { currency: newCurrency });
  };

  const changeRestaurantName = (newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setRestaurantName(trimmed);
    sendWs('UPDATE_RESTAURANT_NAME', { name: trimmed });
  };

  const formatPrice = (amount) => {
    const val = Number(amount || 0).toFixed(2);
    if (['USD', 'CAD', 'GBP', 'JPY'].includes(currency.code)) {
      return `${currency.symbol}${val}`;
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
