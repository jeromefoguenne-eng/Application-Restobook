import React, { useState } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { X, Send, Plus, Minus, Trash2, Receipt, CheckCircle, BellRing } from 'lucide-react';

export const OrderTakingModal = ({ table, onClose, onOpenBilling }) => {
  const { menuCategories, menuItems, createOrder, activeAlarms, acknowledgeOrder, tickets, formatPrice } = useRestobook();
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'cat_entrees');
  const [coursePhase, setCoursePhase] = useState('main'); // 'direct' | 'starter' | 'main' | 'dessert'
  const [cartItems, setCartItems] = useState([]);
  const [activeModifiersItem, setActiveModifiersItem] = useState(null);
  const [tempModifiers, setTempModifiers] = useState([]);
  const [serverName, setServerName] = useState('Alexandre');

  const isAlarming = activeAlarms.includes(table.id);
  const tableTickets = tickets.filter(t => t.tableId === table.id);
  const [mobileTab, setMobileTab] = useState('menu'); // 'menu' | 'cart'

  // Filtrer les articles par catégorie sélectionnée
  const filteredItems = menuItems.filter(item => item.categoryId === selectedCategory);

  // Ajouter au panier
  const handleAddItem = (item) => {
    // Si l'article a des groupes de modificateurs (ex: cuisson), ouvrir le sélecteur
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setActiveModifiersItem(item);
      setTempModifiers([]);
      return;
    }

    addToCartDirect(item, []);
  };

  const addToCartDirect = (item, modifiers = []) => {
    const existingIndex = cartItems.findIndex(
      ci => ci.id === item.id && JSON.stringify(ci.selectedModifiers) === JSON.stringify(modifiers)
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          id: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          selectedModifiers: modifiers,
          phase: coursePhase,
          customNote: ''
        }
      ]);
    }
  };

  const confirmModifiers = () => {
    if (activeModifiersItem) {
      addToCartDirect(activeModifiersItem, tempModifiers);
      setActiveModifiersItem(null);
      setTempModifiers([]);
    }
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cartItems];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCartItems(updated);
  };

  const totalAmount = cartItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);

  // Envoi de la commande vers la Cuisine via le Cloud
  const handleSendOrder = () => {
    if (cartItems.length === 0) return;

    createOrder({
      tableId: table.id,
      serverName,
      coursePhase,
      items: cartItems.map(it => ({
        menuItemId: it.id,
        name: it.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        phase: it.phase,
        selectedModifiers: it.selectedModifiers,
        customKitchenNote: it.customNote
      }))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* En-tête de la table */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
              isAlarming ? 'bg-red-600 animate-pulse-fast text-white' : 'bg-yellow-500 text-slate-950'
            }`}>
              T{table.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Commande Table {table.number}</h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  {table.capacity} couverts
                </span>
                {isAlarming && (
                  <span className="flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                    <BellRing className="w-3.5 h-3.5" /> Plats prêts au passe !
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Serveur : {serverName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Acquitter l'alarme si prêt */}
            {isAlarming && (
              <button
                onClick={() => acknowledgeOrder(null, table.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all animate-bounce-short"
              >
                <CheckCircle className="w-4 h-4" /> Acquitter le passe
              </button>
            )}

            {/* Facturation si commandes existantes */}
            <button
              onClick={() => onOpenBilling(table)}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-colors"
            >
              <Receipt className="w-4 h-4" /> Facturation / Note
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Onglets mobile smartphone : Bascule Carte / Panier */}
        <div className="md:hidden flex bg-slate-950 p-2 border-b border-slate-800 gap-2 shrink-0">
          <button
            onClick={() => setMobileTab('menu')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mobileTab === 'menu'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            🍽️ Carte des Plats
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'cart'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            <span>🛒 Ticket ({cartItems.length})</span>
            {cartItems.length > 0 && (
              <span className="font-mono font-black text-[11px] bg-slate-950/20 px-1.5 py-0.5 rounded">
                {formatPrice(totalAmount)}
              </span>
            )}
          </button>
        </div>

        {/* Corps scindé : Plein écran ou Côte-à-côte */}
        <div className="flex-1 flex overflow-hidden">
          {/* Colonne gauche : Catalogue de plats */}
          <div className={`flex-1 flex-col border-r border-slate-800 p-4 overflow-hidden ${
            mobileTab === 'menu' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Sélecteur de temps de service (Phase) */}
            <div className="flex items-center gap-2 mb-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Envoi :</span>
              {[
                { id: 'direct', label: '⚡ Direct' },
                { id: 'starter', label: '🥗 Entrées' },
                { id: 'main', label: '🥩 Plats' },
                { id: 'dessert', label: '🍰 Desserts' }
              ].map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setCoursePhase(phase.id)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    coursePhase === phase.id
                      ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {phase.label}
                </button>
              ))}
            </div>

            {/* Onglets des catégories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {menuCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-slate-800 text-yellow-400 border border-yellow-500/40'
                      : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Grille des articles du menu */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 pr-1 pt-2">
              {filteredItems.map(item => {
                const isAvailable = item.isAvailable !== false;
                return (
                  <button
                    key={item.id}
                    disabled={!isAvailable}
                    onClick={() => handleAddItem(item)}
                    className={`flex flex-col justify-between p-3.5 border rounded-2xl text-left transition-all shadow-sm ${
                      isAvailable
                        ? 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-yellow-500/40 active:scale-[0.98] group'
                        : 'bg-red-950/10 border-red-900/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className={`text-sm font-bold line-clamp-2 ${isAvailable ? 'text-white group-hover:text-yellow-400' : 'text-slate-400 line-through'}`}>
                          {item.name}
                        </h4>
                        {!isAvailable && (
                          <span className="text-[9px] bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                            Épuisé
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                      <span className="text-sm font-extrabold text-yellow-400">
                        {formatPrice(item.price)}
                      </span>
                      {isAvailable && (
                        <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-yellow-500 group-hover:text-slate-950 flex items-center justify-center font-bold text-xs transition-colors">
                          +
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colonne droite : Bon / Ticket en cours */}
          <div className={`w-full md:w-88 lg:w-96 flex-col bg-slate-950/90 p-4 ${
            mobileTab === 'cart' ? 'flex' : 'hidden md:flex'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-200">Ticket en cours</h3>
              <span className="text-xs text-slate-400">{cartItems.length} article(s)</span>
            </div>

            {/* Liste des articles du panier */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-2">
                    🍽️
                  </div>
                  <p className="text-xs">Touchez des articles à gauche pour composer la commande</p>
                </div>
              ) : (
                cartItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white flex-1">{it.name}</span>
                      <span className="text-xs font-extrabold text-yellow-400 shrink-0">
                        {formatPrice(it.unitPrice * it.quantity)}
                      </span>
                    </div>

                    {it.selectedModifiers?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {it.selectedModifiers.map((mod, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded font-medium"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Phase : {it.phase}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{it.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total et action d'envoi vers la Cuisine */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Commande</span>
                <span className="text-2xl font-black text-white">{formatPrice(totalAmount)}</span>
              </div>

              <button
                disabled={cartItems.length === 0}
                onClick={handleSendOrder}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl shadow-xl shadow-yellow-500/20 text-sm tracking-wide transition-all transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>ENVOYER EN CUISINE (TABLE {table.number})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal sélecteur de modificateurs (ex: Cuisson, Sauces) */}
        {activeModifiersItem && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold mb-1">{activeModifiersItem.name}</h3>
              <p className="text-xs text-slate-400 mb-4">Sélectionnez les options de préparation :</p>

              {activeModifiersItem.modifierGroups?.map(group => (
                <div key={group.id} className="mb-4">
                  <label className="text-xs font-bold text-yellow-400 block mb-2">{group.name} :</label>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((opt, oIdx) => {
                      const isSelected = tempModifiers.includes(opt);
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            if (group.isRequired) {
                              // Choix unique
                              setTempModifiers([opt]);
                            } else {
                              // Multi choix
                              setTempModifiers(
                                isSelected
                                  ? tempModifiers.filter(m => m !== opt)
                                  : [...tempModifiers, opt]
                              );
                            }
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                            isSelected
                              ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-md shadow-yellow-500/20'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setActiveModifiersItem(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmModifiers}
                  className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-yellow-500/20"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
