import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { soundEngine } from '../utils/soundEngine';

const RestobookContext = createContext(null);

const DEFAULT_SERVER_URL = window.location.hostname === 'localhost' 
  ? 'ws://localhost:4001' 
  : `ws://${window.location.hostname}:4001`;

export const RestobookProvider = ({ children }) => {
  const [activeMode, setActiveMode] = useState('duo'); // 'salle' | 'cuisine' | 'duo'
  const [sessionId, setSessionId] = useState('RESTO-LE-CENTRAL');
  const [pairingCode, setPairingCode] = useState('834912');
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

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
        setTickets(msg.payload.tickets || []);
        setMenuCategories(msg.payload.menuCategories || []);
        setMenuItems(msg.payload.menuItems || []);
        setReservations(msg.payload.reservations || []);
        setActiveAlarms(msg.payload.activeAlarms || []);
        if (msg.payload.pairingCode) setPairingCode(msg.payload.pairingCode);
        break;

      case 'ORDER_CREATED':
        setTickets(prev => [...prev, msg.payload.ticket]);
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
        addReservation
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
