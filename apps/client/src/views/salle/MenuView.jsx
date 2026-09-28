import React, { useState } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { MenuItemModal } from './MenuItemModal';
import { Utensils, Plus, Pencil, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const MenuView = () => {
  const {
    menuCategories,
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability
  } = useRestobook();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleOpenAdd = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleSave = (itemData) => {
    if (itemToEdit) {
      updateMenuItem(itemData);
    } else {
      addMenuItem(itemData);
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMenuItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-950 overflow-y-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-yellow-400" />
            Gestion de la Carte & des Prix
          </h2>
          <p className="text-xs text-slate-400">
            Ajoutez, modifiez ou retirez des plats et boissons en temps réel
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Plat ou une Boisson</span>
        </button>
      </div>

      {/* Catégories et articles */}
      <div className="space-y-6">
        {menuCategories.map(cat => {
          const items = menuItems.filter(i => i.categoryId === cat.id);
          return (
            <div key={cat.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-yellow-400 flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className="text-xs text-slate-500 font-normal">({items.length} références)</span>
                </h3>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Aucun article dans cette catégorie pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(item => {
                    const isAvailable = item.isAvailable !== false;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 bg-slate-950 rounded-2xl border transition-all flex flex-col justify-between group ${
                          isAvailable
                            ? 'border-slate-800 hover:border-slate-700'
                            : 'border-red-900/40 bg-red-950/10 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-sm text-white">{item.name}</h4>
                            <span className="font-black text-yellow-400 font-mono text-sm whitespace-nowrap">
                              {Number(item.price).toFixed(2)} €
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {item.allergens?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.allergens.map((alg, aIdx) => (
                                <span key={aIdx} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                  {alg}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.modifierGroups?.some(g => g.id === 'cuisson') && (
                            <span className="inline-block mt-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              🔥 Choix cuisson disponible
                            </span>
                          )}
                        </div>

                        {/* Barre d'actions sous chaque carte */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-3">
                          {/* Bascule de disponibilité rapide */}
                          <button
                            onClick={() => toggleItemAvailability(item.id)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg border transition-colors ${
                              isAvailable
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                            }`}
                            title="Cliquer pour changer la disponibilité"
                          >
                            {isAvailable ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>En stock</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rupture</span>
                              </>
                            )}
                          </button>

                          {/* Boutons Éditer & Supprimer */}
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
      />

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
