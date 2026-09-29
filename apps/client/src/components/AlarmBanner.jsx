import React from 'react';
import { useRestobook } from '../context/RestobookContext';
import { BellRing, Check, UtensilsCrossed, Volume2 } from 'lucide-react';

export const AlarmBanner = () => {
  const { activeAlarms, latestAlarm, acknowledgeOrder } = useRestobook();

  // Trouver l'alarme courante : soit latestAlarm, soit la première alarme active
  const currentAlarm = latestAlarm || (activeAlarms.length > 0 ? activeAlarms[activeAlarms.length - 1] : null);

  if (!currentAlarm || activeAlarms.length === 0) return null;

  const ticketId = currentAlarm.ticketId || currentAlarm.ticket?.id;
  const tableId = currentAlarm.tableId || currentAlarm.ticket?.tableId;
  const tableNumber = currentAlarm.tableNumber || currentAlarm.ticket?.tableNumber || '?';
  const items = currentAlarm.items || currentAlarm.ticket?.items || [];

  const handleAcknowledge = () => {
    acknowledgeOrder(ticketId, tableId || tableNumber);
  };

  const handleAcknowledgeAll = (e) => {
    e.stopPropagation();
    // Acquitter toutes les alarmes une par une ou vider
    activeAlarms.forEach(a => {
      acknowledgeOrder(a.ticketId || a.ticket?.id, a.tableId || a.tableNumber);
    });
  };

  return (
    <div className="fixed top-2 sm:top-4 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-50 sm:w-[95%] max-w-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border-2 border-red-400 animate-bounce-short">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Icône cloche pulsante et infos */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-white text-red-600 rounded-xl shadow-lg shrink-0 animate-ping-slow">
            <BellRing className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase">
                Passe Cuisine {activeAlarms.length > 1 && `(${activeAlarms.length})`}
              </span>
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-red-100">
                <Volume2 className="w-3 h-3 animate-pulse" /> Sonnerie active
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-extrabold tracking-tight mt-0.5 truncate">
              🚨 TABLE {tableNumber} : Prêt au passe !
            </h3>
            <p className="text-[11px] sm:text-xs text-red-100 truncate mt-0.5">
              {items && items.length > 0 
                ? items.map(i => `${i.quantity ? i.quantity + 'x ' : ''}${i.name || i.itemName}`).join(' • ')
                : `${currentAlarm.itemsCount || 1} commande(s) prête(s)`}
            </p>
          </div>
        </div>

        {/* Boutons d'acquittement */}
        <div className="flex items-center gap-2 shrink-0">
          {activeAlarms.length > 1 && (
            <button
              onClick={handleAcknowledgeAll}
              className="text-xs font-bold text-red-100 hover:text-white underline px-2 py-1 shrink-0"
            >
              Tout acquitter
            </button>
          )}
          <button
            onClick={handleAcknowledge}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white text-red-700 hover:bg-red-50 font-black px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-xl transition-all transform active:scale-95 text-xs sm:text-sm"
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span>J'ARRIVE / RÉCUPÉRÉ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
