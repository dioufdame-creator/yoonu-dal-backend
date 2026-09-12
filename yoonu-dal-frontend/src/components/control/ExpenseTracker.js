import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import ReceiptScanner from '../ai/ReceiptScanner';
import { PremiumGate } from '../subscription/SubscriptionComponents';

const CATEGORIES = [
  { value: 'loyer',               label: 'Loyer',                 icon: '🏠', color: 'from-orange-500 to-red-500',    bgColor: 'bg-orange-50',  borderColor: 'border-orange-200',  textColor: 'text-orange-700',  group: 'Essentiels' },
  { value: 'alimentation',        label: 'Alimentation',          icon: '🍽️', color: 'from-red-500 to-rose-500',      bgColor: 'bg-red-50',     borderColor: 'border-red-200',     textColor: 'text-red-700',     group: 'Essentiels' },
  { value: 'transport',           label: 'Transport',             icon: '🚗', color: 'from-blue-500 to-cyan-500',     bgColor: 'bg-blue-50',    borderColor: 'border-blue-200',    textColor: 'text-blue-700',    group: 'Essentiels' },
  { value: 'sante_courante',      label: 'Santé courante',        icon: '💊', color: 'from-pink-500 to-rose-500',     bgColor: 'bg-pink-50',    borderColor: 'border-pink-200',    textColor: 'text-pink-700',    group: 'Essentiels' },
  { value: 'eau_electricite',     label: 'Eau / Électricité',     icon: '💡', color: 'from-yellow-500 to-amber-500',  bgColor: 'bg-yellow-50',  borderColor: 'border-yellow-200',  textColor: 'text-yellow-700',  group: 'Essentiels' },
  { value: 'telephone_internet',  label: 'Téléphone / Internet',  icon: '📱', color: 'from-indigo-500 to-blue-500',   bgColor: 'bg-indigo-50',  borderColor: 'border-indigo-200',  textColor: 'text-indigo-700',  group: 'Essentiels' },
  { value: 'aide_menagere',       label: 'Aide ménagère',         icon: '🧹', color: 'from-cyan-500 to-teal-500',     bgColor: 'bg-cyan-50',    borderColor: 'border-cyan-200',    textColor: 'text-cyan-700',    group: 'Essentiels' },
  { value: 'solidarite_famille',  label: 'Solidarité / Famille',  icon: '👨‍👩‍👧', color: 'from-purple-500 to-pink-500',  bgColor: 'bg-purple-50',  borderColor: 'border-purple-200',  textColor: 'text-purple-700',  group: 'Essentiels' },
  { value: 'maison_courses',      label: 'Maison / Courses',      icon: '🛒', color: 'from-purple-500 to-pink-500',   bgColor: 'bg-purple-50',  borderColor: 'border-purple-200',  textColor: 'text-purple-700',  group: 'Essentiels' },
  { value: 'restaurant',          label: 'Restaurant / Café',     icon: '🍜', color: 'from-orange-400 to-amber-500',  bgColor: 'bg-orange-50',  borderColor: 'border-orange-200',  textColor: 'text-orange-700',  group: 'Plaisirs' },
  { value: 'loisirs',             label: 'Loisirs / Sorties',     icon: '🎬', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50',  borderColor: 'border-yellow-200',  textColor: 'text-yellow-700',  group: 'Plaisirs' },
  { value: 'vetements',           label: 'Vêtements / Mode',      icon: '👔', color: 'from-cyan-500 to-blue-500',     bgColor: 'bg-cyan-50',    borderColor: 'border-cyan-200',    textColor: 'text-cyan-700',    group: 'Plaisirs' },
  { value: 'beaute',              label: 'Beauté / Coiffure',     icon: '💅', color: 'from-pink-400 to-rose-500',     bgColor: 'bg-pink-50',    borderColor: 'border-pink-200',    textColor: 'text-pink-700',    group: 'Plaisirs' },
  { value: 'voyage',              label: 'Voyage / Vacances',     icon: '✈️', color: 'from-blue-400 to-indigo-500',   bgColor: 'bg-blue-50',    borderColor: 'border-blue-200',    textColor: 'text-blue-700',    group: 'Plaisirs' },
  { value: 'education',           label: 'Éducation / Scolarité', icon: '📚', color: 'from-indigo-500 to-blue-500',   bgColor: 'bg-indigo-50',  borderColor: 'border-indigo-200',  textColor: 'text-indigo-700',  group: 'Projets' },
  { value: 'epargne',             label: 'Épargne / Invest.',     icon: '💰', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50',   borderColor: 'border-green-200',   textColor: 'text-green-700',   group: 'Projets' },
  { value: 'fetes_ceremonies',    label: 'Fêtes & Cérémonies',    icon: '🎊', color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50',  borderColor: 'border-purple-200',  textColor: 'text-purple-700',  group: 'Projets' },
  { value: 'spiritualite',        label: 'Spiritualité / Aumône', icon: '🕌', color: 'from-teal-500 to-emerald-500',  bgColor: 'bg-teal-50',    borderColor: 'border-teal-200',    textColor: 'text-teal-700',    group: 'Projets' },
  { value: 'sante_exceptionnelle',label: 'Santé exceptionnelle',  icon: '🏥', color: 'from-red-500 to-pink-500',      bgColor: 'bg-red-50',     borderColor: 'border-red-200',     textColor: 'text-red-700',     group: 'Projets' },
  { value: 'immobilier',          label: 'Immobilier / Constr.',  icon: '🏗️', color: 'from-stone-500 to-gray-600',    bgColor: 'bg-stone-50',   borderColor: 'border-stone-200',   textColor: 'text-stone-700',   group: 'Projets' },
  { value: 'tontine_epargne',     label: 'Tontine / Épargne coll.',icon: '🤝', color: 'from-green-600 to-teal-600',  bgColor: 'bg-green-50',   borderColor: 'border-green-200',   textColor: 'text-green-700',   group: 'Projets' },
  { value: 'remboursement_dette', label: 'Remboursement dette',   icon: '💳', color: 'from-amber-500 to-orange-500',  bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',   textColor: 'text-amber-700',   group: 'Libération' },
  { value: 'autre',               label: 'Autre',                 icon: '📝', color: 'from-gray-500 to-slate-500',    bgColor: 'bg-gray-50',    borderColor: 'border-gray-200',    textColor: 'text-gray-700',    group: 'Autre' },
];

const GROUPS = ['Essentiels', 'Plaisirs', 'Projets', 'Libération', 'Autre'];

const ENVELOPE_CONFIG = [
  { type: 'essentiel',  name: 'Essentiels', icon: '🏠', color: 'bg-red-500',    bgColor: 'bg-red-50',    textColor: 'text-red-700' },
  { type: 'plaisir',    name: 'Plaisirs',   icon: '🎉', color: 'bg-blue-500',   bgColor: 'bg-blue-50',   textColor: 'text-blue-700' },
  { type: 'projet',     name: 'Projets',    icon: '💎', color: 'bg-green-500', bgColor: 'bg-green-50',  textColor: 'text-green-700' },
  { type: 'liberation', name: 'Libération', icon: '🔓', color: 'bg-amber-500',  bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
];

const MONTHS_FR_SHORT = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const ExpenseTrackerPremium = ({ toast, onNavigate, auth, user }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [filterGroup, setFilterGroup] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const monthOptions = (() => {
    const options = [];
    const nowD = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      options.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${MONTHS_FR_SHORT[d.getMonth()]} ${d.getFullYear()}`,
        isCurrent: i === 0,
      });
    }
    return options;
  })();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].key);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const isCurrentMonth = selectedMonth === monthOptions[0].key;
  const selectedOption = monthOptions.find(m => m.key === selectedMonth) || monthOptions[0];

  const [expenses, setExpenses] = useState([]);
  const [envelopes, setEnvelopes] = useState(
    ENVELOPE_CONFIG.map(e => ({ ...e, budget: 0, spent: 0 }))
  );
  const [categoryRules, setCategoryRules] = useState({});

  const emptyForm = () => ({
    amount: '', category: '', description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const monthParam = isCurrentMonth ? '' : `?month=${selectedMonth}`;
      const [expensesRes, envelopesRes, rulesRes] = await Promise.all([
        API.get(`/expenses/${monthParam}`).catch(() => ({ data: [] })),
        API.get(`/meta-envelopes/${monthParam}`).catch(() => ({ data: [] })),
        API.get('/category-rules/').catch(() => ({ data: { categories: [] } }))
      ]);

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
        })));
      }
    } catch (error) {
      toast?.showError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [toast, selectedMonth, isCurrentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

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
      amount: expense.amount, category: expense.category,
      description: expense.description, date: expense.date
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

  const monthlyExpenses = expenses.filter(exp => exp.date && exp.date.startsWith(selectedMonth));
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
    const matchesSearch = !searchQuery ||
      exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
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
  : GROUPS.map(group => ({ group, categories: CATEGORIES.filter(c => c.group === group) }));

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
            <h1 className="text-lg font-bold text-gray-900">💳 Mes dépenses</h1>
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
            onClick={() => setShowScanner(true)}
            className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg flex-shrink-0"
            title="Scanner un reçu"
          >
            📸
          </button>
          <button
            onClick={() => { setEditingExpense(null); setForm(emptyForm()); setShowModal(true); }}
            className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md"
          >
            +
          </button>
        </div>

        {/* Carte résumé */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-5 mb-4 text-white shadow-xl">
          <p className="text-sm opacity-80 mb-1">Total dépensé ce mois</p>
          <p className="text-3xl font-bold mb-3">{formatCurrencyFull(totalExpenses)}</p>
          <div className="grid grid-cols-2 gap-2">
            {envelopeStats.slice(0, 4).map(env => (
              <div key={env.type} className="bg-black/20 rounded-2xl px-3 py-2">
                <p className="text-[10px] opacity-75 flex items-center gap-1">{env.icon} {env.name}</p>
                <p className="text-xs font-bold">{Math.round(env.percentage)}% utilisé</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enveloppes détaillées */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Mes enveloppes</h2>
          <div className="space-y-3">
            {envelopeStats.map(env => (
              <div key={env.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <span>{env.icon}</span> {env.name}
                  </span>
                  <span className={`text-xs font-bold ${env.isOverBudget ? 'text-red-500' : 'text-gray-500'}`}>
                    {env.isOverBudget
                      ? `+${formatCurrency(Math.abs(env.remaining))} dépassé`
                      : `${formatCurrency(env.remaining)} restant`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      env.percentage > 100 ? 'bg-red-500' : env.percentage >= 80 ? 'bg-amber-500' : env.color
                    }`}
                    style={{ width: `${Math.min(env.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recherche */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher une dépense..."
          className="w-full mb-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Filtres groupes */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterGroup('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterGroup === 'all' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            Toutes
          </button>
          {GROUPS.map(group => (
            <button
              key={group}
              onClick={() => setFilterGroup(group)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterGroup === group ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm text-gray-500 mb-4">
              {expenses.length === 0 ? 'Aucune dépense enregistrée' : 'Aucun résultat'}
            </p>
            {expenses.length === 0 && (
              <button
                onClick={() => { setEditingExpense(null); setForm(emptyForm()); setShowModal(true); }}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Ajouter ma première dépense
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-50">
              {filteredExpenses.map((expense) => {
                const catInfo = getCategoryInfo(expense.category);
                const isExpanded = expandedId === expense.id;
                return (
                  <div key={expense.id}>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catInfo.color} flex items-center justify-center text-lg flex-shrink-0`}>
                          {catInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{expense.description}</p>
                          <p className="text-[11px] text-gray-400">
                            {catInfo.label} · {new Date(expense.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-red-500 flex-shrink-0">-{formatCurrency(expense.amount)}</p>
                        <button onClick={() => setExpandedId(isExpanded ? null : expense.id)} className="text-gray-300 text-xs flex-shrink-0">
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                          <button onClick={() => handleEdit(expense)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-xl text-xs font-bold">
                            ✏️ Modifier
                          </button>
                          <button onClick={() => setConfirmDeleteId(expense.id)} className="flex-1 bg-red-50 text-red-700 py-2 rounded-xl text-xs font-bold">
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
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  {editingExpense ? '✏️ Modifier' : '➕ Nouvelle dépense'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Montant</label>
                <input type="number" value={form.amount}
                  onChange={(e) => setForm({...form, amount: e.target.value})}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-green-500"
                  required />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Catégorie</label>
                <div className="space-y-3">
                  {categoriesByGroup.map(({ group, categories }) => (
                    <div key={group}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{group}</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {categories.map(cat => (
                          <button key={cat.value} type="button"
                            onClick={() => setForm({...form, category: cat.value})}
                            className={`p-2 rounded-xl border-2 text-[11px] font-medium transition-all ${
                              form.category === cat.value
                                ? `bg-gradient-to-br ${cat.color} text-white border-white shadow-md`
                                : `${cat.bgColor} ${cat.borderColor} ${cat.textColor}`
                            }`}>
                            <div className="text-base mb-0.5">{cat.icon}</div>
                            <div className="leading-tight">{cat.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Description</label>
                <input type="text" value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Ex: Courses"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Date</label>
                <input type="date" value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                  required />
              </div>

              <div className="flex gap-3 pt-2 pb-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-semibold text-sm">
                  {editingExpense ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Confirmation suppression */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer la dépense ?</h3>
            <p className="text-sm text-gray-500 mb-6">Cette action est irréversible</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm">
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl font-semibold text-sm">
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
                amount: data.amount || '', category: data.category || '',
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
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default ExpenseTrackerPremium;
