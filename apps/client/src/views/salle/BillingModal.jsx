import React, { useState } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { useAuth } from '../../context/AuthContext';
import { X, CreditCard, Banknote, Ticket, Check, Users, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';

export const BillingModal = ({ table, onClose }) => {
  const { tickets, closeTableBill, formatPrice, currency, restaurantName } = useRestobook();
  const { currentUser } = useAuth();
  const [splitCount, setSplitCount] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [cashGiven, setCashGiven] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Récupérer tous les tickets associés à cette table (par ID ou numéro de table)
  const tableTickets = tickets.filter(t => 
    t.tableId === table.id || 
    String(t.tableId) === String(table.id) || 
    (table.number && (t.tableNumber === table.number || String(t.tableNumber) === String(table.number)))
  );

  // Extraire tous les articles commandés pour la table
  let allItems = tableTickets.flatMap(t => t.items || []);

  // Sécurité supplémentaire : si la table a un currentOrder avec des articles
  if (allItems.length === 0 && table.currentOrder?.items?.length > 0) {
    allItems = [...table.currentOrder.items];
  }

  // Calcul dynamique et exact du montant total TTC
  const totalAmount = allItems.reduce((acc, it) => {
    const unitPrice = parseFloat(it.unitPrice ?? it.price ?? 0) || 0;
    const qty = parseInt(it.quantity, 10) || 1;
    return acc + (unitPrice * qty);
  }, 0);

  const splitAmount = splitCount > 0 ? totalAmount / splitCount : 0;
  const changeToReturn = cashGiven ? Math.max(0, parseFloat(cashGiven) - totalAmount) : 0;

  const handleCloseBill = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    const now = new Date();
    const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(now);

    const itemsSummary = allItems.length > 0
      ? allItems.map(it => {
          const unitPrice = parseFloat(it.unitPrice ?? it.price ?? 0) || 0;
          const qty = parseInt(it.quantity, 10) || 1;
          return {
            name: it.name || it.itemName || 'Consommation',
            quantity: qty,
            unitPrice,
            total: unitPrice * qty
          };
        })
      : [
          {
            name: `Addition Table ${table.number}`,
            quantity: 1,
            unitPrice: totalAmount,
            total: totalAmount
          }
        ];

    const invoiceData = {
      id: `FAC-${Date.now().toString().slice(-6)}`,
      invoiceNumber: `FAC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`,
      timestamp: now.toISOString(),
      dateFormatted,
      tableId: table.id,
      tableNumber: table.number,
      serverName: currentUser?.name || 'Service Salle',
      items: itemsSummary,
      totalAmount,
      currency: currency.symbol,
      currencyCode: currency.code,
      paymentMethod: selectedMethod,
      paymentMethodLabel: selectedMethod === 'card' ? 'Carte Bancaire' : (selectedMethod === 'cash' ? 'Espèces' : 'Titres Resto'),
      splitCount,
      cashGiven: selectedMethod === 'cash' ? (parseFloat(cashGiven) || totalAmount) : null,
      changeReturned: selectedMethod === 'cash' ? changeToReturn : null,
      vatRate: 10,
      vatAmount: totalAmount - (totalAmount / 1.10),
      netAmount: totalAmount / 1.10
    };

    setIsSuccess(true);
    setTimeout(() => {
      closeTableBill(table.id, invoiceData);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div 
        className="relative w-full max-w-lg h-full sm:h-auto max-h-none sm:max-h-[92vh] bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto text-slate-100 p-4 sm:p-6 flex flex-col justify-between"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        <div>
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-yellow-400 uppercase tracking-wider block">
                {restaurantName}
              </span>
              <h2 className="text-lg sm:text-xl font-bold">Addition Table {table.number}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Facturation & Encaissement</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Détail de l'addition */}
        <div 
          className="my-4 max-h-48 overflow-y-auto space-y-2 pr-1"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          {allItems.length > 0 ? (
            allItems.map((it, idx) => {
              const unitPrice = parseFloat(it.unitPrice ?? it.price ?? 0) || 0;
              const qty = parseInt(it.quantity, 10) || 1;
              return (
                <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-slate-200 font-medium">
                      {qty}x {it.name || it.itemName || 'Consommation'}
                    </span>
                    {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {it.selectedModifiers.join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="font-bold font-mono text-white">
                    {formatPrice(unitPrice * qty)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-slate-400 text-center py-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              Aucune commande active enregistrée sur cette table.
            </div>
          )}
        </div>

        {/* Total & Partage */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-400">Montant Total TTC</span>
            <span className="text-2xl font-black text-white font-mono">{formatPrice(totalAmount)}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Users className="w-4 h-4" />
              <span>Diviser par couverts :</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => setSplitCount(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    splitCount === num
                      ? 'bg-yellow-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {splitCount > 1 && (
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/80 text-yellow-400 font-bold">
              <span>Par personne ({splitCount} parts) :</span>
              <span className="font-mono text-base">{formatPrice(splitAmount)}</span>
            </div>
          )}
        </div>

        {/* Moyens de Paiement */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Moyen de paiement :
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card', label: 'Carte Bancaire', icon: CreditCard },
              { id: 'cash', label: 'Espèces', icon: Banknote },
              { id: 'voucher', label: 'Titres Resto', icon: Ticket }
            ].map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border text-xs font-bold transition-all ${
                    selectedMethod === m.id
                      ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-md shadow-yellow-500/20'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {selectedMethod === 'cash' && (
            <div className="pt-2">
              <label className="text-xs text-slate-400 block mb-1">
                Montant remis en espèces ({currency.symbol}) :
              </label>
              <input
                type="number"
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
                placeholder="Ex: 50"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-yellow-500 focus:outline-none"
              />
              {changeToReturn > 0 && (
                <p className="text-xs font-bold text-emerald-400 mt-1">
                  Rendu monnaie : {formatPrice(changeToReturn)}
                </p>
              )}
            </div>
          )}
        </div>

        </div>

        {/* Actions d'encaissement */}
        <div className="flex gap-2 pt-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={() => alert("Impression du ticket thermique ESC/POS simulée avec succès !")}
            className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors border border-slate-700 flex items-center justify-center shrink-0"
            title="Imprimer le ticket"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            disabled={isSuccess}
            onClick={handleCloseBill}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 text-xs sm:text-sm transition-all transform active:scale-95"
          >
            <Check className="w-5 h-5" />
            <span>
              {isSuccess 
                ? (totalAmount > 0 ? 'Table Clôturée !' : 'Table Libérée !') 
                : (totalAmount > 0 ? 'Encaisser & Libérer la Table' : 'Libérer la Table (0,00 €)')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
