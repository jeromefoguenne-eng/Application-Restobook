import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { mockTables, mockMenuItems, mockMenuCategories } from '../../packages/shared/src/mocks/seedData.js';
import { TableStatus, TicketStatus, ItemStatus, RestobookEventType } from '../../packages/shared/src/types.js';

const PORT = process.env.PORT || 4001;

// Base de données en mémoire par restaurant / session
const sessions = new Map();

function getOrCreateSession(sessionId = 'RESTO-DEMO') {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      name: "Bistrot Le Central",
      pairingCode: Math.floor(100000 + Math.random() * 900000).toString(),
      tables: JSON.parse(JSON.stringify(mockTables)),
      menuCategories: JSON.parse(JSON.stringify(mockMenuCategories)),
      menuItems: JSON.parse(JSON.stringify(mockMenuItems)),
      reservations: [
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
      ],
      currency: { code: 'EUR', symbol: '€', name: 'Euro (€)' },
      tickets: [],
      activeAlarms: [],
      clients: new Set()
    });
  }
  return sessions.get(sessionId);
}

const server = http.createServer((req, res) => {
  // En-têtes CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  if (url.pathname.startsWith('/api/session/')) {
    const sessionId = url.pathname.replace('/api/session/', '') || 'RESTO-DEMO';
    const session = getOrCreateSession(sessionId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const { clients, ...safeSession } = session;
    res.end(JSON.stringify(safeSession));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const wss = new WebSocketServer({ server });

function broadcastToSession(session, message, senderWs = null) {
  const payload = JSON.stringify(message);
  for (const client of session.clients) {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws) => {
  let currentSession = null;
  let clientRole = null; // 'salle' ou 'cuisine'

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        // Appairage ou connexion à une session
        case 'JOIN_SESSION': {
          const { sessionId, role, pairingCode } = msg.payload;
          currentSession = getOrCreateSession(sessionId || 'RESTO-DEMO');
          clientRole = role;

          currentSession.clients.add(ws);

          const { clients, ...safeSession } = currentSession;
          ws.send(JSON.stringify({
            type: 'SESSION_INITIALIZED',
            payload: {
              ...safeSession,
              role: clientRole
            }
          }));

          // Informer les autres qu'un client s'est connecté
          broadcastToSession(currentSession, {
            type: 'DEVICE_CONNECTED',
            payload: { role: clientRole, timestamp: new Date().toISOString() }
          }, ws);
          break;
        }

        // Nouvelle commande prise en Salle -> transmise en Cuisine
        case 'CREATE_ORDER': {
          if (!currentSession) return;
          const { tableId, serverName, coursePhase, items } = msg.payload;
          const table = currentSession.tables.find(t => t.id === tableId);
          if (table) {
            table.status = TableStatus.ORDER_SENT;
          }

          const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const ticket = {
            id: ticketId,
            tableId,
            tableNumber: table ? table.number : '?',
            serverName: serverName || 'Serveur',
            createdAt: new Date().toISOString(),
            coursePhase: coursePhase || 'main',
            items: items.map((it, idx) => ({
              id: `${ticketId}_it_${idx}`,
              ...it,
              status: ItemStatus.PENDING
            })),
            priorityIndex: currentSession.tickets.length,
            status: TicketStatus.RECEIVED,
            readyAt: null,
            serverAcknowledged: false
          };

          currentSession.tickets.push(ticket);

          // Diffusion temps réel à tous les clients (notamment la Cuisine et la Salle)
          broadcastToSession(currentSession, {
            type: RestobookEventType.ORDER_CREATED,
            payload: { ticket, tables: currentSession.tables }
          });
          break;
        }

        // Réorganisation tactile des tickets en cuisine (Glisser-Déposer)
        case 'REORDER_TICKETS': {
          if (!currentSession) return;
          const { orderedTicketIds } = msg.payload;
          orderedTicketIds.forEach((id, idx) => {
            const ticket = currentSession.tickets.find(t => t.id === id);
            if (ticket) ticket.priorityIndex = idx;
          });
          currentSession.tickets.sort((a, b) => a.priorityIndex - b.priorityIndex);

          broadcastToSession(currentSession, {
            type: RestobookEventType.TICKET_REORDERED,
            payload: { tickets: currentSession.tickets }
          });
          break;
        }

        // Biffage d'un article en cuisine
        case 'TOGGLE_ITEM': {
          if (!currentSession) return;
          const { ticketId, itemId } = msg.payload;
          const ticket = currentSession.tickets.find(t => t.id === ticketId);
          if (ticket) {
            const item = ticket.items.find(i => i.id === itemId);
            if (item) {
              item.status = item.status === ItemStatus.READY ? ItemStatus.PENDING : ItemStatus.READY;
              broadcastToSession(currentSession, {
                type: 'TICKET_UPDATED',
                payload: { ticket }
              });
            }
          }
          break;
        }

        // VALIDATION CUISINE : "Envoyer au passe / Prêt" -> DÉCLENCHE L'ALARME EN SALLE
        case 'MARK_ORDER_READY': {
          if (!currentSession) return;
          const { ticketId } = msg.payload;
          const ticket = currentSession.tickets.find(t => t.id === ticketId);
          if (ticket) {
            ticket.status = TicketStatus.READY;
            ticket.readyAt = new Date().toISOString();
            ticket.items.forEach(it => { it.status = ItemStatus.READY; });

            const table = currentSession.tables.find(t => t.id === ticket.tableId);
            if (table) {
              table.status = TableStatus.READY_FROM_KITCHEN;
            }

            if (!currentSession.activeAlarms.includes(ticket.tableId)) {
              currentSession.activeAlarms.push(ticket.tableId);
            }

            const alarmPayload = {
              ticket,
              tableId: ticket.tableId,
              tableNumber: ticket.tableNumber,
              serverName: ticket.serverName,
              coursePhase: ticket.coursePhase,
              items: ticket.items,
              timestamp: ticket.readyAt,
              activeAlarms: currentSession.activeAlarms,
              tables: currentSession.tables
            };

            // Émission immédiate avec alarme sonore & visuelle
            broadcastToSession(currentSession, {
              type: RestobookEventType.ORDER_READY,
              payload: alarmPayload
            });
          }
          break;
        }

        // ACQUITTEMENT SALLE : Le serveur clique sur "J'arrive / Récupéré" -> COUPE L'ALARME
        case 'ACKNOWLEDGE_ORDER': {
          if (!currentSession) return;
          const { ticketId, tableId } = msg.payload;
          const ticket = currentSession.tickets.find(t => t.id === ticketId || t.tableId === tableId);
          if (ticket) {
            ticket.serverAcknowledged = true;
          }

          currentSession.activeAlarms = currentSession.activeAlarms.filter(id => id !== tableId);
          const table = currentSession.tables.find(t => t.id === tableId);
          if (table) {
            table.status = TableStatus.OCCUPIED;
          }

          const ackPayload = {
            tableId,
            ticketId: ticket ? ticket.id : null,
            activeAlarms: currentSession.activeAlarms,
            tables: currentSession.tables
          };

          broadcastToSession(currentSession, {
            type: RestobookEventType.ORDER_ACKNOWLEDGED,
            payload: ackPayload
          });
          break;
        }

        // Mise à jour du plan de salle (glisser-déposer des tables)
        case 'UPDATE_TABLES_LAYOUT': {
          if (!currentSession) return;
          const { tables } = msg.payload;
          currentSession.tables = tables;
          broadcastToSession(currentSession, {
            type: 'TABLES_LAYOUT_UPDATED',
            payload: { tables }
          }, ws);
          break;
        }

        // Facturation / Libération de table
        case 'CLOSE_TABLE_BILL': {
          if (!currentSession) return;
          const { tableId } = msg.payload;
          const table = currentSession.tables.find(t => t.id === tableId);
          if (table) {
            table.status = TableStatus.FREE;
            table.currentOrderId = null;
          }
          currentSession.activeAlarms = currentSession.activeAlarms.filter(id => id !== tableId);

          broadcastToSession(currentSession, {
            type: 'TABLE_BILLED',
            payload: { tableId, tables: currentSession.tables, activeAlarms: currentSession.activeAlarms }
          });
          break;
        }

        // Nouvelle réservation
        case 'ADD_RESERVATION': {
          if (!currentSession) return;
          const reservation = {
            id: `res_${Date.now()}`,
            ...msg.payload,
            status: 'confirmed'
          };
          currentSession.reservations.push(reservation);
          broadcastToSession(currentSession, {
            type: 'RESERVATION_ADDED',
            payload: { reservation, reservations: currentSession.reservations }
          });
          break;
        }

        // Ajout d'un plat ou d'une boisson à la carte
        case 'ADD_MENU_ITEM': {
          if (!currentSession) return;
          const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            ...msg.payload,
            isAvailable: msg.payload.isAvailable !== false
          };
          currentSession.menuItems.push(newItem);
          broadcastToSession(currentSession, {
            type: 'MENU_UPDATED',
            payload: { menuItems: currentSession.menuItems }
          });
          break;
        }

        // Modification d'un plat / boisson existant
        case 'UPDATE_MENU_ITEM': {
          if (!currentSession) return;
          const { item } = msg.payload;
          const idx = currentSession.menuItems.findIndex(i => i.id === item.id);
          if (idx > -1) {
            currentSession.menuItems[idx] = { ...currentSession.menuItems[idx], ...item };
            broadcastToSession(currentSession, {
              type: 'MENU_UPDATED',
              payload: { menuItems: currentSession.menuItems }
            });
          }
          break;
        }

        // Suppression d'un plat / boisson de la carte
        case 'DELETE_MENU_ITEM': {
          if (!currentSession) return;
          const { itemId } = msg.payload;
          currentSession.menuItems = currentSession.menuItems.filter(i => i.id !== itemId);
          broadcastToSession(currentSession, {
            type: 'MENU_UPDATED',
            payload: { menuItems: currentSession.menuItems }
          });
          break;
        }

        // Bascule de rupture de stock / disponibilité en temps réel
        case 'TOGGLE_ITEM_AVAILABILITY': {
          if (!currentSession) return;
          const { itemId } = msg.payload;
          const item = currentSession.menuItems.find(i => i.id === itemId);
          if (item) {
            item.isAvailable = item.isAvailable === false ? true : false;
            broadcastToSession(currentSession, {
              type: 'MENU_UPDATED',
              payload: { menuItems: currentSession.menuItems }
            });
          }
          break;
        }

        // Changement de devise monétaire du restaurant
        case 'CHANGE_CURRENCY': {
          if (!currentSession) return;
          const { currency } = msg.payload;
          currentSession.currency = currency;
          broadcastToSession(currentSession, {
            type: 'CURRENCY_CHANGED',
            payload: { currency }
          });
          break;
        }

        default:
          console.warn('Unknown message type:', msg.type);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    if (currentSession) {
      currentSession.clients.delete(ws);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur Cloud Restobook en écoute sur le port ${PORT}`);
  console.log(`📡 WebSocket disponible sur ws://localhost:${PORT}`);
});
