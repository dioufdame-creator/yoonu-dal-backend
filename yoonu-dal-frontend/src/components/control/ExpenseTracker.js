import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import ReceiptScanner from '../ai/ReceiptScanner';
import { PremiumGate } from '../subscription/SubscriptionComponents';
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';

// ==========================================
// EXPENSE TRACKER PREMIUM V3
// Glassmorphism + Charts + 100% Responsive
// Match Envelopes Premium Quality
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
  { value: 'alimentation', label: 'Alimentation', icon: '🍽️', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
  { value: 'transport', label: 'Transport', icon: '🚗', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  { value: 'logement', label: 'Logement', icon: '🏠', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  { value: 'santé', label: 'Santé', icon: '💊', color: 'from-red-500 to-rose-500', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' },
  { value: 'éducation', label: 'Éducation', icon: '📚', color: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-700' },
  { value: 'famille', label: 'Famille', icon: '👨‍👩‍👧', color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', textColor: 'text-pink-700' },
  { value: 'spiritualité', label: 'Spiritualité', icon: '🕌', color: 'from-teal-500 to-emerald-500', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', textColor: 'text-teal-700' },
  { value: 'loisirs', label: 'Loisirs', icon: '🎬', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700' },
  { value: 'vêtements', label: 'Vêtements', icon: '👔', color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', textColor: 'text-cyan-700' },
  { value: 'autre', label: 'Autre', icon: '📝', color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700' }
];

const ENVELOPE_CONFIG = [
  { type: 'essentiels', name: 'Essentiels', icon: '🏠', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50', textColor: 'text-red-700', glowColor: 'shadow-red-500/20' },
  { type: 'plaisirs', name: 'Plaisirs', icon: '🎉', color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', glowColor: 'shadow-blue-500/20' },
  { type: 'projets', name: 'Projets', icon: '💎', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-700', glowColor: 'shadow-green-500/20' },
  { type: 'liberation', name: 'Libération', icon: '🔓', color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700', glowColor: 'shadow-orange-500/20' }
];

const ExpenseTrackerPremium = ({ toast, onNavigate, auth, user }) => {
  // États UI
  const [showModal, setShowModal] = useState(false);
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
          ...ENVELOPE_CONFIG.find(c => c.type === env.envelope_type) || {},
          history: generateMockHistory(env.current_spent || 0)
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

  const generateMockHistory = (currentValue) => {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const variance = Math.random() * 0.3 - 0.15;
      const value = currentValue * (0.7 + i * 0.05) * (1 + variance);
      history.push({ day: 7 - i, value: Math.max(0, value) });
    }
    return history;
  };

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

  const handleDelete = async (id) => {
    try {
      await API.delete(`/expenses/${id}/`);
      toast?.showSuccess('Dépense supprimée');
      setConfirmDeleteId(null);
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de la suppression');
    }
  };

  // Calculs
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses.filter(exp => exp.date && exp.date.startsWith(currentMonth));
  const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Chargement de vos dépenses...</p>
          <div className="flex gap-1 justify-center mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
        
        {/* Header PREMIUM avec Glassmorphism */}
        <div className="mb-6 sm:mb-8 backdrop-blur-xl bg-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-red-900 to-pink-900 bg-clip-text text-transparent flex items-center gap-2">
                <span>💳</span> Mes Dépenses
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
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
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-600">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons RESPONSIVE */}
          <div className="flex gap-2 sm:gap-3 mt-4">
            <button
              onClick={() => { setEditingExpense(null); setForm(emptyForm()); setShowModal(true); }}
              className="flex-1 group relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-xl sm:text-2xl group-hover:rotate-180 transition-transform duration-500">➕</span>
              <span className="hidden xs:inline">Nouvelle dépense</span>
              <span className="xs:hidden">Ajouter</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></span>
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 rounded-xl sm:rounded-2xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center justify-center"
              title="Scanner un reçu"
            >
              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">📸</span>
            </button>
          </div>
        </div>

        {/* Summary Cards PREMIUM avec Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Card avec effet special */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-pink-600 to-rose-700 rounded-2xl sm:rounded-3xl shadow-2xl shadow-red-500/30 p-4 sm:p-6 text-white">
            <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10">
              <p className="text-xs sm:text-sm text-red-100 mb-1 sm:mb-2 flex items-center gap-2">
                <span>💸</span> Total dépensé
              </p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-red-100">{formatCurrencyFull(totalExpenses)}</p>
            </div>
          </div>

          {/* Envelope Cards avec Charts */}
          {envelopeStats.map(env => (
            <div key={env.type} className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border-2 ${env.isOverBudget ? 'border-red-300' : 'border-gray-200'} overflow-hidden hover:shadow-2xl ${env.glowColor} transition-all duration-500 sm:transform sm:hover:scale-105`}>
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className={`relative ${env.bgColor} p-4 sm:p-5`}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl">{env.icon}</span>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">{env.name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 sm:px-3 py-1 rounded-full ${
                    env.percentage >= 100 ? 'bg-red-200 text-red-800 animate-pulse' :
                    env.percentage >= 80 ? 'bg-amber-200 text-amber-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {Math.round(env.percentage)}%
                  </span>
                </div>
                
                {/* Mini Chart - caché sur très petits écrans */}
                {env.history && (
                  <div className="hidden xs:block h-10 sm:h-12 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={env.history}>
                        <defs>
                          <linearGradient id={`area-${env.type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={env.type === 'essentiels' ? '#ef4444' : env.type === 'plaisirs' ? '#3b82f6' : env.type === 'projets' ? '#10b981' : '#f97316'} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={env.type === 'essentiels' ? '#ef4444' : env.type === 'plaisirs' ? '#3b82f6' : env.type === 'projets' ? '#10b981' : '#f97316'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={env.type === 'essentiels' ? '#ef4444' : env.type === 'plaisirs' ? '#3b82f6' : env.type === 'projets' ? '#10b981' : '#f97316'}
                          fill={`url(#area-${env.type})`}
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="w-full bg-white rounded-full h-2 sm:h-2.5 mb-2 shadow-inner">
                  <div
                    className={`h-2 sm:h-2.5 rounded-full bg-gradient-to-r ${env.color} transition-all duration-1000 relative overflow-hidden`}
                    style={{ width: `${Math.min(env.percentage, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                
                <p className={`text-xs sm:text-sm font-bold ${env.isOverBudget ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                  {env.isOverBudget ? 'Dépassement' : 'Reste'} : {formatCurrency(Math.abs(env.remaining))}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search PREMIUM */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une dépense..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm bg-white/90 transition-all"
                />
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl">🔍</span>
              </div>
            </div>

            {/* Category Filter - Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all transform hover:scale-105 ${
                  filterCategory === 'all'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔥 Toutes
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all transform hover:scale-105 ${
                    filterCategory === cat.value
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions List PREMIUM */}
        {filteredExpenses.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-6xl sm:text-8xl mb-4 animate-bounce">📊</div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
              {expenses.length === 0 ? 'Aucune dépense enregistrée' : 'Aucun résultat'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {expenses.length === 0 
                ? 'Commence à suivre tes dépenses pour mieux gérer ton argent'
                : 'Essaie de modifier tes filtres de recherche'}
            </p>
            {expenses.length === 0 && (
              <button
                onClick={() => { setEditingExpense(null); setForm(emptyForm()); setShowModal(true); }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-green-500/50 transform hover:scale-105 transition-all"
              >
                Ajouter ma première dépense
              </button>
            )}
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredExpenses.map((expense) => {
                const catInfo = getCategoryInfo(expense.category);
                const isExpanded = expandedId === expense.id;
                
                return (
                  <div key={expense.id} className="hover:bg-white/90 transition-colors backdrop-blur-sm">
                    <div className="p-3 sm:p-4 lg:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${catInfo.color} border-2 border-white flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-lg`}>
                            {catInfo.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 truncate">{expense.description}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${catInfo.bgColor} ${catInfo.borderColor} ${catInfo.textColor}`}>
                                {catInfo.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(expense.date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                            -{formatCurrency(expense.amount)}
                          </p>
                          
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors text-sm sm:text-base"
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Actions */}
                      {isExpanded && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex gap-2 animate-fadeIn">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium hover:shadow-lg transition-all transform hover:scale-105"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(expense.id)}
                            className="flex-1 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium hover:shadow-lg transition-all transform hover:scale-105"
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

      {/* Modal Add/Edit PREMIUM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-8 animate-scaleIn max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
                {editingExpense ? '✏️ Modifier' : '➕ Nouvelle dépense'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    placeholder="25000"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">💰</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({...form, category: cat.value})}
                      className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
                        form.category === cat.value
                          ? `bg-gradient-to-br ${cat.color} text-white border-white shadow-lg`
                          : `${cat.bgColor} ${cat.borderColor} ${cat.textColor}`
                      }`}
                    >
                      <div className="text-xl sm:text-2xl mb-1">{cat.icon}</div>
                      <div className="line-clamp-1">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Ex: Courses Auchan"
                  className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105"
                >
                  {editingExpense ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-scaleIn border border-white/20">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Supprimer la dépense ?</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Cette action est irréversible</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-red-500/50 transition-all transform hover:scale-105"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <PremiumGate feature="receipt_scanner" user={user}>
          <ReceiptScanner
            onClose={() => setShowScanner(false)}
            onExpenseExtracted={(data) => {
              setForm({
                amount: data.amount || '',
                category: data.category || '',
                description: data.description || '',
                date: data.date || new Date().toISOString().split('T')[0]
              });
              setShowScanner(false);
              setShowModal(true);
            }}
          />
        </PremiumGate>
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 475px) {
          .xs\:inline { display: inline; }
          .xs\:hidden { display: none; }
          .xs\:block { display: block; }
        }
      `}</style>
    </div>
  );
};

export default ExpenseTrackerPremium;
