import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Users, AlertCircle, Sparkles, Square, Circle, RectangleHorizontal, Layers } from 'lucide-react';
import { getNextAvailableTableNumber } from '../../utils/tableUtils';

export const TableEditModal = ({
  isOpen,
  onClose,
  table = null, // null pour ajout, objet table pour modification
  existingTables = [],
  onSave,
  onDelete
}) => {
  const isEditing = Boolean(table);

  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [shape, setShape] = useState('square');
  const [zoneId, setZoneId] = useState('main_hall');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (table) {
        setNumber(table.number !== undefined ? String(table.number) : '');
        setCapacity(table.capacity || 4);
        setShape(table.shape || 'square');
        setZoneId(table.zoneId || 'main_hall');
      } else {
        // Nouvelle table : proposer le prochain numéro libre garanti sans doublon
        const nextNum = getNextAvailableTableNumber(existingTables);
        setNumber(nextNum);
        setCapacity(4);
        setShape('square');
        setZoneId('main_hall');
      }
      setErrorMessage('');
    }
  }, [isOpen, table, existingTables]);

  if (!isOpen) return null;

  // Vérification de collision de numéro en temps réel
  const trimmedNumber = String(number).trim();
  const isDuplicate = existingTables.some(t => {
    // Si on est en mode édition, ignorer la table en cours d'édition
    if (isEditing && (t.id === table?.id || String(t.id) === String(table?.id))) {
      return false;
    }
    return String(t.number).trim().toLowerCase() === trimmedNumber.toLowerCase();
  });

  const handleSuggestNumber = () => {
    // Calculer le prochain numéro disponible
    const filtered = isEditing ? existingTables.filter(t => t.id !== table?.id) : existingTables;
    const nextNum = getNextAvailableTableNumber(filtered);
    setNumber(nextNum);
    setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!trimmedNumber) {
      setErrorMessage('Veuillez saisir un numéro de table.');
      return;
    }

    if (isDuplicate) {
      setErrorMessage(`Le numéro T${trimmedNumber} est déjà utilisé par une autre table. Veuillez choisir un numéro unique.`);
      return;
    }

    const tableData = {
      ...(table || {}),
      number: trimmedNumber,
      capacity: parseInt(capacity, 10) || 2,
      shape,
      zoneId,
      width: shape === 'rectangle' ? 140 : (shape === 'round' ? 95 : 90),
      height: 90
    };

    onSave(tableData);
    onClose();
  };

  const ZONES = [
    { id: 'main_hall', label: 'Salle Principale' },
    { id: 'terrace', label: 'Terrasse' },
    { id: 'bar', label: 'Bar & Comptoir' },
    { id: 'mezzanine', label: 'Étage / Mezzanine' }
  ];

  const CAPACITIES = [1, 2, 4, 6, 8, 10, 12];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-2xl border border-yellow-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">
              {isEditing ? `Modifier la Table T${table.number}` : 'Ajouter une Nouvelle Table'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing ? 'Configurez le numéro, la capacité et la forme' : 'Configurez les paramètres de la nouvelle table'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Numéro de table */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Numéro ou Nom de la table :
              </label>
              <button
                type="button"
                onClick={handleSuggestNumber}
                className="text-[11px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-semibold"
                title="Attribuer automatiquement le prochain numéro libre"
              >
                <Sparkles className="w-3 h-3" />
                Numéro libre suivant
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold">
                T
              </div>
              <input
                type="text"
                required
                autoFocus
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Ex: 1, 12, 101, Terrasse 1..."
                className={`w-full bg-slate-950 border ${
                  isDuplicate ? 'border-red-500 focus:border-red-400' : 'border-slate-800 focus:border-yellow-500'
                } rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-white focus:outline-none shadow-inner`}
              />
            </div>

            {/* Alerte si doublon */}
            {isDuplicate && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Ce numéro est déjà attribué à une autre table !
              </p>
            )}

            {errorMessage && !isDuplicate && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>

          {/* Nombre de couverts (Capacité) */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Nombre de couverts (places) :
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CAPACITIES.map(cap => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setCapacity(cap)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    capacity === cap
                      ? 'bg-yellow-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cap} {cap > 1 ? 'pers.' : 'pers.'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Autre capacité :</span>
              <input
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-yellow-500 text-center"
              />
            </div>
          </div>

          {/* Forme de la table */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Forme géométrique :
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShape('square')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  shape === 'square'
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Square className="w-5 h-5" />
                <span className="text-xs">Carrée</span>
              </button>

              <button
                type="button"
                onClick={() => setShape('round')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  shape === 'round'
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Circle className="w-5 h-5" />
                <span className="text-xs">Ronde</span>
              </button>

              <button
                type="button"
                onClick={() => setShape('rectangle')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  shape === 'rectangle'
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <RectangleHorizontal className="w-5 h-5" />
                <span className="text-xs">Rectangle</span>
              </button>
            </div>
          </div>

          {/* Zone de la table */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Zone dans le restaurant :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ZONES.map(z => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZoneId(z.id)}
                  className={`p-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                    zoneId === z.id
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(table);
                  onClose();
                }}
                className="p-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Supprimer cette table"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isDuplicate || !trimmedNumber}
              className={`flex-1 py-3 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 ${
                isDuplicate || !trimmedNumber
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/20 active:scale-95'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'Enregistrer' : 'Créer la table'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
