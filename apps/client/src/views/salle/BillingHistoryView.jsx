import React, { useState, useMemo } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { 
  Receipt, 
  Download, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  Banknote, 
  Ticket, 
  Trash2, 
  Eye, 
  Printer, 
  X, 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const BillingHistoryView = () => {
  const { invoices, clearInvoices, formatPrice, currency, restaurantName } = useRestobook();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all'); // 'all' | 'card' | 'cash' | 'voucher'
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all' | 'today' | 'week'
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Filtrage des factures
  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter(inv => {
      // Filtre méthode de paiement
      if (selectedMethod !== 'all' && inv.paymentMethod !== selectedMethod) {
        return false;
      }

      // Filtre période
      if (selectedPeriod === 'today') {
        const invDate = new Date(inv.timestamp).toDateString();
        const today = new Date().toDateString();
        if (invDate !== today) return false;
      } else if (selectedPeriod === 'week') {
        const invTime = new Date(inv.timestamp).getTime();
        const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
        if (invTime < weekAgo) return false;
      }

      // Filtre recherche textuelle
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchNumber = (inv.invoiceNumber || inv.id || '').toLowerCase().includes(query);
        const matchTable = `table ${inv.tableNumber || ''}`.toLowerCase().includes(query);
        const matchServer = (inv.serverName || '').toLowerCase().includes(query);
        const matchItems = (inv.items || []).some(it => (it.name || '').toLowerCase().includes(query));
        return matchNumber || matchTable || matchServer || matchItems;
      }

      return true;
    });
  }, [invoices, selectedMethod, selectedPeriod, searchTerm]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const count = filteredInvoices.length;
    const averageTicket = count > 0 ? totalRevenue / count : 0;
    const cardTotal = filteredInvoices
      .filter(i => i.paymentMethod === 'card')
      .reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const cashTotal = filteredInvoices
      .filter(i => i.paymentMethod === 'cash')
      .reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const voucherTotal = filteredInvoices
      .filter(i => i.paymentMethod === 'voucher')
      .reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    return { totalRevenue, count, averageTicket, cardTotal, cashTotal, voucherTotal };
  }, [filteredInvoices]);

  // Exportation CSV formaté pour Excel (BOM UTF-8 + séparateur point-virgule)
  const handleExportCSV = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      alert("Aucune facture à exporter.");
      return;
    }

    const BOM = '\uFEFF';
    const headers = [
      'N° Facture',
      'Date & Heure',
      'Table',
      'Serveur',
      'Moyen de Paiement',
      'Couverts/Parts',
      'Détail des Articles',
      'Montant HT',
      'Montant TVA (10%)',
      'Montant TTC',
      'Devise'
    ];

    const rows = filteredInvoices.map(inv => {
      const itemsSummary = (inv.items || [])
        .map(it => `${it.quantity}x ${it.name} (${Number(it.unitPrice || 0).toFixed(2)} ${inv.currency || currency?.symbol || '€'})`)
        .join(' + ');

      const ht = (inv.netAmount || (inv.totalAmount / 1.10)).toFixed(2).replace('.', ',');
      const tva = (inv.vatAmount || (inv.totalAmount - (inv.totalAmount / 1.10))).toFixed(2).replace('.', ',');
      const ttc = (inv.totalAmount || 0).toFixed(2).replace('.', ',');

      return [
        `"${inv.invoiceNumber || inv.id}"`,
        `"${inv.dateFormatted || inv.timestamp}"`,
        `"Table ${inv.tableNumber || '?'}"`,
        `"${inv.serverName || 'Service'}"`,
        `"${inv.paymentMethodLabel || inv.paymentMethod || 'CB'}"`,
        `"${inv.splitCount || 1}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${ht}"`,
        `"${tva}"`,
        `"${ttc}"`,
        `"${inv.currency || currency?.symbol || '€'}"`
      ].join(';');
    });

    const csvContent = BOM + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateFile = new Date().toISOString().slice(0, 10);
    link.download = `Factures_Restobook_${restaurantName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateFile}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exportation au format XML Excel natif (.xls)
  const handleExportExcelXML = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      alert("Aucune facture à exporter.");
      return;
    }

    const curSym = currency?.symbol || '€';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="#,##0.00\\ &quot;${curSym}&quot;"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Facturation">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">N° Facture</Data></Cell>
    <Cell><Data ss:Type="String">Date &amp; Heure</Data></Cell>
    <Cell><Data ss:Type="String">Table</Data></Cell>
    <Cell><Data ss:Type="String">Serveur</Data></Cell>
    <Cell><Data ss:Type="String">Paiement</Data></Cell>
    <Cell><Data ss:Type="String">Détail des Articles</Data></Cell>
    <Cell><Data ss:Type="String">Montant HT</Data></Cell>
    <Cell><Data ss:Type="String">TVA (10%)</Data></Cell>
    <Cell><Data ss:Type="String">Total TTC</Data></Cell>
   </Row>
   ${filteredInvoices.map(inv => {
     const itemsStr = (inv.items || []).map(it => `${it.quantity}x ${it.name}`).join(', ');
     const ht = (inv.netAmount || (inv.totalAmount / 1.10)).toFixed(2);
     const tva = (inv.vatAmount || (inv.totalAmount - (inv.totalAmount / 1.10))).toFixed(2);
     const ttc = (inv.totalAmount || 0).toFixed(2);
     return `
   <Row>
    <Cell><Data ss:Type="String">${inv.invoiceNumber || inv.id}</Data></Cell>
    <Cell><Data ss:Type="String">${inv.dateFormatted || inv.timestamp}</Data></Cell>
    <Cell><Data ss:Type="String">Table ${inv.tableNumber || '?'}</Data></Cell>
    <Cell><Data ss:Type="String">${inv.serverName || 'Service'}</Data></Cell>
    <Cell><Data ss:Type="String">${inv.paymentMethodLabel || 'CB'}</Data></Cell>
    <Cell><Data ss:Type="String">${itemsStr.replace(/&/g, '&amp;')}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${ht}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${tva}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${ttc}</Data></Cell>
   </Row>`;
   }).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateFile = new Date().toISOString().slice(0, 10);
    link.download = `Journal_Factures_${restaurantName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateFile}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="flex-1 min-h-0 w-full h-full flex flex-col p-3 sm:p-6 bg-slate-950 overflow-y-auto pb-28 sm:pb-8"
      style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >
      {/* En-tête : Titre & Boutons d'export Excel */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-800 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-yellow-400" />
            Historique de Facturation
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Journal complet des additions encaissées & exportation comptable sous Excel
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton Export Excel CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            title="Télécharger le fichier compatible Excel (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exporter sous Excel (.csv)</span>
          </button>

          {/* Bouton Export Excel XML */}
          <button
            onClick={handleExportExcelXML}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs border border-slate-700 transition-colors"
            title="Exporter classeur Excel formaté (.xls)"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Format .xls</span>
          </button>

          {/* Bouton Réinitialiser l'historique */}
          {invoices && invoices.length > 0 && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 bg-red-950/40 hover:bg-red-900/50 text-red-300 font-bold rounded-2xl text-xs border border-red-800/50 transition-colors"
              title="Vider l'historique des factures"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Effacer</span>
            </button>
          )}
        </div>
      </div>

      {/* Cartes KPI Statistiques */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-3.5 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Chiffre d'Affaires</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {formatPrice(stats.totalRevenue)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Montant total TTC encaissé</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Additions clôturées</span>
            <ShoppingBag className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white font-mono">
            {stats.count}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Factures générées</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Panier Moyen</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
            {formatPrice(stats.averageTicket)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Moyenne par table</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="text-slate-400 text-xs mb-1">Répartition Paiements</div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-cyan-400" /> CB :</span>
              <strong className="text-white">{formatPrice(stats.cardTotal)}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1"><Banknote className="w-3 h-3 text-emerald-400" /> Espèces :</span>
              <strong className="text-white">{formatPrice(stats.cashTotal)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils & Filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par N° facture, table, serveur, plat..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtres de méthode et période */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtre Méthode */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'card', label: '💳 CB' },
              { id: 'cash', label: '💵 Espèces' },
              { id: 'voucher', label: '🎟️ Titres' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedMethod === m.id
                    ? 'bg-yellow-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Filtre Période */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {[
              { id: 'all', label: 'Toutes dates' },
              { id: 'today', label: "Aujourd'hui" },
              { id: 'week', label: '7 jours' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-yellow-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des factures */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-slate-500 text-xs">
          <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="font-semibold text-slate-400">Aucune facture ne correspond à votre sélection.</p>
          <p className="text-[11px] mt-1 text-slate-500">
            Les additions payées et libérées depuis le plan de table apparaîtront automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Tableau pour écrans moyens et grands */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">N° Facture</th>
                  <th className="py-3.5 px-4">Date & Heure</th>
                  <th className="py-3.5 px-4">Table</th>
                  <th className="py-3.5 px-4">Serveur</th>
                  <th className="py-3.5 px-4">Articles</th>
                  <th className="py-3.5 px-4">Paiement</th>
                  <th className="py-3.5 px-4 text-right">Total TTC</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => (
                  <tr 
                    key={inv.id || inv.invoiceNumber}
                    className="hover:bg-slate-850/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedInvoiceForDetail(inv)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-yellow-400">
                      {inv.invoiceNumber || inv.id}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {inv.dateFormatted || inv.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-white font-bold">
                        Table {inv.tableNumber || '?'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {inv.serverName || 'Service'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={(inv.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                      {(inv.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Consommations'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        inv.paymentMethod === 'card'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : inv.paymentMethod === 'cash'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {inv.paymentMethod === 'card' && <CreditCard className="w-3 h-3" />}
                        {inv.paymentMethod === 'cash' && <Banknote className="w-3 h-3" />}
                        {inv.paymentMethod === 'voucher' && <Ticket className="w-3 h-3" />}
                        <span>{inv.paymentMethodLabel || 'Payé'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-white text-sm">
                      {formatPrice(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoiceForDetail(inv);
                        }}
                        className="p-1.5 text-slate-400 hover:text-yellow-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Voir le ticket de caisse"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes pour smartphones */}
          <div className="sm:hidden divide-y divide-slate-800">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id || inv.invoiceNumber}
                onClick={() => setSelectedInvoiceForDetail(inv)}
                className="p-3.5 hover:bg-slate-850/50 active:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div>
                    <span className="font-mono font-bold text-xs text-yellow-400 block">
                      {inv.invoiceNumber || inv.id}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {inv.dateFormatted || inv.timestamp} • Table {inv.tableNumber || '?'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-sm text-white">
                    {formatPrice(inv.totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
                  <span className="truncate max-w-[200px]">
                    {(inv.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Consommations'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 shrink-0 font-medium">
                    {inv.paymentMethodLabel || 'Payé'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Détail Facture / Ticket Thermique */}
      {selectedInvoiceForDetail && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setSelectedInvoiceForDetail(null)}
        >
          <div 
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedInvoiceForDetail(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ticket de caisse thermique simulé */}
            <div className="text-center pb-4 border-b border-dashed border-slate-700 mb-4">
              <span className="text-2xl block mb-1">🍽️</span>
              <h3 className="font-bold text-base uppercase tracking-wider">{restaurantName}</h3>
              <p className="text-[11px] text-slate-400">Ticket d'Addition & Justificatif de Vente</p>
              <p className="font-mono text-xs font-bold text-yellow-400 mt-2">
                {selectedInvoiceForDetail.invoiceNumber || selectedInvoiceForDetail.id}
              </p>
              <p className="text-[10px] text-slate-400">
                {selectedInvoiceForDetail.dateFormatted || selectedInvoiceForDetail.timestamp}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                Table : <strong>{selectedInvoiceForDetail.tableNumber}</strong> • Serveur : <strong>{selectedInvoiceForDetail.serverName || 'Salle'}</strong>
              </p>
            </div>

            {/* Articles */}
            <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1 mb-4">
              {(selectedInvoiceForDetail.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-300">
                    {it.quantity}x {it.name}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {formatPrice(it.total || ((it.unitPrice || 0) * (it.quantity || 1)))}
                  </span>
                </div>
              ))}
            </div>

            {/* Totaux & Taxes */}
            <div className="border-t border-dashed border-slate-700 pt-3 space-y-1 text-xs mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Total HT :</span>
                <span className="font-mono">
                  {formatPrice(selectedInvoiceForDetail.netAmount || (selectedInvoiceForDetail.totalAmount / 1.10))}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TVA (10%) :</span>
                <span className="font-mono">
                  {formatPrice(selectedInvoiceForDetail.vatAmount || (selectedInvoiceForDetail.totalAmount - (selectedInvoiceForDetail.totalAmount / 1.10)))}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800">
                <span>TOTAL TTC :</span>
                <span className="font-mono text-yellow-400">
                  {formatPrice(selectedInvoiceForDetail.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-300 pt-1">
                <span>Règlement :</span>
                <span className="font-bold">{selectedInvoiceForDetail.paymentMethodLabel || 'CB'}</span>
              </div>
              {selectedInvoiceForDetail.cashGiven && (
                <>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Espèces reçues :</span>
                    <span className="font-mono">{formatPrice(selectedInvoiceForDetail.cashGiven)}</span>
                  </div>
                  {selectedInvoiceForDetail.changeReturned > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-400 font-bold">
                      <span>Monnaie rendue :</span>
                      <span className="font-mono">{formatPrice(selectedInvoiceForDetail.changeReturned)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-[10px] text-center text-slate-500 italic mb-4">
              Merci de votre visite et à très bientôt !
            </p>

            {/* Actions du modal */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer reçu</span>
              </button>
              <button
                onClick={() => setSelectedInvoiceForDetail(null)}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation de Réinitialisation de l'historique */}
      {isResetConfirmOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-1">Effacer l'historique ?</h3>
            <p className="text-xs text-slate-400 mb-5">
              Toutes les factures enregistrées pour ce restaurant seront supprimées. Cette action est irréversible.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  clearInvoices();
                  setIsResetConfirmOpen(false);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20"
              >
                Oui, effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
