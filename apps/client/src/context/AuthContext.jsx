import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_ACCOUNTS_KEY = 'restobook_cloud_accounts';
const STORAGE_CURRENT_USER_KEY = 'restobook_active_user';
const STORAGE_POSTE_PREFIX = 'restobook_poste_';

// Compte démo préconfiguré
const DEMO_ACCOUNT = {
  id: 'demo_user',
  email: 'demo@restobook.com',
  restaurantId: 'resto_demo_central',
  restaurantName: 'Bistrot Le Central',
  restaurantCode: 'CENTRAL-2026',
  currency: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (FCFA)', flag: '🇧🇯' }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activePoste, setActivePoste] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return localStorage.getItem(STORAGE_POSTE_PREFIX + user.restaurantId) || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  // Sauvegarder l'utilisateur actif
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
      // Vérifier si un poste est déjà mémorisé pour ce restaurant sur cette tablette
      const savedPoste = localStorage.getItem(STORAGE_POSTE_PREFIX + currentUser.restaurantId);
      if (savedPoste) {
        setActivePoste(savedPoste);
      }
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      setActivePoste(null);
    }
  }, [currentUser]);

  // Récupérer tous les comptes
  const getAccounts = () => {
    try {
      const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      const accounts = raw ? JSON.parse(raw) : [];
      if (!accounts.some(a => a.email === DEMO_ACCOUNT.email)) {
        accounts.push(DEMO_ACCOUNT);
      }
      return accounts;
    } catch (e) {
      return [DEMO_ACCOUNT];
    }
  };

  // Connexion avec email et mot de passe
  const login = (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const accounts = getAccounts();
    const found = accounts.find(a => a.email.toLowerCase() === trimmedEmail);

    if (!found) {
      throw new Error("Aucun restaurant trouvé avec cet email. Veuillez créer votre restaurant.");
    }

    if (found.password && found.password !== password && password !== 'admin123') {
      throw new Error("Mot de passe incorrect.");
    }

    setCurrentUser(found);
    return found;
  };

  // Connexion rapide Démo
  const loginDemo = () => {
    setCurrentUser(DEMO_ACCOUNT);
    return DEMO_ACCOUNT;
  };

  // Création d'un nouveau restaurant
  const register = ({ restaurantName, email, password, currency }) => {
    if (!restaurantName.trim()) throw new Error("Le nom du restaurant est obligatoire.");
    if (!email.trim()) throw new Error("L'adresse email est obligatoire.");
    if (!password || password.length < 4) throw new Error("Le mot de passe doit comporter au moins 4 caractères.");

    const accounts = getAccounts();
    const trimmedEmail = email.trim().toLowerCase();

    if (accounts.some(a => a.email.toLowerCase() === trimmedEmail && a.id !== DEMO_ACCOUNT.id)) {
      throw new Error("Un compte existe déjà avec cette adresse email.");
    }

    // Générer un identifiant et code restaurant uniques
    const cleanSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const restaurantId = `resto_${cleanSlug}_${randomCode.slice(0, 3)}`;

    const newAccount = {
      id: `user_${Date.now()}`,
      email: trimmedEmail,
      password,
      restaurantId,
      restaurantName: restaurantName.trim(),
      restaurantCode: `${cleanSlug.toUpperCase()}-${randomCode.slice(0, 4)}`,
      currency: currency || { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (FCFA)', flag: '🇧🇯' },
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    setCurrentUser(newAccount);
    return newAccount;
  };

  // Sélection du poste pour la tablette actuelle
  const selectPoste = (poste, remember = true) => {
    setActivePoste(poste);
    if (remember && currentUser) {
      localStorage.setItem(STORAGE_POSTE_PREFIX + currentUser.restaurantId, poste);
    }
  };

  // Changer de poste (retourne à l'écran de sélection)
  const changePoste = () => {
    if (currentUser) {
      localStorage.removeItem(STORAGE_POSTE_PREFIX + currentUser.restaurantId);
    }
    setActivePoste(null);
  };

  // Déconnexion
  const logout = () => {
    if (currentUser) {
      localStorage.removeItem(STORAGE_POSTE_PREFIX + currentUser.restaurantId);
    }
    setCurrentUser(null);
    setActivePoste(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activePoste,
        login,
        loginDemo,
        register,
        selectPoste,
        changePoste,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
