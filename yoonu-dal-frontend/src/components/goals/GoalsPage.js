import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const GoalsPage = ({ toast, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [stats, setStats] = useState({
    total_count: 0,
    achieved_count: 0,
    total_target: 0,
    total_current: 0
  });

  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  const emptyForm = () => ({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '0',
    deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    category: 'urgence'
  });
  const [form, setForm] = useState(emptyForm());
  const [contributeAmount, setContributeAmount] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [projetsBudget, setProjetsBudget] = useState(0);

  const CATEGORIES = [
    { value: 'all', label: 'Tous', emoji: '🎯' },
    { value: 'urgence', label: 'Fonds d\'urgence', emoji: '🚨' },
    { value: 'transport', label: 'Transport', emoji: '🚗' },
    { value: 'logement', label: 'Logement', emoji: '🏠' },
    { value: 'loisirs', label: 'Loisirs', emoji: '🎭' },
    { value: 'éducation', label: 'Éducation', emoji: '📚' },
    { value: 'santé', label: 'Santé', emoji: '🏥' },
    { value: 'investissement', label: 'Investissement', emoji: '💰' },
    { value: 'retraite', label: 'Retraite', emoji: '👴' },
    { value: 'autre', label: 'Autre', emoji: '📌' }
  ];

  const formatAmount = (amount) => {
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

  const loadGoals = async () => {
    setLoading(true);
    try {
      const response = await API.get('/goals/manage/');
      setGoals(response.data.goals || []);
      setStats({
        total_count: response.data.total_count || 0,
        achieved_count: response.data.achieved_count || 0,
        total_target: response.data.total_target || 0,
        total_current: response.data.total_current || 0
      });
    } catch (error) {
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
    } catch (error) {
      console.error('Erreur enveloppe projets:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await API.get('/dashboard/metrics/');
      setMetrics(response.data);
    } catch (error) {
      console.error('Erreur metrics:', error);
    }
  };

  // ── Calcul du plan d'atteinte ──────────────────────────────────
  const computePlan = (goal) => {
    const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
    const monthlyIncome = parseFloat(metrics?.monthly_income || 0);
    const monthlyExpenses = parseFloat(metrics?.total_expenses || 0);
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Mois restants jusqu'à la deadline
    let monthsLeft = null;
    if (goal.deadline) {
      const now = new Date();
      const deadline = new Date(goal.deadline);
      monthsLeft = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30)));
    }

    // Montant mensuel nécessaire pour atteindre l'objectif dans les délais
    const monthlyNeeded = monthsLeft ? Math.ceil(remaining / monthsLeft) : null;

    // Scénarios alternatifs
    const scenarios = [];
    const base = projetsBudget > 0 ? projetsBudget : monthlyBalance;

    if (base > 0) {
      // Scénario 1 : 100% de l'enveloppe Projets
      const amount100 = Math.ceil(base);
      scenarios.push({
        label: projetsBudget > 0 ? `100% de l'enveloppe Projets` : '100% du solde mensuel',
        amount: amount100,
        months: Math.ceil(remaining / amount100),
      });

      // Scénario 2 : 75% de l'enveloppe Projets
      const amount75 = Math.ceil(base * 0.75);
      if (amount75 > 0) scenarios.push({
        label: projetsBudget > 0 ? `75% de l'enveloppe Projets` : '75% du solde mensuel',
        amount: amount75,
        months: Math.ceil(remaining / amount75),
      });

      // Scénario 3 : 50% de l'enveloppe Projets
      const amount50 = Math.ceil(base * 0.5);
      if (amount50 > 0) scenarios.push({
        label: projetsBudget > 0 ? `50% de l'enveloppe Projets` : '50% du solde mensuel',
        amount: amount50,
        months: Math.ceil(remaining / amount50),
      });
    }

    // Scénario deadline : est-ce faisable dans les délais ?
    const deadlineFeasible = monthlyNeeded && monthlyBalance >= monthlyNeeded;

    return {
      remaining,
      monthsLeft,
      monthlyNeeded,
      monthlyBalance,
      monthlyIncome,
      scenarios,
      deadlineFeasible
    };
  };

  const handleContribute = async () => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      toast?.showError?.('Montant invalide');
      return;
    }

    const amount = parseFloat(contributeAmount);

    try {
      try {
        await API.post(`/goals/${selectedGoal.id}/contributions/`, { amount });
      } catch (err) {
        if (err.response?.status === 404) {
          await API.put(`/goals/manage/?goal_id=${selectedGoal.id}`, {
            current_amount: parseFloat(selectedGoal.current_amount) + amount
          });
        } else { throw err; }
      }
      toast?.showSuccess?.('Contribution ajoutée !');
      setShowContributeModal(false);
      setContributeAmount('');
      await loadGoals();
    } catch (error) {
      toast?.showError?.('Erreur : ' + (error.response?.data?.error || error.message));
    }
  };

  const loadHistory = async (goalId) => {
    setLoadingHistory(true);
    try {
      const response = await API.get(`/goals/${goalId}/contributions/`);
      setContributions(response.data.contributions || []);
    } catch (error) {
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
    } catch (error) {
      toast?.showError?.('Erreur suppression');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await API.put(`/goals/manage/?goal_id=${editingGoal.id}`, form);
        toast?.showSuccess?.('Objectif modifié !');
      } else {
        await API.post('/goals/manage/', form);
        toast?.showSuccess?.('Objectif créé !');
      }
      setShowCreateModal(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl sm:text-4xl">🎯</span>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes Objectifs</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Définis et atteins tes objectifs financiers
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setForm(emptyForm());
            setShowCreateModal(true);
          }}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all"
        >
          <span className="text-xl">➕</span>
          <span>Créer un objectif</span>
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 pt-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-xs mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_count}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-xs mb-1">Atteints</div>
            <div className="text-2xl font-bold text-green-600">{stats.achieved_count}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-xs mb-1">Progression</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_count > 0
                ? (goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length).toFixed(1)
                : 0}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-xs mb-1">Épargné</div>
            <div className="text-xl font-bold text-purple-600">{formatAmount(stats.total_current)}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="px-4 mb-4 space-y-3">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap text-sm ${
                filterCategory === cat.value
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
        >
          <option value="recent">🕒 Plus récents</option>
          <option value="progress">📊 Progression</option>
          <option value="amount">💰 Montant</option>
          <option value="deadline">📅 Deadline</option>
        </select>
      </div>

      {/* Liste objectifs */}
      <div className="px-4 space-y-4">
        {filteredGoals.map(goal => {
          const category = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];

          return (
            <div key={goal.id} className="bg-white rounded-xl shadow-md p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{category.emoji}</span>
                    <h3 className="font-bold text-gray-900">{goal.title}</h3>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  )}
                  {goal.deadline && (
                    <p className="text-xs text-gray-400 mt-1">
                      📅 Échéance : {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                {goal.is_achieved && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                    ✓ Atteint
                  </span>
                )}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {formatAmount(goal.current_amount)} / {formatAmount(goal.target_amount)} FCFA
                  </span>
                  <span className="font-semibold text-green-600">{goal.progress_percentage}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    setShowContributeModal(true);
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all"
                >
                  <span>➕</span>
                  <span>Ajouter</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    loadHistory(goal.id);
                    setShowHistoryModal(true);
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
                >
                  <span>📜</span>
                  <span>Historique</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    setShowPlanModal(true);
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
                >
                  <span>💡</span>
                  <span>Plan</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setEditingGoal(goal);
                    setForm({
                      title: goal.title,
                      description: goal.description || '',
                      target_amount: goal.target_amount.toString(),
                      current_amount: goal.current_amount.toString(),
                      deadline: goal.deadline || '',
                      category: goal.category
                    });
                    setShowCreateModal(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-100 transition-all"
                >
                  <span>✏️</span>
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDeleteGoal(goal)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-200 hover:bg-red-100 transition-all"
                >
                  <span>🗑️</span>
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-500 mb-2">Aucun objectif trouvé</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-green-600 font-semibold text-sm"
            >
              Créer mon premier objectif →
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL CONTRIBUTION ── */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">➕ Ajouter à "{selectedGoal.title}"</h3>
              <button onClick={() => { setShowContributeModal(false); setContributeAmount(''); }}
                className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="mb-2 text-sm text-gray-600">
              Progression actuelle : {formatFull(selectedGoal.current_amount)} / {formatFull(selectedGoal.target_amount)}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA)</label>
              <input
                type="number"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="Ex: 50 000"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <button
              onClick={handleContribute}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL HISTORIQUE ── */}
      {showHistoryModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">📜 Historique — {selectedGoal.title}</h3>
              <button onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500">Aucune contribution enregistrée</p>
                <button
                  onClick={() => { setShowHistoryModal(false); setShowContributeModal(true); }}
                  className="mt-3 text-green-600 font-semibold text-sm"
                >
                  Faire ma première contribution →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-500 mb-2">
                  {contributions.length} contribution{contributions.length > 1 ? 's' : ''} —
                  Total : {new Intl.NumberFormat('fr-FR').format(
                    contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0)
                  )} FCFA
                </div>
                {contributions.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span>➕</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-700">
                          +{new Intl.NumberFormat('fr-FR').format(c.amount)} FCFA
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {c.note && <p className="text-xs text-gray-500 truncate">{c.note}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteContribution(c.id, selectedGoal.id)}
                      className="text-red-400 hover:text-red-600 text-sm flex-shrink-0"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL PLAN D'ATTEINTE ── */}
      {showPlanModal && selectedGoal && (() => {
        const plan = computePlan(selectedGoal);
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold">💡 Plan d'atteinte</h3>
                <button onClick={() => setShowPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
              </div>

              {/* Objectif */}
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <div className="font-bold text-gray-900 mb-1">{selectedGoal.title}</div>
                <div className="text-sm text-gray-600">
                  Reste à épargner : <span className="font-bold text-green-700">{formatFull(plan.remaining)}</span>
                </div>
                {plan.monthsLeft && (
                  <div className="text-sm text-gray-600">
                    Deadline dans : <span className="font-bold">{plan.monthsLeft} mois</span>
                  </div>
                )}
              </div>

              {/* Pour atteindre la deadline */}
              {plan.monthlyNeeded && (
                <div className={`rounded-xl p-4 mb-4 border-2 ${
                  plan.deadlineFeasible
                    ? 'bg-green-50 border-green-300'
                    : 'bg-amber-50 border-amber-300'
                }`}>
                  <div className="font-semibold text-gray-900 mb-1">
                    {plan.deadlineFeasible ? '✅' : '⚠️'} Pour respecter la deadline
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatFull(plan.monthlyNeeded)}/mois
                  </div>
                  {plan.deadlineFeasible ? (
                    <p className="text-sm text-green-700">
                      C'est faisable avec ton solde mensuel actuel de {formatFull(plan.monthlyBalance)} !
                    </p>
                  ) : (
                    <p className="text-sm text-amber-700">
                      Ton solde actuel ({formatFull(plan.monthlyBalance)}/mois) ne suffit pas.
                      Il te faudra {formatFull(plan.monthlyNeeded - plan.monthlyBalance)} de plus chaque mois.
                    </p>
                  )}
                </div>
              )}

              {/* Scénarios */}
              {plan.scenarios.length > 0 ? (
                <div>
                  <div className="font-semibold text-gray-700 mb-3">📊 Scénarios possibles</div>
                  <div className="space-y-3">
                    {plan.scenarios.map((s, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">{s.label}</span>
                          <span className="text-sm font-bold text-gray-900">{formatFull(s.amount)}/mois</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ⏱️ Objectif atteint en <span className="font-semibold text-green-700">{s.months} mois</span>
                          {s.months >= 12 && ` (${(s.months / 12).toFixed(1)} ans)`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm">
                    Enregistre tes revenus et dépenses pour voir des scénarios personnalisés.
                  </p>
                  <button
                    onClick={() => { setShowPlanModal(false); onNavigate('transactions'); }}
                    className="mt-2 text-green-600 font-semibold text-sm"
                  >
                    Aller aux transactions →
                  </button>
                </div>
              )}

              {/* Conseil */}
              {plan.monthlyBalance > 0 && plan.remaining > 0 && (
                <div className="mt-4 bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💬 <strong>Conseil Yoonu Dal :</strong> Ton enveloppe Projets est faite pour ça.
                    Commence par y allouer{' '}
                    <strong>{formatFull(projetsBudget > 0 ? Math.ceil(projetsBudget * 0.5) : Math.ceil(plan.monthlyBalance * 0.25))}</strong>/mois
                    et augmente progressivement.
                  </p>
                </div>
              )}

              <button
                onClick={() => { setShowPlanModal(false); setShowContributeModal(true); }}
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all"
              >
                ➕ Faire une contribution maintenant
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL CRÉATION/ÉDITION ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingGoal ? '✏️ Modifier' : '🎯 Nouvel objectif'}
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); setEditingGoal(null); setForm(emptyForm()); }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="Ex: Acheter un terrain"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Détails de l'objectif..."
                  rows="2"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant cible (FCFA) *</label>
                  <input
                    type="number"
                    value={form.target_amount}
                    onChange={(e) => setForm({...form, target_amount: e.target.value})}
                    placeholder="Ex: 3 000 000"
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Échéance *</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({...form, deadline: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingGoal(null); setForm(emptyForm()); }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {editingGoal ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
