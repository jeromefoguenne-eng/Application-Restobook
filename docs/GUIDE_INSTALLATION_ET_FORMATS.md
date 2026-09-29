# Restobook Cloud - Guide Officiel de Déploiement en Ligne (100% Gratuit & Pérenne)

Bienvenue dans la version **Restobook Cloud**, la solution SaaS moderne pour restaurants connectant instantanément vos tablettes de **Salle** et de **Cuisine** sans aucun serveur payant, sans configuration d'adresses IP locales et sans risque de coupure.

---

## 1. Pourquoi cette architecture est 100% Gratuite et Pérenne à Vie ?

Contrairement à des services qui s'endorment après quelques jours d'inactivité ou exigent une carte bancaire :
- **Hébergement Frontend** : Déployable gratuitement sur **Vercel** ou **GitHub Pages** (disponible 24h/24 dans le monde entier en HTTPS sans frais).
- **Synchronisation Temps Réel Mondiale** : Utilise le protocole **MQTT sur WebSockets sécurisés (WSS)** avec courtiers publics mondiaux (EMQX / HiveMQ) et canal local `BroadcastChannel`. 
  - *Coût* : **0 € / mois à vie**.
  - *Maintenance* : Aucun serveur à maintenir, ne s'endort jamais.
  - *Sécurité & Isolation* : Chaque restaurant dispose d'un espace hermétique identifié par son propre identifiant (`restaurantId`).
- **Persistance des Données (Offline-First)** : Vos plans de tables, cartes de menus, devises et réservations sont stockés dans le stockage persistant de vos tablettes et synchronisés automatiquement dès qu'un appareil se connecte.

---

## 2. Comment publier l'application en ligne en 2 minutes (Gratuit)

### Option A : Déploiement en 1 clic sur Vercel (Recommandé)
1. Rendez-vous sur [vercel.com](https://vercel.com) (connexion gratuite avec votre compte GitHub).
2. Cliquez sur **"Add New..."** > **"Project"**.
3. Sélectionnez le dépôt `jeromefoguenne-eng/Application-Restobook`.
4. Dans le paramètre **Root Directory**, choisissez `apps/client`.
5. Cliquez sur **"Deploy"**.
6. En moins de 45 secondes, vous obtenez une URL publique permanente (ex: `https://application-restobook.vercel.app`) accessible depuis n'importe quelle tablette ou smartphone sur la planète !

### Option B : Utilisation immédiate sans hébergeur
Vous pouvez directement double-cliquer sur le fichier **`Restobook-Application-Autonome.html`** présent dans ce dossier Google Drive. Il contient toute l'application (SaaS, connexion, plan de table, cuisine et synchronisation en direct).

---

## 3. Comment connecter deux tablettes (Salle & Cuisine)

Le fonctionnement est devenu magique et totalement fluide :

1. **Sur la Tablette 1 (Salle)** :
   - Ouvrez l'application (URL en ligne ou fichier autonome).
   - Créez votre restaurant (ex : *« Le Baobab Gourmand »*, devise *Franc CFA (FCFA)* ou *Euro*).
   - Choisissez le rôle : **🍽️ Tablette Salle (POS & Plan de table)**.
   - Cochez *"Mémoriser ce poste sur cette tablette"*.
   
2. **Sur la Tablette 2 (Cuisine)** :
   - Ouvrez la même application.
   - Connectez-vous avec le même email ou utilisez le compte.
   - Choisissez le rôle : **👨‍🍳 Tablette Cuisine (KDS Écran Chef)**.
   - Cochez *"Mémoriser ce poste sur cette tablette"*.

3. **C’est tout !**
   - Dès qu'une commande est envoyée depuis la Salle, le bon apparaît **instantanément** sur la Tablette Cuisine.
   - Dès que le chef clique sur **"ENVOYER AU PASSE"**, la Tablette Salle émet son carillon sonore et clignote pour appeler le serveur.
   - Si vous préférez tester sur un seul écran (PC ou démo), choisissez simplement le **Mode Duo**.

---

## 4. Contenu de ce dossier Google Drive

- 📄 **`Restobook-Application-Autonome.html`** : L'application complète en un seul fichier exécutable partout par simple double-clic.
- 📁 **`Application-Web-PWA/`** : L'application web compilée prête à être hébergée ou installée en PWA sur tablettes ("Ajouter à l'écran d'accueil").
- 📦 **`Restobook-Code-Source-Complet.zip`** : L'archive compressée complète du code source du projet.
- ⚙️ **`Lancer-Restobook.bat`** : Le lanceur rapide local si vous souhaitez utiliser votre PC comme serveur Wi-Fi local sans connexion Internet.
- 📄 **`GUIDE_INSTALLATION_ET_FORMATS.md`** : Le présent document.

---

## 5. Devises supportées

Pour répondre parfaitement aux besoins du projet **LabDra Bénin 25-26**, le **Franc CFA (FCFA - XOF)** est désormais proposé en tête de liste des devises, aux côtés de l'Euro (€), du Dollar ($), du Dirham marocain (DH), etc.
