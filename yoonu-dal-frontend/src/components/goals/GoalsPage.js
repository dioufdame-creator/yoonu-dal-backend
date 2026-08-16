import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const CATEGORIES = [
  { value: 'all',            label: 'Tous',          emoji: '🎯' },
  { value: 'transport',      label: 'Transport',      emoji: '🚗' },
  { value: 'logement',       label: 'Logement',       emoji: '🏠' },
  { value: 'loisirs',        label: 'Loisirs',        emoji: '🎭' },
  { value: 'éducation',      label: 'Éducation',      emoji: '📚' },
  { value: 'santé',          label: 'Santé',          emoji: '🏥' },
  { value: 'investissement', label: 'Investissement', emoji: '💰' },
  { value: 'retraite',       label: 'Retraite',       emoji: '👴' },
  { value: 'autre',          label: 'Autre',          emoji: '📌' },
];

const emptyForm = () => ({
  title: '',
  description: '',
  target_amount: '',
  current_amount: '0',
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  category: 'autre',
});

const GoalsPage = ({ toast, onNavigate, pageParams }) => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [stats, setStats] = useState({ total_count: 0, achieved_count: 0, total_target: 0, total_current: 0 });

  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showContributeSheet, setShowContributeSheet] = useState(false);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  const [form, setForm] = useState(emptyForm());
  const [contributions, setContributions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [projetsBudget, setProjetsBudget] = useState(0);

  const formatShort = (amount) => {
    const num = parseFloat(amount) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };
  const formatFull = (amount) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(parseFloat(amount) || 0)) + ' FCFA';

  useEffect(() => {
    loadGoals();
    loadMetrics();
    loadEnvelopeProjets();
  }, []);

  useEffect(() => {
    if (pageParams?.openCreate) setShowCreateSheet(true);
  }, [pageParams]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const response = await API.get('/goals/manage/');
      setGoals(response.data.goals || []);
      setStats({
        total_count: response.data.total_count || 0,
        achieved_count: response.data.achieved_count || 0,
        total_target: response.data.total_target || 0,
        total_current: response.data.total_current || 0,
      });
    } catch {
      toast?.showError?.('Erreur chargement objectifs');
    } finally {
      setLoading(false);
    }
  };

  const loadEnvelopeProjets = async () => {
    try {
      const response = await API.get('/meta-envelopes/');
      const envelopes = response.data.envelopes || [];
      const projets = envelopes.find(e => e.envelope_type === 'projet' || e.type === 'projet');
      if (projets) setProjetsBudget(parseFloat(projets.budget || projets.monthly_budget || 0));
    } catch {}
  };

  const loadMetrics = async () => {
    try {
      const response = await API.get('/dashboard/metrics/');
      setMetrics(response.data);
    } catch {}
  };

  // ── Calcul du plan d'atteinte ──────────────────────────────
  const computePlan = (goal) => {
    const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
    const monthlyIncome = parseFloat(metrics?.monthly_income || 0);
    const monthlyExpenses = parseFloat(metrics?.total_expenses || 0);
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    let monthsLeft = null;
    if (goal.deadline) {
      const now = new Date();
      const deadline = new Date(goal.deadline);
      monthsLeft = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30)));
    }

    const monthlyNeeded = monthsLeft ? Math.ceil(remaining / monthsLeft) : null;

    const scenarios = [];
    const base = projetsBudget > 0 ? projetsBudget : monthlyBalance;

    if (base > 0) {
      const amount100 = Math.ceil(base);
      scenarios.push({
        label: projetsBudget > 0 ? "100% de l'enveloppe Projets" : '100% du solde mensuel',
        amount: amount100, months: Math.ceil(remaining / amount100),
      });
      const amount75 = Math.ceil(base * 0.75);
      if (amount75 > 0) scenarios.push({
        label: projetsBudget > 0 ? "75% de l'enveloppe Projets" : '75% du solde mensuel',
        amount: amount75, months: Math.ceil(remaining / amount75),
      });
      const amount50 = Math.ceil(base * 0.5);
      if (amount50 > 0) scenarios.push({
        label: projetsBudget > 0 ? "50% de l'enveloppe Projets" : '50% du solde mensuel',
        amount: amount50, months: Math.ceil(remaining / amount50),
      });
    }

    const deadlineFeasible = monthlyNeeded && monthlyBalance >= monthlyNeeded;

    return { remaining, monthsLeft, monthlyNeeded, monthlyBalance, monthlyIncome, scenarios, deadlineFeasible };
  };

  // ── Contribuer — redirige vers une source traçable ─────────
  const goToEpargner = () => {
    setShowContributeSheet(false);
    onNavigate('quick-add', { type: 'savings', preselectGoalId: selectedGoal.id });
  };

  const goToPockets = () => {
    setShowContributeSheet(false);
    onNavigate('pockets', { preselectDestinationGoalId: selectedGoal.id });
  };

  const loadHistory = async (goalId) => {
    setLoadingHistory(true);
    try {
      const response = await API.get(`/goals/${goalId}/contributions/`);
      setContributions(response.data.contributions || []);
    } catch {
      setContributions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteContribution = async (contributionId, goalId) => {
    if (!window.confirm('Supprimer cette contribution ?')) return;
    try {
      await API.delete(`/goals/contributions/${contributionId}/`);
      toast?.showSuccess?.('Contribution supprimée');
      await loadHistory(goalId);
      await loadGoals();
    } catch {
      toast?.showError?.('Erreur suppression');
    }
  };

  const handleCreateGoal = async () => {
    if (!form.title || !form.target_amount) {
      toast?.showError?.('Titre et montant cible requis');
      return;
    }
    try {
      if (editingGoal) {
        await API.put(`/goals/manage/?goal_id=${editingGoal.id}`, form);
        toast?.showSuccess?.('Objectif modifié !');
      } else {
        await API.post('/goals/manage/', form);
        toast?.showSuccess?.('Objectif créé !');
      }
      setShowCreateSheet(false);
      setEditingGoal(null);
      setForm(emptyForm());
      await loadGoals();
    } catch (error) {
      toast?.showError?.('Erreur : ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteGoal = async (goal) => {
    if (!window.confirm(`Supprimer l'objectif "${goal.title}" ?`)) return;
    try {
      await API.delete(`/goals/manage/?goal_id=${goal.id}`);
      toast?.showSuccess?.('Objectif supprimé !');
      await loadGoals();
    } catch (error) {
      toast?.showError?.('Erreur : ' + (error.response?.data?.error || error.message));
    }
  };

  const openEdit = (goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title, description: goal.description || '',
      target_amount: goal.target_amount, current_amount: goal.current_amount,
      deadline: goal.deadline || '', category: goal.category || 'autre',
    });
    setShowCreateSheet(true);
  };

  const openHistory = (goal) => {
    setSelectedGoal(goal);
    setShowHistorySheet(true);
    loadHistory(goal.id);
  };

  const filteredGoals = goals
    .filter(g => filterCategory === 'all' || g.category === filterCategory)
    .filter(g =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.created_at) - new Date(a.created_at);
        case 'progress': return b.progress_percentage - a.progress_percentage;
        case 'amount': return b.target_amount - a.target_amount;
        case 'deadline': return new Date(a.deadline) - new Date(b.deadline);
        default: return 0;
      }
    });

  const getStateColor = (pct) => pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';

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
            <h1 className="text-lg font-bold text-gray-900">🎯 Mes projets</h1>
            <p className="text-xs text-gray-400">Vos objectifs financiers</p>
          </div>
          <button
            onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowCreateSheet(true); }}
            className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md"
          >
            +
          </button>
        </div>

        {/* Résumé */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-5 mb-4 text-white shadow-xl">
          <p className="text-sm opacity-80 mb-1">Total épargné</p>
          <p className="text-3xl font-bold mb-3">{formatFull(stats.total_current)}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] opacity-75">Objectifs actifs</p>
              <p className="text-sm font-bold">{stats.total_count - stats.achieved_count}</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] opacity-75">Atteints</p>
              <p className="text-sm font-bold">{stats.achieved_count} 🏆</p>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher un objectif..."
          className="w-full mb-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Catégories */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterCategory === cat.value ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Tri */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full mb-4 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-semibold text-gray-600 outline-none"
        >
          <option value="recent">📅 Plus récents</option>
          <option value="progress">📊 Progression</option>
          <option value="amount">💰 Montant cible</option>
          <option value="deadline">⏰ Échéance</option>
        </select>

        {/* Liste */}
        {filteredGoals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery || filterCategory !== 'all' ? 'Aucun résultat' : 'Aucun objectif pour l\'instant'}
            </p>
            {!searchQuery && filterCategory === 'all' && (
              <button
                onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowCreateSheet(true); }}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                + Créer mon premier objectif
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map(goal => {
              const cat = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[CATEGORIES.length - 1];
              const pct = goal.progress_percentage || 0;
              const isAchieved = pct >= 100;

              return (
                <div key={goal.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {cat.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{goal.title}</p>
                        {goal.deadline && (
                          <p className="text-xs text-gray-400">
                            Échéance : {new Date(goal.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    {isAchieved && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-600 flex-shrink-0">
                        🏆 Atteint
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">{pct.toFixed(0)}%</span>
                      <span className="font-bold text-gray-700">
                        {formatShort(goal.current_amount)} / {formatShort(goal.target_amount)} FCFA
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getStateColor(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => { setSelectedGoal(goal); setShowContributeSheet(true); }}
                      className="col-span-2 text-xs font-bold py-2.5 rounded-xl bg-green-50 text-green-700"
                    >
                      + Ajouter
                    </button>
                    <button
                      onClick={() => { setSelectedGoal(goal); setShowPlanSheet(true); }}
                      className="text-xs font-bold py-2.5 rounded-xl bg-blue-50 text-blue-600"
                      title="Plan d'atteinte"
                    >
                      📈
                    </button>
                    <button
                      onClick={() => openHistory(goal)}
                      className="text-xs font-bold py-2.5 rounded-xl bg-gray-50 text-gray-600"
                      title="Historique"
                    >
                      🕐
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openEdit(goal)}
                      className="flex-1 text-[11px] font-semibold py-2 rounded-xl bg-gray-50 text-gray-500"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal)}
                      className="flex-1 text-[11px] font-semibold py-2 rounded-xl bg-red-50 text-red-500"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET — Créer / Modifier ── */}
      {showCreateSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreateSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  {editingGoal ? '✏️ Modifier l\'objectif' : '🎯 Nouvel objectif'}
                </h2>
                <button onClick={() => setShowCreateSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Titre</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Voyage à Marrakech"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Montant cible</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                  placeholder="0"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Échéance</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Optionnel"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleCreateGoal}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
              >
                {editingGoal ? 'Enregistrer' : 'Créer l\'objectif'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── BOTTOM SHEET — Ajouter (choix source traçable) ── */}
      {showContributeSheet && selectedGoal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowContributeSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
            <div className="pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">➕ Ajouter à "{selectedGoal.title}"</h2>
                <button onClick={() => setShowContributeSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatFull(selectedGoal.current_amount)} / {formatFull(selectedGoal.target_amount)}
              </p>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-400 mb-1">D'où vient cet argent ?</p>

              <button
                onClick={goToEpargner}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-all text-left"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                  💰
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Argent frais de ce mois</p>
                  <p className="text-xs text-gray-500">Sort de votre budget mensuel</p>
                </div>
              </button>

              <button
                onClick={goToPockets}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all text-left"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                  🔄
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Depuis une de mes poches</p>
                  <p className="text-xs text-gray-500">Trésorerie ou épargne déjà en réserve</p>
                </div>
              </button>
            </div>
            <div className="pb-6" />
          </div>
        </>
      )}

      {/* ── BOTTOM SHEET — Plan d'atteinte ── */}
      {showPlanSheet && selectedGoal && (() => {
        const plan = computePlan(selectedGoal);
        return (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPlanSheet(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
              <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">📈 Plan d'atteinte</h2>
                  <button onClick={() => setShowPlanSheet(false)} className="text-gray-400 text-xl">✕</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{selectedGoal.title}</p>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-400">Reste à épargner</p>
                  <p className="text-2xl font-bold text-gray-900">{formatFull(plan.remaining)}</p>
                </div>

                {plan.monthsLeft && (
                  <div className={`rounded-2xl p-4 ${plan.deadlineFeasible ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <p className={`text-xs font-semibold ${plan.deadlineFeasible ? 'text-green-700' : 'text-amber-700'}`}>
                      {plan.deadlineFeasible ? '✅ Objectif atteignable' : '⚠️ Rythme à augmenter'}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Il faut environ <strong>{formatFull(plan.monthlyNeeded)}/mois</strong> pendant {plan.monthsLeft} mois pour respecter l'échéance.
                    </p>
                  </div>
                )}

                {plan.scenarios.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Scénarios possibles</p>
                    <div className="space-y-2">
                      {plan.scenarios.map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                            <p className="text-xs text-gray-400">{formatFull(s.amount)}/mois</p>
                          </div>
                          <p className="text-sm font-bold text-green-600">{s.months} mois</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.scenarios.length === 0 && !plan.monthsLeft && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Ajoutez une échéance ou renseignez vos revenus pour voir un plan personnalisé.
                  </p>
                )}
              </div>
              <div className="pb-6" />
            </div>
          </>
        );
      })()}

      {/* ── BOTTOM SHEET — Historique ── */}
      {showHistorySheet && selectedGoal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowHistorySheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">🕐 Historique</h2>
                <button onClick={() => setShowHistorySheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{selectedGoal.title}</p>
            </div>

            <div className="p-5">
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : contributions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucune contribution pour l'instant</p>
              ) : (
                <div className="space-y-2">
                  {contributions.map(c => (
                    <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm">
                        {c.type === 'remove' ? '➖' : '➕'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{formatFull(c.amount)}</p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {c.source} {c.note && `· ${c.note}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteContribution(c.id, selectedGoal.id)}
                        className="text-gray-300 hover:text-red-500 text-sm flex-shrink-0 px-1"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pb-6" />
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default GoalsPage;
