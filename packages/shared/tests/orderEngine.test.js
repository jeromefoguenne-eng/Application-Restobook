import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RestobookCoreEngine,
  TableStatus,
  TicketStatus,
  ItemStatus,
  CoursePhase,
  RestobookEventType,
  mockTables
} from '../src/index.js';

test('RestobookCoreEngine - Prise de commande, transmission cuisine et alarme serveur', async (t) => {
  const engine = new RestobookCoreEngine({ tables: mockTables });
  const events = [];
  engine.on(event => events.push(event));

  await t.test('1. Prise de commande sur la Table 1 (Salle vers Cuisine)', () => {
    const ticket = engine.createOrder({
      tableId: 'table_1',
      serverName: 'Thomas',
      coursePhase: CoursePhase.MAIN,
      items: [
        { menuItemId: 'item_3', name: 'Entrecôte Grillée 300g', selectedModifiers: ['Saignant', 'Sauce Poivre'] },
        { menuItemId: 'item_4', name: 'Pavé de Saumon Rôti', selectedModifiers: [] }
      ]
    });

    assert.ok(ticket.id.startsWith('ticket_'));
    assert.equal(ticket.tableNumber, '1');
    assert.equal(ticket.status, TicketStatus.RECEIVED);
    assert.equal(ticket.items.length, 2);
    assert.equal(ticket.items[0].status, ItemStatus.PENDING);

    const table1 = engine.tables.get('table_1');
    assert.equal(table1.status, TableStatus.ORDER_SENT);

    // Vérifier l'événement émis
    const createdEvent = events.find(e => e.type === RestobookEventType.ORDER_CREATED);
    assert.ok(createdEvent);
    assert.equal(createdEvent.payload.id, ticket.id);
  });

  await t.test('2. Réorganisation par glisser-déposer des tickets en cuisine', () => {
    // Créer une 2ème commande sur la table 2
    const ticket2 = engine.createOrder({
      tableId: 'table_2',
      serverName: 'Sophie',
      coursePhase: CoursePhase.STARTER,
      items: [{ menuItemId: 'item_1', name: 'Carpaccio de Bœuf' }]
    });

    const ticketsList = Array.from(engine.tickets.values());
    assert.equal(ticketsList.length, 2);

    // Le chef inverse l'ordre des tickets (Ticket 2 passe en priorité 0)
    engine.reorderTickets([ticketsList[1].id, ticketsList[0].id]);

    assert.equal(engine.tickets.get(ticketsList[1].id).priorityIndex, 0);
    assert.equal(engine.tickets.get(ticketsList[0].id).priorityIndex, 1);
  });

  await t.test('3. Biffage d\'un article en cuisine', () => {
    const firstTicket = Array.from(engine.tickets.values())[0];
    const firstItemId = firstTicket.items[0].id;

    engine.toggleItemPrepared(firstTicket.id, firstItemId);
    assert.equal(engine.tickets.get(firstTicket.id).items[0].status, ItemStatus.READY);
  });

  await t.test('4. Validation "Prêt au passe" en Cuisine -> Déclenchement de l\'ALARME', () => {
    const firstTicket = Array.from(engine.tickets.values())[0];
    
    // Le chef appuie sur "Envoyer au passe"
    engine.markTicketReady(firstTicket.id);

    // Statut du ticket et de la table
    assert.equal(firstTicket.status, TicketStatus.READY);
    const table1 = engine.tables.get('table_1');
    assert.equal(table1.status, TableStatus.READY_FROM_KITCHEN);

    // L'alarme doit être active pour la table 1
    assert.ok(engine.getActiveAlarms().includes('table_1'));

    // L'événement ORDER_READY doit avoir été propagé
    const readyEvent = events.find(e => e.type === RestobookEventType.ORDER_READY);
    assert.ok(readyEvent);
    assert.equal(readyEvent.payload.tableId, 'table_1');
    assert.equal(readyEvent.payload.tableNumber, '1');
  });

  await t.test('5. Acquittement par le serveur en Salle -> Extinction de l\'ALARME', () => {
    const firstTicket = Array.from(engine.tickets.values())[0];

    // Le serveur clique sur "J'arrive / Récupéré"
    engine.acknowledgeOrder(firstTicket.id);

    assert.equal(firstTicket.serverAcknowledged, true);
    assert.ok(!engine.getActiveAlarms().includes('table_1'));

    const table1 = engine.tables.get('table_1');
    assert.equal(table1.status, TableStatus.OCCUPIED);

    const ackEvent = events.find(e => e.type === RestobookEventType.ORDER_ACKNOWLEDGED);
    assert.ok(ackEvent);
    assert.equal(ackEvent.payload.tableId, 'table_1');
  });
});
