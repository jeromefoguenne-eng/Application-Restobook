import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Utensils, Check, Flame } from 'lucide-react';

const COMMON_ALLERGENS = [
  'Gluten', 'Lactose', 'Œufs', 'Poisson', 'Crustacés', 
  'Arachides', 'Soja', 'Fruits à coque', 'Moutarde', 'Sulfites'
];

export const MenuItemModal = ({ isOpen, onClose, onSave, itemToEdit, categories }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat_plats');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('15.00');
  const [vatRate, setVatRate] = useState('10.0');
  const [allergens, setAllergens] = useState([]);
  const [hasCookingOption, setHasCookingOption] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setCategoryId(itemToEdit.categoryId || categories[0]?.id || 'cat_plats');
      setDescription(itemToEdit.description || '');
      setPrice(itemToEdit.price ? itemToEdit.price.toString() : '15.00');
      setVatRate(itemToEdit.vatRate ? itemToEdit.vatRate.toString() : '10.0');
      setAllergens(itemToEdit.allergens || []);
      setHasCookingOption(Boolean(itemToEdit.modifierGroups?.some(g => g.id === 'cuisson')));
      setIsAvailable(itemToEdit.isAvailable !== false);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || 'cat_plats');
      setDescription('');
      setPrice('15.00');
      setVatRate('10.0');
      setAllergens([]);
      setHasCookingOption(false);
      setIsAvailable(true);
    }
  }, [itemToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const toggleAllergen = (alg) => {
    setAllergens(prev =>
      prev.includes(alg) ? prev.filter(a => a !== alg) : [...prev, alg]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const modifierGroups = [];
    if (hasCookingOption) {
      modifierGroups.push({
        id: 'cuisson',
        name: 'Cuisson',
        isRequired: true,
        options: ['Bleu', 'Saignant', 'À point', 'Bien cuit']
      });
    }

    const payload = {
      ...(itemToEdit ? { id: itemToEdit.id } : {}),
      name: name.trim(),
      categoryId,
      description: description.trim(),
      price: parseFloat(price) || 0,
      vatRate: parseFloat(vatRate) || 10,
      allergens,
      modifierGroups,
      isAvailable
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-2xl border border-yellow-500/20">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {itemToEdit ? 'Modifier le plat / la boisson' : 'Ajouter un plat ou une boisson'}
            </h2>
            <p className="text-xs text-slate-400">Gérez votre carte en direct pour la salle et la cuisine</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du plat */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Nom de l'article * :</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Entrecôte grillée, Mojito passion, Tarte Tatin..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Catégorie * :</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prix et TVA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Prix TTC (€) * :</label>
              <input
                type="number"
                step="0.10"
                min="0"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="14.50"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Taux de TVA :</label>
              <select
                value={vatRate}
                onChange={e => setVatRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="10.0">10% (Alimentation & Softs)</option>
                <option value="20.0">20% (Alcools & Vins)</option>
                <option value="5.5">5.5% (Taux réduit)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Description & Ingrédients :</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Viande maturée 21 jours, sauce béarnaise maison, frites fraîches..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Option de cuisson */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">Demander la cuisson en salle</span>
                <span className="text-[10px] text-slate-400">Bleu, Saignant, À point, Bien cuit</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={hasCookingOption}
              onChange={e => setHasCookingOption(e.target.checked)}
              className="w-5 h-5 accent-yellow-500 rounded cursor-pointer"
            />
          </div>

          {/* Allergènes */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Allergènes à signaler :</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGENS.map(alg => {
                const isSelected = allergens.includes(alg);
                return (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => toggleAllergen(alg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-yellow-500 text-slate-950 border-yellow-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {alg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Boutons d'action */}
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
              className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
            >
              {itemToEdit ? 'Mettre à jour' : 'Ajouter à la carte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
