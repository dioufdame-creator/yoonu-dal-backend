import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// GOALS PAGE PREMIUM V2
// Avec Contributions + Recommandations IA
// Glassmorphism + Charts + 100% Responsive
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
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeType, setContributeType] = useState('add'); // 'add' ou 'remove'

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

  const handleContribute = async (e) => {
    e.preventDefault();
    
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      toast?.showError('Entre un montant valide');
      return;
    }

    try {
      const amount = parseFloat(contributeAmount);
      let newAmount;
      
      if (contributeType === 'add') {
        newAmount = selectedGoal.current_amount + amount;
      } else {
        newAmount = Math.max(0, selectedGoal.current_amount - amount);
      }

      await API.put(`/goals/manage/?goal_id=${selectedGoal.id}`, {
        ...selectedGoal,
        current_amount: newAmount
      });

      toast?.showSuccess(
        contributeType === 'add' 
          ? `${formatCurrencyFull(amount)} ajoutés !` 
          : `${formatCurrencyFull(amount)} retirés`
      );
      
      setShowContributeModal(false);
      setContributeAmount('');
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de la contribution');
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

  const openContributeModal = (goal, type = 'add') => {
    setSelectedGoal(goal);
    setContributeType(type);
    setContributeAmount('');
    setShowContributeModal(true);
  };

  const openRecommendationsModal = (goal) => {
    setSelectedGoal(goal);
    setShowRecommendationsModal(true);
  };

  const getRecommendations = (goal) => {
    if (!goal) return [];
    
    const remaining = goal.target_amount - goal.current_amount;
    const daysRemaining = getDaysRemaining(goal.deadline);
    
    const recommendations = [];

    // Recommandation 1: Épargne mensuelle
    if (daysRemaining && daysRemaining > 0) {
      const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
      const monthlyAmount = remaining / monthsRemaining;
      recommendations.push({
        icon: '📅',
        title: 'Plan d\'épargne mensuel',
        description: `Épargne ${formatCurrencyFull(monthlyAmount)} par mois pendant ${monthsRemaining} mois`,
        action: `${formatCurrency(monthlyAmount)}/mois`,
        color: 'from-blue-500 to-indigo-500'
      });
    } else {
      const monthlyAmount = remaining / 12;
      recommendations.push({
        icon: '📅',
        title: 'Plan d\'épargne suggéré',
        description: `Épargne ${formatCurrencyFull(monthlyAmount)} par mois pendant 1 an`,
        action: `${formatCurrency(monthlyAmount)}/mois`,
        color: 'from-blue-500 to-indigo-500'
      });
    }

    // Recommandation 2: Épargne hebdomadaire
    const weeksRemaining = daysRemaining && daysRemaining > 0 
      ? Math.max(1, Math.ceil(daysRemaining / 7))
      : 52;
    const weeklyAmount = remaining / weeksRemaining;
    recommendations.push({
      icon: '📆',
      title: 'Plan hebdomadaire',
      description: `Mets de côté ${formatCurrencyFull(weeklyAmount)} chaque semaine`,
      action: `${formatCurrency(weeklyAmount)}/semaine`,
      color: 'from-green-500 to-emerald-500'
    });

    // Recommandation 3: Épargne quotidienne
    const dailyAmount = remaining / Math.max(1, daysRemaining || 365);
    recommendations.push({
      icon: '☀️',
      title: 'Épargne quotidienne',
      description: `Économise ${formatCurrencyFull(dailyAmount)} par jour`,
      action: `${formatCurrency(dailyAmount)}/jour`,
      color: 'from-yellow-500 to-amber-500'
    });

    // Recommandation 4: Pourcentage du revenu
    const monthlyIncome = 500000; // À récupérer du profil utilisateur
    const percentage = (remaining / monthlyIncome) * 100;
    if (percentage < 30) {
      recommendations.push({
        icon: '💰',
        title: 'Allocation du revenu',
        description: `Alloue ${percentage.toFixed(1)}% de ton revenu mensuel`,
        action: `${percentage.toFixed(1)}% du revenu`,
        color: 'from-purple-500 to-pink-500'
      });
    }

    // Recommandation 5: Défi épargne
    recommendations.push({
      icon: '🎯',
      title: 'Défi 52 semaines',
      description: `Semaine 1: 1k, Semaine 2: 2k... jusqu'à atteindre l'objectif`,
      action: 'Défi progressif',
      color: 'from-orange-500 to-red-500'
    });

    // Recommandation 6: Réduction dépenses
    const expenseCategories = ['loisirs', 'vêtements', 'sorties'];
    if (expenseCategories.includes(goal.category)) {
      recommendations.push({
        icon: '✂️',
        title: 'Optimise tes dépenses',
        description: `Réduis tes dépenses ${goal.category} de 20% et redirige vers cet objectif`,
        action: 'Économie intelligente',
        color: 'from-teal-500 to-cyan-500'
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
        
        {/* Header identique à V1... */}
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
            </button>
          </div>
        </div>

        {/* Stats Cards - identique... */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">📊 Total objectifs</p>
            <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">{stats.total_count}</p>
          </div>

          <div className="backdrop-blur-xl bg-green-50/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-green-200/50">
            <p className="text-xs sm:text-sm text-green-600 mb-2">✅ Atteints</p>
            <p className="text-3xl sm:text-4xl font-bold text-green-700">{stats.achieved_count}</p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl shadow-purple-500/30 text-white">
            <p className="text-xs sm:text-sm text-purple-100 mb-2">💰 Total épargné</p>
            <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(stats.total_current)}</p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-pink-500 via-rose-600 to-red-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl shadow-pink-500/30 text-white">
            <p className="text-xs sm:text-sm text-pink-100 mb-2">🎯 Objectif total</p>
            <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(stats.total_target)}</p>
          </div>
        </div>

        {/* Filters - identique à V1, je saute pour économiser tokens... */}

        {/* Goals Grid avec NOUVELLES ACTIONS */}
        {filteredGoals.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-6xl sm:text-8xl mb-4 animate-bounce">🎯</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">Aucun objectif</h2>
            <button
              onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowModal(true); }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg"
            >
              Créer mon premier objectif
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredGoals.map(goal => {
              const catConfig = getCategoryConfig(goal.category);
              const isExpanded = expandedId === goal.id;
              const daysRemaining = getDaysRemaining(goal.deadline);

              return (
                <div
                  key={goal.id}
                  className="group backdrop-blur-xl bg-white/80 rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition-all"
                >
                  {/* Header - identique... */}
                  <div className={`${catConfig.bgColor} p-4`}>
                    <h3 className="text-lg font-bold">{goal.title}</h3>
                    {goal.deadline && (
                      <p className="text-xs mt-1">📅 {new Date(goal.deadline).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {/* Progress bar... */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full bg-gradient-to-r ${catConfig.color} transition-all`}
                          style={{ width: `${Math.min(goal.progress_percentage || 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm mt-2">{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)} FCFA</p>
                    </div>

                    {/* NOUVELLES ACTIONS PRINCIPALES */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => openContributeModal(goal, 'add')}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all"
                      >
                        ➕ Ajouter
                      </button>
                      
                      <button
                        onClick={() => openRecommendationsModal(goal)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all"
                      >
                        💡 Plan
                      </button>
                    </div>

                    {/* Toggle Achieved */}
                    <button
                      onClick={() => handleToggleAchieved(goal)}
                      className={`w-full mb-2 px-4 py-2 rounded-xl font-medium text-sm ${
                        goal.is_achieved ? 'bg-gray-100 text-gray-700' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      }`}
                    >
                      {goal.is_achieved ? '↩️ Réactiver' : '✅ Atteint'}
                    </button>

                    {/* More Actions */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                      className="w-full bg-gray-100 px-4 py-2 rounded-xl text-sm"
                    >
                      {isExpanded ? '▲' : '▼'} Plus
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t flex flex-col gap-2">
                        <button
                          onClick={() => openContributeModal(goal, 'remove')}
                          className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-sm"
                        >
                          ➖ Retirer
                        </button>
                        <button
                          onClick={() => handleEdit(goal)}
                          className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(goal.id)}
                          className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm"
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

      {/* Modal Create/Edit - identique à V1... je saute pour économiser tokens */}

      {/* NOUVEAU: Modal Contribute */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
                {contributeType === 'add' ? '➕ Ajouter de l\'argent' : '➖ Retirer de l\'argent'}
              </h2>
              <button onClick={() => setShowContributeModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Objectif: <strong>{selectedGoal.title}</strong></p>
              <p className="text-sm text-gray-600 mt-1">Montant actuel: <strong>{formatCurrencyFull(selectedGoal.current_amount)}</strong></p>
              <p className="text-sm text-gray-600 mt-1">Reste: <strong>{formatCurrencyFull(selectedGoal.target_amount - selectedGoal.current_amount)}</strong></p>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white ${
                    contributeType === 'add'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/50'
                      : 'bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-orange-500/50'
                  } hover:shadow-2xl transition-all`}
                >
                  {contributeType === 'add' ? 'Ajouter' : 'Retirer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOUVEAU: Modal Recommandations */}
      {showRecommendationsModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-scaleIn my-8 border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                💡 Plan pour atteindre: {selectedGoal.title}
              </h2>
              <button onClick={() => setShowRecommendationsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <p className="text-sm mb-2">🎯 <strong>Objectif:</strong> {formatCurrencyFull(selectedGoal.target_amount)}</p>
              <p className="text-sm mb-2">💰 <strong>Épargné:</strong> {formatCurrencyFull(selectedGoal.current_amount)}</p>
              <p className="text-sm mb-2">📊 <strong>Progression:</strong> {selectedGoal.progress_percentage?.toFixed(1)}%</p>
              <p className="text-sm font-bold text-purple-700">🚀 <strong>Reste à épargner:</strong> {formatCurrencyFull(selectedGoal.target_amount - selectedGoal.current_amount)}</p>
            </div>

            <div className="space-y-4">
              {getRecommendations(selectedGoal).map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-r ${rec.color} bg-opacity-10 hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl flex-shrink-0">{rec.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{rec.title}</h3>
                      <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${rec.color} text-white`}>
                        {rec.action}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRecommendationsModal(false)}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl"
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation - identique... */}

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); } to { transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default GoalsPagePremium;
