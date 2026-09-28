import React, { useState, useEffect } from 'react';
import { useRestobook } from '../context/RestobookContext';
import { Store, X, Check, Sparkles } from 'lucide-react';

export const EditRestaurantNameModal = ({ isOpen, onClose }) => {
  const { restaurantName, changeRestaurantName } = useRestobook();
  const [name, setName] = useState(restaurantName);

  useEffect(() => {
    setName(restaurantName);
  }, [restaurantName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      changeRestaurantName(name.trim());
      onClose();
    }
  };

  const PRESETS = [
    "Bistrot Le Central",
    "La Trattoria Bella",
    "L'Atelier des Saveurs",
    "Brasserie des Halles",
    "Le Grill Gourmand"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-2xl border border-yellow-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Nom de votre Restaurant</h2>
            <p className="text-xs text-slate-400">Ce nom apparaîtra sur vos tablettes, menus et additions</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Nom de l'établissement :
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Le Petit Zinc, Brasserie Royale..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-yellow-500 shadow-inner"
            />
          </div>

          {/* Suggestions rapides */}
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block mb-2">Suggestions rapides :</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setName(p)}
                  className="px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-yellow-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
