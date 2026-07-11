import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import ReceiptScanner from '../ai/ReceiptScanner';
import { PremiumGate } from '../subscription/SubscriptionComponents';
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';

// ==========================================
// EXPENSE TRACKER V4
// Nouvelles catégories contexte sénégalais
// ==========================================

const CATEGORIES = [
  // ESSENTIELS
  { value: 'loyer',               label: 'Loyer',                 icon: '🏠', color: 'from-orange-500 to-red-500',    bgColor: 'bg-orange-50',  borderColor: 'border-orange-200',  textColor: 'text-orange-700',  group: 'Essentiels' },
  { value: 'alimentation',        label: 'Alimentation',          icon: '🍽️', color: 'from-red-500 to-rose-500',      bgColor: 'bg-red-50',     borderColor: 'border-red-200',     textColor: 'text-red-700',     group: 'Essentiels' },
  { value: 'transport',           label: 'Transport',             icon: '🚗', color: 'from-blue-500 to-cyan-500',     bgColor: 'bg-blue-50',    borderColor: 'border-blue-200',    textColor: 'text-blue-700',    group: 'Essentiels' },
  { value: 'sante_courante',      label: 'Santé courante',        icon: '💊', color: 'from-pink-500 to-rose-500',     bgColor: 'bg-pink-50',    borderColor: 'border-pink-200',    textColor: 'text-pink-700',    group: 'Essentiels' },
  { value: 'eau_electricite',     label: 'Eau / Électricité',     icon: '💡', color: 'from-yellow-500 to-amber-500',  bgColor: 'bg-yellow-50',  borderColor: 'border-yellow-200',  textColor: 'text-yellow-700',  group: 'Essentiels' },
  { value: 'telephone_internet',  label: 'Téléphone / Internet',  icon: '📱', color: 'from-indigo-500 to-blue-500',   bgColor: 'bg-indigo-50',  borderColor: 'border-indigo-200',  textColor: 'text-indigo-700',  group: 'Essentiels' },
  { value: 'aide_menagere',       label: 'Aide ménagère',         icon: '🧹', color: 'from-cyan-500 to-teal-500',     bgColor: 'bg-cyan-50',    borderColor: 'border-cyan-200',    textColor: 'text-cyan-700',    group: 'Essentiels' },
  { value: 'solidarite_famille',  label: 'Solidarité / Famille',  icon: '👨‍👩‍👧', color: 'from-purple-500 to-pink-500',  bgColor: 'bg-purple-50',  borderColor: 'border-purple-200',  textColor: 'text-purple-700',  group: 'Essentiels' },
  { value: 'maison_courses',      label: 'Maison / Courses',      icon: '🛒', color: 'from-purple-500 to-pink-500',   bgColor: 'bg-purple-50',  borderColor: 'border-purple-200',  textColor: 'text-purple-700',  group: 'Essentiels' },

  // PLAISIRS
  { value: 'restaurant',          label: 'Restaurant / Café',     icon: '🍜', color: 'from-orange-400 to-amber-500',  bgColor: 'bg-orange-50',  borderColor: 'border-orange-200',  textColor: 'text-orange-700',  group: 'Plaisirs' },
  { value: 'loisirs',             label: 'Loisirs / Sorties',     icon: '🎬', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50',  borderColor: 'border-yellow-200',  textColor: 'text-yellow-700',  group: 'Plaisirs' },
  { value: 'vetements',           label: 'Vêtements / Mode',      icon: '👔', color: 'from-cyan-500 to-blue-500',     bgColor: 'bg-cyan-50',    borderColor: 'border-cyan-200',    textColor: 'text-cyan-700',    group: 'Plaisirs' },
  { value: 'beaute',              label: 'Beauté / Coiffure',     icon: '💅', color: 'from-pink-400 to-rose-500',     bgColor: 'bg-pink-50',    borderColor: 'border-pink-200',    textColor: 'text-pink-700',    group: 'Plaisirs' },
  { value: 'voyage',              label: 'Voyage / Vacances',     icon: '✈️', color: 'from-blue-400 to-indigo-500',   bgColor: 'bg-blue-50',    borderColor: 'border-blue-200',    textColor: 'text-blue-700',    group: 'Plaisirs' },

  // PROJETS
  { value: 'education',           label: 'Éducation / Scolarité', icon: '📚', color: 'from-indigo-500 to-blue-500',   bgColor: 'bg-indigo-50',  borderColor: 'border-indigo-200',  textColor: 'text-indigo-700',  group: 'Projets' },
  { value: 'epargne',             label: 'Épargne / Invest.',     icon: '💰', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50',   borderColor: 'border-green-200',   textColor: 'text-green-700',   group: 'Projets' },
  { value: 'fetes_ceremonies',    label: 'Fêtes & Cérémonies',    icon: '🎊', color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50',  borderColor: 'border-purple-200',  textColor: 'text-purple-700',  group: 'Projets' },
  { value: 'spiritualite',        label: 'Spiritualité / Aumône', icon: '🕌', color: 'from-teal-500 to-emerald-500',  bgColor: 'bg-teal-50',    borderColor: 'border-teal-200',    textColor: 'text-teal-700',    group: 'Projets' },
  { value: 'sante_exceptionnelle',label: 'Santé exceptionnelle',  icon: '🏥', color: 'from-red-500 to-pink-500',      bgColor: 'bg-red-50',     borderColor: 'border-red-200',     textColor: 'text-red-700',     group: 'Projets' },
  { value: 'immobilier',          label: 'Immobilier / Constr.',  icon: '🏗️', color: 'from-stone-500 to-gray-600',    bgColor: 'bg-stone-50',   borderColor: 'border-stone-200',   textColor: 'text-stone-700',   group: 'Projets' },
  { value: 'tontine_epargne',     label: 'Tontine / Épargne coll.',icon: '🤝', color: 'from-green-600 to-teal-600',  bgColor: 'bg-green-50',   borderColor: 'border-green-200',   textColor: 'text-green-700',   group: 'Projets' },

  // LIBÉRATION
  { value: 'remboursement_dette', label: 'Remboursement dette',   icon: '💳', color: 'from-amber-500 to-orange-500',  bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',   textColor: 'text-amber-700',   group: 'Libération' },

  // AUTRE
  { value: 'autre',               label: 'Autre',                 icon: '📝', color: 'from-gray-500 to-slate-500',    bgColor: 'bg-gray-50',    borderColor: 'border-gray-200',    textColor: 'text-gray-700',    group: 'Autre' },
];

const GROUPS = ['Essentiels', 'Plaisirs', 'Projets', 'Libération', 'Autre'];

const ENVELOPE_CONFIG = [
  { type: 'essentiel',  name: 'Essentiels', icon: '🏠', color: 'from-red-500 to-pink-500',    bgColor: 'bg-red-50',    textColor: 'text-red-700',    glowColor: 'shadow-red-500/20' },
  { type: 'plaisir',   name: 'Plaisirs',   icon: '🎉', color: 'from-blue-500 to-indigo-500',  bgColor: 'bg-blue-50',   textColor: 'text-blue-700',   glowColor: 'shadow-blue-500/20' },
  { type: 'projet',    name: 'Projets',    icon: '💎', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50',  textColor: 'text-green-700',  glowColor: 'shadow-green-500/20' },
  { type: 'liberation',name: 'Libération', icon: '🔓', color: 'from-orange-500 to-amber-500',  bgColor: 'bg-orange-50', textColor: 'text-orange-700', glowColor: 'shadow-orange-500/20' }
];

const ExpenseTrackerPremium = ({ toast, onNavigate, auth, user }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [expenses, setExpenses] = useState([]);
  const [envelopes, setEnvelopes] = useState(
    ENVELOPE_CONFIG.map(e => ({ ...e, budget: 0, spent: 0 }))
  );
  // ✅ State pour les règles personnalisées — à l'intérieur du composant
  const [categoryRules, setCategoryRules] = useState({});

  const emptyForm = () => ({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ 3 promesses avec déstructuration correcte
      const [expensesRes, envelopesRes, rulesRes] = await Promise.all([
        API.get('/expenses/').catch(() => ({ data: [] })),
        API.get('/meta-envelopes/').catch(() => ({ data: [] })),
        API.get('/category-rules/').catch(() => ({ data: { categories: [] } }))
      ]);

      // ✅ Construire le mapping depuis les règles utilisateur
      const rulesMapping = {};
      (rulesRes.data?.categories || []).forEach(cat => {
        const frontendEnv = cat.current_envelope
          .replace('essentiels', 'essentiel')
          .replace('plaisirs', 'plaisir')
          .replace('projets', 'projet');
        rulesMapping[cat.category] = frontendEnv;
      });
      setCategoryRules(rulesMapping);

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

  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) =>
    new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';

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
      toast?.showError('Erreur lors de la suppression');
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses.filter(exp => exp.date && exp.date.startsWith(currentMonth));
  const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  const envelopeStats = envelopes.map(env => {
    const spent = env.current_spent || 0;
    const budget = env.monthly_budget || 0;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = budget - spent;
    return { ...env, spent, budget, percentage, remaining, isOverBudget: spent > budget };
  });

  const filteredExpenses = monthlyExpenses.filter(exp => {
    const catInfo = CATEGORIES.find(c => c.value === exp.category);
    const matchesGroup = filterGroup === 'all' || catInfo?.group === filterGroup;
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    const matchesSearch = !searchQuery ||
      exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesCategory && matchesSearch;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const getCategoryInfo = (category) =>
    CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];

  const categoriesByGroup = Object.keys(categoryRules).length > 0
  ? [
      { group: 'Essentiels', categories: CATEGORIES.filter(c => categoryRules[c.value] === 'essentiel') },
      { group: 'Plaisirs',   categories: CATEGORIES.filter(c => categoryRules[c.value] === 'plaisir') },
      { group: 'Projets',    categories: CATEGORIES.filter(c => categoryRules[c.value] === 'projet') },
      { group: 'Libération', categories: CATEGORIES.filter(c => categoryRules[c.value] === 'liberation') },
    ].filter(g => g.categories.length > 0)
  : GROUPS.map(group => ({
      group,
      categories: CATEGORIES.filter(c => c.group === group)
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de vos dépenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">

        {/* Header */}
        <div className="mb-6 sm:mb-8 backdrop-blur-xl bg-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-red-900 to-pink-900 bg-clip-text text-transparent flex items-center gap-2">
                <span>💳</span> Mes Dépenses
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 mt-4">
            <button
              onClick={() => { setEditingExpense(null); setForm(emptyForm()); setShowModal(true); }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm hover:shadow-2xl hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
            >
              <span>➕</span>
              <span>Nouvelle dépense</span>
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center"
              title="Scanner un reçu"
            >
              <span className="text-2xl">📸</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-pink-600 to-rose-700 rounded-2xl shadow-2xl shadow-red-500/30 p-4 sm:p-6 text-white">
            <p className="text-xs text-red-100 mb-1">💸 Total dépensé</p>
            <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-red-100 mt-1">{formatCurrencyFull(totalExpenses)}</p>
          </div>
          {envelopeStats.map(env => (
            <div key={env.type} className={`bg-white/80 backdrop-blur-xl rounded-2xl border-2 ${env.isOverBudget ? 'border-red-300' : 'border-gray-200'} overflow-hidden hover:shadow-xl transition-all`}>
              <div className={`${env.bgColor} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{env.icon}</span>
                    <p className="text-xs font-bold text-gray-700">{env.name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    env.percentage >= 100 ? 'bg-red-200 text-red-800' :
                    env.percentage >= 80 ? 'bg-amber-200 text-amber-800' :
                    'bg-green-200 text-green-800'
                  }`}>{Math.round(env.percentage)}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full bg-gradient-to-r ${env.color} transition-all duration-1000`}
                    style={{ width: `${Math.min(env.percentage, 100)}%` }} />
                </div>
                <p className={`text-xs font-bold ${env.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {env.isOverBudget ? 'Dépassement' : 'Reste'} : {formatCurrency(Math.abs(env.remaining))}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20 mb-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une dépense..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => { setFilterGroup('all'); setFilterCategory('all'); }}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${filterGroup === 'all' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700'}`}>
                🔥 Toutes
              </button>
              {GROUPS.map(group => (
                <button key={group} onClick={() => { setFilterGroup(group); setFilterCategory('all'); }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${filterGroup === group ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700'}`}>
                  {group}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste transactions */}
        {filteredExpenses.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border-2 border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {expenses.length === 0 ? 'Aucune dépense enregistrée' : 'Aucun résultat'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {expenses.length === 0 ? 'Commence à suivre tes dépenses pour mieux gérer ton argent' : 'Essaie de modifier tes filtres'}
            </p>
            {expenses.length === 0 && (
              <button onClick={() => { setEditingExpense(null); setForm(emptyForm()); setShowModal(true); }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:shadow-xl transition-all">
                Ajouter ma première dépense
              </button>
            )}
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredExpenses.map((expense) => {
                const catInfo = getCategoryInfo(expense.category);
                const isExpanded = expandedId === expense.id;
                return (
                  <div key={expense.id} className="hover:bg-white/90 transition-colors">
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${catInfo.color} flex items-center justify-center text-xl flex-shrink-0 shadow-lg`}>
                            {catInfo.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{expense.description}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${catInfo.bgColor} ${catInfo.borderColor} ${catInfo.textColor}`}>
                                {catInfo.label}
                              </span>
                              <span className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-red-600">-{formatCurrency(expense.amount)}</p>
                          <button onClick={() => setExpandedId(isExpanded ? null : expense.id)} className="text-gray-400 text-sm">
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                          <button onClick={() => handleEdit(expense)}
                            className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                            ✏️ Modifier
                          </button>
                          <button onClick={() => setConfirmDeleteId(expense.id)}
                            className="flex-1 bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-8 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingExpense ? '✏️ Modifier' : '➕ Nouvelle dépense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant *</label>
                <div className="relative">
                  <input type="number" value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    placeholder="25000"
                    className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">💰</span>
                </div>
              </div>

              {/* Catégorie groupée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Catégorie *</label>
                <div className="space-y-4">
                  {categoriesByGroup.map(({ group, categories }) => (
                    <div key={group}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map(cat => (
                          <button key={cat.value} type="button"
                            onClick={() => setForm({...form, category: cat.value})}
                            className={`p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                              form.category === cat.value
                                ? `bg-gradient-to-br ${cat.color} text-white border-white shadow-lg scale-105`
                                : `${cat.bgColor} ${cat.borderColor} ${cat.textColor} hover:scale-105`
                            }`}>
                            <div className="text-lg mb-1">{cat.icon}</div>
                            <div className="leading-tight">{cat.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* ✅ Affichage enveloppe depuis les règles utilisateur */}
                {form.category && (
                  <div className="mt-2 text-xs text-gray-500">
                    Enveloppe : <span className="font-semibold capitalize">{categoryRules[form.category] || 'non définie'}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input type="text" value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Ex: Courses"
                  className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input type="date" value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:shadow-xl transition-all">
                  {editingExpense ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer la dépense ?</h3>
            <p className="text-sm text-gray-600 mb-6">Cette action est irréversible</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm">
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold text-sm hover:shadow-xl transition-all">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner */}
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

      <style jsx>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ExpenseTrackerPremium;
