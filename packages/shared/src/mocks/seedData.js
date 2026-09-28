import { TableShape, TableStatus, CoursePhase } from '../types.js';

export const mockTables = [
  {
    id: 'table_1',
    number: '1',
    zoneId: 'main_hall',
    shape: TableShape.SQUARE,
    capacity: 2,
    positionX: 80,
    positionY: 100,
    width: 90,
    height: 90,
    rotation: 0,
    status: TableStatus.FREE
  },
  {
    id: 'table_2',
    number: '2',
    zoneId: 'main_hall',
    shape: TableShape.ROUND,
    capacity: 4,
    positionX: 240,
    positionY: 100,
    width: 100,
    height: 100,
    rotation: 0,
    status: TableStatus.FREE
  },
  {
    id: 'table_3',
    number: '3',
    zoneId: 'main_hall',
    shape: TableShape.RECTANGLE,
    capacity: 6,
    positionX: 420,
    positionY: 100,
    width: 140,
    height: 90,
    rotation: 0,
    status: TableStatus.FREE
  },
  {
    id: 'table_4',
    number: '4',
    zoneId: 'terrace',
    shape: TableShape.ROUND,
    capacity: 2,
    positionX: 80,
    positionY: 260,
    width: 80,
    height: 80,
    rotation: 0,
    status: TableStatus.FREE
  },
  {
    id: 'table_5',
    number: '5',
    zoneId: 'terrace',
    shape: TableShape.ROUND,
    capacity: 4,
    positionX: 240,
    positionY: 260,
    width: 100,
    height: 100,
    rotation: 0,
    status: TableStatus.FREE
  }
];

export const mockMenuCategories = [
  { id: 'cat_entrees', name: 'Entrées', order: 1, icon: '🥗' },
  { id: 'cat_plats', name: 'Plats', order: 2, icon: '🥩' },
  { id: 'cat_boissons', name: 'Boissons', order: 3, icon: '🍷' },
  { id: 'cat_desserts', name: 'Desserts', order: 4, icon: '🍰' }
];

export const mockMenuItems = [
  {
    id: 'item_1',
    categoryId: 'cat_entrees',
    name: 'Carpaccio de Bœuf & Parmesan',
    description: 'Fines tranches de bœuf mariné, huile de truffe, copeaux de parmesan 24 mois',
    price: 14.50,
    vatRate: 10.0,
    allergens: ['Lactose'],
    isAvailable: true
  },
  {
    id: 'item_2',
    categoryId: 'cat_entrees',
    name: 'Soupe à l\'Oignon Gratinée',
    description: 'Recette traditionnelle au bouillon de bœuf, croûtons à l\'ail et emmental fondu',
    price: 9.80,
    vatRate: 10.0,
    allergens: ['Gluten', 'Lactose'],
    isAvailable: true
  },
  {
    id: 'item_3',
    categoryId: 'cat_plats',
    name: 'Entrecôte Grillée 300g (Normandie)',
    description: 'Viande maturée, servie avec frites fraîches maison et sauce au choix',
    price: 26.00,
    vatRate: 10.0,
    allergens: ['Lactose'],
    modifierGroups: [
      {
        id: 'cuisson',
        name: 'Cuisson',
        isRequired: true,
        options: ['Bleu', 'Saignant', 'À point', 'Bien cuit']
      },
      {
        id: 'sauce',
        name: 'Sauce au choix',
        isRequired: true,
        options: ['Sauce Poivre Noir', 'Béarnaise Maison', 'Beurre Maître d\'Hôtel', 'Roquefort']
      }
    ],
    isAvailable: true
  },
  {
    id: 'item_4',
    categoryId: 'cat_plats',
    name: 'Pavé de Saumon Rôti',
    description: 'Riz vénéré noir, émulsion citron vert et estragon',
    price: 22.50,
    vatRate: 10.0,
    allergens: ['Poisson', 'Lactose'],
    isAvailable: true
  },
  {
    id: 'item_5',
    categoryId: 'cat_desserts',
    name: 'Moelleux Cœur Coulant Chocolat Valrhona',
    description: 'Glace vanille Bourbon de Madagascar',
    price: 8.50,
    vatRate: 10.0,
    allergens: ['Gluten', 'Lactose', 'Œufs'],
    isAvailable: true
  },
  {
    id: 'item_6',
    categoryId: 'cat_boissons',
    name: 'Bordeaux Rouge AOC Château Saint-Émilion (Verre)',
    description: 'Millésime 2020, robe grenat, tanins soyeux',
    price: 6.50,
    vatRate: 20.0,
    allergens: ['Sulfites'],
    isAvailable: true
  }
];
