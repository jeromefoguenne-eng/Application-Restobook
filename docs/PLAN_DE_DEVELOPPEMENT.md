# 🚀 Plan de Développement Étape par Étape - Restobook Duo

Ce plan détaille la feuille de route d'implémentation selon une méthodologie rigoureuse, orientée composants et tests (TDD).

---

## 📅 Synthèse des Jalons (Milestones)

| Jalon | Intitulé | Objectif Principal | Durée Estimée |
| :--- | :--- | :--- | :--- |
| **Jalon 1** | **Socle & Bibliothèque Partagée** | Architecture monorepo, modèles Dart, sérialisation & contrats | Semaine 1 |
| **Jalon 2** | **Plan de Table Interactif (Salle)** | Canvas tactile, glisser-déposer des tables, persistance du plan | Semaine 2 |
| **Jalon 3** | **Menu, Carte & Prise de Commande** | Gestion des catégories, articles, variantes et ticket en cours | Semaine 3 |
| **Jalon 4** | **Réservations & Facturation** | Gestion des créneaux, additions divisées, règlements | Semaine 4 |
| **Jalon 5** | **Application Cuisine (KDS)** | Affichage des bons, drag & drop de réorganisation, biffage | Semaine 5 |
| **Jalon 6** | **Temps Réel & Système d'Alarme** | Synchro Firestore/LAN, déclencheur d'alarme sonore & visuelle | Semaine 6 |
| **Jalon 7** | **Tests d'Intégration & Finalisation** | Recette sur 2 tablettes réelles, optimisations tactiles | Semaine 7 |

---

## 🛠️ Découpage Détaillé des Tâches (Bite-Sized Tasks)

### JALON 1 : Socle Commun (`restobook_shared`)

#### Tâche 1.1 : Initialisation du Monorepo Flutter
**Fichiers cibles :**
- `pubspec.yaml` (Workspace racine)
- `packages/restobook_shared/pubspec.yaml`
- `apps/restobook_salle/pubspec.yaml`
- `apps/restobook_kitchen/pubspec.yaml`

- [ ] **Étape 1** : Créer l'arborescence des dossiers `packages/restobook_shared`, `apps/restobook_salle` et `apps/restobook_kitchen`.
- [ ] **Étape 2** : Configurer les dépendances partagées (`freezed_annotation`, `json_annotation`, `uuid`).
- [ ] **Étape 3** : Valider la compilation croisée des packages avec `flutter pub get`.

#### Tâche 1.2 : Modélisation des Tables et Zones
**Fichiers cibles :**
- `packages/restobook_shared/lib/src/models/table_model.dart`
- `packages/restobook_shared/lib/src/models/floor_zone_model.dart`
- `packages/restobook_shared/test/table_model_test.dart`

- [ ] **Étape 1 : Écrire le test unitaire** :
  ```dart
  test('RestaurantTable should serialize and deserialize correctly to/from JSON', () {
    final table = RestaurantTable(
      id: 'tab_1',
      number: '10',
      zoneId: 'main_hall',
      shape: TableShape.round,
      capacity: 4,
      positionX: 120.0,
      positionY: 200.0,
      width: 80.0,
      height: 80.0,
      rotation: 0.0,
      status: TableStatus.free,
    );
    final json = table.toJson();
    final restored = RestaurantTable.fromJson(json);
    expect(restored.number, equals('10'));
    expect(restored.shape, equals(TableShape.round));
  });
  ```
- [ ] **Étape 2** : Lancer le test pour vérifier l'échec initial (`flutter test packages/restobook_shared/test/table_model_test.dart`).
- [ ] **Étape 3** : Implémenter les classes `RestaurantTable`, `FloorZone` et les énumérations associées.
- [ ] **Étape 4** : Valider le passage du test avec succès.

#### Tâche 1.3 : Modélisation des Commandes, Bons Cuisine & Événements
**Fichiers cibles :**
- `packages/restobook_shared/lib/src/models/order_model.dart`
- `packages/restobook_shared/lib/src/models/kitchen_ticket_model.dart`
- `packages/restobook_shared/lib/src/models/realtime_events.dart`
- `packages/restobook_shared/test/order_model_test.dart`

- [ ] **Étape 1** : Écrire les tests de sérialisation des statuts de préparation et des tickets cuisine.
- [ ] **Étape 2** : Implémenter les modèles `KitchenTicket`, `OrderItem`, `CoursePhase`.
- [ ] **Étape 3** : Définir la structure des événements `OrderReadyEvent` contenant l'ID de la table et les plats préparés.

---

### JALON 2 : Plan de Table Interactif (`restobook_salle`)

#### Tâche 2.1 : Canvas Graphique avec Support Pan & Zoom
**Fichiers cibles :**
- `apps/restobook_salle/lib/features/floor_plan/views/floor_canvas_view.dart`
- `apps/restobook_salle/lib/features/floor_plan/providers/floor_plan_provider.dart`

- [ ] **Étape 1** : Mettre en place un `InteractiveViewer` avec contraintes de zoom (0.5x à 2.5x) et grille de repère magnétique.
- [ ] **Étape 2** : Développer le widget de rendu d'une table avec différenciation visuelle selon la forme (carrée, rectangle, ronde).
- [ ] **Étape 3** : Connecter le State Notifier Riverpod pour charger la disposition des tables depuis la base de données locale/Cloud.

#### Tâche 2.2 : Éditeur en Glisser-Déposer (Drag & Drop)
**Fichiers cibles :**
- `apps/restobook_salle/lib/features/floor_plan/widgets/table_draggable_palette.dart`
- `apps/restobook_salle/lib/features/floor_plan/widgets/draggable_table_item.dart`

- [ ] **Étape 1** : Intégrer les widgets Flutter `Draggable` et `DragTarget` pour déposer de nouvelles tables sur la grille.
- [ ] **Étape 2** : Implémenter la manipulation d'une table existante (déplacement par glisser, rotation à 45°/90°, édition du numéro et du nombre de couverts).
- [ ] **Étape 3** : Ajouter le bouton "Sauvegarder la disposition" et le mode verrouillage (pour éviter les déplacements accidentels pendant le service).

---

### JALON 3 : Prise de Commande & Gestion du Menu (`restobook_salle`)

#### Tâche 3.1 : Gestionnaire de Carte & Produits
**Fichiers cibles :**
- `apps/restobook_salle/lib/features/menu/views/menu_management_screen.dart`
- `apps/restobook_salle/lib/features/menu/widgets/menu_item_editor_dialog.dart`

- [ ] **Étape 1** : Créer l'écran d'administration du menu (création de catégories, ajout de plats avec prix, taux de TVA, allergènes et variantes).
- [ ] **Étape 2** : Permettre d'activer/désactiver la disponibilité d'un article en un tap (gestion des ruptures de stock en temps réel).

#### Tâche 3.2 : Prise de Commande Tactile
**Fichiers cibles :**
- `apps/restobook_salle/lib/features/orders/views/order_entry_screen.dart`
- `apps/restobook_salle/lib/features/orders/widgets/active_ticket_view.dart`

- [ ] **Étape 1** : Créer l'écran scindé en 2 colonnes (sélection des plats à gauche, panier/ticket à droite).
- [ ] **Étape 2** : Implémenter la sélection des cuissons et la saisie de remarques spéciales.
- [ ] **Étape 3** : Associer chaque ligne à un envoi spécifique (Direct, Entrée, Plat, Dessert).
- [ ] **Étape 4** : Implémenter l'action "Envoyer en cuisine" qui enregistre la commande et génère les bons numériques.

---

### JALON 4 : Réservations & Facturation (`restobook_salle`)

#### Tâche 4.1 : Module Réservations
**Fichiers cibles :**
- `apps/restobook_salle/lib/features/reservations/views/reservations_calendar_view.dart`
- `apps/restobook_salle/lib/features/reservations/widgets/reservation_dialog.dart`

- [ ] **Étape 1** : Développer le sélecteur de créneaux Midi / Soir et la liste chronologique.
- [ ] **Étape 2** : Lier la réservation à une table physique sur le plan avec calcul de disponibilité.
- [ ] **Étape 3** : Action "Marquer comme Arrivé" pour transformer automatiquement la réservation en table active.

#### Tâche 4.2 : Encaissement & Facturation
**Fichiers cibles :**
- `apps/restobook_salle/lib/features/billing/views/billing_screen.dart`
- `apps/restobook_salle/lib/features/billing/widgets/split_payment_modal.dart`

- [ ] **Étape 1** : Mettre en place le calcul automatique des totaux, remises et ventilation de TVA.
- [ ] **Étape 2** : Implémenter la division d'addition (par parts égales ou par sélection d'articles).
- [ ] **Étape 3** : Clôturer la table (changement du statut en libre / vert sur le plan).

---

### JALON 5 : Application Cuisine Restobook Kitchen (KDS)

#### Tâche 5.1 : Écran Haute Lisibilité des Bons de Commande
**Fichiers cibles :**
- `apps/restobook_kitchen/lib/features/kds/views/kitchen_display_screen.dart`
- `apps/restobook_kitchen/lib/features/kds/widgets/order_ticket_card.dart`

- [ ] **Étape 1** : Créer le thème d'interface sombre à fort contraste pour écran de cuisine.
- [ ] **Étape 2** : Afficher les fiches de commande avec compteur de temps dynamique et code couleur d'urgence.
- [ ] **Étape 3** : Implémenter le biffage tactile au doigt pour chaque article terminé.

#### Tâche 5.2 : Réorganisation Tactile des Bons (Drag & Drop KDS)
**Fichiers cibles :**
- `apps/restobook_kitchen/lib/features/kds/widgets/reorderable_ticket_board.dart`

- [ ] **Étape 1** : Implémenter un conteneur réordonnable fluide (`ReorderableListView` horizontal ou drag custom) pour permettre au chef de déplacer un bon vers la gauche ou la droite selon ses priorités de cuisson.
- [ ] **Étape 2** : Synchroniser l'ordre de priorité dans l'état local et distant.

#### Tâche 5.3 : Validation des Plats & Déclenchement d'Alarme
**Fichiers cibles :**
- `apps/restobook_kitchen/lib/features/kds/widgets/ticket_action_buttons.dart`

- [ ] **Étape 1** : Concevoir le bouton proéminent **"ENVOYER AU PASSE (PRÊT)"**.
- [ ] **Étape 2** : Émettre l'événement `EVENT_ORDER_READY` avec l'identifiant de la table et de la commande.
- [ ] **Étape 3** : Transférer le ticket dans la colonne "Historique récent" avec option d'annulation en cas d'erreur.

---

### JALON 6 : Couplage Temps Réel & Système d'Alarme Salle

#### Tâche 6.1 : Système d'Alerte Sonore & Visuelle
**Fichiers cibles :**
- `apps/restobook_salle/lib/core/audio/alarm_service.dart`
- `apps/restobook_salle/lib/features/floor_plan/widgets/table_alarm_pulse.dart`
- `apps/restobook_salle/lib/features/orders/widgets/kitchen_ready_banner.dart`

- [ ] **Étape 1** : Intégrer `audioplayers` avec fichier audio d'alarme de restaurant (sonnette carillon / bip cadencé).
- [ ] **Étape 2** : Dès réception de l'événement `EVENT_ORDER_READY` :
  - Jouer la boucle sonore d'alarme.
  - Faire clignoter la table en rouge vif sur le plan 2D.
  - Afficher une bannière rouge en haut de l'écran avec le détail du plat prêt.
- [ ] **Étape 3** : Développer le bouton d'acquittement "Pris en charge" qui coupe le son et met à jour le statut en "Plat récupéré".

#### Tâche 6.2 : Synchronisation Hybride (Firebase + Local LAN)
**Fichiers cibles :**
- `packages/restobook_shared/lib/src/sync/sync_manager.dart`
- `packages/restobook_shared/lib/src/sync/local_lan_discovery.dart`

- [ ] **Étape 1** : Connecter le flux Firebase Firestore pour la synchronisation normale.
- [ ] **Étape 2** : Mettre en place un serveur WebSocket de secours sur la tablette Salle avec découverte ZeroConf (mDNS).
- [ ] **Étape 3** : Bascule automatique transparente entre le canal Cloud et le canal local si le ping Internet échoue.

---

### JALON 7 : Tests d'Intégration & Recette sur Tablettes

- [ ] **Test 7.1** : Simulation de prise de commande sur Tablette 1 et apparition du bon sur Tablette 2 (< 200 ms).
- [ ] **Test 7.2** : Réorganisation de 5 commandes par glisser-déposer sur Tablette 2.
- [ ] **Test 7.3** : Validation "Prêt" sur Tablette 2 -> déclenchement immédiat de l'alarme sonore et clignotement rouge sur Tablette 1.
- [ ] **Test 7.4** : Coupure volontaire de la connexion Internet et vérification du maintien des alertes en réseau local.
