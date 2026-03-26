import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// GOALS PAGE PHASE 1 - VERSION COMPLÈTE
// ✅ Filtres par catégorie
// ✅ Recherche
// ✅ Tri (date, progression, montant, deadline)
// ✅ Statistiques avancées
// ✅ Recommandations intelligentes
// ✅ Plans d'épargne calculés
// Design cohérent Dashboard, 100% responsive
// ==========================================

const CATEGORIES = [
  { value: 'urgence', label: 'Fonds d\'urgence', icon: '🚨' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'logement', label: 'Logement', icon: '🏠' },
  { value: 'loisirs', label: 'Loisirs', icon: '🎉' },
  { value: 'éducation', label: 'Éducation', icon: '📚' },
  { value: 'santé', label: 'Santé', icon: '💊' },
  { value: 'investissement', label: 'Investissement', icon: '📈' },
  { value: 'retraite', label: 'Retraite', icon: '🌴' },
  { value: 'autre', label: 'Autre', icon: '🎯' }
];

const GoalsPagePhase1 = ({ toast, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({
    total_count: 0,
    achieved_count: 0,
    total_target: 0,
    total_current: 0
  });

  // Filtres & Recherche & Tri
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form data
  const emptyForm = () => ({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
    category: 'autre'
  });
  const [form, setForm] = useState(emptyForm());
  const [contributeAmount, setContributeAmount] = useState('');

  useEffect(() => {
    loadGoals();
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
      console.error('Erreur:', error);
      toast?.showError?.('Erreur chargement objectifs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.target_amount) {
      toast?.showError?.('Remplis les champs obligatoires');
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount || 0),
        deadline: form.deadline || null,
        category: form.category
      };

      if (editingGoal) {
        await API.put(`/goals/manage/?goal_id=${editingGoal.id}`, payload);
        toast?.showSuccess?.('Objectif modifié !');
      } else {
        await API.post('/goals/manage/', payload);
        toast?.showSuccess?.('Objectif créé !');
      }

      setShowModal(false);
      setEditingGoal(null);
      setForm(emptyForm());
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError?.(error.response?.data?.error || 'Erreur');
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      toast?.showError?.('Entre un montant valide');
      return;
    }

    try {
      const amount = parseFloat(contributeAmount);
      const newAmount = selectedGoal.current_amount + amount;

      await API.put(`/goals/manage/?goal_id=${selectedGoal.id}`, {
        ...selectedGoal,
        current_amount: newAmount
      });

      toast?.showSuccess?.(`${amount.toLocaleString()} FCFA ajoutés !`);
      setShowContributeModal(false);
      setContributeAmount('');
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError?.('Erreur contribution');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline || '',
      category: goal.category
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/goals/manage/?goal_id=${id}`);
      toast?.showSuccess?.('Objectif supprimé');
      setConfirmDeleteId(null);
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError?.('Erreur suppression');
    }
  };

  const handleToggleAchieved = async (goal) => {
    try {
      await API.put(`/goals/manage/?goal_id=${goal.id}`, {
        ...goal,
        is_achieved: !goal.is_achieved
      });
      toast?.showSuccess?.(goal.is_achieved ? 'Objectif réactivé' : 'Félicitations! 🎉');
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError?.('Erreur');
    }
  };

  // Recommandations intelligentes
  const getRecommendations = (goal) => {
    if (!goal) return [];
    
    const remaining = goal.target_amount - goal.current_amount;
    const daysRemaining = getDaysRemaining(goal.deadline);
    const recommendations = [];

    if (remaining <= 0) {
      return [{
        icon: '🎉',
        title: 'Objectif atteint !',
        description: 'Félicitations ! Tu as atteint cet objectif.',
        value: formatCurrency(goal.current_amount),
        type: 'success'
      }];
    }

    // Plan mensuel
    if (daysRemaining && daysRemaining > 0) {
      const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
      const monthlyAmount = remaining / monthsRemaining;
      recommendations.push({
        icon: '📅',
        title: 'Plan mensuel',
        description: `Épargne ${formatCurrencyFull(monthlyAmount)} par mois`,
        value: `${monthsRemaining} mois restants`,
        type: 'info'
      });
    } else if (daysRemaining && daysRemaining < 0) {
      recommendations.push({
        icon: '⚠️',
        title: 'Deadline dépassée',
        description: `L'objectif devait être atteint il y a ${Math.abs(daysRemaining)} jours`,
        value: `Reste ${formatCurrency(remaining)} FCFA`,
        type: 'warning'
      });
    }

    // Plan hebdomadaire
    const weeksRemaining = daysRemaining && daysRemaining > 0 ? Math.ceil(daysRemaining / 7) : 52;
    const weeklyAmount = remaining / weeksRemaining;
    recommendations.push({
      icon: '📆',
      title: 'Plan hebdomadaire',
      description: `Mets de côté ${formatCurrencyFull(weeklyAmount)} chaque semaine`,
      value: `${weeksRemaining} semaines`,
      type: 'info'
    });

    // Plan quotidien
    const dailyDays = daysRemaining && daysRemaining > 0 ? daysRemaining : 365;
    const dailyAmount = remaining / dailyDays;
    recommendations.push({
      icon: '☀️',
      title: 'Épargne quotidienne',
      description: `Économise ${formatCurrencyFull(dailyAmount)} par jour`,
      value: `${dailyDays} jours`,
      type: 'info'
    });

    // Pourcentage atteint
    const pctAchieved = (goal.current_amount / goal.target_amount) * 100;
    if (pctAchieved >= 75) {
      recommendations.push({
        icon: '🚀',
        title: 'Presque là !',
        description: `Tu as déjà atteint ${pctAchieved.toFixed(0)}% de l\'objectif`,
        value: `Plus que ${formatCurrency(remaining)} FCFA`,
        type: 'success'
      });
    } else if (pctAchieved >= 50) {
      recommendations.push({
        icon: '🔥',
        title: 'Plus qu\'à mi-chemin !',
        description: `Tu as déjà atteint ${pctAchieved.toFixed(0)}% de l\'objectif`,
        value: `Encore ${formatCurrency(remaining)} FCFA`,
        type: 'success'
      });
    } else if (pctAchieved >= 25) {
      recommendations.push({
        icon: '💪',
        title: 'Bon départ !',
        description: `Tu as atteint ${pctAchieved.toFixed(0)}% de l\'objectif`,
        value: `Continue comme ça !`,
        type: 'info'
      });
    }

    return recommendations;
  };

  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
  };

  const getCategoryConfig = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filtres & Tri
  const filteredAndSortedGoals = goals
    .filter(goal => {
      const matchesCategory = filterCategory === 'all' || goal.category === filterCategory;
      const matchesSearch = !searchQuery ||
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return (b.progress_percentage || 0) - (a.progress_percentage || 0);
        case 'amount':
          return b.target_amount - a.target_amount;
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        case 'recent':
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

  // Statistiques avancées
  const advancedStats = {
    avgProgress: goals.length > 0 
      ? goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length 
      : 0,
    nearCompletion: goals.filter(g => g.progress_percentage >= 75 && !g.is_achieved).length,
    overdue: goals.filter(g => {
      const days = getDaysRemaining(g.deadline);
      return days !== null && days < 0 && !g.is_achieved;
    }).length,
    totalRemaining: goals.reduce((sum, g) => sum + (g.target_amount - g.current_amount), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-6 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl">🎯</span>
                <span>Mes Objectifs</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Définis et atteins tes objectifs financiers</p>
            </div>
            
            <button
              onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowModal(true); }}
              className="w-full sm:w-auto bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              + Créer un objectif
            </button>
          </div>
        </div>

        {/* Stats Enrichies */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total objectifs</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_count}</p>
            <p className="text-xs text-green-600 mt-1">{advancedStats.avgProgress.toFixed(0)}% moy.</p>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Atteints</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.achieved_count}</p>
            {advancedStats.nearCompletion > 0 && (
              <p className="text-xs text-gray-500 mt-1">{advancedStats.nearCompletion} proche(s)</p>
            )}
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total épargné</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{formatCurrency(stats.total_current)}</p>
            <p className="text-xs text-gray-500 mt-1">/ {formatCurrency(stats.total_target)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Reste</p>
            <p className="text-base sm:text-lg font-bold text-orange-600 truncate">{formatCurrency(advancedStats.totalRemaining)}</p>
            {advancedStats.overdue > 0 && (
              <p className="text-xs text-red-600 mt-1">{advancedStats.overdue} en retard</p>
            )}
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un objectif..."
                  className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Tri */}
            <div className="w-full lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="recent">➡️ Plus récents</option>
                <option value="progress">📊 Progression</option>
                <option value="amount">💰 Montant</option>
                <option value="deadline">📅 Échéance</option>
              </select>
            </div>
          </div>

          {/* Filtres catégories */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                filterCategory === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({goals.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = goals.filter(g => g.category === cat.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    filterCategory === cat.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Goals List */}
        {filteredAndSortedGoals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-6xl mb-4">
              {goals.length === 0 ? '🎯' : '🔍'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {goals.length === 0 ? 'Aucun objectif' : 'Aucun résultat'}
            </h2>
            <p className="text-gray-600 mb-6">
              {goals.length === 0 
                ? 'Crée ton premier objectif financier'
                : 'Essaie de modifier tes filtres'}
            </p>
            {goals.length === 0 && (
              <button
                onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowModal(true); }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Créer mon premier objectif
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAndSortedGoals.map(goal => {
              const catConfig = getCategoryConfig(goal.category);
              const isExpanded = expandedId === goal.id;
              const daysRemaining = getDaysRemaining(goal.deadline);

              return (
                <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  
                  {/* Header */}
                  <div className="bg-gray-50 border-b border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-3xl flex-shrink-0">{goal.is_achieved ? '✅' : catConfig.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{goal.title}</h3>
                          {goal.description && <p className="text-sm text-gray-600 line-clamp-1">{goal.description}</p>}
                        </div>
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium flex-shrink-0 ml-2">
                        {catConfig.label}
                      </span>
                    </div>

                    {goal.deadline && (
                      <div className="mt-2 text-xs text-gray-600">
                        📅 {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                        {daysRemaining !== null && (
                          <span className={
                            daysRemaining < 0 ? 'text-red-600 font-medium ml-2' :
                            daysRemaining < 30 ? 'text-orange-600 font-medium ml-2' : 'ml-2'
                          }>
                            ({daysRemaining > 0 ? `${daysRemaining}j restants` : `${Math.abs(daysRemaining)}j retard`})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Progression</span>
                        <span className="text-xs sm:text-sm font-bold text-green-600">
                          {goal.progress_percentage?.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
                        <div
                          className="h-2.5 sm:h-3 bg-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(goal.progress_percentage || 0, 100)}%` }}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-600">Épargné</p>
                          <p className="font-bold text-green-600 truncate">{formatCurrency(goal.current_amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Objectif</p>
                          <p className="font-bold text-gray-900 truncate">{formatCurrency(goal.target_amount)}</p>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Reste: <span className="font-medium text-gray-700">{formatCurrency(goal.target_amount - goal.current_amount)}</span>
                      </div>
                    </div>

                    {/* Actions principales */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        onClick={() => { setSelectedGoal(goal); setContributeAmount(''); setShowContributeModal(true); }}
                        className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700"
                      >
                        + Ajouter
                      </button>
                      
                      <button
                        onClick={() => { setSelectedGoal(goal); setShowRecommendationsModal(true); }}
                        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700"
                      >
                        💡 Plan
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleAchieved(goal)}
                      className={`w-full mb-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium ${
                        goal.is_achieved 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {goal.is_achieved ? '↩ Réactiver' : '✓ Atteint'}
                    </button>

                    {/* More actions */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
                    >
                      {isExpanded ? '▲ Masquer' : '▼ Plus d\'actions'}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-2">
                        <button
                          onClick={() => handleEdit(goal)}
                          className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-100"
                        >
                          ✏ Modifier
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(goal.id)}
                          className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-100"
                        >
                          🗑 Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-4 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingGoal(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="Ex: Acheter une voiture"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Détails..."
                  rows="2"
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({...form, category: cat.value})}
                      className={`p-2 sm:p-3 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                        form.category === cat.value
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <div className="text-xl sm:text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs truncate">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Montant objectif *</label>
                  <input
                    type="number"
                    value={form.target_amount}
                    onChange={(e) => setForm({...form, target_amount: e.target.value})}
                    placeholder="5000000"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Montant actuel</label>
                  <input
                    type="number"
                    value={form.current_amount}
                    onChange={(e) => setForm({...form, current_amount: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date limite (optionnel)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({...form, deadline: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingGoal(null); }}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 text-sm sm:text-base"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm sm:text-base"
                >
                  {editingGoal ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Contribute */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ajouter de l'argent</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900">{selectedGoal.title}</p>
              <p className="text-xs text-gray-600 mt-1">Montant actuel: {formatCurrencyFull(selectedGoal.current_amount)}</p>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Recommandations */}
      {showRecommendationsModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">💡 Plan: {selectedGoal.title}</h2>
              <button onClick={() => setShowRecommendationsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Objectif</p>
                  <p className="font-bold text-gray-900">{formatCurrencyFull(selectedGoal.target_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Épargné</p>
                  <p className="font-bold text-green-600">{formatCurrencyFull(selectedGoal.current_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Progression</p>
                  <p className="font-bold text-gray-900">{selectedGoal.progress_percentage?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Reste</p>
                  <p className="font-bold text-orange-600">{formatCurrencyFull(selectedGoal.target_amount - selectedGoal.current_amount)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {getRecommendations(selectedGoal).map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    rec.type === 'success' ? 'bg-green-50 border-green-200' :
                    rec.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl flex-shrink-0">{rec.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{rec.title}</h3>
                      <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-200">
                        {rec.value}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRecommendationsModal(false)}
              className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer l'objectif ?</h3>
              <p className="text-gray-600 mb-6">Cette action est irréversible</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default GoalsPagePhase1;
