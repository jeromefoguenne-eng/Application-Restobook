import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UtensilsCrossed,
  ChefHat,
  Columns2,
  Store,
  LogOut,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const PosteSelectorView = () => {
  const { currentUser, selectPoste, logout } = useAuth();
  const [rememberPoste, setRememberPoste] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (currentUser?.restaurantCode) {
      navigator.clipboard.writeText(currentUser.restaurantCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 p-4 md:p-8">
      {/* En-tête */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-lg shadow-amber-500/10">
            🍽️
          </div>
          <div>
            <span className="font-extrabold text-lg text-white">
              Restobook Cloud
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-amber-400">{currentUser?.restaurantName || 'Mon Restaurant'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </header>

      {/* Sélection des Postes */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="text-center mb-8">
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider inline-block mb-3">
            Configuration du poste
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Quel rôle occupe cette tablette ?
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
            Sélectionnez le poste de cet appareil. Toutes les tablettes connectées à <strong className="text-white">{currentUser?.restaurantName}</strong> se synchronisent automatiquement en temps réel.
          </p>

          {/* Badge Code Restaurant à partager */}
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs">
            <span className="text-slate-400">Code de votre restaurant :</span>
            <span className="font-mono font-black text-amber-400 text-sm tracking-wider">
              {currentUser?.restaurantCode || 'RESTO-2026'}
            </span>
            <button
              onClick={copyCode}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Copier le code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3 Cartes de choix de Poste */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CARTE 1 : TABLETTE SALLE */}
          <button
            onClick={() => selectPoste('salle', rememberPoste)}
            className="group relative bg-slate-900/90 hover:bg-slate-850 border-2 border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 text-left transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                  Tablette Salle
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  POS & Service
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Plan de table 2D tactile, réservations, prise de commande, calcul d'addition et réception des alertes carillon quand un plat est prêt.
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-amber-400 gap-1.5 pt-3 border-t border-slate-800 group-hover:translate-x-1 transition-transform">
              <span>Activer ce poste</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* CARTE 2 : TABLETTE CUISINE */}
          <button
            onClick={() => selectPoste('cuisine', rememberPoste)}
            className="group relative bg-slate-900/90 hover:bg-slate-850 border-2 border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 text-left transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <ChefHat className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                  Tablette Cuisine
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  KDS Écran Chef
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Affichage des bons en temps réel, chronomètres de cuisson, priorisation tactile (glisser ou flèches) et bouton "Envoyer au passe" avec alarme.
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-emerald-400 gap-1.5 pt-3 border-t border-slate-800 group-hover:translate-x-1 transition-transform">
              <span>Activer ce poste</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* CARTE 3 : MODE DUO */}
          <button
            onClick={() => selectPoste('duo', rememberPoste)}
            className="group relative bg-slate-900/90 hover:bg-slate-850 border-2 border-slate-800 hover:border-blue-500/60 rounded-3xl p-6 text-left transition-all duration-200 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
              <Columns2 className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-extrabold text-white group-hover:text-blue-400 transition-colors">
                  Poste Duo
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Direction / PC
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Visualisez la Salle et la Cuisine côte à côte sur le même écran. Idéal pour un ordinateur de bureau, un manager ou pour tester.
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-blue-400 gap-1.5 pt-3 border-t border-slate-800 group-hover:translate-x-1 transition-transform">
              <span>Activer ce poste</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Option Mémorisation */}
        <div className="mt-8 text-center">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
            <input
              type="checkbox"
              checked={rememberPoste}
              onChange={(e) => setRememberPoste(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span>Mémoriser ce poste sur cette tablette (ouvrira directement cet écran au lancement)</span>
          </label>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-900">
        <span>Vous pourrez changer de poste à tout moment depuis le menu en haut de l'écran.</span>
      </footer>
    </div>
  );
};
