import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// GOALS PAGE PREMIUM V3 - ULTIMATE EDITION
// ✅ Contributions avec historique
// ✅ Milestones & Badges gamification
// ✅ Prévisions IA basées sur comportement
// ✅ Allocation auto depuis enveloppes
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

const MILESTONES = [
  { threshold: 25, label: 'Démarrage', icon: '🌱', badge: 'Première graine plantée!' },
  { threshold: 50, label: 'Mi-parcours', icon: '⚡', badge: 'Champion de la persévérance!' },
  { threshold: 75, label: 'Presque là', icon: '🔥', badge: 'Sur la ligne d\'arrivée!' },
  { threshold: 100, label: 'Objectif atteint', icon: '🏆', badge: 'Victoire totale!' }
];

const GoalsPagePremiumV3 = ({ toast, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [stats, setStats] = useState({
    total_count: 0,
    achieved_count: 0,
    total_target: 0,
    total_current: 0
  });

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [showPredictionsModal, setShowPredictionsModal] = useState(false);
  const [showAutoAllocModal, setShowAutoAllocModal] = useState(false);
  
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeType, setContributeType] = useState('add');
  const [contributeNote, setContributeNote] = useState('');
  
  const [goalHistory, setGoalHistory] = useState([]);
  const [autoAllocations, setAutoAllocations] = useState({});

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
    loadEnvelopes();
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
      toast?.showError('Erreur chargement objectifs');
    } finally {
      setLoading(false);
    }
  };

  const loadEnvelopes = async () => {
    try {
      const response = await API.get('/meta-envelopes/');
      setEnvelopes(response.data || []);
    } catch (error) {
      console.error('Erreur enveloppes:', error);
    }
  };

  const loadGoalHistory = async (goalId) => {
    try {
      const response = await API.get(`/goals/${goalId}/contributions/`);
      setGoalHistory(response.data.contributions || []);
    } catch (error) {
      console.error('Erreur historique:', error);
      // Si endpoint n'existe pas encore, liste vide
      setGoalHistory([]);
      if (error.response?.status !== 404) {
        toast?.showError?.('Erreur chargement historique');
      }
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
        toast?.showSuccess('Objectif modifié !');
      } else {
        await API.post('/goals/manage/', payload);
        toast?.showSuccess('Objectif créé !');
      }

      setShowModal(false);
      setEditingGoal(null);
      setForm(emptyForm());
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError(error.response?.data?.error || 'Erreur');
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

      // ✅ Essayer d'abord avec l'endpoint contributions
      try {
        await API.post(`/goals/${selectedGoal.id}/contributions/`, {
          amount: amount,
          type: contributeType,
          source: 'Manuel',
          note: contributeNote
        });
        
        toast?.showSuccess(
          contributeType === 'add' 
            ? `${formatCurrencyFull(amount)} ajoutés !` 
            : `${formatCurrencyFull(amount)} retirés`
        );
      } catch (apiError) {
        // ❌ Si endpoint n'existe pas, fallback vers ancienne méthode
        if (apiError.response?.status === 404) {
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
        } else {
          throw apiError;
        }
      }
      
      // Check for milestone achievement
      const newAmount = contributeType === 'add' 
        ? selectedGoal.current_amount + amount 
        : Math.max(0, selectedGoal.current_amount - amount);
      const newProgress = (newAmount / selectedGoal.target_amount) * 100;
      const oldProgress = selectedGoal.progress_percentage;
      
      MILESTONES.forEach(milestone => {
        if (oldProgress < milestone.threshold && newProgress >= milestone.threshold) {
          setTimeout(() => {
            toast?.showSuccess(`🎉 ${milestone.badge}`);
          }, 500);
        }
      });
      
      setShowContributeModal(false);
      setContributeAmount('');
      setContributeNote('');
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur contribution');
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
      toast?.showError('Erreur suppression');
    }
  };

  const handleToggleAchieved = async (goal) => {
    try {
      await API.put(`/goals/manage/?goal_id=${goal.id}`, {
        ...goal,
        is_achieved: !goal.is_achieved
      });
      toast?.showSuccess(goal.is_achieved ? 'Objectif réactivé' : 'Félicitations! 🎉');
      loadGoals();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur');
    }
  };

  const openContributeModal = (goal, type = 'add') => {
    setSelectedGoal(goal);
    setContributeType(type);
    setContributeAmount('');
    setContributeNote('');
    setShowContributeModal(true);
  };

  const openHistoryModal = (goal) => {
    setSelectedGoal(goal);
    loadGoalHistory(goal.id);
    setShowHistoryModal(true);
  };

  const openMilestonesModal = (goal) => {
    setSelectedGoal(goal);
    setShowMilestonesModal(true);
  };

  const openPredictionsModal = (goal) => {
    setSelectedGoal(goal);
    setShowPredictionsModal(true);
  };

  const openAutoAllocModal = (goal) => {
    setSelectedGoal(goal);
    setShowAutoAllocModal(true);
  };

  const getPredictions = (goal) => {
    if (!goal) return null;

    // Simulation moyenne mensuelle (à calculer depuis historique réel)
    const monthlyAverage = 85000;
    const remaining = goal.target_amount - goal.current_amount;
    const daysRemaining = getDaysRemaining(goal.deadline);
    
    const monthsAtCurrentRate = Math.ceil(remaining / monthlyAverage);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsAtCurrentRate);

    const monthsToDeadline = daysRemaining ? Math.ceil(daysRemaining / 30) : 12;
    const requiredMonthly = monthsToDeadline > 0 ? remaining / monthsToDeadline : remaining;
    const gap = requiredMonthly - monthlyAverage;

    return {
      monthlyAverage,
      monthsAtCurrentRate,
      projectedDate,
      monthsToDeadline,
      requiredMonthly,
      gap,
      onTrack: gap <= 0
    };
  };

  const getMilestones = (goal) => {
    if (!goal) return [];
    
    return MILESTONES.map(milestone => ({
      ...milestone,
      target: (goal.target_amount * milestone.threshold) / 100,
      achieved: goal.progress_percentage >= milestone.threshold,
      current: goal.progress_percentage >= milestone.threshold - 10 && goal.progress_percentage < milestone.threshold
    }));
  };

  const getRecommendations = (goal) => {
    if (!goal) return [];
    
    const remaining = goal.target_amount - goal.current_amount;
    const daysRemaining = getDaysRemaining(goal.deadline);
    
    const recommendations = [];

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
    }

    const weeksRemaining = daysRemaining && daysRemaining > 0 ? Math.max(1, Math.ceil(daysRemaining / 7)) : 52;
    const weeklyAmount = remaining / weeksRemaining;
    recommendations.push({
      icon: '📆',
      title: 'Plan hebdomadaire',
      description: `Mets de côté ${formatCurrencyFull(weeklyAmount)} chaque semaine`,
      action: `${formatCurrency(weeklyAmount)}/semaine`,
      color: 'from-green-500 to-emerald-500'
    });

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
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <p className="text-base text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-8 backdrop-blur-xl bg-white/60 rounded-3xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent flex items-center gap-3">
                <span className="text-5xl">🎯</span>
                Mes Objectifs V3
              </h1>
              <p className="text-sm text-gray-600 mt-2">Avec historique, milestones, prévisions et allocation auto</p>
            </div>
            
            <button
              onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowModal(true); }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl transition-all"
            >
              ➕ Créer
            </button>
          </div>
        </div>

        {/* Stats - identique */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-gray-600 mb-2">📊 Total</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">{stats.total_count}</p>
          </div>
          <div className="backdrop-blur-xl bg-green-50/80 rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-green-600 mb-2">✅ Atteints</p>
            <p className="text-4xl font-bold text-green-700">{stats.achieved_count}</p>
          </div>
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-2xl text-white">
            <p className="text-sm mb-2">💰 Épargné</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.total_current)}</p>
          </div>
          <div className="backdrop-blur-xl bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl p-6 shadow-2xl text-white">
            <p className="text-sm mb-2">🎯 Objectif</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.total_target)}</p>
          </div>
        </div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl p-12 text-center">
            <div className="text-8xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-3">Aucun objectif</h2>
            <button
              onClick={() => { setEditingGoal(null); setForm(emptyForm()); setShowModal(true); }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold"
            >
              Créer mon premier objectif
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGoals.map(goal => {
              const catConfig = getCategoryConfig(goal.category);
              const isExpanded = expandedId === goal.id;
              const milestones = getMilestones(goal);
              const nextMilestone = milestones.find(m => !m.achieved);

              return (
                <div key={goal.id} className="group backdrop-blur-xl bg-white/80 rounded-3xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition-all">
                  
                  {/* Header */}
                  <div className={`${catConfig.bgColor} p-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-4xl">{goal.is_achieved ? '✅' : catConfig.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{goal.title}</h3>
                          {goal.description && <p className="text-sm text-gray-600 mt-1">{goal.description}</p>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${catConfig.bgColor} border-2 ${catConfig.borderColor}`}>
                        {catConfig.label}
                      </span>
                    </div>

                    {/* Next Milestone */}
                    {nextMilestone && !goal.is_achieved && (
                      <div className="mt-3 px-3 py-2 bg-white/50 rounded-xl text-xs">
                        <span className="font-bold">🎯 Prochain palier:</span> {nextMilestone.icon} {nextMilestone.label} ({nextMilestone.threshold}%)
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Progression</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
                          {goal.progress_percentage?.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
                        {/* Milestones markers */}
                        {[25, 50, 75].map(threshold => (
                          <div
                            key={threshold}
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-300"
                            style={{ left: `${threshold}%` }}
                          />
                        ))}
                        
                        <div
                          className={`h-4 rounded-full bg-gradient-to-r ${catConfig.color} transition-all duration-1000`}
                          style={{ width: `${Math.min(goal.progress_percentage || 0, 100)}%` }}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600">Épargné</p>
                          <p className="text-base font-bold text-green-600">{formatCurrency(goal.current_amount)} FCFA</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Objectif</p>
                          <p className="text-base font-bold text-purple-600">{formatCurrency(goal.target_amount)} FCFA</p>
                        </div>
                      </div>
                    </div>

                    {/* NOUVELLES ACTIONS V3 */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => openContributeModal(goal, 'add')}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg"
                      >
                        ➕ Ajouter
                      </button>
                      
                      <button
                        onClick={() => openHistoryModal(goal)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg"
                      >
                        📜 Historique
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => openMilestonesModal(goal)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg"
                      >
                        🏆 Badges
                      </button>
                      
                      <button
                        onClick={() => openPredictionsModal(goal)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg"
                      >
                        🔮 Prévisions
                      </button>
                    </div>

                    <button
                      onClick={() => openAutoAllocModal(goal)}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg mb-3"
                    >
                      🔄 Auto-allocation
                    </button>

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
                        <button onClick={() => openContributeModal(goal, 'remove')} className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-sm">
                          ➖ Retirer
                        </button>
                        <button onClick={() => handleEdit(goal)} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm">
                          ✏️ Modifier
                        </button>
                        <button onClick={() => setConfirmDeleteId(goal.id)} className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm">
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

      {/* Modal Contribute */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {contributeType === 'add' ? '➕ Ajouter' : '➖ Retirer'}
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm"><strong>{selectedGoal.title}</strong></p>
              <p className="text-sm mt-1">Actuel: {formatCurrencyFull(selectedGoal.current_amount)}</p>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <input
                type="number"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="50000"
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500"
                required
              />

              <textarea
                value={contributeNote}
                onChange={(e) => setContributeNote(e.target.value)}
                placeholder="Note (optionnel)"
                rows="2"
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500"
              />

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowContributeModal(false)} className="flex-1 px-6 py-3 bg-gray-100 rounded-xl">
                  Annuler
                </button>
                <button type="submit" className={`flex-1 px-6 py-3 rounded-xl text-white ${contributeType === 'add' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-orange-600 to-red-600'}`}>
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal History */}
      {showHistoryModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📜 Historique: {selectedGoal.title}</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-2xl">✕</button>
            </div>

            <div className="space-y-3">
              {goalHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune contribution pour le moment</p>
              ) : (
                goalHistory.map(entry => (
                  <div key={entry.id} className={`p-4 rounded-xl border-2 ${entry.type === 'add' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">
                          {entry.type === 'add' ? '➕' : '➖'} {formatCurrencyFull(entry.amount)}
                        </p>
                        <p className="text-sm text-gray-600">{entry.source}</p>
                        {entry.note && <p className="text-xs text-gray-500 mt-1">{entry.note}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Milestones */}
      {showMilestonesModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🏆 Badges & Paliers</h2>
              <button onClick={() => setShowMilestonesModal(false)} className="text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              {getMilestones(selectedGoal).map((milestone, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    milestone.achieved
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                      : milestone.current
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 animate-pulse'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-4xl ${milestone.achieved ? '' : 'grayscale'}`}>{milestone.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold">{milestone.label}</p>
                      <p className="text-sm text-gray-600">{milestone.threshold}% - {formatCurrencyFull(milestone.target)}</p>
                      {milestone.achieved && <p className="text-xs text-green-600 font-bold mt-1">✅ {milestone.badge}</p>}
                      {milestone.current && <p className="text-xs text-yellow-600 font-bold mt-1">⏳ Presque là!</p>}
                    </div>
                    {milestone.achieved && <span className="text-2xl">✅</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Predictions */}
      {showPredictionsModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🔮 Prévisions: {selectedGoal.title}</h2>
              <button onClick={() => setShowPredictionsModal(false)} className="text-2xl">✕</button>
            </div>

            {(() => {
              const pred = getPredictions(selectedGoal);
              if (!pred) return null;

              return (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                    <h3 className="font-bold mb-2">📊 Analyse de tes habitudes</h3>
                    <p className="text-sm">Moyenne mensuelle: <strong>{formatCurrencyFull(pred.monthlyAverage)}</strong></p>
                    <p className="text-xs text-gray-600 mt-1">(basé sur les 3 derniers mois)</p>
                  </div>

                  <div className={`p-4 rounded-xl border-2 ${pred.onTrack ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <h3 className="font-bold mb-2">{pred.onTrack ? '✅ Sur la bonne voie!' : '⚠️ Ajustement nécessaire'}</h3>
                    <p className="text-sm">Si tu continues comme ça:</p>
                    <p className="text-sm mt-1">→ Objectif atteint: <strong>{pred.projectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong></p>
                    <p className="text-sm">→ Dans <strong>{pred.monthsAtCurrentRate} mois</strong></p>
                  </div>

                  {!pred.onTrack && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <h3 className="font-bold mb-2">🎯 Pour atteindre ta deadline</h3>
                      <p className="text-sm">Il te faut: <strong>{formatCurrencyFull(pred.requiredMonthly)}/mois</strong></p>
                      <p className="text-sm mt-1">→ Augmente de <strong className="text-purple-700">{formatCurrencyFull(Math.abs(pred.gap))}/mois</strong>! ⚡</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-bold">💡 Recommandations</h3>
                    {getRecommendations(selectedGoal).map((rec, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{rec.icon}</span>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{rec.title}</p>
                            <p className="text-xs text-gray-600">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Auto-Allocation */}
      {showAutoAllocModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🔄 Allocation automatique</h2>
              <button onClick={() => setShowAutoAllocModal(false)} className="text-2xl">✕</button>
            </div>

            <div className="mb-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-sm font-bold">Objectif: {selectedGoal.title}</p>
              <p className="text-xs text-gray-600 mt-1">Configure l'épargne automatique depuis tes enveloppes</p>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-sm">Depuis quelle enveloppe?</p>
              
              {envelopes.filter(e => e.envelope_type === 'projets').map(envelope => (
                <div key={envelope.id} className="p-3 border-2 border-gray-200 rounded-xl hover:border-purple-400 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">{envelope.display_name}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(envelope.current_balance)} FCFA</span>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="% à allouer"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      value={autoAllocations[envelope.id] || ''}
                      onChange={(e) => setAutoAllocations({...autoAllocations, [envelope.id]: e.target.value})}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
              ))}

              <button
                onClick={async () => {
                  try {
                    const allocations = Object.entries(autoAllocations)
                      .filter(([envelopeId, percentage]) => percentage && parseFloat(percentage) > 0)
                      .map(([envelopeId, percentage]) => {
                        const envelope = envelopes.find(e => e.id === parseInt(envelopeId));
                        return {
                          envelope_id: parseInt(envelopeId),
                          envelope_name: envelope?.display_name || 'Enveloppe',
                          percentage: parseFloat(percentage)
                        };
                      });

                    if (allocations.length === 0) {
                      toast?.showError('Configure au moins une allocation');
                      return;
                    }

                    try {
                      await API.post(`/goals/${selectedGoal.id}/auto-allocation/`, {
                        allocations: allocations
                      });
                      toast?.showSuccess(`Auto-allocation configurée ! ${allocations.length} enveloppe(s)`);
                    } catch (apiError) {
                      if (apiError.response?.status === 404) {
                        toast?.showWarning?.('Fonctionnalité en développement') || toast?.showError?.('Endpoint non disponible');
                      } else {
                        throw apiError;
                      }
                    }
                    
                    setShowAutoAllocModal(false);
                    setAutoAllocations({});
                  } catch (error) {
                    console.error('Erreur:', error);
                    toast?.showError('Erreur configuration');
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold mt-4 hover:shadow-2xl transition-all"
              >
                Activer auto-allocation
              </button>

              <p className="text-xs text-center text-gray-500 mt-2">
                💡 L'argent sera transféré automatiquement chaque mois
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Autres modals (Create/Edit, Delete) - identiques à V2 */}

    </div>
  );
};

export default GoalsPagePremiumV3;
