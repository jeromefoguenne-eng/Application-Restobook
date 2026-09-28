import React from 'react';
import { useRestobook } from '../context/RestobookContext';
import { BellRing, Check, UtensilsCrossed, Volume2 } from 'lucide-react';

export const AlarmBanner = () => {
  const { activeAlarms, latestAlarm, acknowledgeOrder } = useRestobook();

  if (!latestAlarm || activeAlarms.length === 0) return null;

  const handleAcknowledge = () => {
    acknowledgeOrder(latestAlarm.ticketId, latestAlarm.tableId);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-4 shadow-2xl border-2 border-red-400 animate-bounce-short">
      <div className="flex items-center justify-between gap-4">
        {/* Icône cloche pulsante */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white text-red-600 rounded-xl shadow-lg animate-ping-slow">
            <BellRing className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase">
                Passe-Plat Cuisine
              </span>
              <span className="flex items-center gap-1 text-xs text-red-100">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Alarme sonore active
              </span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
              🚨 TABLE {latestAlarm.tableNumber} : Plats prêts au passe !
            </h3>
            <p className="text-xs text-red-100 line-clamp-1 mt-0.5">
              {latestAlarm.items?.map(i => `${i.name || i.itemName}`).join(' • ')}
            </p>
          </div>
        </div>

        {/* Bouton d'acquittement */}
        <button
          onClick={handleAcknowledge}
          className="flex items-center gap-2 bg-white text-red-700 hover:bg-red-50 font-black px-5 py-3 rounded-xl shadow-xl transition-all transform hover:scale-105 active:scale-95 shrink-0"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>J'ARRIVE / RÉCUPÉRÉ</span>
        </button>
      </div>
    </div>
  );
};
