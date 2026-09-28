# Restobook - Guide de Déploiement & Comparatif des Formats

Bienvenue dans le guide officiel de déploiement et d'utilisation de **Restobook**, la solution connectée en temps réel associant :
1. **Restobook Salle (POS)** : Plan de table interactif, réservations, gestion du menu, devises personnalisées, prise de commande tactile et facturation/partage d'addition.
2. **Restobook Kitchen (KDS)** : Écran cuisine en direct, priorisation des bons (glisser-déposer tactile ou flèches), pointage des plats et alarme de rappel serveur au passe.

---

## 1. Quel format privilégier : APK ou HTML / PWA ?

### 🏆 Recommandation : Privilégier le format HTML / PWA (Progressive Web App)

Pour une utilisation en restauration sur tablettes et smartphones (Android, iPad, etc.), le format **PWA (Web Mobile tactile autonome)** est **très nettement supérieur** au format APK classique pour les raisons suivantes :

| Critère | Format HTML / PWA (Recommandé) 🌟 | Format APK classique 📱 |
| :--- | :--- | :--- |
| **Installation** | **Instantanée en 1 clic** via le navigateur Chrome/Safari ("Ajouter à l'écran d'accueil"). Pas de message d'alerte sécurité Android ("Sources inconnues"). | Nécessite d'activer le débogage ou l'autorisation d'installer des APK non certifiés sur chaque tablette. |
| **Compatibilité** | **100% Universelle** : Fonctionne sur toutes les tablettes Android (Samsung, Lenovo, Xiaomi...), les iPad d'Apple, les smartphones et les ordinateurs PC/Mac. | Réservé uniquement aux appareils Android. Incompatible avec iPad ou iPhone. |
| **Mises à jour** | **Instantanées et invisibles** : Dès que vous changez un prix ou une option, toutes les tablettes sont à jour sans rien réinstaller. | Obligation de désinstaller et réinstaller manuellement le fichier `.apk` sur chaque tablette. |
| **Expérience visuelle** | **Plein écran immersif** identique à une application native du Play Store (sans barre d'adresse ni boutons du navigateur). | Plein écran natif. |
| **Sonneries & Alarmes** | Prise en charge native de l'audio haute fidélité (Web Audio API) pour le carillon du passe. | Support audio natif. |
| **Poids** | Léger et instantané (chargement en mémoire cache locale). | Fichier volumineux de 20 à 50 Mo par appareil. |

---

## 2. Comment installer l'application sur vos Tablettes & Smartphones

### Sur Tablette ou Smartphone Android (Google Chrome)
1. Ouvrez **Google Chrome** et saisissez l'adresse de l'application (ex : `http://192.168.0.112:4001` ou votre URL en ligne).
2. Appuyez sur les **trois petits points verticaux** (menu en haut à droite).
3. Sélectionnez **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**.
4. L'icône officielle **Restobook** apparaît désormais sur l'écran d'accueil de la tablette.
5. Lorsque vous appuyez dessus, l'application se lance en **plein écran**, sans aucune barre de navigation !

### Sur iPad ou iPhone (Safari)
1. Ouvrez **Safari** et accédez à l'adresse de l'application.
2. Appuyez sur l'icône de **Partage** (carré avec une flèche vers le haut).
3. Faites défiler et choisissez **"Sur l'écran d'accueil"**.
4. Validez en cliquant sur **Ajouter**.

---

## 3. Vous préférez tout de même générer un fichier APK ?

Nous avons configuré pour vous une chaîne d'intégration continue **GitHub Actions** (`.github/workflows/build-apk.yml`) qui permet de compiler un fichier APK dans le cloud sans installer 10 Go d'outils Android Studio sur votre machine :

1. Rendez-vous sur votre dépôt GitHub : `https://github.com/jeromefoguenne-eng/Application-Restobook`
2. Cliquez sur l'onglet **"Actions"**.
3. Dans la liste à gauche, cliquez sur **"Build Android APK (Salle & Cuisine)"**.
4. Cliquez sur le bouton déroulant **"Run workflow"** puis validez.
5. En 3 minutes, GitHub compile l'application et met à disposition dans les **Artifacts** le fichier `Restobook-Android-APK.zip` contenant le fichier `.apk` installable directement sur n'importe quelle tablette Android.

---

## 4. Contenu du dossier d'export

Ce dossier contient tout le nécessaire pour démarrer immédiatement :

- 📁 `Application-Web-PWA/` : L'application web prête pour la production (fichiers HTML, CSS, JavaScript compilés, icônes tactiles et manifest PWA).
- ⚙️ `Lancer-Restobook.bat` : Script Windows en 1 clic pour lancer à la fois le serveur de synchronisation et l'application dans votre navigateur.
- 📦 `Restobook-Code-Source-Complet.zip` : L'archive complète du code source (dépôt Git nettoyé, sans node_modules superflus).
- 📄 `GUIDE_INSTALLATION_ET_FORMATS.md` : Le présent document explicatif.

---

## 5. Comment démarrer en restaurant (Réseau Local ou Cloud)

### Option A : En réseau local Wi-Fi (Idéal en restaurant)
1. Double-cliquez sur `Lancer-Restobook.bat` sur votre PC central (ou caisse).
2. Le terminal affiche l'adresse locale du serveur (ex : `http://192.168.0.112:4001`).
3. Sur la **Tablette Salle**, ouvrez Chrome à cette adresse et choisissez **Restobook Salle**.
4. Sur la **Tablette Cuisine**, ouvrez Chrome à cette adresse et choisissez **Restobook Kitchen**.
5. Les deux écrans sont immédiatement synchronisés via WebSocket :
   - Dès qu'une commande est envoyée depuis la salle, le ticket apparaît instantanément en cuisine avec son chronomètre.
   - En cuisine, les cuisiniers peuvent réorganiser les tickets (glisser-déposer tactile ou flèches `<` / `>`) et cocher les plats préparés.
   - Lorsque le cuisinier clique sur **"ENVOYER AU PASSE"**, la tablette salle déclenche une alarme sonore (carillon) et visuelle clignotante pour alerter les serveurs.

### Option B : Déploiement Cloud (Accessible depuis n'importe où)
- Le backend `apps/server` peut être déployé en 1 clic sur des hébergeurs gratuits comme **Render**, **Railway** ou votre propre serveur VPS.
- Le frontend `apps/client` peut être hébergé sur **Vercel**, **Netlify** ou **GitHub Pages**.
- Les tablettes peuvent ainsi être connectées même via la 4G/5G mobile !
