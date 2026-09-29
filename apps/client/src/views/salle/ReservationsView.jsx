import React, { useState } from 'react';
import { useRestobook } from '../../context/RestobookContext';
import { Calendar, Clock, Users, Phone, Plus, Check, UserCheck, X } from 'lucide-react';

export const ReservationsView = () => {
  const { reservations, tables, addReservation, updateTableLayout } = useRestobook();
  const [selectedService, setSelectedService] = useState('soir');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    guests: 2,
    time: '20:00',
    service: 'soir',
    tableId: tables[0]?.id || '',
    notes: ''
  });

  const filteredReservations = reservations.filter(r => r.service === selectedService);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) return;

    addReservation(formData);
    setIsModalOpen(false);
    setFormData({
      customerName: '',
      phone: '',
      guests: 2,
      time: selectedService === 'midi' ? '12:30' : '20:00',
      service: selectedService,
      tableId: tables[0]?.id || '',
      notes: ''
    });
  };

  const handleSeatGuests = (reservation) => {
    const updated = tables.map(t => {
      if (t.id === reservation.tableId) {
        return { ...t, status: 'occupied' };
      }
      return t;
    });
    updateTableLayout(updated);
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 bg-slate-950 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-800 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-400" />
            Cahier des Réservations
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400">Gestion des services et attribution des tables</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Sélecteur de service */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setSelectedService('midi')}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedService === 'midi'
                  ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ☀️ Midi
            </button>
            <button
              onClick={() => setSelectedService('soir')}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedService === 'soir'
                  ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌙 Soir
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-yellow-500/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> <span>Nouvelle Résa</span>
          </button>
        </div>
      </div>

      {/* Liste des réservations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReservations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Aucune réservation enregistrée pour ce service.
          </div>
        ) : (
          filteredReservations.map(res => {
            const assignedTable = tables.find(t => t.id === res.tableId);
            return (
              <div
                key={res.id}
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-base text-white">{res.customerName}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{res.phone || 'Non renseigné'}</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 font-mono text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-xl text-yellow-400">
                      <Clock className="w-3.5 h-3.5" /> {res.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 py-2 px-3 bg-slate-950/70 rounded-xl border border-slate-800/80 mb-3">
                    <span className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                      <Users className="w-3.5 h-3.5 text-yellow-400" />
                      {res.guests} couverts
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-300 font-semibold">
                      Table : <strong className="text-white font-black">T{assignedTable?.number || '?'}</strong>
                    </span>
                  </div>

                  {res.notes && (
                    <p className="text-xs text-slate-400 italic line-clamp-2 mb-3">
                      « {res.notes} »
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSeatGuests(res)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 font-bold rounded-xl text-xs transition-colors"
                >
                  <UserCheck className="w-4 h-4" /> Installer à table
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal d'ajout de réservation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Ajouter une réservation</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Nom du client :</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Ex: Martin Sophie"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Téléphone :</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Couverts :</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.guests}
                    onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Heure :</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    placeholder="20:00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Table assignée :</label>
                  <select
                    value={formData.tableId}
                    onChange={e => setFormData({ ...formData, tableId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                  >
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        Table {t.number} ({t.capacity} pl.)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Remarques particulières :</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Chaise haute, terrasse souhaitée..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-yellow-500/20 transition-all mt-2"
              >
                Confirmer la réservation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
