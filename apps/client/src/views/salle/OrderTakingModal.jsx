import React, { useState } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { X, Send, Plus, Minus, Trash2, Receipt, CheckCircle, BellRing, ChevronRight, ArrowLeft, ShoppingBag } from 'lucide-react';

export const OrderTakingModal = ({ table, onClose, onOpenBilling }) => {
  const { menuCategories, menuItems, createOrder, activeAlarms, acknowledgeOrder, tickets, formatPrice } = useRestobook();
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]?.id || 'cat_entrees');
  const [coursePhase, setCoursePhase] = useState('main'); // 'direct' | 'starter' | 'main' | 'dessert'
  const [cartItems, setCartItems] = useState([]);
  const [activeModifiersItem, setActiveModifiersItem] = useState(null);
  const [tempModifiers, setTempModifiers] = useState([]);
  const [serverName, setServerName] = useState('Alexandre');
  const [mobileTab, setMobileTab] = useState('menu'); // 'menu' | 'cart'

  const isAlarming = activeAlarms.some(a => 
    a.tableId === table.id || 
    a.tableNumber === table.number || 
    String(a.tableNumber) === String(table.number) ||
    String(a.tableId) === String(table.id)
  ) || table.status === 'ready' || table.status === 'READY_TO_SERVE';

  // Filtrer les articles par catégorie sélectionnée
  const filteredItems = menuItems.filter(item => item.categoryId === selectedCategory);

  // Ajouter au panier
  const handleAddItem = (item) => {
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
  const totalItemCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Envoi de la commande vers la Cuisine via le Cloud
  const handleSendOrder = () => {
    if (cartItems.length === 0) return;

    createOrder({
      tableId: table.id,
      serverName,
      coursePhase,
      items: cartItems.map(it => ({
        menuItemId: it.id,
        itemId: it.id,
        name: it.name,
        price: it.unitPrice,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-5xl h-full sm:h-[88vh] bg-slate-900 sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* En-tête de la table */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 bg-slate-950 border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-sm sm:text-xl shadow-lg shrink-0 ${
              isAlarming ? 'bg-red-600 animate-pulse-fast text-white' : 'bg-yellow-500 text-slate-950'
            }`}>
              T{table.number}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-xl font-bold truncate">Table {table.number}</h2>
                <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-300 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                  {table.capacity} cvts
                </span>
                {isAlarming && (
                  <span className="flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                    <BellRing className="w-3 h-3" /> Passe prêt !
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">Serveur : {serverName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Acquitter l'alarme si prêt */}
            {isAlarming && (
              <button
                onClick={() => acknowledgeOrder(null, table.id || table.number)}
                className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all animate-bounce-short"
                title="Acquitter le plat au passe"
              >
                <CheckCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Acquitter passe</span>
              </button>
            )}

            {/* Facturation */}
            <button
              onClick={() => onOpenBilling(table)}
              className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-colors"
              title="Addition / Facturation"
            >
              <Receipt className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Addition</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Onglets mobile smartphone : Bascule Carte / Panier */}
        <div className="md:hidden flex bg-slate-950 p-1.5 border-b border-slate-800 gap-1.5 shrink-0">
          <button
            onClick={() => setMobileTab('menu')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'menu'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            <span>🍽️ Carte des Plats</span>
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'cart'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ticket ({totalItemCount})</span>
            {cartItems.length > 0 && (
              <span className="font-mono font-black text-[11px] bg-slate-950/20 px-1.5 py-0.5 rounded">
                {formatPrice(totalAmount)}
              </span>
            )}
          </button>
        </div>

        {/* Corps scindé : Plein écran ou Côte-à-côte */}
        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          {/* Colonne gauche : Catalogue de plats */}
          <div className={`flex-1 min-h-0 flex-col border-r border-slate-800 p-2.5 sm:p-4 overflow-hidden ${
            mobileTab === 'menu' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Sélecteur de temps de service (Phase) */}
            <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3 bg-slate-950 p-1 sm:p-1.5 rounded-2xl border border-slate-800 shrink-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 sm:px-2 hidden xs:inline">
                Phase :
              </span>
              {[
                { id: 'direct', label: '⚡ Direct' },
                { id: 'starter', label: '🥗 Entrées' },
                { id: 'main', label: '🥩 Plats' },
                { id: 'dessert', label: '🍰 Desserts' }
              ].map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setCoursePhase(phase.id)}
                  className={`flex-1 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
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
            <div 
              className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0"
              style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
            >
              {menuCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
            <div 
              className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pr-1 pt-1 pb-16 sm:pb-2 content-start"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              {filteredItems.map(item => {
                const isAvailable = item.isAvailable !== false && item.available !== false;
                const inCart = cartItems.find(ci => ci.id === item.id);

                return (
                  <button
                    key={item.id}
                    disabled={!isAvailable}
                    onClick={() => handleAddItem(item)}
                    className={`flex flex-col justify-between p-2.5 sm:p-3.5 border rounded-2xl text-left transition-all shadow-sm ${
                      isAvailable
                        ? 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-yellow-500/40 active:scale-[0.98] group'
                        : 'bg-red-950/10 border-red-900/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-yellow-400 transition-colors line-clamp-1">
                          {item.name}
                        </span>
                        {inCart && (
                          <span className="w-5 h-5 rounded-full bg-yellow-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 mt-0.5 sm:mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-800/80">
                      <span className="text-xs sm:text-sm font-extrabold text-yellow-400">
                        {formatPrice(item.price)}
                      </span>
                      {isAvailable && (
                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-yellow-500 group-hover:text-slate-950 flex items-center justify-center font-bold text-xs transition-colors">
                          +
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Barre flottante mobile : Voir le ticket quand des articles sont ajoutés */}
            {cartItems.length > 0 && (
              <div
                onClick={() => setMobileTab('cart')}
                className="md:hidden mt-2 p-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 rounded-2xl shadow-xl flex items-center justify-between font-black shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 text-yellow-400 px-2.5 py-1 rounded-xl text-xs font-mono">
                    {totalItemCount} {totalItemCount > 1 ? 'articles' : 'article'}
                  </span>
                  <span className="text-sm font-extrabold">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs uppercase tracking-wider">
                  <span>Voir le ticket</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite : Bon / Ticket en cours */}
          <div className={`w-full md:w-88 lg:w-96 min-h-0 flex-col bg-slate-950/90 p-3 sm:p-4 ${
            mobileTab === 'cart' ? 'flex' : 'hidden md:flex'
          }`}>
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileTab('menu')}
                  className="md:hidden p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 flex items-center gap-1 text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Plats</span>
                </button>
                <h3 className="font-bold text-xs sm:text-sm text-slate-200">Ticket en cours</h3>
              </div>
              <span className="text-xs text-slate-400">{totalItemCount} article(s)</span>
            </div>

            {/* Liste des articles du panier */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto py-2 sm:py-3 space-y-2 pr-1"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-2">
                    🍽️
                  </div>
                  <p className="text-xs">Touchez des articles pour composer la commande</p>
                  <button
                    onClick={() => setMobileTab('menu')}
                    className="md:hidden mt-3 px-4 py-2 bg-yellow-500 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Parcourir la carte
                  </button>
                </div>
              ) : (
                cartItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-1.5"
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
                          className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{it.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total et action d'envoi vers la Cuisine */}
            <div className="pt-2 sm:pt-3 border-t border-slate-800 space-y-2 sm:space-y-3 shrink-0">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-xl sm:text-2xl font-black text-white">{formatPrice(totalAmount)}</span>
              </div>

              <button
                disabled={cartItems.length === 0}
                onClick={handleSendOrder}
                className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl shadow-xl shadow-yellow-500/20 text-xs sm:text-sm tracking-wide transition-all transform active:scale-95"
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
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <h3 className="text-base sm:text-lg font-bold mb-1">{activeModifiersItem.name}</h3>
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
                              setTempModifiers([opt]);
                            } else {
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
