import React, { useState, useRef } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { Plus, Move, Check, Users, Sparkles, RotateCw, Trash2, LayoutGrid, Map, BellRing } from 'lucide-react';

export const FloorPlanCanvas = ({ onSelectTable }) => {
  const { tables, updateTableLayout, deleteTable, activeAlarms } = useRestobook();
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ready' | 'occupied' | 'free'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (smartphone) | 'canvas' (2D Plan)
  const canvasRef = useRef(null);

  // Support Pointer Events unifié (Tactile mobile, tablette, stylet et souris)
  const pointerStartRef = useRef({ startX: 0, startY: 0, initialTableX: 0, initialTableY: 0 });

  const handlePointerDown = (e, table) => {
    if (!isEditMode) return;
    if (e.target.closest('button')) return; // Ne pas déplacer si on clique sur rotation ou suppression

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    setDraggedTableId(table.id);
    pointerStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialTableX: table.positionX || 50,
      initialTableY: table.positionY || 50
    };
  };

  const handlePointerMove = (e, tableId) => {
    if (!isEditMode || draggedTableId !== tableId || !canvasRef.current) return;
    e.preventDefault();

    const deltaX = e.clientX - pointerStartRef.current.startX;
    const deltaY = e.clientY - pointerStartRef.current.startY;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const rawX = pointerStartRef.current.initialTableX + deltaX;
    const rawY = pointerStartRef.current.initialTableY + deltaY;

    // Magnétisme à la grille (snap-to-grid de 20px) et contraintes limites du canvas
    const snapX = Math.max(10, Math.min(canvasRect.width - 90, Math.round(rawX / 20) * 20));
    const snapY = Math.max(10, Math.min(canvasRect.height - 90, Math.round(rawY / 20) * 20));

    const updated = tables.map(t => {
      if (t.id === tableId) {
        return { ...t, positionX: snapX, positionY: snapY };
      }
      return t;
    });
    updateTableLayout(updated);
  };

  const handlePointerUp = (e, tableId) => {
    if (!isEditMode || draggedTableId !== tableId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDraggedTableId(null);
  };

  // Ajout rapide d'une nouvelle table
  const handleAddTable = (shape = 'square', capacity = 4) => {
    const newNumber = (tables.length + 1).toString();
    const newTable = {
      id: `table_${Date.now()}`,
      number: newNumber,
      zoneId: 'main_hall',
      shape,
      capacity,
      positionX: 40 + (tables.length * 20) % 200,
      positionY: 40 + (tables.length * 20) % 200,
      width: shape === 'rectangle' ? 130 : 90,
      height: 90,
      rotation: 0,
      status: 'free'
    };
    updateTableLayout([...tables, newTable]);
  };

  const rotateTable = (tableId, e) => {
    e?.stopPropagation();
    const updated = tables.map(t => {
      if (t.id === tableId) {
        return { ...t, rotation: ((t.rotation || 0) + 45) % 360 };
      }
      return t;
    });
    updateTableLayout(updated);
  };

  const handleDeleteTable = (table, e) => {
    e?.stopPropagation();
    const hasActiveOrders = table.status === 'occupied' || table.status === 'order_sent' || table.status === 'ready' || table.status === 'bill_requested';
    if (hasActiveOrders) {
      if (!window.confirm(`Attention : La table T${table.number} a une commande en cours ou est occupée. Confirmer la suppression ?`)) {
        return;
      }
    }
    deleteTable(table.id);
  };

  // Obtenir la couleur et l'animation selon le statut de la table
  const getTableStyle = (table) => {
    const isAlarming = activeAlarms.some(a => 
      a.tableId === table.id || 
      a.tableNumber === table.number || 
      String(a.tableNumber) === String(table.number) ||
      String(a.tableId) === String(table.id)
    ) || table.status === 'ready' || table.status === 'READY_TO_SERVE';

    if (isAlarming) {
      return {
        bg: 'bg-red-600 text-white border-2 border-red-300 ring-4 sm:ring-8 ring-red-500/40 animate-pulse-fast shadow-2xl shadow-red-600/60',
        badge: 'bg-red-900/80 text-white font-black',
        label: '🚨 PRÊT EN CUISINE !'
      };
    }

    switch (table.status) {
      case 'occupied':
        return {
          bg: 'bg-blue-600 text-white border border-blue-400 shadow-lg shadow-blue-600/30',
          badge: 'bg-blue-900/60 text-blue-200',
          label: 'Occupée'
        };
      case 'order_sent':
        return {
          bg: 'bg-amber-500 text-slate-950 font-semibold border border-amber-300 shadow-lg shadow-amber-500/30',
          badge: 'bg-amber-950/40 text-amber-900',
          label: 'En cuisine'
        };
      case 'bill_requested':
        return {
          bg: 'bg-purple-600 text-white border border-purple-400 shadow-lg shadow-purple-600/30',
          badge: 'bg-purple-900/60 text-purple-200',
          label: 'Addition demandée'
        };
      case 'free':
      default:
        return {
          bg: 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400 shadow-lg shadow-emerald-600/20',
          badge: 'bg-emerald-950/50 text-emerald-200',
          label: 'Libre'
        };
    }
  };

  // Filtrage des tables pour la vue Grille
  const filteredTables = tables.filter(t => {
    const isAlarming = activeAlarms.some(a => 
      a.tableId === t.id || 
      a.tableNumber === t.number || 
      String(a.tableNumber) === String(t.number) ||
      String(a.tableId) === String(t.id)
    ) || t.status === 'ready' || t.status === 'READY_TO_SERVE';

    if (activeFilter === 'ready') return isAlarming;
    if (activeFilter === 'occupied') return t.status === 'occupied' || t.status === 'order_sent' || t.status === 'bill_requested';
    if (activeFilter === 'free') return t.status === 'free' || !t.status;
    return true;
  });

  const readyTablesCount = tables.filter(t => 
    activeAlarms.some(a => a.tableId === t.id || a.tableNumber === t.number || String(a.tableNumber) === String(t.number)) ||
    t.status === 'ready' || t.status === 'READY_TO_SERVE'
  ).length;

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-slate-950 p-2 sm:p-4 overflow-hidden">
      {/* Barre d'outils du plan */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-slate-800 mb-2 sm:mb-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
            <span>Tables</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {tables.length}
            </span>
          </h2>

          {/* Sélecteur Mode Grille / Mode Plan 2D */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-yellow-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue grille tactile rapide (idéale pour smartphone)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grille</span>
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'canvas'
                  ? 'bg-yellow-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue plan de salle 2D avec glisser-déposer"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Plan 2D</span>
            </button>
          </div>

          {/* Légende rapide (masquée sur petit smartphone) */}
          <div className="hidden xl:flex items-center gap-3 text-xs ml-2 border-l border-slate-800 pl-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Libre</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Occupée</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>En Cuisine</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>Prêt (Alarme)</span>
          </div>
        </div>

        {/* Contrôles du mode Édition & Ajout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => handleAddTable('square', 2)}
                className="px-2 py-1 text-xs font-medium hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-0.5"
                title="Ajouter table 2 couverts"
              >
                <Plus className="w-3.5 h-3.5" /> 2
              </button>
              <button
                onClick={() => handleAddTable('round', 4)}
                className="px-2 py-1 text-xs font-medium hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-0.5"
                title="Ajouter table 4 couverts"
              >
                <Plus className="w-3.5 h-3.5" /> 4
              </button>
              <button
                onClick={() => handleAddTable('rectangle', 6)}
                className="px-2 py-1 text-xs font-medium hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-0.5"
                title="Ajouter table 6 couverts"
              >
                <Plus className="w-3.5 h-3.5" /> 6
              </button>
            </div>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
              isEditMode
                ? 'bg-yellow-500 text-slate-950 shadow-yellow-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5" /> <span>Terminer</span>
              </>
            ) : (
              <>
                <Move className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Modifier plan</span><span className="sm:hidden">Éditer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* VUE 1 : GRILLE TACTILE RAPIDE (OPTIMISÉE SMARTPHONE & SERVICE PRESSÉ) */}
      {viewMode === 'grid' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Filtres de statut rapides */}
          <div 
            className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none shrink-0"
            style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
          >
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Toutes ({tables.length})
            </button>
            <button
              onClick={() => setActiveFilter('ready')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'ready'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-950 text-red-400 border border-red-500/30'
              }`}
            >
              <BellRing className={`w-3 h-3 ${readyTablesCount > 0 ? 'animate-pulse' : ''}`} />
              <span>🚨 Prêtes ({readyTablesCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('occupied')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'occupied'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-blue-400 border border-slate-800'
              }`}
            >
              Occupées ({tables.filter(t => t.status === 'occupied' || t.status === 'order_sent').length})
            </button>
            <button
              onClick={() => setActiveFilter('free')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === 'free'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-950 text-emerald-400 border border-slate-800'
              }`}
            >
              Libres ({tables.filter(t => t.status === 'free' || !t.status).length})
            </button>
          </div>

          {/* Grille tactile des tables */}
          <div 
            className="flex-1 min-h-0 overflow-y-auto pr-1 pb-28 sm:pb-8 grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 content-start"
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            {filteredTables.map((table) => {
              const style = getTableStyle(table);
              const isAlarming = activeAlarms.some(a => 
                a.tableId === table.id || 
                a.tableNumber === table.number || 
                String(a.tableNumber) === String(table.number) ||
                String(a.tableId) === String(table.id)
              ) || table.status === 'ready' || table.status === 'READY_TO_SERVE';

              return (
                <div
                  key={table.id}
                  onClick={() => !isEditMode && onSelectTable(table)}
                  className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between select-none cursor-pointer transition-all duration-150 active:scale-95 shadow-md ${style.bg} ${
                    isEditMode ? 'ring-2 ring-yellow-400/60' : ''
                  }`}
                  style={{ minHeight: '110px' }}
                >
                  {/* Actions en mode édition */}
                  {isEditMode && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                      <button
                        onClick={(e) => rotateTable(table.id, e)}
                        className="p-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-lg shadow-md"
                        title="Pivoter"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTable(table, e)}
                        className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-md"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none">
                      T{table.number}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-semibold opacity-90">
                      <Users className="w-3.5 h-3.5" />
                      <span>{table.capacity}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${style.badge}`}>
                      {isAlarming ? '🚨 PRÊT !' : style.label}
                    </span>
                    {!isEditMode && (
                      <span className="text-[10px] font-bold text-white/80 group-hover:text-white">
                        Ouvrir →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VUE 2 : CANVAS 2D INTERACTIF (PLAN SPATIAL AVEC GLISSER-DÉPOSER) */}
      {viewMode === 'canvas' && (
        <div 
          className="flex-1 min-h-0 overflow-auto rounded-2xl border border-slate-800 relative bg-slate-950/60 pb-20 sm:pb-0"
          style={{ touchAction: isEditMode ? 'none' : 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          <div
            ref={canvasRef}
            className={`relative min-w-[650px] min-h-[500px] h-full w-full transition-colors ${
              isEditMode
                ? 'bg-slate-900/60 border-yellow-500/40 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]'
                : 'bg-slate-900/40'
            }`}
          >
            {isEditMode && (
              <div className="absolute top-3 left-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 pointer-events-none z-10 shadow-lg">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Mode Édition : Déplacez les tables librement au doigt ou à la souris</span>
              </div>
            )}

            {/* Rendu des tables sur le plan 2D */}
            {tables.map((table) => {
              const style = getTableStyle(table);
              const isAlarming = activeAlarms.some(a => 
                a.tableId === table.id || 
                a.tableNumber === table.number || 
                String(a.tableNumber) === String(table.number) ||
                String(a.tableId) === String(table.id)
              ) || table.status === 'ready' || table.status === 'READY_TO_SERVE';

              return (
                <div
                  key={table.id}
                  onPointerDown={(e) => handlePointerDown(e, table)}
                  onPointerMove={(e) => handlePointerMove(e, table.id)}
                  onPointerUp={(e) => handlePointerUp(e, table.id)}
                  onPointerCancel={(e) => handlePointerUp(e, table.id)}
                  onClick={() => !isEditMode && onSelectTable(table)}
                  style={{
                    left: `${table.positionX || 50}px`,
                    top: `${table.positionY || 50}px`,
                    width: `${table.width || 90}px`,
                    height: `${table.height || 90}px`,
                    transform: `rotate(${table.rotation || 0}deg)`,
                    cursor: isEditMode ? (draggedTableId === table.id ? 'grabbing' : 'grab') : 'pointer',
                    touchAction: isEditMode ? 'none' : 'auto',
                    userSelect: 'none'
                  }}
                  className={`absolute flex flex-col items-center justify-center select-none transition-all duration-100 ${
                    draggedTableId === table.id ? 'scale-105 shadow-2xl z-30 ring-4 ring-yellow-400' : 'active:scale-95'
                  } ${
                    table.shape === 'round' ? 'rounded-full' : 'rounded-2xl'
                  } ${style.bg}`}
                >
                  {/* Boutons d'action en mode édition : Rotation & Suppression */}
                  {isEditMode && (
                    <>
                      <button
                        onClick={(e) => handleDeleteTable(table, e)}
                        className="absolute -top-2 -left-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all z-20"
                        title={`Supprimer la table T${table.number}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => rotateTable(table.id, e)}
                        className="absolute -top-2 -right-2 p-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all z-20"
                        title="Pivoter à 45°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                    </>
                  )}

                  {/* Numéro de table */}
                  <span className="text-xl font-extrabold tracking-tight">
                    T{table.number}
                  </span>

                  {/* Capacité et statut */}
                  <div className="flex items-center gap-1 text-[11px] font-medium opacity-90 mt-0.5">
                    <Users className="w-3 h-3" />
                    <span>{table.capacity}</span>
                  </div>

                  {/* Badge d'état */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold mt-1 ${style.badge}`}>
                    {isAlarming ? 'PRÊT !' : style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
