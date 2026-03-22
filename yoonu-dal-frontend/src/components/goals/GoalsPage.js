import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// GOALS PAGE PREMIUM V1
// Glassmorphism + Charts + 100% Responsive
// Match Envelopes & Tontines Premium Quality
// ==========================================

const CATEGORIES = [
  { value: 'urgence', label: 'Fonds d\'urgence', icon: '🚨', color: 'from-red-500 to-rose-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { value: 'transport', label: 'Transport', icon: '🚗', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { value: 'logement', label: 'Logement', icon: '🏠', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { value: 'loisirs', label: 'Loisirs', icon: '🎉', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { value: 'éducation', label: 'Éducation', icon: '📚', color: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { value: 'santé', label: 'Santé', icon: '💊', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { value: 'investissement', label: 'Investissement', icon: '📈', color: 'from-teal-500 to-cyan-500', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  { value: 'retraite', label: 'Retraite', icon: '🌴', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { value: 'autre', label: 'Autre', icon: '🎯', color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
];

const GoalsPagePremium = ({ toast, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({
    total_count: 0,
    achieved_count: 0,
    total_target: 0,
    total_current: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const emptyForm = () => ({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
    category: 'autre'
  });
  const [form, setForm] = useState(emptyForm());

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
      toast?.showError('Erreur lors du chargement des objectifs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.target_amount) {
      toast?.showError('Remplis les champs obligatoires');
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
        toast?.showSuccess('Objectif modifié avec succès');
      } else {
        await API.post('/goals/manage/', payload);
        toast?.showSuccess('Objectif créé avec succès');
      }

      setShowModal(false);
      setEditingGoal(null);
      setForm(emptyForm());
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
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
      toast?.showSuccess('Objectif supprimé');
      setConfirmDeleteId(null);
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de la suppression');
    }
  };

  const handleToggleAchieved = async (goal) => {
    try {
      await API.put(`/goals/manage/?goal_id=${goal.id}`, {
        ...goal,
        is_achieved: !goal.is_achieved
      });
      toast?.showSuccess(goal.is_achieved ? 'Objectif réactivé' : 'Objectif marqué comme atteint !');
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de la mise à jour');
    }
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

  const filteredGoals = goals.filter(goal => {
    const matchesCategory = filterCategory === 'all' || goal.category === filterCategory;
    const matchesSearch = !searchQuery ||
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-pink-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Chargement de vos objectifs...</p>
          <div className="flex gap-1 justify-center mt-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
        
        {/* Header PREMIUM */}
        <div className="mb-6 sm:mb-8 backdrop-blur-xl bg-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-900 via-pink-900 to-indigo-900 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl lg:text-5xl">🎯</span>
                <span>Mes Objectifs</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                Définis et atteins tes objectifs financiers
              </p>
            </div>
            
            <button
              onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowModal(true); }}
              className="group relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto"
            >
              <span className="text-xl sm:text-2xl group-hover:rotate-180 transition-transform duration-500">➕</span>
              <span className="hidden xs:inline">Nouvel objectif</span>
              <span className="xs:hidden">Créer</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Stats Cards PREMIUM */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">📊 Total objectifs</p>
            <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">{stats.total_count}</p>
            <p className="text-xs text-gray-500 mt-1">Objectifs actifs</p>
          </div>

          <div className="backdrop-blur-xl bg-green-50/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-green-200/50">
            <p className="text-xs sm:text-sm text-green-600 mb-2">✅ Atteints</p>
            <p className="text-3xl sm:text-4xl font-bold text-green-700">{stats.achieved_count}</p>
            <p className="text-xs text-green-600 mt-1">
              {stats.total_count > 0 ? Math.round((stats.achieved_count / stats.total_count) * 100) : 0}% de succès
            </p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl shadow-purple-500/30 text-white relative overflow-hidden">
            <div className="hidden sm:block absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10">
              <p className="text-xs sm:text-sm text-purple-100 mb-2">💰 Total épargné</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">{formatCurrency(stats.total_current)}</p>
              <p className="text-xs text-purple-100">{formatCurrencyFull(stats.total_current)}</p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-pink-500 via-rose-600 to-red-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl shadow-pink-500/30 text-white relative overflow-hidden">
            <div className="hidden sm:block absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10">
              <p className="text-xs sm:text-sm text-pink-100 mb-2">🎯 Objectif total</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">{formatCurrency(stats.total_target)}</p>
              <p className="text-xs text-pink-100">{formatCurrencyFull(stats.total_target)}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un objectif..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm bg-white/90 transition-all"
                />
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl">🔍</span>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all transform hover:scale-105 ${
                  filterCategory === 'all'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔥 Tous
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all transform hover:scale-105 ${
                    filterCategory === cat.value
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-6xl sm:text-8xl mb-4 animate-bounce">🎯</div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent mb-3">
              {goals.length === 0 ? 'Aucun objectif' : 'Aucun résultat'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {goals.length === 0
                ? 'Crée ton premier objectif financier pour commencer'
                : 'Essaie de modifier tes filtres de recherche'}
            </p>
            {goals.length === 0 && (
              <button
                onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowModal(true); }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all"
              >
                Créer mon premier objectif
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredGoals.map(goal => {
              const catConfig = getCategoryConfig(goal.category);
              const isExpanded = expandedId === goal.id;
              const daysRemaining = getDaysRemaining(goal.deadline);
              const isUrgent = daysRemaining !== null && daysRemaining < 30 && daysRemaining > 0;
              const isOverdue = daysRemaining !== null && daysRemaining < 0;

              return (
                <div
                  key={goal.id}
                  className={`group backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl border-2 ${goal.is_achieved ? 'border-green-300' : catConfig.borderColor} overflow-hidden hover:shadow-2xl transition-all duration-500 sm:transform sm:hover:scale-105 ${goal.is_achieved ? 'opacity-75' : ''}`}
                >
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Header */}
                  <div className={`relative ${catConfig.bgColor} border-b-2 ${catConfig.borderColor} p-4 sm:p-6`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-3xl sm:text-4xl flex-shrink-0 ${goal.is_achieved ? 'grayscale' : ''}`}>
                          {goal.is_achieved ? '✅' : catConfig.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold ${catConfig.bgColor} ${catConfig.borderColor} border-2`}>
                        {catConfig.label}
                      </span>
                    </div>

                    {/* Deadline */}
                    {goal.deadline && (
                      <div className={`text-xs sm:text-sm font-medium ${
                        isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        📅 Échéance: {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                        {daysRemaining !== null && (
                          <span className="ml-2">
                            ({daysRemaining > 0 ? `${daysRemaining} jours restants` : `${Math.abs(daysRemaining)} jours de retard`})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="relative p-4 sm:p-6">
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Progression</span>
                        <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
                          {goal.progress_percentage?.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-3 sm:h-4 shadow-inner overflow-hidden">
                        <div
                          className={`h-3 sm:h-4 rounded-full bg-gradient-to-r ${catConfig.color} transition-all duration-1000 relative overflow-hidden`}
                          style={{ width: `${Math.min(goal.progress_percentage || 0, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600">Épargné</p>
                          <p className="text-sm sm:text-base font-bold text-green-600">{formatCurrency(goal.current_amount)} FCFA</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Objectif</p>
                          <p className="text-sm sm:text-base font-bold text-purple-600">{formatCurrency(goal.target_amount)} FCFA</p>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Reste à économiser: <span className="font-bold">{formatCurrency(goal.target_amount - goal.current_amount)} FCFA</span>
                      </div>
                    </div>

                    {/* Toggle Achieved */}
                    <button
                      onClick={() => handleToggleAchieved(goal)}
                      className={`w-full mb-3 px-4 py-2.5 rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base transition-all transform hover:scale-105 ${
                        goal.is_achieved
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
                      }`}
                    >
                      {goal.is_achieved ? '↩️ Réactiver' : '✅ Marquer comme atteint'}
                    </button>

                    {/* Expand Actions */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <span>{isExpanded ? '▲' : '▼'}</span>
                      <span>{isExpanded ? 'Masquer' : 'Plus d\'actions'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2 animate-fadeIn">
                        <button
                          onClick={() => handleEdit(goal)}
                          className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2.5 rounded-xl font-medium text-sm sm:text-base hover:shadow-lg transition-all transform hover:scale-105"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(goal.id)}
                          className="w-full bg-gradient-to-r from-red-50 to-rose-50 text-red-700 px-4 py-2.5 rounded-xl font-medium text-sm sm:text-base hover:shadow-lg transition-all transform hover:scale-105"
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
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn overflow-y-auto py-8">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-8 animate-scaleIn my-auto max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
                {editingGoal ? '✏️ Modifier l\'objectif' : '➕ Nouvel objectif'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingGoal(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="Ex: Acheter une voiture"
                  className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Détails de l'objectif..."
                  rows="3"
                  className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({...form, category: cat.value})}
                      className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 text-xs sm:text-sm font-medium transition-all transform hover:scale-105 ${
                        form.category === cat.value
                          ? `bg-gradient-to-br ${cat.color} text-white border-white shadow-lg`
                          : `${cat.bgColor} ${cat.borderColor}`
                      }`}
                    >
                      <div className="text-xl sm:text-2xl mb-1">{cat.icon}</div>
                      <div className="line-clamp-1">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant objectif *</label>
                  <input
                    type="number"
                    value={form.target_amount}
                    onChange={(e) => setForm({...form, target_amount: e.target.value})}
                    placeholder="5000000"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant actuel</label>
                  <input
                    type="number"
                    value={form.current_amount}
                    onChange={(e) => setForm({...form, current_amount: e.target.value})}
                    placeholder="0"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date limite (optionnel)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({...form, deadline: e.target.value})}
                  className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingGoal(null); }}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                >
                  {editingGoal ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-scaleIn border border-white/20">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Supprimer l'objectif ?</h3>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
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
        }
      `}</style>
    </div>
  );
};

export default GoalsPagePremium;
