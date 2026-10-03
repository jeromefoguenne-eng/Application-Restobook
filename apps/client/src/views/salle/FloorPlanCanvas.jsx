import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { 
  Plus, Move, Check, Users, Sparkles, RotateCw, Trash2, LayoutGrid, 
  Map, BellRing, Settings, AlertTriangle, Magnet, ZoomIn, ZoomOut, 
  Maximize2, SlidersHorizontal, Edit3 
} from 'lucide-react';
import { TableEditModal } from './TableEditModal';
import { 
  getNextAvailableTableNumber, 
  findDuplicateTableNumbers, 
  fixDuplicateTableNumbers, 
  autoAlignTables 
} from '../../utils/tableUtils';

export const FloorPlanCanvas = ({ onSelectTable }) => {
  const { tables, updateTableLayout, deleteTable, activeAlarms } = useRestobook();
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ready' | 'occupied' | 'free'
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' (2D Plan) | 'grid' (smartphone)
  
  // Options de disposition spatiale
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.75 | 1 | 1.25

  // Modal d'ajout / modification de table
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTableData, setModalTableData] = useState(null); // null = création, objet = modification

  // Drag & drop ultra-fluide sans lag réseau/localStorage
  const [dragState, setDragState] = useState(null); // { tableId, currentX, currentY }
  const canvasRef = useRef(null);
  const dragInfoRef = useRef({
    tableId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    tableWidth: 90,
    tableHeight: 90
  });

  // Détection des doublons de numéros
  const duplicateNumbers = useMemo(() => findDuplicateTableNumbers(tables), [tables]);

  // Correction automatique des doublons
  const handleFixDuplicates = () => {
    const fixed = fixDuplicateTableNumbers(tables);
    updateTableLayout(fixed);
  };

  // Gestion du Glisser-Déposer global (Window Pointer Events)
  const handlePointerDown = (e, table) => {
    if (!isEditMode) return;
    if (e.target.closest('button')) return; // Ne pas déplacer si clic sur bouton d'action

    e.preventDefault();
    const tableW = table.width || (table.shape === 'rectangle' ? 140 : 90);
    const tableH = table.height || 90;

    dragInfoRef.current = {
      tableId: table.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: table.positionX || 50,
      initialY: table.positionY || 50,
      tableWidth: tableW,
      tableHeight: tableH
    };

    setDragState({
      tableId: table.id,
      currentX: table.positionX || 50,
      currentY: table.positionY || 50
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const onPointerMove = (e) => {
      e.preventDefault();
      const { tableId, startX, startY, initialX, initialY, tableWidth, tableHeight } = dragInfoRef.current;
      if (!tableId || !canvasRef.current) return;

      const deltaX = (e.clientX - startX) / zoomLevel;
      const deltaY = (e.clientY - startY) / zoomLevel;

      let rawX = initialX + deltaX;
      let rawY = initialY + deltaY;

      // Limites de l'espace de salle (Canvas de 1400 x 900 px)
      const maxX = Math.max(800, canvasRef.current.clientWidth - tableWidth - 10);
      const maxY = Math.max(600, canvasRef.current.clientHeight - tableHeight - 10);

      let finalX = Math.max(10, Math.min(maxX, rawX));
      let finalY = Math.max(10, Math.min(maxY, rawY));

      // Magnétisme à la grille (snap 20px) si activé
      if (snapToGrid) {
        finalX = Math.round(finalX / 20) * 20;
        finalY = Math.round(finalY / 20) * 20;
      } else {
        finalX = Math.round(finalX);
        finalY = Math.round(finalY);
      }

      setDragState({
        tableId,
        currentX: finalX,
        currentY: finalY
      });
    };

    const onPointerUp = () => {
      const { tableId } = dragInfoRef.current;
      if (tableId && dragState) {
        // Sauvegarde unique au relâchement final
        const updated = tables.map(t => {
          if (t.id === tableId) {
            return {
              ...t,
              positionX: dragState.currentX,
              positionY: dragState.currentY
            };
          }
          return t;
        });
        updateTableLayout(updated);
      }
      setDragState(null);
      dragInfoRef.current.tableId = null;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [dragState, tables, snapToGrid, zoomLevel, updateTableLayout]);

  // Ajout rapide d'une table avec numéro garanti UNIQUE
  const handleQuickAddTable = (shape = 'square', capacity = 4) => {
    const nextNumber = getNextAvailableTableNumber(tables);
    const offset = (tables.length * 25) % 200;
    const newTable = {
      id: `table_${Date.now()}`,
      number: nextNumber,
      zoneId: 'main_hall',
      shape,
      capacity,
      positionX: 60 + offset,
      positionY: 60 + offset,
      width: shape === 'rectangle' ? 140 : (shape === 'round' ? 95 : 90),
      height: 90,
      rotation: 0,
      status: 'free'
    };
    updateTableLayout([...tables, newTable]);
  };

  // Ouverture du modal pour ajouter une table sur-mesure
  const handleOpenAddCustomModal = () => {
    setModalTableData(null);
    setIsModalOpen(true);
  };

  // Ouverture du modal pour éditer une table
  const handleOpenEditTableModal = (table, e) => {
    e?.stopPropagation();
    setModalTableData(table);
    setIsModalOpen(true);
  };

  // Sauvegarde depuis le modal (Création ou Mise à jour)
  const handleSaveModalTable = (tableData) => {
    if (modalTableData) {
      // Mise à jour de la table existante
      const updated = tables.map(t => {
        if (t.id === modalTableData.id) {
          return {
            ...t,
            ...tableData
          };
        }
        return t;
      });
      updateTableLayout(updated);
    } else {
      // Création d'une nouvelle table
      const offset = (tables.length * 25) % 200;
      const newTable = {
        id: `table_${Date.now()}`,
        status: 'free',
        positionX: 60 + offset,
        positionY: 60 + offset,
        rotation: 0,
        ...tableData
      };
      updateTableLayout([...tables, newTable]);
    }
  };

  // Rotation d'une table (par pas de 45°)
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

  // Suppression d'une table avec confirmation de sécurité
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

  // Aligner automatiquement toutes les tables
  const handleAutoAlign = () => {
    if (!window.confirm('Voulez-vous réorganiser et aligner automatiquement toutes les tables du plan ?')) {
      return;
    }
    const aligned = autoAlignTables(tables, canvasRef.current?.clientWidth || 1000);
    updateTableLayout(aligned);
  };

  // Style visuel de la table selon son état
  const getTableStyle = (table) => {
    const isAlarming = activeAlarms.some(a => 
      a.tableId === table.id || 
      a.tableNumber === table.number || 
      String(a.tableNumber) === String(table.number) ||
      String(a.tableId) === String(table.id)
    ) || table.status === 'ready' || table.status === 'READY_TO_SERVE';

    if (isAlarming) {
      return {
        bg: 'bg-red-600 text-white border-2 border-red-300 ring-4 ring-red-500/40 animate-pulse shadow-2xl shadow-red-600/60',
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
    <div className="flex flex-col h-full min-h-0 w-full bg-slate-950 p-2 sm:p-4 overflow-hidden relative">
      {/* BANNIÈRE D'ALERTE : DOUBLONS DÉTECTÉS */}
      {duplicateNumbers.length > 0 && (
        <div className="mb-2 p-3 bg-red-600/20 border-2 border-red-500/60 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-extrabold text-white">Attention : Conflit de numéros en double !</span>
              <p className="text-[11px] text-red-300">
                Des tables partagent le même numéro : {duplicateNumbers.map(n => `T${n}`).join(', ')}.
              </p>
            </div>
          </div>
          <button
            onClick={handleFixDuplicates}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
            title="Attribuer des numéros uniques à toutes les tables en double"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Corriger les doublons automatiquement</span>
          </button>
        </div>
      )}

      {/* BARRE D'OUTILS PRINCIPALE */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800 mb-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
            <span>Plan de Salle</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
              {tables.length} tables
            </span>
          </h2>

          {/* Sélecteur Mode Plan 2D / Mode Grille */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'canvas'
                  ? 'bg-yellow-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue spatiale 2D avec positionnement libre des tables"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Plan 2D</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-yellow-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue liste compacte sous forme de tuiles tactiles"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grille</span>
            </button>
          </div>

          {/* Outils spatiaux (visibles en vue Plan 2D) */}
          {viewMode === 'canvas' && (
            <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs">
              {/* Toggle Magnétisme grille */}
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                  snapToGrid ? 'bg-slate-800 text-yellow-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={snapToGrid ? "Magnétisme grille actif (20px)" : "Déplacement libre au pixel près"}
              >
                <Magnet className="w-3 h-3" />
                <span className="text-[11px]">{snapToGrid ? 'Grille 20px' : 'Libre'}</span>
              </button>

              {/* Contrôles de zoom */}
              <div className="flex items-center border-l border-slate-800 pl-1 ml-0.5">
                <button
                  onClick={() => setZoomLevel(Math.max(0.75, zoomLevel - 0.15))}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  title="Dézoomer"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white font-mono"
                  title="Réinitialiser zoom (100%)"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.15))}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  title="Zoomer"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contrôles d'Édition & Création */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold px-1.5 hidden xl:inline">Ajouter :</span>
              <button
                onClick={() => handleQuickAddTable('square', 2)}
                className="px-2 py-1 text-xs font-semibold hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-0.5"
                title="Ajouter rapidement une table 2 couverts"
              >
                <Plus className="w-3.5 h-3.5 text-yellow-400" /> 2 pl.
              </button>
              <button
                onClick={() => handleQuickAddTable('round', 4)}
                className="px-2 py-1 text-xs font-semibold hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-0.5"
                title="Ajouter rapidement une table 4 couverts"
              >
                <Plus className="w-3.5 h-3.5 text-yellow-400" /> 4 pl.
              </button>
              <button
                onClick={() => handleQuickAddTable('rectangle', 6)}
                className="px-2 py-1 text-xs font-semibold hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-0.5"
                title="Ajouter rapidement une table 6 couverts"
              >
                <Plus className="w-3.5 h-3.5 text-yellow-400" /> 6 pl.
              </button>
              <button
                onClick={handleOpenAddCustomModal}
                className="px-2.5 py-1 text-xs font-bold bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg flex items-center gap-1 border border-yellow-500/30"
                title="Ajouter une table sur-mesure (choisir numéro, forme, zone...)"
              >
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span>Sur-mesure</span>
              </button>

              {/* Bouton Réaligner */}
              <button
                onClick={handleAutoAlign}
                className="px-2 py-1 text-xs font-semibold hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg flex items-center gap-1 border-l border-slate-800 ml-1 pl-2"
                title="Ranger et aligner proprement toutes les tables"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span className="hidden lg:inline">Aligner</span>
              </button>
            </div>
          )}

          {/* Bouton bascule Mode Édition */}
          <button
            onClick={() => {
              const nextEdit = !isEditMode;
              setIsEditMode(nextEdit);
              // Si on passe en mode édition depuis la grille, basculer automatiquement en Plan 2D pour pouvoir disposer les tables
              if (nextEdit && viewMode === 'grid') {
                setViewMode('canvas');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
              isEditMode
                ? 'bg-yellow-500 text-slate-950 shadow-yellow-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" /> <span>Terminer l'édition</span>
              </>
            ) : (
              <>
                <Move className="w-3.5 h-3.5" /> <span>Disposer & Modifier les tables</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* VUE 1 : PLAN 2D INTERACTIF (GLISSER-DÉPOSER FLUIDE & POSITIONNEMENT LIBRE) */}
      {viewMode === 'canvas' && (
        <div 
          className="flex-1 min-h-0 overflow-auto rounded-2xl border border-slate-800 relative bg-slate-950/70 pb-20 sm:pb-0 select-none"
          style={{ touchAction: isEditMode ? 'none' : 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          {isEditMode && (
            <div className="sticky top-2 left-2 z-20 inline-flex items-center gap-2 bg-slate-900/90 border border-yellow-500/40 text-yellow-300 text-xs px-3 py-1.5 rounded-xl font-bold shadow-xl backdrop-blur-md mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Glissez les tables au doigt ou à la souris pour les placer librement dans la salle</span>
            </div>
          )}

          <div
            ref={canvasRef}
            style={{
              minWidth: '1200px',
              minHeight: '800px',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              transition: dragState ? 'none' : 'transform 0.15s ease-out'
            }}
            className={`relative w-full h-full p-6 ${
              isEditMode
                ? 'bg-slate-900/40 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]'
                : 'bg-slate-900/20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:30px_30px]'
            }`}
          >
            {/* Rendu des tables sur le Plan 2D */}
            {tables.map((table) => {
              const isBeingDragged = dragState?.tableId === table.id;
              const posX = isBeingDragged ? dragState.currentX : (table.positionX || 50);
              const posY = isBeingDragged ? dragState.currentY : (table.positionY || 50);

              const style = getTableStyle(table);
              const isAlarming = activeAlarms.some(a => 
                a.tableId === table.id || 
                a.tableNumber === table.number || 
                String(a.tableNumber) === String(table.number) ||
                String(a.tableId) === String(table.id)
              ) || table.status === 'ready' || table.status === 'READY_TO_SERVE';

              const isDup = duplicateNumbers.includes(String(table.number).trim());

              return (
                <div
                  key={table.id}
                  onPointerDown={(e) => handlePointerDown(e, table)}
                  onClick={() => !isEditMode && onSelectTable(table)}
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    width: `${table.width || (table.shape === 'rectangle' ? 140 : 90)}px`,
                    height: `${table.height || 90}px`,
                    transform: `rotate(${table.rotation || 0}deg)`,
                    cursor: isEditMode ? (isBeingDragged ? 'grabbing' : 'grab') : 'pointer',
                    touchAction: isEditMode ? 'none' : 'auto',
                    zIndex: isBeingDragged ? 40 : 10
                  }}
                  className={`absolute flex flex-col items-center justify-center select-none transition-shadow ${
                    isBeingDragged 
                      ? 'scale-105 shadow-2xl ring-4 ring-yellow-400 bg-yellow-500/20' 
                      : 'hover:scale-[1.02] active:scale-95'
                  } ${
                    table.shape === 'round' ? 'rounded-full' : 'rounded-2xl'
                  } ${style.bg} ${isDup ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-slate-950' : ''}`}
                >
                  {/* Boutons d'action en Mode Édition */}
                  {isEditMode && (
                    <>
                      {/* Supprimer */}
                      <button
                        onClick={(e) => handleDeleteTable(table, e)}
                        className="absolute -top-2.5 -left-2.5 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-30"
                        title={`Supprimer la table T${table.number}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      {/* Modifier numéro & options */}
                      <button
                        onClick={(e) => handleOpenEditTableModal(table, e)}
                        className="absolute -top-2.5 left-6 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-30"
                        title="Modifier numéro, couverts ou forme"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      {/* Pivoter */}
                      <button
                        onClick={(e) => rotateTable(table.id, e)}
                        className="absolute -top-2.5 -right-2.5 p-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-30"
                        title="Pivoter à 45°"
                      >
                        <RotateCw className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </>
                  )}

                  {/* Numéro de table */}
                  <div className="flex items-center gap-0.5">
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight leading-none">
                      T{table.number}
                    </span>
                    {isDup && (
                      <span className="text-[10px] bg-red-950 text-red-200 border border-red-500 px-1 rounded font-bold" title="Numéro en doublon !">
                        ⚠️
                      </span>
                    )}
                  </div>

                  {/* Capacité en couverts */}
                  <div className="flex items-center gap-1 text-[11px] font-semibold opacity-90 mt-0.5">
                    <Users className="w-3 h-3" />
                    <span>{table.capacity}</span>
                  </div>

                  {/* Statut de la table */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold mt-1 ${style.badge}`}>
                    {isAlarming ? 'PRÊT !' : style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VUE 2 : GRILLE TACTILE RAPIDE */}
      {viewMode === 'grid' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Notification informative si en mode édition */}
          {isEditMode && (
            <div className="mb-2 p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-between text-xs text-yellow-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                Pour déplacer librement les tables dans la salle, passez sur la vue <strong>Plan 2D</strong>.
              </span>
              <button
                onClick={() => setViewMode('canvas')}
                className="px-2.5 py-1 bg-yellow-500 text-slate-950 font-bold rounded-lg text-xs shrink-0 ml-2"
              >
                Basculer sur Plan 2D
              </button>
            </div>
          )}

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

              const isDup = duplicateNumbers.includes(String(table.number).trim());

              return (
                <div
                  key={table.id}
                  onClick={() => !isEditMode && onSelectTable(table)}
                  className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between select-none cursor-pointer transition-all duration-150 active:scale-95 shadow-md ${style.bg} ${
                    isEditMode ? 'ring-2 ring-yellow-400/60' : ''
                  } ${isDup ? 'ring-2 ring-red-400' : ''}`}
                  style={{ minHeight: '110px' }}
                >
                  {/* Actions en Mode Édition */}
                  {isEditMode && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                      <button
                        onClick={(e) => handleOpenEditTableModal(table, e)}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md"
                        title="Modifier le numéro ou les propriétés"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
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
                    <div className="flex items-center gap-1">
                      <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none">
                        T{table.number}
                      </span>
                      {isDup && <span className="text-xs" title="Doublon !">⚠️</span>}
                    </div>
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

      {/* MODAL D'AJOUT ET ÉDITION DE TABLE */}
      <TableEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        table={modalTableData}
        existingTables={tables}
        onSave={handleSaveModalTable}
        onDelete={handleDeleteTable}
      />
    </div>
  );
};
