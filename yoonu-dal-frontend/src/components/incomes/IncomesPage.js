// src/components/incomes/IncomesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';

const SOURCES = [
  { value: 'Salaire', label: 'Salaire', icon: '💼', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'Freelance', label: 'Freelance', icon: '💻', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: 'Business', label: 'Business', icon: '🏢', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'Investissement', label: 'Investissement', icon: '📈', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'Location', label: 'Location', icon: '🏠', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { value: 'Pension', label: 'Pension', icon: '👴', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { value: 'Allocation', label: 'Allocation', icon: '🎁', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { value: 'Prime', label: 'Prime', icon: '⭐', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { value: 'Cadeau', label: 'Cadeau', icon: '🎁', color: 'bg-red-50 border-red-200 text-red-700' },
  { value: 'remboursement_recu', label: 'Remboursement reçu', icon: '🤝', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { value: 'Autre', label: 'Autre', icon: '💰', color: 'bg-gray-50 border-gray-200 text-gray-700' }
];

const MONTHS_FR_SEL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const IncomesPageV2 = ({ toast, onNavigate }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [filterSource, setFilterSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [incomes, setIncomes] = useState([]);

  const emptyForm = () => ({
    amount: '', source: '', description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [form, setForm] = useState(emptyForm);

  const monthOptions = (() => {
    const options = [];
    const nowD = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      options.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${MONTHS_FR_SEL[d.getMonth()]} ${d.getFullYear()}`,
        isCurrent: i === 0,
      });
    }
    return options;
  })();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].key);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const isCurrentMonth = selectedMonth === monthOptions[0].key;
  const selectedOption = monthOptions.find(m => m.key === selectedMonth) || monthOptions[0];

  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) =>
    new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const loadIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const monthParam = isCurrentMonth ? '' : `?month=${selectedMonth}`;
      const response = await API.get(`/incomes/${monthParam}`);
      const incomesList = response.data?.incomes || [];
      setIncomes(incomesList);
    } catch (error) {
      toast?.showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [toast, selectedMonth, isCurrentMonth]);

  useEffect(() => { loadIncomes(); }, [loadIncomes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.source || !form.description) {
      toast?.showError('Remplis tous les champs obligatoires');
      return;
    }
    try {
      const payload = {
        amount: parseFloat(form.amount),
        source: form.source,
        description: form.description,
        date: form.date
      };
      if (editingIncome) {
        await API.put(`/incomes/${editingIncome.id}/`, payload);
        toast?.showSuccess('Revenu modifié avec succès');
      } else {
        await API.post('/incomes/', payload);
        toast?.showSuccess('Revenu ajouté avec succès');
      }
      setShowModal(false);
      setEditingIncome(null);
      setForm(emptyForm());
      loadIncomes();
    } catch (error) {
      toast?.showError('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/incomes/${id}/`);
      toast?.showSuccess('Revenu supprimé');
      setConfirmDeleteId(null);
      loadIncomes();
    } catch (error) {
      toast?.showError('Erreur lors de la suppression');
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setForm({
      amount: income.amount, source: income.source,
      description: income.description, date: income.date
    });
    setShowModal(true);
  };

  const monthlyIncomes = incomes.filter(inc => inc.date && inc.date.startsWith(selectedMonth));
  const totalIncomes = monthlyIncomes.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

  const sourceStats = SOURCES.map(src => {
    const total = monthlyIncomes.filter(inc => inc.source === src.value).reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
    return { ...src, total, count: monthlyIncomes.filter(inc => inc.source === src.value).length };
  }).filter(s => s.total > 0);

  const filteredIncomes = monthlyIncomes.filter(inc => {
    const matchesSource = filterSource === 'all' || inc.source === filterSource;
    const matchesSearch = !searchQuery ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesSearch;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const getSourceInfo = (source) => SOURCES.find(s => s.value === source) || SOURCES[SOURCES.length - 1];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">💰 Mes revenus</h1>
            <div className="relative">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-green-600"
              >
                <span>{selectedOption.label}</span>
                <span className={`transition-transform text-[10px] ${showMonthPicker ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showMonthPicker && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMonthPicker(false)} />
                  <div className="absolute top-6 left-0 z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-[170px]">
                    {monthOptions.map(m => (
                      <button
                        key={m.key}
                        onClick={() => { setSelectedMonth(m.key); setShowMonthPicker(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          m.key === selectedMonth ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {m.label}{m.isCurrent ? ' (en cours)' : ''}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => { setEditingIncome(null); setForm(emptyForm()); setShowModal(true); }}
            className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md"
          >
            +
          </button>
        </div>

        {/* Carte résumé */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-5 mb-4 text-white shadow-xl">
          <p className="text-sm opacity-80 mb-1">Total des revenus ce mois</p>
          <p className="text-3xl font-bold mb-3">{formatCurrencyFull(totalIncomes)}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] opacity-75">Nombre de revenus</p>
              <p className="text-sm font-bold">{monthlyIncomes.length}</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] opacity-75">Sources actives</p>
              <p className="text-sm font-bold">{sourceStats.length}</p>
            </div>
          </div>
        </div>

        {/* Répartition par source */}
        {sourceStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-3">📊 Répartition par source</h2>
            <div className="space-y-3">
              {sourceStats.map(src => {
                const percentage = (src.total / totalIncomes) * 100;
                return (
                  <div key={src.value}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <span>{src.icon}</span> {src.label}
                      </span>
                      <span className="text-xs font-bold text-green-600">{formatCurrency(src.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recherche */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher un revenu..."
          className="w-full mb-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Filtres sources */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterSource('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterSource === 'all' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            Toutes
          </button>
          {sourceStats.slice(0, 5).map(src => (
            <button
              key={src.value}
              onClick={() => setFilterSource(src.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterSource === src.value ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {src.icon} {src.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filteredIncomes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-sm text-gray-500 mb-4">
              {incomes.length === 0 ? 'Aucun revenu enregistré' : 'Aucun résultat'}
            </p>
            {incomes.length === 0 && (
              <button
                onClick={() => { setEditingIncome(null); setForm(emptyForm()); setShowModal(true); }}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Ajouter mon premier revenu
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-50">
              {filteredIncomes.map((income) => {
                const srcInfo = getSourceInfo(income.source);
                const isExpanded = expandedId === income.id;
                return (
                  <div key={income.id}>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${srcInfo.color} border flex items-center justify-center text-lg flex-shrink-0`}>
                          {srcInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{income.description}</p>
                          <p className="text-[11px] text-gray-400">{srcInfo.label} · {formatDate(income.date)}</p>
                        </div>
                        <p className="text-sm font-bold text-green-600 flex-shrink-0">+{formatCurrency(income.amount)}</p>
                        <button onClick={() => setExpandedId(isExpanded ? null : income.id)} className="text-gray-300 text-xs flex-shrink-0">
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                          <button onClick={() => handleEdit(income)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-xl text-xs font-bold">
                            ✏️ Modifier
                          </button>
                          <button onClick={() => setConfirmDeleteId(income.id)} className="flex-1 bg-red-50 text-red-700 py-2 rounded-xl text-xs font-bold">
                            🗑️ Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet — Add/Edit */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setShowModal(false); setEditingIncome(null); }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  {editingIncome ? '✏️ Modifier le revenu' : '➕ Nouveau revenu'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingIncome(null); }} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Montant</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({...form, amount: e.target.value})}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({...form, source: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {SOURCES.map(src => (
                    <option key={src.value} value={src.value}>{src.icon} {src.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Ex: Salaire mars"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingIncome(null); }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-semibold text-sm"
                >
                  {editingIncome ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Confirmation suppression */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🗑️</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Supprimer ce revenu ?</h2>
              <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm">
                  Annuler
                </button>
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl font-semibold text-sm hover:bg-red-700 transition-all">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default IncomesPageV2;
