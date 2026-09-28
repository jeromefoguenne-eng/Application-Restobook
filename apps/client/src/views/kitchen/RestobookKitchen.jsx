import React, { useState, useEffect } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { PairingModal } from '../../components/PairingModal';
import {
  ChefHat,
  Clock,
  QrCode,
  CheckCircle2,
  GripVertical,
  Check,
  RotateCcw,
  Sparkles,
  Volume2
} from 'lucide-react';

export const RestobookKitchen = () => {
  const {
    tickets,
    reorderTickets,
    toggleItemPrepared,
    markOrderReady,
    enableSound,
    soundEnabled
  } = useRestobook();

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [draggedTicketId, setDraggedTicketId] = useState(null);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  // Mettre à jour le chronomètre chaque seconde
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calcul du temps écoulé depuis la création du ticket
  const getElapsedTime = (createdAt) => {
    if (!createdAt) return '00:00';
    const elapsedSec = Math.floor((currentTime - new Date(createdAt).getTime()) / 1000);
    if (elapsedSec < 0) return '00:00';
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyClass = (createdAt) => {
    if (!createdAt) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    const elapsedMins = (currentTime - new Date(createdAt).getTime()) / (1000 * 60);
    if (elapsedMins > 20) {
      return 'bg-red-500/30 text-red-400 border-red-500/40 animate-pulse font-black';
    }
    if (elapsedMins > 10) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold';
    }
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  // Séparer les tickets actifs et terminés
  const activeTickets = tickets.filter(t => t.status !== 'ready' && t.status !== 'archived');
  const completedTickets = tickets.filter(t => t.status === 'ready' || t.status === 'archived');

  // Glisser-déposer pour réordonnancement des priorités
  const handleDragStart = (e, ticketId) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnTicket = (e, targetTicketId) => {
    e.preventDefault();
    if (!draggedTicketId || draggedTicketId === targetTicketId) return;

    const currentOrder = activeTickets.map(t => t.id);
    const sourceIndex = currentOrder.indexOf(draggedTicketId);
    const targetIndex = currentOrder.indexOf(targetTicketId);

    if (sourceIndex > -1 && targetIndex > -1) {
      const newOrder = [...currentOrder];
      const [moved] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, moved);
      reorderTickets(newOrder);
    }
    setDraggedTicketId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* En-tête Cuisine KDS */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold flex items-center gap-2">
              Restobook Kitchen <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">KDS Écran Cuisine</span>
            </h1>
            <p className="text-[11px] text-slate-400">Affichage temps réel, priorisation tactile & validation passe</p>
          </div>
        </div>

        {/* Contrôles et boutons */}
        <div className="flex items-center gap-3">
          {/* Onglets Actifs / Historique */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              En Cuisine ({activeTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Historique Récent ({completedTickets.length})
            </button>
          </div>

          {/* Bouton d'appairage QR Code */}
          <button
            onClick={() => setIsPairingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <QrCode className="w-4 h-4 text-yellow-400" />
            <span>Lier Tablette Salle (QR Code)</span>
          </button>
        </div>
      </div>

      {/* Grille horizontale des bons de commande */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-start scrollbar-thin">
        {activeTab === 'active' && activeTickets.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mb-3 shadow-inner">
              👨‍🍳
            </div>
            <h3 className="text-base font-bold text-slate-300">Aucun bon en attente</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Dès qu'une commande est passée en salle sur la première tablette, elle apparaîtra instantanément ici avec son chronomètre.
            </p>
          </div>
        )}

        {activeTab === 'active' && activeTickets.map((ticket, index) => {
          const urgencyStyle = getUrgencyClass(ticket.createdAt);
          const allItemsDone = ticket.items.every(it => it.status === 'ready');

          return (
            <div
              key={ticket.id}
              draggable
              onDragStart={(e) => handleDragStart(e, ticket.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnTicket(e, ticket.id)}
              className="w-80 md:w-88 shrink-0 bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all hover:border-slate-700 select-none"
            >
              {/* En-tête du bon avec poignée de glisser-déposer */}
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300"
                    title="Glisser pour réorganiser l'ordre"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white font-mono tracking-tight">
                      TABLE {ticket.tableNumber}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {ticket.serverName} • Phase: <span className="uppercase text-yellow-400 font-bold">{ticket.coursePhase}</span>
                    </p>
                  </div>
                </div>

                {/* Chronomètre d'attente */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-sm ${urgencyStyle}`}>
                  <Clock className="w-4 h-4" />
                  <span>{getElapsedTime(ticket.createdAt)}</span>
                </div>
              </div>

              {/* Liste des plats à préparer */}
              <div className="p-4 flex-1 space-y-2.5 max-h-[55vh] overflow-y-auto">
                {ticket.items.map((item) => {
                  const isDone = item.status === 'ready';
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItemPrepared(ticket.id, item.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                        isDone
                          ? 'bg-slate-950/60 border-slate-800/60 text-slate-500 line-through opacity-60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-white shadow-sm'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-bold leading-tight">
                            {item.quantity}x {item.name || item.itemName}
                          </span>
                        </div>

                        {item.selectedModifiers?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedModifiers.map((mod, mIdx) => (
                              <span
                                key={mIdx}
                                className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-md border border-yellow-500/20"
                              >
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.customKitchenNote && (
                          <p className="text-xs text-amber-400 font-bold mt-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                            ⚠️ {item.customKitchenNote}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bouton d'action proéminent : "ENVOYER AU PASSE (PRÊT)" -> DÉCLENCHE L'ALARME */}
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                <button
                  onClick={() => markOrderReady(ticket.id)}
                  className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide shadow-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                    allItemsDone
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>🛎️ ENVOYER AU PASSE (PRÊT)</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Vue Historique des commandes envoyées */}
        {activeTab === 'history' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTickets.map(ticket => (
              <div key={ticket.id} className="p-4 bg-slate-900 border border-slate-800 rounded-3xl opacity-80">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold font-mono text-emerald-400">TABLE {ticket.tableNumber}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    Prêt au passe
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {ticket.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Serveur : {ticket.serverName}</span>
                  <span>Envoyé à : {new Date(ticket.readyAt || ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Appairage QR Code */}
      <PairingModal isOpen={isPairingOpen} onClose={() => setIsPairingOpen(false)} />
    </div>
  );
};
