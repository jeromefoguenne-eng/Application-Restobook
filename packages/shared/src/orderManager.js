import { TableStatus, TicketStatus, ItemStatus, RestobookEventType } from './types.js';

/**
 * Gestionnaire du Cycle de Vie des Commandes & Alarmes Restobook
 */
export class RestobookCoreEngine {
  constructor(initialData = {}) {
    this.tables = new Map(initialData.tables?.map(t => [t.id, { ...t }]) || []);
    this.tickets = new Map(initialData.tickets?.map(t => [t.id, { ...t }]) || []);
    this.activeAlarms = new Set();
    this.eventListeners = [];
  }

  on(listener) {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  emit(event) {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in event listener:', err);
      }
    }
  }

  /**
   * Création et expédition d'une commande depuis la Salle (POS) vers la Cuisine (KDS)
   */
  createOrder({ tableId, serverName, items, coursePhase }) {
    const table = this.tables.get(tableId);
    if (!table) throw new Error(`Table ${tableId} introuvable`);

    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticket = {
      id: ticketId,
      tableId,
      tableNumber: table.number,
      serverName,
      createdAt: new Date().toISOString(),
      coursePhase,
      items: items.map((it, idx) => ({
        id: `${ticketId}_item_${idx}`,
        ...it,
        status: ItemStatus.PENDING
      })),
      priorityIndex: this.tickets.size, // Placé en fin de file par défaut
      status: TicketStatus.RECEIVED,
      readyAt: null,
      serverAcknowledged: false
    };

    this.tickets.set(ticketId, ticket);
    table.status = TableStatus.ORDER_SENT;
    table.currentOrderId = ticketId;

    this.emit({
      type: RestobookEventType.ORDER_CREATED,
      payload: ticket
    });

    return ticket;
  }

  /**
   * Réorganisation de l'ordre des tickets en cuisine (Drag & Drop par le chef)
   */
  reorderTickets(orderedTicketIds) {
    orderedTicketIds.forEach((id, index) => {
      const ticket = this.tickets.get(id);
      if (ticket) {
        ticket.priorityIndex = index;
      }
    });

    this.emit({
      type: RestobookEventType.TICKET_REORDERED,
      payload: { orderedTicketIds }
    });
  }

  /**
   * Biffage d'un article individuel dans un bon en cuisine
   */
  toggleItemPrepared(ticketId, itemId) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} introuvable`);

    const item = ticket.items.find(it => it.id === itemId);
    if (!item) throw new Error(`Article ${itemId} introuvable`);

    item.status = item.status === ItemStatus.READY ? ItemStatus.PENDING : ItemStatus.READY;

    // Si tous les articles sont prêts, on passe le statut du bon en cours
    const allReady = ticket.items.every(it => it.status === ItemStatus.READY);
    if (allReady && ticket.status !== TicketStatus.READY) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    this.emit({
      type: RestobookEventType.ORDER_UPDATED,
      payload: ticket
    });

    return ticket;
  }

  /**
   * Le chef cuisinier clique sur "ENVOYER AU PASSE / PRÊT"
   * -> Déclenche immédiatement l'ALARME sur la tablette Salle !
   */
  markTicketReady(ticketId) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} introuvable`);

    ticket.status = TicketStatus.READY;
    ticket.readyAt = new Date().toISOString();
    ticket.items.forEach(it => { it.status = ItemStatus.READY; });

    const table = this.tables.get(ticket.tableId);
    if (table) {
      table.status = TableStatus.READY_FROM_KITCHEN;
    }

    this.activeAlarms.add(ticket.tableId);

    this.emit({
      type: RestobookEventType.ORDER_READY,
      payload: {
        ticketId,
        tableId: ticket.tableId,
        tableNumber: ticket.tableNumber,
        serverName: ticket.serverName,
        coursePhase: ticket.coursePhase,
        items: ticket.items,
        timestamp: ticket.readyAt
      }
    });

    return ticket;
  }

  /**
   * Le serveur en salle clique sur "J'arrive / Récupéré"
   * -> Coupe l'alarme sonore et acquitte le bon
   */
  acknowledgeOrder(ticketId) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} introuvable`);

    ticket.serverAcknowledged = true;
    this.activeAlarms.delete(ticket.tableId);

    const table = this.tables.get(ticket.tableId);
    if (table) {
      table.status = TableStatus.OCCUPIED;
    }

    this.emit({
      type: RestobookEventType.ORDER_ACKNOWLEDGED,
      payload: {
        ticketId,
        tableId: ticket.tableId
      }
    });

    return ticket;
  }

  getActiveAlarms() {
    return Array.from(this.activeAlarms);
  }
}
