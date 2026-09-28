import React, { useState } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { OrderTakingModal } from './OrderTakingModal';
import { BillingModal } from './BillingModal';
import { ReservationsView } from './ReservationsView';
import { MenuView } from './MenuView';
import { AlarmBanner } from '../../components/AlarmBanner';
import { Map, Calendar, Utensils, Volume2, BellRing, Sparkles } from 'lucide-react';

export const RestobookSalle = () => {
  const { soundEnabled, enableSound, activeAlarms } = useRestobook();
  const [activeTab, setActiveTab] = useState('floor'); // 'floor' | 'reservations' | 'menu'
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null);
  const [selectedTableForBilling, setSelectedTableForBilling] = useState(null);

  const handleSelectTable = (table) => {
    setSelectedTableForOrder(table);
  };

  const handleOpenBilling = (table) => {
    setSelectedTableForOrder(null);
    setSelectedTableForBilling(table);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Bannière d'Alarme Popup Cuisine */}
      <AlarmBanner />

      {/* Barre de navigation interne Salle */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-lg">
            🍽️
          </div>
          <div>
            <h1 className="text-base font-extrabold flex items-center gap-2">
              Restobook Salle <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold border border-yellow-500/30">POS Tablette</span>
            </h1>
            <p className="text-[11px] text-slate-400">Prise de commande, plan de table & facturation</p>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('floor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'floor'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Plan de Table</span>
            {activeAlarms.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reservations'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Réservations</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'menu'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Carte & Prix</span>
          </button>
        </div>

        {/* Bouton d'activation audio / alarme */}
        <div className="flex items-center gap-2">
          {!soundEnabled ? (
            <button
              onClick={enableSound}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-colors animate-pulse"
              title="Activer le son des alarmes"
            >
              <Volume2 className="w-4 h-4" />
              <span>Activer Alarme Sonore</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Son Actif</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'floor' && (
          <FloorPlanCanvas onSelectTable={handleSelectTable} />
        )}
        {activeTab === 'reservations' && <ReservationsView />}
        {activeTab === 'menu' && <MenuView />}
      </div>

      {/* Modal Prise de Commande */}
      {selectedTableForOrder && (
        <OrderTakingModal
          table={selectedTableForOrder}
          onClose={() => setSelectedTableForOrder(null)}
          onOpenBilling={handleOpenBilling}
        />
      )}

      {/* Modal Facturation */}
      {selectedTableForBilling && (
        <BillingModal
          table={selectedTableForBilling}
          onClose={() => setSelectedTableForBilling(null)}
        />
      )}
    </div>
  );
};
