import React, { useState, useRef } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { Plus, Move, Check, Users, Sparkles, AlertCircle, RotateCw } from 'lucide-react';

export const FloorPlanCanvas = ({ onSelectTable }) => {
  const { tables, updateTableLayout, activeAlarms } = useRestobook();
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState(null);
  const canvasRef = useRef(null);

  // Début du glisser-déposer d'une table
  const handleDragStart = (e, tableId) => {
    if (!isEditMode) return;
    setDraggedTableId(tableId);
    e.dataTransfer.setData('text/plain', tableId);
  };

  const handleDragOver = (e) => {
    if (!isEditMode) return;
    e.preventDefault();
  };

  const handleDrop = (e) => {
    if (!isEditMode || !draggedTableId || !canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left - 45; // Centrer sur la table
    const rawY = e.clientY - rect.top - 45;

    // Magnétisme à la grille (snap-to-grid de 20px)
    const snapX = Math.max(10, Math.min(rect.width - 100, Math.round(rawX / 20) * 20));
    const snapY = Math.max(10, Math.min(rect.height - 100, Math.round(rawY / 20) * 20));

    const updated = tables.map(t => {
      if (t.id === draggedTableId) {
        return { ...t, positionX: snapX, positionY: snapY };
      }
      return t;
    });

    updateTableLayout(updated);
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
    e.stopPropagation();
    const updated = tables.map(t => {
      if (t.id === tableId) {
        return { ...t, rotation: ((t.rotation || 0) + 45) % 360 };
      }
      return t;
    });
    updateTableLayout(updated);
  };

  // Obtenir la couleur et l'animation selon le statut de la table
  const getTableStyle = (table) => {
    const isAlarming = activeAlarms.includes(table.id) || table.status === 'ready';

    if (isAlarming) {
      return {
        bg: 'bg-red-600 text-white border-2 border-red-300 ring-8 ring-red-500/40 animate-pulse-fast shadow-2xl shadow-red-600/60',
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
          label: 'Addition'
        };
      case 'reserved':
        return {
          bg: 'bg-slate-700 text-slate-300 border border-slate-600',
          badge: 'bg-slate-800 text-slate-400',
          label: 'Réservée'
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

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4">
      {/* Barre d'outils du plan */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Plan de Salle Interactif
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {tables.length} tables
            </span>
          </h2>

          {/* Légende rapide */}
          <div className="hidden lg:flex items-center gap-3 text-xs ml-4 border-l border-slate-800 pl-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Libre</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Occupée</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>En Cuisine</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>Prêt (Alarme)</span>
          </div>
        </div>

        {/* Contrôle du mode Édition / Service */}
        <div className="flex items-center gap-2">
          {isEditMode && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => handleAddTable('square', 2)}
                className="px-2.5 py-1 text-xs font-medium hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-1"
                title="Ajouter table 2 couverts"
              >
                <Plus className="w-3.5 h-3.5" /> Carrée (2)
              </button>
              <button
                onClick={() => handleAddTable('round', 4)}
                className="px-2.5 py-1 text-xs font-medium hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-1"
                title="Ajouter table ronde 4 couverts"
              >
                <Plus className="w-3.5 h-3.5" /> Ronde (4)
              </button>
              <button
                onClick={() => handleAddTable('rectangle', 6)}
                className="px-2.5 py-1 text-xs font-medium hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-1"
                title="Ajouter table rectangulaire 6 couverts"
              >
                <Plus className="w-3.5 h-3.5" /> Rect. (6)
              </button>
            </div>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isEditMode
                ? 'bg-yellow-500 text-slate-950 shadow-yellow-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-4 h-4" /> Mode Service (Verrouiller)
              </>
            ) : (
              <>
                <Move className="w-4 h-4" /> Mode Édition (Glisser-Déposer)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas 2D avec grille magnétique */}
      <div
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex-1 rounded-2xl border transition-colors overflow-hidden ${
          isEditMode
            ? 'bg-slate-900/60 border-yellow-500/40 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]'
            : 'bg-slate-900/40 border-slate-800/80'
        }`}
      >
        {isEditMode && (
          <div className="absolute top-3 left-3 pointer-events-none bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-medium text-yellow-400">
            ✋ Glissez les tables pour les réorganiser. Cliquez sur 🔄 pour pivoter.
          </div>
        )}

        {/* Rendu des tables sur le plan */}
        {tables.map((table) => {
          const style = getTableStyle(table);
          const isAlarming = activeAlarms.includes(table.id) || table.status === 'ready';

          return (
            <div
              key={table.id}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, table.id)}
              onClick={() => !isEditMode && onSelectTable(table)}
              style={{
                left: `${table.positionX || 50}px`,
                top: `${table.positionY || 50}px`,
                width: `${table.width || 90}px`,
                height: `${table.height || 90}px`,
                transform: `rotate(${table.rotation || 0}deg)`,
                cursor: isEditMode ? 'grab' : 'pointer'
              }}
              className={`absolute flex flex-col items-center justify-center select-none transition-all duration-150 active:scale-95 ${
                table.shape === 'round' ? 'rounded-full' : 'rounded-2xl'
              } ${style.bg}`}
            >
              {/* Bouton de rotation en mode édition */}
              {isEditMode && (
                <button
                  onClick={(e) => rotateTable(table.id, e)}
                  className="absolute -top-2 -right-2 p-1 bg-yellow-500 text-slate-950 rounded-full shadow hover:bg-yellow-400 z-10"
                  title="Pivoter à 45°"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
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
  );
};
