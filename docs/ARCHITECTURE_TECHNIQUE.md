# 📐 Architecture Technique - Écosystème Restobook

Ce document décrit en détail l'architecture logicielle, les protocoles de communication temps réel, les modèles de données et la stratégie de tolérance aux pannes pour les deux applications Android **Restobook Salle** et **Restobook Kitchen**.

---

## 1. Topologie Réseau & Stratégie Temps Réel Hybride

Dans un contexte de restauration, la fiabilité de transmission des commandes est critique : le restaurant ne peut pas s'arrêter si la connexion Internet du fournisseur d'accès faiblit. Restobook adopte une **stratégie hybride double canal** :

```
                  ┌──────────────────────────────────────────────┐
                  │                 CLOUD FIREBASE               │
                  │   (Firestore / Realtime Database + Storage)  │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
                      Sync Cloud │ (Normal)       │ Sync Cloud (Normal)
                                 ▼                ▼
     ┌─────────────────────────────┐            ┌─────────────────────────────┐
     │  TABLETTE 1 : SALLE (POS)   │            │ TABLETTE 2 : CUISINE (KDS)  │
     │                             │            │                             │
     │  - Client App (Flutter)     │◄──────────►│  - Client App (Flutter)     │
     │  - Embedded WebSocket Server│  Local LAN │  - WebSocket Client         │
     │  - mDNS / ZeroConf Service  │  (Secours) │  - Auto-Discovery via mDNS  │
     └─────────────────────────────┘            └─────────────────────────────┘
```

### Modes de Fonctionnement :
1. **Canal Principal (Cloud Firebase)** :
   - Écouteurs de collections en temps réel (`snapshots()` Firestore ou Firebase Realtime DB).
   - Latence moyenne : **40 à 120 ms**.
   - Sauvegarde continue, multi-tablettes et accessible à distance (ex: tableau de bord gérant).
2. **Canal Secours Local (Offline LAN via WebSocket)** :
   - Si la connexion Internet est coupée, la tablette Salle active son serveur WebSocket local embarqué (port standard `8080`).
   - La tablette Cuisine détecte automatiquement la tablette Salle sur le Wi-Fi local grâce au protocole **mDNS / Bonjour (ZeroConf)** (`_restobook._tcp`).
   - La transmission des commandes et des alarmes continue de fonctionner à 100% sur le réseau local, sans interruption.
   - Dès le retour d'Internet, les données locales sont automatiquement synchronisées vers le Cloud.

---

## 2. Modèles de Données Partagés (`restobook_shared`)

Les deux applications partagent une bibliothèque commune contenant les entités métiers, les enums et la sérialisation JSON.

### A. Entités de Salle & Tables

```dart
enum TableShape { round, square, rectangle }
enum TableStatus { free, occupied, orderSent, readyFromKitchen, billRequested, reserved }

class RestaurantTable {
  final String id;
  final String number;          // Ex: "T1", "12", "Terrasse 3"
  final String zoneId;          // Ex: "salle_principale", "terrasse"
  final TableShape shape;
  final int capacity;           // Nombre de couverts (ex: 2, 4, 6)
  final double positionX;       // Coordonnée X sur le canvas (en pourcentage ou points)
  final double positionY;       // Coordonnée Y sur le canvas
  final double width;
  final double height;
  final double rotation;        // Orientation en degrés
  final TableStatus status;
  final String? currentOrderId;
  final String? currentReservationId;
}

class FloorZone {
  final String id;
  final String name;            // "Salle principale", "Terrasse", "Mezzanine"
  final int orderIndex;
  final String? backgroundPlanUrl; // Plan de fond optionnel
}
```

### B. Menu & Produits

```dart
class Category {
  final String id;
  final String name;            // "Entrées", "Plats Chauds", "Desserts", "Vins"
  final int displayOrder;
  final String? iconName;
}

class MenuItem {
  final String id;
  final String categoryId;
  final String name;            // "Entrecôte grillée 300g"
  final String description;
  final double price;           // Ex: 24.50 €
  final double vatRate;         // Ex: 10.0 ou 20.0 %
  final List<String> allergens;
  final List<ModifierGroup> modifierGroups; // Cuissons, sauces, garnitures
  final bool isAvailable;       // Gestion des ruptures de stock
}

class ModifierGroup {
  final String id;
  final String name;            // "Cuisson", "Sauce au choix"
  final bool isRequired;        // Obligatoire ou optionnel
  final int maxChoices;
  final List<ModifierOption> options; // "Bleu", "Saignant", "À point"
}
```

### C. Commandes & Bons Cuisine

```dart
enum CoursePhase {
  direct,     // Envoi direct (ex: apéritif, boisson)
  starter,    // Entrées
  mainCourse, // Plats principaux
  dessert,    // Desserts
}

enum ItemPreparationStatus {
  pending,    // En attente
  cooking,    // En cours de préparation
  ready,      // Réalisé / Prêt au passe
  delivered   // Emporté par le serveur
}

class OrderItem {
  final String id;
  final String menuItemId;
  final String itemName;
  final double unitPrice;
  final int quantity;
  final CoursePhase phase;
  final List<String> selectedModifiers; // Ex: ["Saignant", "Sauce Poivre"]
  final String? customKitchenNote;      // Ex: "Sans oignons"
  final ItemPreparationStatus status;
  final DateTime? preparedAt;
}

enum OrderTicketStatus {
  received,     // Arrivé en cuisine
  inProgress,   // Brigade au travail
  ready,        // Sonnette/Alarme déclenchée !
  archived      // Commande terminée
}

class KitchenTicket {
  final String id;
  final String orderId;
  final String tableNumber;
  final String serverName;
  final DateTime createdAt;
  final CoursePhase currentPhase;
  final List<OrderItem> items;
  final int priorityScore;      // Permet la réorganisation manuelle (drag & drop)
  final OrderTicketStatus status;
  final DateTime? readyAt;
  final bool serverAcknowledged;
}
```

---

## 3. Protocole d'Événements Temps Réel & Alarme

### Flux de Vie d'une Commande :
1. **Émission** : Le serveur valide la commande sur la Tablette 1.
   - Événement : `EVENT_ORDER_CREATED` / `TICKET_DISPATCHED`.
   - Payload : Contenu du ticket, numéro de table, phase (Entrées ou Plats).
2. **Réception Cuisine** : La Tablette 2 reçoit l'événement en moins de 100ms.
   - Son bref "Nouveau Bon" (carillon discret).
   - Le ticket s'affiche en tête de liste ou selon la priorité définie.
3. **Réorganisation en Cuisine** : Le chef cuisinier glisse-dépose le ticket pour réordonner sa file.
   - Événement : `EVENT_TICKET_REORDERED` (met à jour `priorityScore`).
4. **Validation Cuisine (Coup de feu terminé)** : Le chef clique sur **"Prêt / Réalisé"**.
   - Statut du ticket passe à `ready`.
   - Événement : `EVENT_ORDER_READY` { tableId: "T4", ticketId: "...", items: [...] }.
5. **Déclenchement de l'Alarme (Tablette Salle)** :
   - La tablette Salle intercepte `EVENT_ORDER_READY`.
   - Déclenchement d'une alarme sonore audible et cadencée (bip puissant ou carillon d'urgence).
   - La table concernée sur le plan 2D clignote en rouge vif.
   - Une bannière "Pop-up Alarme" apparaît : *"🚨 TABLE 4 : Les Plats sont prêts au passe !"*.
6. **Acquittement Serveur** :
   - Le serveur clique sur *"Je récupère"* sur la tablette Salle.
   - L'alarme sonore se coupe.
   - Le statut passe à `delivered`.

---

## 4. Architecture Audio (Gestionnaire d'Alarmes)

Pour assurer que le serveur entende l'alarme même dans le bruit d'une salle de restaurant :
- Module dédié : `AudioNotificationService` basé sur `audioplayers`.
- Modes d'alertes configurables dans les réglages :
  - **Sonnerie continue** (sonne toutes les 5 secondes jusqu'à acquittement par le serveur).
  - **Sonnerie unique** (3 bips successifs).
  - **Contrôle du volume indépendant** (utilise le flux audio multimédia avec override de volume).
  - **Vibreur de la tablette** (si supporté par le matériel).

---

## 5. Sécurité et Gestion des Données
- Données chiffrées au repos et en transit (TLS 1.3 / WSS).
- Profils utilisateurs avec droits différenciés :
  - **Manager** : Accès plan de salle, prix du menu, clôtures de caisse, statistiques.
  - **Serveur** : Plan de table, prise de commande, encaissement, acquittement des alarmes.
  - **Cuisine** : Affichage KDS, réordonnancement, validation des bons.
