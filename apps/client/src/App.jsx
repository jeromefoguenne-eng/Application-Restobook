import React, { useState } from 'react';
import { useRestobook } from './context/RestobookContext';
import { RestobookSalle } from './views/salle/RestobookSalle';
import { RestobookKitchen } from './views/kitchen/RestobookKitchen';
import { PairingModal } from './components/PairingModal';
import {
  Tablet,
  ChefHat,
  Columns2,
  QrCode,
  Wifi,
  Volume2,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';

export function App() {
  const {
    activeMode,
    setActiveMode,
    connected,
    sessionId,
    enableSound,
    soundEnabled,
    activeAlarms
  } = useRestobook();

  const [isPairingOpen, setIsPairingOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Barre Supérieure Globale & Sélecteur de Mode Tablette */}
      <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Restobook
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
            <span>Session:</span>
            <strong className="text-white">{sessionId}</strong>
          </div>
        </div>

        {/* Sélecteur de vue (Tablette Salle / Tablette Cuisine / Duo Côte-à-Côte) */}
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
            <span className="hidden md:inline">Tablette</span> Salle (POS)
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
            <span className="hidden md:inline">Tablette</span> Cuisine (KDS)
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
            <span>Simulateur Duo (2 Tablettes)</span>
          </button>
        </div>

        {/* Statut Réseau & Appairage QR Code */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPairingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden lg:inline">Appairage QR Code</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
            title={connected ? 'Connecté au serveur Cloud' : 'En attente de connexion'}
          >
            <Wifi className={`w-3.5 h-3.5 ${connected ? '' : 'animate-pulse'}`} />
            <span className="hidden sm:inline">{connected ? 'Cloud En Ligne' : 'Hors Ligne'}</span>
          </div>
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
    </div>
  );
}
export default App;
