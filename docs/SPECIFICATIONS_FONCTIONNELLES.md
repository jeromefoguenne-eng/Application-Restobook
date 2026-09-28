# 📋 Spécifications Fonctionnelles & Ergonomie (UX/UI)

Ce document décrit l'ensemble des parcours utilisateurs, la cinématique des écrans et les règles de gestion pour les applications **Restobook Salle** et **Restobook Kitchen**.

---

## 1. Application 1 : Restobook Salle (Front of House & POS)

L'application tourne en mode paysage sur une tablette Android 10 à 12 pouces, positionnée sur un support de caisse ou tenue par le maître d'hôtel.

### Écran 1.1 : Plan de Salle Interactif (Floor Plan Canvas)

Deux modes d'utilisation distincts :
1. **Mode Édition (Configuration du restaurant)** :
   - Panneau latéral avec palette d'objets : Table ronde, Table carrée, Table rectangulaire, Cloison/Mur, Bar, Entrée/Sortie.
   - **Glisser-Déposer libre** : Le gérant glisse un élément sur la grille magnétique (snap-to-grid).
   - Paramétrage de la table : Numéro/Nom (ex: "Table 12"), Nombre de places assises (2, 4, 6, 8...), Zone d'affectation ("Terrasse", "Intérieur").
   - Redimensionnement et rotation à deux doigts ou par molette tactile.
   - Sauvegarde du plan avec historique de versions.
2. **Mode Service (Pendant le service)** :
   - Vue d'ensemble interactive de la salle avec zoom et déplacement fluide (pinch-to-zoom & pan).
   - Code couleur des tables en temps réel :
     - 🟢 **Verte** : Libre
     - 🔵 **Bleue** : Occupée (commande en cours ou servie)
     - 🟡 **Jaune** : En attente cuisine
     - 🔴 **Rouge clignotante** : **Alarme cuisine ! (Plats prêts au passe)**
     - 🟣 **Violette** : En attente d'encaissement / Note demandée
     - ⚪ **Grise** : Réservée pour le service actuel
   - Tap sur une table :
     - Si libre -> Boîte de dialogue : "Ouvrir une table (Nombre de couverts)" ou "Assigner réservation".
     - Si occupée -> Ouvre immédiatement l'écran de prise de commande et le récapitulatif d'addition.

---

### Écran 1.2 : Module de Réservations

- **Vue Timeline / Créneaux** :
  - Séparation Midi (11h30 - 15h00) / Soir (18h30 - 23h30).
  - Liste chronologique des réservations du jour.
- **Fiche Réservation** :
  - Nom & Prénom du client.
  - Numéro de téléphone & Email.
  - Nombre de personnes.
  - Table assignée (suggestion intelligente selon le nombre de couverts).
  - Commentaires : Anniversaire, chaise haute bébé, intolérance au gluten, etc.
  - Statut : Confirmée, Arrivée (fait basculer la table en bleue), No-Show, Annulée.

---

### Écran 1.3 : Gestionnaire de Menu & Tarifs

- Organisation hiérarchique :
  - **Familles / Catégories** (Onglets visuels avec icônes ou photos).
  - **Fiches Produits** :
    - Nom de l'article, Description, Taux de TVA (10% alimentation, 20% alcools).
    - Prix unitaire TTC.
    - Options & Suppléments (Groupes de modificateurs) :
      - Choix unique obligatoire : Ex. Cuisson (Bleu, Saignant, À point, Bien cuit).
      - Choix multiple : Ex. Sauces (Poivre, Roquefort, Béarnaise), Garnitures (Frites fraîches, Légumes de saison, Riz).
    - Bascule rapide "Disponible / Épuisé" (pour réagir instantanément en cas de rupture de stock).

---

### Écran 1.4 : Prise de Commande Rapide

- Disposition optimisée en 2 colonnes :
  - **Gauche (65%)** : Grille des produits filtrable par catégories avec recherche textuelle rapide.
  - **Droite (35%)** : Ticket de caisse en cours pour la table sélectionnée.
- Fonctionnalités indispensables :
  - Distinction par couvert (Client 1, Client 2, etc.) ou global par table.
  - Séparation par temps de service :
    - **Apéritif / Boissons** (envoi direct bar/cuisine).
    - **Entrées**.
    - **Plats**.
    - **Desserts**.
  - Saisie de remarques personnalisées pour chaque plat (ex: "Bien grillé", "Sauce à part").
  - Gros bouton tactile d'action : **"ENVOYER EN CUISINE (TABLE X)"**.

---

### Écran 1.5 : Facturation & Encaissement

- Récapitulatif clair du ticket avec calcul automatique de la TVA par taux.
- Options de partage d'addition :
  - **Partage égal** : Division automatique du montant total par le nombre de personnes (ex: 120 € / 4 = 30 € par personne).
  - **Division par article** : Sélection tactile des articles réglés par chaque convive.
- Enregistrement des paiements multi-modes :
  - Carte bancaire, Espèces (avec calculatrice de rendu de monnaie), Titres-Restaurant, Chèque.
- Clôture de table : Libère automatiquement la table sur le plan 2D qui repasse au statut Vert.
- Impression de l'addition ou envoi par email.

---

### Écran 1.6 : Système d'Alarme & Bannière d'Alerte Serveur

- Lorsqu'un plat ou un envoi est validé sur la tablette Cuisine :
  - **Alerte Sonore** : Sonnette de restaurant ("Ding-Ding !") ou signal d'alarme répétitif émis par le haut-parleur de la tablette.
  - **Alerte Visuelle** :
    - La table concernée sur le plan 2D pulse avec une lueur rouge.
    - Une bannière "Passe-Plat" rouge apparaît en surimpression en haut de l'écran :
      `🚨 TABLE 3 : Les 2 Entrecôtes sont prêtes au passe !`
    - Bouton d'action immédiate : **"J'arrive / Récupéré"** qui coupe immédiatement l'alarme sonore.

---

## 2. Application 2 : Restobook Kitchen (KDS - Kitchen Display System)

L'application tourne en permanence en cuisine, fixée au mur ou sur un meuble inox en face du chef de partie et du passe-plat. Interface sombre à fort contraste pour limiter la fatigue oculaire et maximiser la lisibilité à 2 mètres de distance.

### Écran 2.1 : Tableau des Bons de Commande (Vue Principale)

- Grille horizontale de colonnes représentant chaque commande / ticket actif.
- En-tête de chaque bon :
  - Numéro de table bien visible (ex: **TABLE 08** en gras taille 28pt).
  - Nom du serveur ayant pris la commande.
  - Chronomètre dynamique : Affiche le temps écoulé depuis l'arrivée du bon (`04:32`).
  - Code couleur de criticité :
    - 🟩 Vert : Moins de 10 min
    - 🟧 Orange : 10 à 20 min
    - 🟥 Rouge clignotant : Plus de 20 min (Retard critique)

### Écran 2.2 : Réorganisation Tactile par Glisser-Déposer (Drag & Drop)

- Le chef de cuisine peut maintenir un doigt appuyé sur un ticket pour le déplacer de gauche à droite dans la file d'attente.
- Permet de regrouper les commandes ayant les mêmes cuissons ou de faire passer une table prioritaire en avant de ligne.
- L'ordre réorganisé est sauvegardé instantanément.

### Écran 2.3 : Biffage & Validation des Plats

- Chaque ligne du bon détaille la quantité, le nom du plat, les cuissons et les remarques particulières écrites en surbrillance jaune (ex: *"⚠️ SANS ARACHIDE"*).
- **Biffage individuel** : Le cuisinier touche un article fini pour le rayer (feedback visuel gris barré).
- **Bouton d'envoi principal** :
  - Bouton vert large en bas du ticket : **"ENVOYER AU PASSE (TABLE X)"**.
  - Au clic :
    1. Le bon quitte l'écran actif ou passe en statut "Prêt".
    2. L'alarme sonore et visuelle retentit immédiatement sur la tablette de la salle.
- **Onglet "Historique / Rappel"** :
  - Permet en un clic de rouvrir un bon validé par mégarde.
