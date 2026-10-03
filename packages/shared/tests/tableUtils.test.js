import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextAvailableTableNumber,
  findDuplicateTableNumbers,
  fixDuplicateTableNumbers,
  autoAlignTables
} from '../src/utils/tableUtils.js';

test('tableUtils - Gestion des numéros de tables et unicité', async (t) => {
  await t.test('1. getNextAvailableTableNumber retourne 1 pour un plan vide', () => {
    assert.equal(getNextAvailableTableNumber([]), '1');
  });

  await t.test('2. getNextAvailableTableNumber trouve le premier numéro libre séquentiel', () => {
    const tables = [
      { id: 't1', number: '1' },
      { id: 't2', number: '2' },
      { id: 't3', number: '3' }
    ];
    assert.equal(getNextAvailableTableNumber(tables), '4');
  });

  await t.test('3. getNextAvailableTableNumber remplit les trous sans collision', () => {
    // Si la table 2 a été supprimée
    const tables = [
      { id: 't1', number: '1' },
      { id: 't3', number: '3' },
      { id: 't4', number: '4' }
    ];
    assert.equal(getNextAvailableTableNumber(tables), '2');
  });

  await t.test('4. findDuplicateTableNumbers identifie les doublons', () => {
    const tables = [
      { id: 't1', number: '1' },
      { id: 't2', number: '2' },
      { id: 't3', number: '1' }, // Doublon de '1'
      { id: 't4', number: '4' },
      { id: 't5', number: '4' }  // Doublon de '4'
    ];
    const dups = findDuplicateTableNumbers(tables);
    assert.deepEqual(dups.sort(), ['1', '4'].sort());
  });

  await t.test('5. fixDuplicateTableNumbers corrige les numéros en double', () => {
    const tables = [
      { id: 't1', number: '1' },
      { id: 't2', number: '2' },
      { id: 't3', number: '1' }, // Doublon
      { id: 't4', number: '2' }  // Doublon
    ];
    const fixed = fixDuplicateTableNumbers(tables);
    // Vérifier que tous les numéros sont uniques
    const numbers = fixed.map(t => t.number);
    const unique = new Set(numbers);
    assert.equal(unique.size, fixed.length);
    // La table 1 garde son 1, la table 2 garde son 2
    assert.equal(fixed[0].number, '1');
    assert.equal(fixed[1].number, '2');
    // Les deux autres ont reçu des numéros libres (3 et 4)
    assert.equal(fixed[2].number, '3');
    assert.equal(fixed[3].number, '4');
  });

  await t.test('6. autoAlignTables repositionne les tables sans perte', () => {
    const tables = [
      { id: 't1', number: '1', positionX: 0, positionY: 0 },
      { id: 't2', number: '2', positionX: 0, positionY: 0 },
      { id: 't3', number: '3', positionX: 0, positionY: 0 }
    ];
    const aligned = autoAlignTables(tables, 800);
    assert.equal(aligned.length, 3);
    assert.ok(aligned[0].positionX >= 50);
    assert.ok(aligned[1].positionX > aligned[0].positionX);
  });
});
