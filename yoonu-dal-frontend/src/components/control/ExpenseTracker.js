import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import ReceiptScanner from '../ai/ReceiptScanner';
import { PremiumGate } from '../subscription/SubscriptionComponents';

// ==========================================
// EXPENSE TRACKER V2 - PREMIUM DESIGN
// Match Dashboard V6 quality
// ==========================================

const CATEGORY_TO_ENVELOPE = {
  'alimentation': 'essentiels',
  'transport': 'essentiels',
  'logement': 'essentiels',
  'santé': 'essentiels',
  'éducation': 'projets',
  'famille': 'projets',
  'spiritualité': 'projets',
  'loisirs': 'plaisirs',
  'vêtements': 'plaisirs',
  'autre': 'plaisirs'
};

const CATEGORIES = [
  { value: 'alimentation', label: 'Alimentation', icon: '🍽️', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'transport', label: 'Transport', icon: '🚗', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'logement', label: 'Logement', icon: '🏠', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: 'santé', label: 'Santé', icon: '💊', color: 'bg-red-50 border-red-200 text-red-700' },
  { value: 'éducation', label: 'Éducation', icon: '📚', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { value: 'famille', label: 'Famille', icon: '👨‍👩‍👧', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { value: 'spiritualité', label: 'Spiritualité', icon: '🕌', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { value: 'loisirs', label: 'Loisirs', icon: '🎬', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { value: 'vêtements', label: 'Vêtements', icon: '👔', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { value: 'autre', label: 'Autre', icon: '📝', color: 'bg-gray-50 border-gray-200 text-gray-700' }
];

const ENVELOPE_CONFIG = [
  { type: 'essentiels', name: 'Essentiels', icon: '🏠', color: 'from-red-500 to-red-400', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  { type: 'plaisirs', name: 'Plaisirs', icon: '🎉', color: 'from-blue-500 to-blue-400', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  { type: 'projets', name: 'Projets', icon: '💎', color: 'from-green-500 to-green-400', bgColor: 'bg-green-50', textColor: 'text-green-700' }
];

const ExpenseTrackerV2 = ({ toast, onNavigate, auth, user }) => {  // ✅ AJOUTER user
  // États UI
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // États données
  const [expenses, setExpenses] = useState([]);
  const [envelopes, setEnvelopes] = useState(
    ENVELOPE_CONFIG.map(e => ({ ...e, budget: 0, spent: 0 }))
  );
  const [pendingCount, setPendingCount] = useState(0);

  // Formulaire
  const emptyForm = () => ({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [form, setForm] = useState(emptyForm);

  // Charger données
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesRes, envelopesRes] = await Promise.all([
        API.get('/expenses/').catch(() => ({ data: [] })),
        API.get('/meta-envelopes/').catch(() => ({ data: [] }))
      ]);

      const expList = Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data.expenses || [];
      setExpenses(expList);

      const envList = Array.isArray(envelopesRes.data) ? envelopesRes.data : envelopesRes.data.envelopes || [];
      if (envList.length > 0) {
        setEnvelopes(envList.map(env => ({
          ...env,
          ...ENVELOPE_CONFIG.find(c => c.type === env.envelope_type) || {}
        })));
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast?.showError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helpers
  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
  };

  // Actions
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.amount || !form.category || !form.description) {
      toast?.showError('Remplis tous les champs obligatoires');
      return;
    }

    try {
      const payload = {
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        date: form.date
      };

      if (editingExpense) {
        await API.put(`/expenses/${editingExpense.id}/`, payload);
        toast?.showSuccess('Dépense modifiée avec succès');
      } else {
        await API.post('/expenses/', payload);
        toast?.showSuccess('Dépense ajoutée avec succès');
      }

      setShowModal(false);
      setEditingExpense(null);
      setForm(emptyForm());
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/expenses/${id}/`);
      toast?.showSuccess('Dépense supprimée');
      setConfirmDeleteId(null);
      loadData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast?.showError('Erreur lors de la suppression');
    }
  };
  // ✅✅✅ AJOUTER ICI ✅✅✅
      const handleReceiptScanned = (scannedExpense) => {
        console.log('📸 Dépense scannée:', scannedExpense);
        setShowScanner(false);
        loadData();
        toast?.showSuccess?.(`Dépense de ${scannedExpense.amount} FCFA ajoutée !`);
      };
      // ✅✅✅ FIN AJOUT ✅✅✅
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setForm({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date
    });
    setShowModal(true);
  };

  const handleScanResult = (data) => {
    setForm({
      amount: data.amount || '',
      category: data.category || '',
      description: data.description || '',
      date: data.date || new Date().toISOString().split('T')[0]
    });
    setShowScanner(false);
    setShowModal(true);
  };

  // Calculs
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyExpenses = expenses.filter(exp => exp.date && exp.date.startsWith(monthStr));
  
  const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  
// ✅ UTILISER DIRECTEMENT LES DONNÉES DU BACKEND
const envelopeStats = envelopes.map(env => {
  const spent = env.current_spent || 0;
  const budget = env.monthly_budget || 0;
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;
  
  return {
    ...env,
    spent,
    budget,
    percentage,
    remaining,
    isOverBudget: spent > budget
  };
});
  // Filtres
  const filteredExpenses = monthlyExpenses.filter(exp => {
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    const matchesSearch = !searchQuery || 
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const getCategoryInfo = (category) => CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];

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
                💳 Mes Dépenses
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            {/* Status Online/Offline */}
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <span className="bg-yellow-50 text-yellow-700 text-xs px-3 py-1.5 rounded-full border border-yellow-200 font-medium">
                  {pendingCount} en attente
                </span>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-600">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => { setEditingExpense(null); setForm(emptyForm()); setShowModal(true); }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-xl">➕</span>
              <span>Nouvelle dépense</span>
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center"
              title="Scanner un reçu"
            >
              <span className="text-2xl">📸</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total dépensé</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatCurrencyFull(totalExpenses)}</p>
          </div>

          {/* Envelope Cards */}
          {envelopeStats.map(env => (
            <div key={env.type} className={`${env.bgColor} rounded-xl p-5 border-2 ${env.isOverBudget ? 'border-red-300' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{env.icon}</span>
                  <p className="text-xs font-semibold text-gray-700">{env.name}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  env.percentage >= 100 ? 'bg-red-200 text-red-800' :
                  env.percentage >= 80 ? 'bg-amber-200 text-amber-800' :
                  'bg-green-200 text-green-800'
                }`}>
                  {Math.round(env.percentage)}%
                </span>
              </div>
              
              <div className="w-full bg-white rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${env.color} transition-all duration-500`}
                  style={{ width: `${Math.min(env.percentage, 100)}%` }}
                />
              </div>
              
              <p className={`text-sm font-bold ${env.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {env.isOverBudget ? 'Dépassement' : 'Reste'} : {formatCurrency(Math.abs(env.remaining))}
              </p>
            </div>
          ))}
        </div>

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
                  placeholder="Rechercher une dépense..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filterCategory === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes
              </button>
              {CATEGORIES.slice(0, 5).map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filterCategory === cat.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {expenses.length === 0 ? 'Aucune dépense enregistrée' : 'Aucun résultat'}
            </h2>
            <p className="text-gray-600 mb-6">
              {expenses.length === 0 
                ? 'Commence à suivre tes dépenses pour mieux gérer ton argent'
                : 'Essaie de modifier tes filtres de recherche'}
            </p>
            {expenses.length === 0 && (
              <button
                onClick={() => { setEditingExpense(null); setForm(emptyForm()); setShowModal(true); }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Ajouter ma première dépense
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredExpenses.map((expense) => {
                const catInfo = getCategoryInfo(expense.category);
                const isExpanded = expandedId === expense.id;
                
                return (
                  <div key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-xl ${catInfo.color} border-2 flex items-center justify-center text-2xl flex-shrink-0`}>
                            {catInfo.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{expense.description}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                                {catInfo.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(expense.date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-xl font-bold text-red-600">
                            -{formatCurrency(expense.amount)}
                          </p>
                          
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : expense.id)}
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
                            onClick={() => handleEdit(expense)}
                            className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(expense.id)}
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
              {editingExpense ? '✏️ Modifier la dépense' : '➕ Nouvelle dépense'}
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
                  placeholder="25000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  required
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
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
                  placeholder="Ex: Courses Auchan"
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
                  onClick={() => { setShowModal(false); setEditingExpense(null); }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {editingExpense ? 'Modifier' : 'Ajouter'}
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
                Supprimer cette dépense ?
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

      {/* Receipt Scanner */}
      

      {showScanner && (
        <PremiumGate
          user={user}
          feature="Scanner OCR"
          onUpgrade={() => onNavigate('pricing')}
        >
          <ReceiptScanner 
            onReceiptScanned={handleReceiptScanned}
            onClose={() => setShowScanner(false)}
            toast={toast}
          />
        </PremiumGate>
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

export default ExpenseTrackerV2;
