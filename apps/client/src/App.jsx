import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useRestobook } from './context/RestobookContext';
import { AuthView } from './views/auth/AuthView';
import { PosteSelectorView } from './views/auth/PosteSelectorView';
import { RestobookSalle } from './views/salle/RestobookSalle';
import { RestobookKitchen } from './views/kitchen/RestobookKitchen';
import { PairingModal } from './components/PairingModal';
import { EditRestaurantNameModal } from './components/EditRestaurantNameModal';
import {
  Tablet,
  ChefHat,
  Columns2,
  QrCode,
  Wifi,
  Volume2,
  UtensilsCrossed,
  Sparkles,
  Store,
  Pencil,
  LogOut,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export function App() {
  const { currentUser, activePoste, changePoste, logout } = useAuth();

  const {
    activeMode,
    setActiveMode,
    connected,
    cloudConnected,
    sessionId,
    restaurantName,
    enableSound,
    soundEnabled,
    activeAlarms
  } = useRestobook();

  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);

  // 1. Si l'utilisateur n'est pas connecté -> Afficher l'écran SaaS / Inscription / Démo
  if (!currentUser) {
    return <AuthView />;
  }

  // 2. Si l'utilisateur est connecté mais n'a pas sélectionné de poste -> Écran de choix de poste
  if (!activePoste) {
    return <PosteSelectorView />;
  }

  // 3. Application principale pour le poste choisi
  const isOnline = cloudConnected || connected;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Barre Supérieure Globale */}
      <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Restobook
            </span>
          </div>

          {/* Bouton Nom du Restaurant modifiable */}
          <button
            onClick={() => setIsEditNameOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500/40 rounded-xl transition-all group"
            title="Cliquer pour changer le nom du restaurant"
          >
            <Store className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">
              {restaurantName}
            </span>
            <Pencil className="w-3 h-3 text-slate-500 group-hover:text-yellow-400 transition-colors" />
          </button>

          {/* Badge du Poste Actif sur cette tablette */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            {activeMode === 'salle' && (
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <UtensilsCrossed className="w-3 h-3" />
                <span>Poste Salle</span>
              </span>
            )}
            {activeMode === 'cuisine' && (
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <ChefHat className="w-3 h-3" />
                <span>Poste Cuisine (KDS)</span>
              </span>
            )}
            {activeMode === 'duo' && (
              <span className="flex items-center gap-1 font-bold text-blue-400">
                <Columns2 className="w-3 h-3" />
                <span>Mode Duo</span>
              </span>
            )}
          </div>
        </div>

        {/* Sélecteur rapide de vue (Tablette Salle / Cuisine / Duo) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveMode('salle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'salle'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablette</span> Salle
            {activeAlarms.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveMode('cuisine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'cuisine'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablette</span> Cuisine
          </button>

          <button
            onClick={() => setActiveMode('duo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'duo'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Simulateur</span> Duo
          </button>
        </div>

        {/* Statut Cloud & Actions Compte */}
        <div className="flex items-center gap-2">
          {/* Indicateur Cloud Sync WSS */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
            title={isOnline ? 'Synchronisation Cloud Realtime active' : 'Mode local / recherche réseau'}
          >
            <Wifi className={`w-3.5 h-3.5 ${isOnline ? '' : 'animate-pulse'}`} />
            <span className="hidden sm:inline">{isOnline ? 'Cloud En Ligne' : 'Hors Ligne'}</span>
          </div>

          {/* Bouton Changer de Poste */}
          <button
            onClick={changePoste}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            title="Changer le rôle de cette tablette"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Changer de poste</span>
          </button>

          {/* Bouton Déconnexion */}
          <button
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-red-500/10 hover:text-red-400 border border-slate-800 text-slate-400 text-xs font-bold transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Zone d'affichage principale selon le mode */}
      <main className="flex-1 overflow-hidden">
        {activeMode === 'salle' && <RestobookSalle />}
        {activeMode === 'cuisine' && <RestobookKitchen />}
        {activeMode === 'duo' && (
          <div className="flex h-full w-full divide-x-2 divide-slate-800">
            {/* Moitié gauche : Tablette 1 (Salle) */}
            <div className="w-1/2 h-full flex flex-col overflow-hidden relative">
              <div className="bg-slate-900/60 px-4 py-1 text-[11px] font-bold text-yellow-400 flex items-center justify-between border-b border-slate-800">
                <span>📱 TABLETTE 1 : SALLE & PLAN DE TABLE (POS)</span>
                <span className="text-slate-400 font-normal">Glissez les tables • Prenez commande</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <RestobookSalle />
              </div>
            </div>

            {/* Moitié droite : Tablette 2 (Cuisine) */}
            <div className="w-1/2 h-full flex flex-col overflow-hidden relative">
              <div className="bg-slate-900/60 px-4 py-1 text-[11px] font-bold text-amber-400 flex items-center justify-between border-b border-slate-800">
                <span>👨‍🍳 TABLETTE 2 : CUISINE EN DIRECT (KDS)</span>
                <span className="text-slate-400 font-normal">Réorganisez l'ordre • Cliquez "Prêt" pour sonner</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <RestobookKitchen />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal d'Appairage QR Code */}
      <PairingModal isOpen={isPairingOpen} onClose={() => setIsPairingOpen(false)} />

      {/* Modal de Modification du Nom du Restaurant */}
      <EditRestaurantNameModal isOpen={isEditNameOpen} onClose={() => setIsEditNameOpen(false)} />
    </div>
  );
}

export default App;
