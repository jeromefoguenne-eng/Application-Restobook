# 🍽️ Restobook - Système Connecté Salle & Cuisine (Duo Android)

Système moderne et temps réel pour la restauration, composé de deux applications Android synchronisées sur tablettes tactiles :
1. **Restobook Salle (Front of House & POS)** : Plan de table interactif en glisser-déposer, réservations, gestion du menu, prise de commande et facturation.
2. **Restobook Kitchen (KDS - Kitchen Display System)** : Affichage dynamique des commandes en cuisine, réorganisation par glisser-déposer (priorisation des feux), validation des plats et déclenchement d'alarmes sonores/visuelles pour les serveurs.

---

## 📱 Vue d'Ensemble de l'Écosystème

```
+---------------------------------------------------------------------------------------+
|                                    RESEAU LOCAL / CLOUD                               |
|                     Firebase Firestore / Realtime DB  +  WebSocket Local LAN          |
+---------------------------------------------------------------------------------------+
                                        ▲                               ▲
                                        │ (Envoi commande en <100ms)    │ (Status "Prêt" + Alarme)
                                        │                               │
             ┌──────────────────────────┴───┐               ┌───────────┴──────────────────┐
             │   TABLETTE 1 : SALLE (POS)   │               │ TABLETTE 2 : CUISINE (KDS)   │
             │   "Restobook Salle"          │               │ "Restobook Kitchen"          │
             ├──────────────────────────────┤               ├──────────────────────────────┤
             │ • Plan de table (Drag & Drop)│               │ • Écran des bons de commande │
             │ • Gestion des réservations   │               │ • Réorganisation par drag    │
             │ • Prise de commande fluide   │               │ • Biffage article par article│
             │ • Facturation & Encaissement │               │ • Bouton "Envoyer / Prêt"    │
             │ • 🚨 Récepteur d'Alarme      │               │ • Gestion des temps d'attente│
             │   (Alerte sonore & visuelle) │               │                              │
             └──────────────────────────────┘               └──────────────────────────────┘
```

---

## 🌟 Fonctionnalités Clés

### 1. Tablette Salle (Restobook Salle)
* **Éditeur de Plan de Salle Interactif** :
  * Création et disposition des tables en glisser-déposer (tables rondes, carrées, rectangulaires, mange-debout).
  * Gestion multizone : *Salle Principale, Terrasse, Véranda, Bar*.
  * États visuels en temps réel :
    * 🟢 **Verte** : Libre
    * 🔵 **Bleue** : Occupée (clients installés)
    * 🟡 **Jaune** : Commande en cours de préparation en cuisine
    * 🔴 **Rouge clignotante + bip** : **Plat prêt en cuisine ! (Passe-plat)**
    * 🟣 **Violette** : Addition demandée
    * ⚪ **Grise** : Réservée
* **Module de Réservations** :
  * Calendrier par services (Midi / Soir).
  * Assignation automatique ou manuelle d'une table avec détection de la capacité.
  * Historique client, coordonnées et requêtes particulières (allergies, anniversaire).
* **Menu & Prise de Commande** :
  * Organisation par catégories : Entrées, Plats, Desserts, Boissons, Vins, Formules.
  * Gestion des suppléments, cuissons (bleu, saignant, à point) et commentaires libres ("sans coriandre").
  * Découpage en envois : *Direct, À suivre (Suite), Dessert*.
* **Facturation & Encaissement** :
  * Division de l'addition (par couvert, équitable, ou par article sélectionné).
  * Multi-moyens de paiement (CB, Espèces, Titres-Restaurant, etc.).
  * Édition et impression ticket (compatibilité imprimante thermique ESC/POS Bluetooth / Wi-Fi).
* **Récepteur d'Alarme de Service** :
  * Alerte sonore distincte et bandeau persistant dès que la cuisine valide un plat/envoi.
  * Notification : *"Table 4 : Suite prête au passe !"*.
  * Acquittement en un clic : *"Pris en charge"*.

---

### 2. Tablette Cuisine (Restobook Kitchen - KDS)
* **Bons de Commande Numériques en Temps Réel** :
  * Affichage sous forme de fiches / tickets clairs et très contrastés (optimisés pour l'environnement chaud et dynamique d'une cuisine).
  * Horodatage dynamique avec code couleur d'urgence :
    * 🟢 < 10 minutes
    * 🟠 10 à 20 minutes
    * 🔴 > 20 minutes de retard
* **Réorganisation Tactile des Commandes (Drag & Drop)** :
  * Glisser-déposer des tickets pour ajuster les priorités selon les feux de cuisson, les tables pressées ou le rythme de la brigade.
* **Validation & Déclenchement d'Alarme** :
  * Biffage tactile des articles préparés au fur et à mesure.
  * Bouton d'action proéminent : **"Envoyer au passe / Prêt"**.
  * Déclenche instantanément l'alarme sonore et visuelle sur la tablette du serveur en salle.
* **Historique & Rappel** :
  * Possibilité de rappeler un bon validé par erreur dans les 5 minutes.

---

## 🛠️ Stack Technologique Recommandée

| Couche | Technologie | Justification |
| :--- | :--- | :--- |
| **Framework Mobile** | **Flutter (Dart)** | Expérience native 60/120 FPS sur tablettes Android, canvas tactile surpuissant pour le Drag & Drop, monorepo propre pour les 2 applications. |
| **State Management** | **Riverpod** | Gestion d'état réactive, testable et découplée. |
| **Synchronisation Temps Réel** | **Firebase Firestore / Realtime DB** | Latence ultra-faible (<100ms), mode hors-ligne natif avec cache local, gestion des streams en temps réel. |
| **Secours Réseau Local (LAN)** | **WebSockets + Bonjour/mDNS** | Permet aux 2 tablettes de communiquer via le Wi-Fi local même en cas de coupure de la connexion Internet externe. |
| **Moteur Audio** | **audioplayers** | Sons d'alarme configurables, personnalisables et prioritaires sur Android. |
| **Persistance Locale** | **Hive / Isar / SQLite** | Cache instantané hors-ligne pour la fluidité absolue de l'interface. |

---

## 📂 Structure du Dépôt

```
Application-Restobook/
├── README.md                           # Documentation générale (ce fichier)
├── docs/
│   ├── ARCHITECTURE_TECHNIQUE.md       # Schéma technique, modèles de données, protocoles
│   ├── SPECIFICATIONS_FONCTIONNELLES.md # Parcours utilisateurs, états des tables et tickets
│   └── PLAN_DE_DEVELOPPEMENT.md        # Plan d'implémentation par étapes (TDD & Jalons)
├── apps/                               # (À initialiser lors de la phase de code)
│   ├── restobook_salle/                # Application Android Salle & Caisse (POS)
│   ├── restobook_kitchen/              # Application Android Cuisine (KDS)
│   └── restobook_shared/               # Modèles de données, DTOs et protocoles partagés
```

---

## 📖 Documentation Détaillée

1. [📐 Architecture Technique & Réseau](docs/ARCHITECTURE_TECHNIQUE.md)
2. [📋 Spécifications Fonctionnelles & UX](docs/SPECIFICATIONS_FONCTIONNELLES.md)
3. [🚀 Plan de Développement Étape par Étape](docs/PLAN_DE_DEVELOPPEMENT.md)
