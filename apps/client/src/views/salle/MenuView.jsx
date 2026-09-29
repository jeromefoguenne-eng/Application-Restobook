import React, { useState } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { MenuItemModal } from './MenuItemModal';
import {
  Utensils,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Coins,
  ChevronDown
} from 'lucide-react';

export const MenuView = () => {
  const {
    menuCategories,
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
    addMenuCategory,
    currency,
    changeCurrency,
    formatPrice,
    AVAILABLE_CURRENCIES
  } = useRestobook();

  // Onglet sélectionné : 'cat_entrees' par défaut, ou 'all'
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('cat_entrees');
  const [defaultCategoryForModal, setDefaultCategoryForModal] = useState('cat_plats');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Modal d'ajout de nouvelle catégorie
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍽️');

  const handleOpenAdd = (defaultCatId) => {
    const targetCat = defaultCatId || (selectedCategoryTab !== 'all' ? selectedCategoryTab : (menuCategories[0]?.id || 'cat_plats'));
    setDefaultCategoryForModal(targetCat);
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setItemToEdit(item);
    setDefaultCategoryForModal(item.categoryId || menuCategories[0]?.id || 'cat_plats');
    setIsModalOpen(true);
  };

  const handleSave = (itemData) => {
    if (itemToEdit) {
      updateMenuItem(itemData);
    } else {
      addMenuItem(itemData);
    }
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const created = addMenuCategory({
      name: newCatName.trim(),
      icon: newCatIcon.trim() || '🍽️'
    });
    setNewCatName('');
    setIsAddCatModalOpen(false);
    if (created && created.id) {
      setSelectedCategoryTab(created.id);
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMenuItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  // Liste des catégories à afficher
  const categoriesToDisplay = selectedCategoryTab === 'all'
    ? menuCategories
    : menuCategories.filter(cat => cat.id === selectedCategoryTab);

  return (
    <div 
      className="flex-1 flex flex-col p-3 sm:p-6 bg-slate-950 overflow-y-auto"
      style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >
      {/* En-tête : Titre + Sélecteur de Devise + Bouton Ajouter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-800 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-yellow-400" />
            Carte du Restaurant
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Séparez vos Entrées, Plats, Boissons & Desserts et configurez la devise de votre choix
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Sélecteur de Devise Monétaire */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 border border-slate-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium hidden xs:inline">Devise :</span>
            <select
              value={currency.code}
              onChange={(e) => {
                const found = AVAILABLE_CURRENCIES.find(c => c.code === e.target.value);
                if (found) changeCurrency(found);
              }}
              className="bg-slate-950 border border-slate-700 text-xs font-bold text-yellow-400 px-2 py-1 rounded-xl focus:outline-none focus:border-yellow-500 cursor-pointer"
            >
              {AVAILABLE_CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Nouvelle Catégorie */}
          <button
            onClick={() => setIsAddCatModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl text-xs border border-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-yellow-400" />
            <span>Catégorie</span>
          </button>

          <button
            onClick={() => handleOpenAdd(selectedCategoryTab !== 'all' ? selectedCategoryTab : 'cat_plats')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-yellow-500/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Ajouter plat</span>
          </button>
        </div>
      </div>

      {/* Onglets de séparation claire : Entrées, Plats, Boissons, Desserts */}
      <div 
        className="flex gap-2 pb-4 overflow-x-auto scrollbar-none border-b border-slate-800/80 mb-6"
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      >
        {menuCategories.map(cat => {
          const count = menuItems.filter(i => i.categoryId === cat.id).length;
          const isSelected = selectedCategoryTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryTab(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                isSelected
                  ? 'bg-yellow-500 text-slate-950 shadow-yellow-500/20 scale-[1.02]'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Bouton pour tout afficher d'un coup */}
        <button
          onClick={() => setSelectedCategoryTab('all')}
          className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
            selectedCategoryTab === 'all'
              ? 'bg-yellow-500 text-slate-950 shadow-yellow-500/20'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800/60'
          }`}
        >
          ✨ Tout afficher
        </button>
      </div>

      {/* Contenu des catégories filtrées */}
      <div className="space-y-6">
        {categoriesToDisplay.map(cat => {
          const items = menuItems.filter(i => i.categoryId === cat.id);
          return (
            <div key={cat.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
                    {cat.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                    <p className="text-xs text-slate-400">{items.length} référence(s) enregistrée(s)</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAdd(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Ajouter dans {cat.name}</span>
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                  Aucun article dans la section {cat.name}. Cliquez sur "+ Ajouter dans {cat.name}" pour commencer.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(item => {
                    const isAvailable = item.isAvailable !== false && item.available !== false;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 bg-slate-950 rounded-2xl border transition-all flex flex-col justify-between group ${
                          isAvailable
                            ? 'border-slate-800 hover:border-slate-700 shadow-sm'
                            : 'border-red-900/40 bg-red-950/10 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-sm text-white">{item.name}</h4>
                            <span className="font-black text-yellow-400 font-mono text-base whitespace-nowrap">
                              {formatPrice(item.price)}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {item.allergens?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {item.allergens.map((alg, aIdx) => (
                                <span key={aIdx} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                  {alg}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.modifierGroups?.some(g => g.id === 'cuisson') && (
                            <span className="inline-block mt-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              🔥 Cuisson au choix
                            </span>
                          )}
                        </div>

                        {/* Actions : Rupture de stock, Éditer, Supprimer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-4">
                          <button
                            onClick={() => toggleItemAvailability(item.id)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border transition-colors ${
                              isAvailable
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                            }`}
                            title="Changer la disponibilité"
                          >
                            {isAvailable ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>En stock</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Épuisé</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-yellow-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Modifier ce plat"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Retirer ce plat de la carte"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal d'Ajout / Modification */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        itemToEdit={itemToEdit}
        categories={menuCategories}
        defaultCategory={defaultCategoryForModal}
        currency={currency}
      />

      {/* Modal de Création de Catégorie */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <h3 className="font-bold text-base mb-1 flex items-center gap-2">
              <span className="text-xl">📁</span>
              <span>Ajouter une catégorie</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Créez une nouvelle famille de plats (ex: Pizzas, Vins, Cocktails...)
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom de la catégorie * :</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Ex: Pâtes & Pizzas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Icône / Émoji :</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['🥗', '🥩', '🍷', '🍰', '🍕', '🍔', '🍺', '☕', '🍲', '🍣', '🍹'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatIcon(emoji)}
                      className={`text-lg p-1.5 rounded-xl border transition-all ${
                        newCatIcon === emoji
                          ? 'bg-yellow-500/20 border-yellow-500 scale-110'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-yellow-500/20"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmation de Suppression */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-1">Retirer cet article ?</h3>
            <p className="text-xs text-slate-400 mb-5">
              Êtes-vous sûr de vouloir supprimer <strong className="text-white">« {itemToDelete.name} »</strong> de la carte ?
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
