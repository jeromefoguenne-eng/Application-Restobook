import React, { useState } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { OrderTakingModal } from './OrderTakingModal';
import { BillingModal } from './BillingModal';
import { ReservationsView } from './ReservationsView';
import { MenuView } from './MenuView';
import { BillingHistoryView } from './BillingHistoryView';
import { AlarmBanner } from '../../components/AlarmBanner';
import { Map, Calendar, Utensils, Receipt, Volume2, BellRing, Sparkles } from 'lucide-react';

export const RestobookSalle = () => {
  const { soundEnabled, enableSound, activeAlarms } = useRestobook();
  const [activeTab, setActiveTab] = useState('floor'); // 'floor' | 'reservations' | 'menu' | 'history'
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
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-900 border-b border-slate-800 z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
            🍽️
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5 sm:gap-2">
              <span>Salle</span>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold border border-yellow-500/30">
                POS
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
              Prise de commande, plan de table & facturation
            </p>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('floor')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'floor'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Plan</span>
            {activeAlarms.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reservations'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Réservations</span>
            <span className="xs:hidden">Résas</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'menu'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Carte & Prix</span>
            <span className="xs:hidden">Carte</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Historique Facturation</span>
            <span className="xs:hidden">Factures</span>
          </button>
        </div>

        {/* Bouton d'activation audio / alarme */}
        <div className="flex items-center gap-2 shrink-0">
          {!soundEnabled ? (
            <button
              onClick={enableSound}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-colors animate-pulse"
              title="Activer le son des alarmes de cuisine"
            >
              <Volume2 className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Activer Alarme Sonore</span>
              <span className="sm:hidden text-[10px]">Son</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold">
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Son Actif</span>
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
        {activeTab === 'history' && <BillingHistoryView />}
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
