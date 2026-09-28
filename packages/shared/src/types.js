/**
 * Modèles & Types Partagés Restobook
 * Système Connecté Salle & Cuisine (Tablettes Android)
 */

export const TableShape = {
  ROUND: 'round',
  SQUARE: 'square',
  RECTANGLE: 'rectangle'
};

export const TableStatus = {
  FREE: 'free',                     // Verte : Libre
  OCCUPIED: 'occupied',             // Bleue : Occupée (clients installés)
  ORDER_SENT: 'order_sent',         // Jaune : Commande en cours de préparation en cuisine
  READY_FROM_KITCHEN: 'ready',      // Rouge pulsante + alarme : Plats prêts au passe-plat !
  BILL_REQUESTED: 'bill_requested', // Violette : Addition demandée
  RESERVED: 'reserved'              // Grise : Réservée pour le service
};

export const CoursePhase = {
  DIRECT: 'direct',                 // Boissons, apéritifs
  STARTER: 'starter',               // Entrées
  MAIN: 'main',                     // Plats principaux
  DESSERT: 'dessert'                // Desserts & cafés
};

export const ItemStatus = {
  PENDING: 'pending',
  COOKING: 'cooking',
  READY: 'ready',
  DELIVERED: 'delivered'
};

export const TicketStatus = {
  RECEIVED: 'received',
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  ARCHIVED: 'archived'
};

export const RestobookEventType = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  TICKET_REORDERED: 'TICKET_REORDERED',
  ORDER_READY: 'ORDER_READY',                   // Déclenche l'alarme sur tablette Salle
  ORDER_ACKNOWLEDGED: 'ORDER_ACKNOWLEDGED',     // Coupe l'alarme sur tablette Salle
  TABLE_STATUS_CHANGED: 'TABLE_STATUS_CHANGED'
};

export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  MEAL_VOUCHER: 'meal_voucher',
  OTHER: 'other'
};
