// src/components/incomes/IncomesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';

// ==========================================
// INCOMES PAGE V2 - PREMIUM DESIGN
// Match ExpenseTracker quality
// ==========================================

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
  { value: 'Autre', label: 'Autre', icon: '💰', color: 'bg-gray-50 border-gray-200 text-gray-700' }
];

const IncomesPageV2 = ({ toast, onNavigate }) => {
  // États UI
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [filterSource, setFilterSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // États données
  const [incomes, setIncomes] = useState([]);

  // Formulaire
  const emptyForm = () => ({
    amount: '',
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [form, setForm] = useState(emptyForm);

  // ✅ Formatter FCFA CORRIGÉ
  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Charger données
  const loadIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/incomes/');
      const incomesList = response.data?.incomes || [];
      setIncomes(incomesList);
    } catch (error) {
      console.error('Erreur chargement revenus:', error);
      toast?.showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  // Actions
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
      console.error('Erreur:', error);
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
      console.error('Erreur suppression:', error);
      toast?.showError('Erreur lors de la suppression');
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setForm({
      amount: income.amount,
      source: income.source,
      description: income.description,
      date: income.date
    });
    setShowModal(true);
  };

  // Calculs
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyIncomes = incomes.filter(inc => inc.date && inc.date.startsWith(monthStr));
  
  const totalIncomes = monthlyIncomes.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
  
  // Stats par source
  const sourceStats = SOURCES.map(src => {
    const total = monthlyIncomes
      .filter(inc => inc.source === src.value)
      .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
    
    return {
      ...src,
      total,
      count: monthlyIncomes.filter(inc => inc.source === src.value).length
    };
  }).filter(s => s.total > 0);

  // Filtres
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                💰 Mes Revenus
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => { setEditingIncome(null); setForm(emptyForm()); setShowModal(true); }}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span className="text-xl">➕</span>
            <span>Nouveau revenu</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total des revenus</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalIncomes)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatCurrencyFull(totalIncomes)}</p>
          </div>

          {/* Count Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nombre de revenus</p>
            <p className="text-3xl font-bold text-gray-900">{monthlyIncomes.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sourceStats.length} sources actives</p>
          </div>
        </div>

        {/* Sources Stats */}
        {sourceStats.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">📊 Répartition par source</h3>
            <div className="space-y-3">
              {sourceStats.map(src => {
                const percentage = (src.total / totalIncomes) * 100;
                return (
                  <div key={src.value}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{src.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{src.label}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(src.total)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un revenu..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Source Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              <button
                onClick={() => setFilterSource('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filterSource === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes
              </button>
              {sourceStats.slice(0, 4).map(src => (
                <button
                  key={src.value}
                  onClick={() => setFilterSource(src.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filterSource === src.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {src.icon} {src.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Incomes List */}
        {filteredIncomes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">💸</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {incomes.length === 0 ? 'Aucun revenu enregistré' : 'Aucun résultat'}
            </h2>
            <p className="text-gray-600 mb-6">
              {incomes.length === 0 
                ? 'Commence à tracker tes revenus pour mieux gérer tes finances'
                : 'Essaie de modifier tes filtres de recherche'}
            </p>
            {incomes.length === 0 && (
              <button
                onClick={() => { setEditingIncome(null); setForm(emptyForm()); setShowModal(true); }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Ajouter mon premier revenu
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredIncomes.map((income) => {
                const srcInfo = getSourceInfo(income.source);
                const isExpanded = expandedId === income.id;
                
                return (
                  <div key={income.id} className="hover:bg-gray-50 transition-colors">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-xl ${srcInfo.color} border-2 flex items-center justify-center text-2xl flex-shrink-0`}>
                            {srcInfo.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{income.description}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${srcInfo.color}`}>
                                {srcInfo.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(income.date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-xl font-bold text-green-600">
                            +{formatCurrency(income.amount)}
                          </p>
                          
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : income.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Actions */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 animate-fadeIn">
                          <button
                            onClick={() => handleEdit(income)}
                            className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(income.id)}
                            className="flex-1 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
                          >
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

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingIncome ? '✏️ Modifier le revenu' : '➕ Nouveau revenu'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Montant */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({...form, amount: e.target.value})}
                  placeholder="150000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  required
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Source *
                </label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({...form, source: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {SOURCES.map(src => (
                    <option key={src.value} value={src.value}>
                      {src.icon} {src.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Ex: Salaire Mars 2026"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingIncome(null); }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {editingIncome ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-scaleIn">
            <div className="text-center">
              <div className="text-6xl mb-4">🗑️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Supprimer ce revenu ?
              </h2>
              <p className="text-gray-600 mb-6">
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default IncomesPageV2;
