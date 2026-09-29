import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AVAILABLE_CURRENCIES } from '../../context/RestobookContext';
import {
  UtensilsCrossed,
  Store,
  ChefHat,
  Tablet,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Wifi,
  Lock,
  Mail,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export const AuthView = () => {
  const { login, loginDemo, register } = useAuth();

  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'demo'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState(AVAILABLE_CURRENCIES[0]); // Franc CFA par défaut
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      register({
        restaurantName,
        email,
        password,
        currency
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = () => {
    setError(null);
    loginDemo();
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto selection:bg-amber-500 selection:text-slate-950">
      {/* En-tête de marque */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-lg shadow-amber-500/10">
            🍽️
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              Restobook Cloud
            </span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
              100% Gratuit & Pérenne
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Cloud Realtime Actif</span>
        </div>
      </header>

      {/* Contenu principal centré */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          {/* Titre et description */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Espace Restaurant
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1.5">
              Connectez vos tablettes de Salle et de Cuisine en temps réel.
            </p>
          </div>

          {/* Onglets Connexion / Création */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 mb-6">
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                tab === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Se connecter
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                tab === 'register'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Créer un restaurant
            </button>
          </div>

          {/* Message d'erreur éventuel */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Formulaire : Se connecter */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@mon-restaurant.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
              >
                <span>Accéder à mon restaurant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Formulaire : Créer un restaurant */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nom du Restaurant
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Ex: Le Baobab Gourmand"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Devise monétaire par défaut
                </label>
                <div className="relative">
                  <select
                    value={currency.code}
                    onChange={(e) => {
                      const found = AVAILABLE_CURRENCIES.find(c => c.code === e.target.value);
                      if (found) setCurrency(found);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors cursor-pointer"
                  >
                    {AVAILABLE_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                        {curr.flag} {curr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Adresse Email (Identifiant)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@mon-restaurant.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 4 caractères"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
              >
                <span>Créer mon restaurant & démarrer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Séparateur pour l'accès Démo Immédiat */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative px-3 bg-slate-900 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ou tester directement
            </span>
          </div>

          {/* Bouton Accès Démo Immédiat */}
          <button
            onClick={handleDemoClick}
            className="w-full py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Accès Rapide Démo (1 clic sans inscription)</span>
          </button>
        </div>
      </main>

      {/* Pied de page et arguments clés */}
      <footer className="px-6 py-4 border-t border-slate-900 bg-slate-950/80 text-center">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Liaison instantanée Salle & Cuisine</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zéro installation (PWA Web Mobile)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Gratuit & Pérenne à vie</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
