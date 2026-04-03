import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const GoalsPage = ({ toast, onNavigate }) => {
  // États principaux
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [stats, setStats] = useState({
    total_count: 0,
    achieved_count: 0,
    total_target: 0,
    total_current: 0
  });

  // Filtres
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Modals
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAutoAllocModal, setShowAutoAllocModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Données modals
  const [contributions, setContributions] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [badges, setBadges] = useState([]);
  const [contributeAmount, setContributeAmount] = useState('');

  const CATEGORIES = [
    { value: 'all', label: 'Tous', icon: '🎯' },
    { value: 'urgence', label: 'Urgence', icon: '🚨' },
    { value: 'logement', label: 'Logement', icon: '🏠' },
    { value: 'transport', label: 'Transport', icon: '🚗' },
    { value: 'education', label: 'Éducation', icon: '📚' },
    { value: 'sante', label: 'Santé', icon: '🏥' },
    { value: 'loisirs', label: 'Loisirs', icon: '🎭' },
    { value: 'famille', label: 'Famille', icon: '👨‍👩‍👧‍👦' },
    { value: 'investissement', label: 'Investissement', icon: '💰' },
    { value: 'autre', label: 'Autre', icon: '📌' }
  ];

  // Fonction formatage montants
  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

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
      toast?.showError?.('Erreur chargement objectifs');
    } finally {
      setLoading(false);
    }
  };

  const loadEnvelopes = async () => {
    try {
      const response = await API.get('/meta-envelopes/');
      setEnvelopes(response.data || []);
    } catch (error) {
      console.error('Erreur envelopes:', error);
    }
  };

  const loadHistory = async (goalId) => {
    try {
      const response = await API.get(`/goals/${goalId}/contributions/`);
      console.log('🔍 HISTORIQUE:', response.data);
      setContributions(response.data.contributions || []);
    } catch (error) {
      console.error('Erreur historique:', error);
      setContributions([]);
    }
  };

  const loadAutoAlloc = async (goalId) => {
    try {
      const response = await API.get(`/goals/${goalId}/auto-allocation/`);
      setAllocations(response.data.allocations || []);
    } catch (error) {
      console.error('Erreur auto-alloc:', error);
      setAllocations([]);
    }
  };

  const loadBadges = async (goalId) => {
    try {
      const response = await API.get(`/goals/${goalId}/milestones/`);
      setBadges(response.data.badges || []);
    } catch (error) {
      console.error('Erreur badges:', error);
      setBadges([]);
    }
  };

  const handleContribute = async () => {
    console.log('🎯 handleContribute appelé');
    console.log('🎯 contributeAmount:', contributeAmount);
    console.log('🎯 selectedGoal:', selectedGoal);

    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      alert('Montant invalide');
      return;
    }

    const amount = parseFloat(contributeAmount);
    console.log('🎯 Amount parsed:', amount);

    try {
      // Essayer Phase 2
      console.log('🔄 Tentative Phase 2...');
      try {
        const response = await API.post(`/goals/${selectedGoal.id}/contributions/`, {
          amount: amount,
          type: 'add',
          source: 'Manuel',
          note: ''
        });
        console.log('✅ Phase 2 contribution OK:', response.data);
      } catch (err) {
        console.log('❌ Phase 2 erreur:', err.response?.status, err.response?.data);
        
        // Fallback Phase 1
        if (err.response?.status === 404) {
          console.log('⚠️ Fallback Phase 1 - Endpoint:', `/goals/manage/?goal_id=${selectedGoal.id}`);
          console.log('⚠️ Payload:', { current_amount: selectedGoal.current_amount + amount });
          
          const response = await API.put(`/goals/manage/?goal_id=${selectedGoal.id}`, {
            current_amount: selectedGoal.current_amount + amount
          });
          console.log('✅ Phase 1 OK:', response.data);
        } else {
          throw err;
        }
      }

      console.log('✅ Contribution réussie !');
      alert('Contribution ajoutée !');
      setShowContributeModal(false);
      setContributeAmount('');
      await loadGoals();
      console.log('✅ Goals rechargées');
    } catch (error) {
      console.error('❌ ERREUR FINALE:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      alert('Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  // Filtrage et tri
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
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6 pb-6 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mes Objectifs 🎯</h1>
        <p className="text-green-50 text-sm">Planifie et atteins tes objectifs financiers</p>
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
                ? ((goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length).toFixed(1))
                : 0}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-xs mb-1">Épargné</div>
            <div className="text-xl font-bold text-purple-600">
              {formatAmount(stats.total_current)}
            </div>
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

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
        >
          <option value="recent">➡️ Plus récents</option>
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
            <div key={goal.id} className="bg-white rounded-lg shadow-md p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="font-bold text-gray-900">{goal.title}</h3>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  )}
                </div>
                {goal.is_achieved && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                    ✓ Atteint
                  </span>
                )}
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {formatAmount(goal.current_amount)} / {formatAmount(goal.target_amount)} FCFA
                  </span>
                  <span className="font-semibold text-green-600">{goal.progress_percentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    setShowContributeModal(true);
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
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
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  <span>📜</span>
                  <span>Historique</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    loadAutoAlloc(goal.id);
                    setShowAutoAllocModal(true);
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                >
                  <span>⚡</span>
                  <span>Auto-épargne</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    loadBadges(goal.id);
                    setShowBadgesModal(true);
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium border border-yellow-200"
                >
                  <span>🏆</span>
                  <span>Badges</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-500">Aucun objectif trouvé</p>
          </div>
        )}
      </div>

      {/* Modal Contribution */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">💰 Ajouter à {selectedGoal.title}</h3>
              <button
                onClick={() => {
                  setShowContributeModal(false);
                  setContributeAmount('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="Ex: 50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base"
                />
              </div>

              <button
                onClick={handleContribute}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium"
              >
                ✓ Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {showHistoryModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">📜 Historique - {selectedGoal.title}</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {contributions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500">Aucune contribution encore</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contributions.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                      <span className="text-xl">
                        {c.type === 'add' ? '➕' : c.type === 'remove' ? '➖' : '⚡'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">
                          {c.type === 'remove' ? '-' : '+'}{formatAmount(c.amount)} FCFA
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(c.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{c.source}</p>
                      {c.note && <p className="text-xs text-gray-500 italic">{c.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Auto-Allocation */}
      {showAutoAllocModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">⚡ Auto-épargne - {selectedGoal.title}</h3>
              <button
                onClick={() => setShowAutoAllocModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                💡 Fonctionnalité disponible après migration backend Phase 2
              </p>
            </div>

            {allocations.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">⚡</div>
                <p className="text-gray-500">Aucune allocation configurée</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Badges */}
      {showBadgesModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🏆 Badges - {selectedGoal.title}</h3>
              <button
                onClick={() => setShowBadgesModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-5xl mb-2">
                {selectedGoal.progress_percentage >= 100 ? '🎉' :
                 selectedGoal.progress_percentage >= 75 ? '🚀' :
                 selectedGoal.progress_percentage >= 50 ? '🔥' :
                 selectedGoal.progress_percentage >= 25 ? '💪' : '🎯'}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedGoal.progress_percentage}% accompli
              </div>
            </div>

            {badges.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🏅</div>
                <p className="text-gray-500">Continue ! Les badges arrivent bientôt</p>
              </div>
            ) : (
              <div className="space-y-3">
                {badges.map((badge, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{badge.icon}</span>
                      <div>
                        <div className="font-bold text-gray-900">{badge.title}</div>
                        <p className="text-sm text-gray-600">{badge.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
