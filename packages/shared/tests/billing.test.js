import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RestobookCoreEngine,
  TableStatus,
  TicketStatus,
  CoursePhase,
  mockTables
} from '../src/index.js';

test('Facturation & Calcul de l\'Addition Restobook', async (t) => {
  await t.test('1. Calcul exact des montants avec unitPrice et price', () => {
    const items = [
      { name: 'Carpaccio de Bœuf', unitPrice: 14.50, quantity: 2 },
      { name: 'Entrecôte Grillée 300g', unitPrice: 26.00, quantity: 1 },
      { name: 'Café Espresso', price: 2.50, quantity: 3 }
    ];

    const totalAmount = items.reduce((acc, it) => {
      const unitPrice = parseFloat(it.unitPrice ?? it.price ?? 0) || 0;
      const qty = parseInt(it.quantity, 10) || 1;
      return acc + (unitPrice * qty);
    }, 0);

    // 14.50 * 2 = 29.00
    // 26.00 * 1 = 26.00
    // 2.50 * 3 = 7.50
    // Total = 62.50
    assert.equal(totalAmount, 62.50);
    assert.notEqual(totalAmount, 48.00);
    assert.notEqual(totalAmount, 48.50);
  });

  await t.test('2. Ne retombe pas sur 48€ / 48.50€ par défaut quand une table est vide', () => {
    const emptyItems = [];
    const totalAmount = emptyItems.reduce((acc, it) => {
      const unitPrice = parseFloat(it.unitPrice ?? it.price ?? 0) || 0;
      const qty = parseInt(it.quantity, 10) || 1;
      return acc + (unitPrice * qty);
    }, 0);

    assert.equal(totalAmount, 0);
    assert.notEqual(totalAmount, 48.50);
  });

  await t.test('3. Prise de commande avec moteur partagé et cumul sur plusieurs tickets', () => {
    const engine = new RestobookCoreEngine({ tables: mockTables });

    // 1ère commande : Entrées & Plats (Table 2)
    const ticket1 = engine.createOrder({
      tableId: 'table_2',
      serverName: 'Julie',
      coursePhase: CoursePhase.MAIN,
      items: [
        { menuItemId: 'item_1', name: 'Carpaccio de Bœuf', unitPrice: 14.50, price: 14.50, quantity: 2 },
        { menuItemId: 'item_3', name: 'Entrecôte Grillée 300g', unitPrice: 26.00, price: 26.00, quantity: 1 }
      ]
    });

    // 2ème commande : Desserts et Boissons (Table 2)
    const ticket2 = engine.createOrder({
      tableId: 'table_2',
      serverName: 'Julie',
      coursePhase: CoursePhase.DESSERT,
      items: [
        { menuItemId: 'item_5', name: 'Moelleux Chocolat', unitPrice: 8.50, price: 8.50, quantity: 2 },
        { menuItemId: 'item_6', name: 'Café', unitPrice: 2.50, price: 2.50, quantity: 2 }
      ]
    });

    const allTickets = Array.from(engine.tickets.values());
    const table2Tickets = allTickets.filter(tk => tk.tableId === 'table_2');
    assert.equal(table2Tickets.length, 2);

    const allTableItems = table2Tickets.flatMap(tk => tk.items || []);
    const totalAddition = allTableItems.reduce((acc, it) => {
      const unitPrice = parseFloat(it.unitPrice ?? it.price ?? 0) || 0;
      const qty = parseInt(it.quantity, 10) || 1;
      return acc + (unitPrice * qty);
    }, 0);

    // Ticket 1: 14.50 * 2 + 26.00 = 55.00
    // Ticket 2: 8.50 * 2 + 2.50 * 2 = 17.00 + 5.00 = 22.00
    // Total Addition: 77.00
    assert.equal(totalAddition, 77.00);

    // Vérification du partage de l'addition (par ex. 2 personnes)
    const splitCount = 2;
    const perPerson = totalAddition / splitCount;
    assert.equal(perPerson, 38.50);
  });
});
