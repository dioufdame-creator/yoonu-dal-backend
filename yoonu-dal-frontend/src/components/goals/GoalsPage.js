import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const GoalsPage = () => {
  // États
  const [goals, setGoals] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  
  // Modals
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAutoAllocModal, setShowAutoAllocModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // Données
  const [contributions, setContributions] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [badges, setBadges] = useState([]);

  // Toast simple
  const showToast = (message) => {
    alert(message);
  };

  // Catégories
  const categories = [
    { id: 'all', name: 'Tous', icon: '🎯' },
    { id: 'urgence', name: 'Urgence', icon: '🚨' },
    { id: 'logement', name: 'Logement', icon: '🏠' },
    { id: 'transport', name: 'Transport', icon: '🚗' },
    { id: 'education', name: 'Éducation', icon: '📚' },
    { id: 'sante', name: 'Santé', icon: '🏥' },
    { id: 'loisirs', name: 'Loisirs', icon: '🎭' },
    { id: 'famille', name: 'Famille', icon: '👨\u200d👩\u200d👧\u200d👦' },
    { id: 'investissement', name: 'Investissement', icon: '💰' },
    { id: 'autre', name: 'Autre', icon: '📌' }
  ];

  useEffect(() => {
    fetchGoals();
    fetchEnvelopes();
  }, []);

  const fetchGoals = async () => {
    try {
  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k`;
    return amount.toString();
  };
      const response = await API.get('/goals/manage/');
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvelopes = async () => {
    try {
      const response = await API.get('/meta-envelopes/');
      setEnvelopes(response.data || []);
    } catch (error) {
      console.error('Erreur envelopes:', error);
    }
  };

  const fetchHistory = async (goalId) => {
    try {
      const response = await API.get(`/goals/${goalId}/contributions/`);
    console.log("🔍 HISTORIQUE:", response.data);
      setContributions(response.data.contributions || []);
    } catch (error) {
      console.error('Erreur historique:', error);
      setContributions([]);
    }
  };

  const fetchAutoAlloc = async (goalId) => {
    try {
      const response = await API.get(`/goals/${goalId}/auto-allocation/`);
      setAllocations(response.data.allocations || []);
    } catch (error) {
      console.error('Erreur auto-alloc:', error);
      setAllocations([]);
    }
  };

  const fetchBadges = async (goalId) => {
    try {
      const response = await API.get(`/goals/${goalId}/milestones/`);
      setBadges(response.data.badges || []);
    } catch (error) {
      console.error('Erreur badges:', error);
      setBadges([]);
    }
  };

  const openHistoryModal = (goal) => {
    setSelectedGoal(goal);
    fetchHistory(goal.id);
    setShowHistoryModal(true);
  };

  const openAutoAllocModal = (goal) => {
    setSelectedGoal(goal);
    fetchAutoAlloc(goal.id);
    setShowAutoAllocModal(true);
  };

  const openBadgesModal = (goal) => {
    setSelectedGoal(goal);
    fetchBadges(goal.id);
    setShowBadgesModal(true);
  };

  const handleContribution = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await API.post(`/goals/${selectedGoal.id}/contributions/`, {
        amount: formData.get('amount'),
        type: 'add',
        source: formData.get('source') || 'Manuel',
        note: formData.get('note') || ''
      });

      showToast('Contribution ajoutée !');
      setShowContributionModal(false);
      fetchGoals();
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur contribution');
    }
  };

  const handleAutoAlloc = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const allocationsData = [];
    
    envelopes.forEach((env) => {
      const percentage = formData.get(`envelope_${env.id}`);
      if (percentage && parseFloat(percentage) > 0) {
        allocationsData.push({
          envelope_id: env.id,
          percentage: parseFloat(percentage)
        });
      }
    });

    try {
      await API.post(`/goals/${selectedGoal.id}/auto-allocation/`, {
        allocations: allocationsData
      });

      showToast('Auto-allocation configurée !');
      setShowAutoAllocModal(false);
    } catch (error) {
      console.error('Erreur:', error);
      showToast(error.response?.data?.error || 'Erreur');
    }
  };

  // Filtrage et tri
  const filteredGoals = goals
    .filter(g => selectedCategory === 'all' || g.category === selectedCategory)
    .filter(g => 
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  // Stats
  const stats = {
    total: goals.length,
    achieved: goals.filter(g => g.is_achieved).length,
    avgProgress: goals.length > 0 
      ? (goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length).toFixed(1)
      : 0,
    totalSaved: goals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0)
  };

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
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mes Objectifs 🎯</h1>
        <p className="text-green-50 text-sm sm:text-base">Planifie et atteins tes objectifs financiers</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-8 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-gray-500 text-xs sm:text-sm mb-1">Total</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-gray-500 text-xs sm:text-sm mb-1">Atteints</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.achieved}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-gray-500 text-xs sm:text-sm mb-1">Progression</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.avgProgress}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="text-gray-500 text-xs sm:text-sm mb-1">Épargné</div>
            <div className="text-lg sm:text-xl font-bold text-purple-600">
              {formatAmount(stats.totalSaved)}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="px-4 mb-4 space-y-3">
        <input
          type="text"
          placeholder="🔍 Rechercher un objectif..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-all ${
                selectedCategory === cat.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="recent">➡️ Plus récents</option>
          <option value="progress">📊 Progression</option>
          <option value="amount">💰 Montant</option>
          <option value="deadline">📅 Deadline</option>
        </select>
      </div>

      {/* Liste objectifs */}
      <div className="px-4 space-y-4">
        {filteredGoals.map(goal => (
          <GoalCard 
            key={goal.id} 
            goal={goal}
            categories={categories}
            onContribute={() => { setSelectedGoal(goal); setShowContributionModal(true); }}
            onHistory={() => openHistoryModal(goal)}
            onAutoAlloc={() => openAutoAllocModal(goal)}
            onBadges={() => openBadgesModal(goal)}
          />
        ))}

        {filteredGoals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-500">Aucun objectif trouvé</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showContributionModal && (
        <ContributionModal
          goal={selectedGoal}
          onClose={() => setShowContributionModal(false)}
          onSubmit={handleContribution}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          goal={selectedGoal}
          contributions={contributions}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showAutoAllocModal && (
        <AutoAllocModal
          goal={selectedGoal}
          envelopes={envelopes}
          allocations={allocations}
          onClose={() => setShowAutoAllocModal(false)}
          onSubmit={handleAutoAlloc}
        />
      )}

      {showBadgesModal && (
        <BadgesModal
          goal={selectedGoal}
          badges={badges}
          onClose={() => setShowBadgesModal(false)}
        />
      )}
    </div>
  );
};

// GoalCard Component
const GoalCard = ({ goal, categories, onContribute, onHistory, onAutoAlloc, onBadges }) => {
  const category = categories.find(c => c.id === goal.category) || categories[0];
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{category.icon}</span>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">{goal.title}</h3>
            </div>
            {goal.description && (
              <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
            )}
          </div>
          {goal.is_achieved && (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
              ✓ Atteint
            </span>
          )}
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs sm:text-sm mb-1">
            <span className="text-gray-600">
              {formatAmount(goal.current_amount)} / {formatAmount(goal.target_amount)} FCFA
            </span>
            <span className="font-semibold text-green-600">{goal.progress_percentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={onContribute}
            className="flex items-center justify-center gap-1 px-2 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700"
          >
            <span>➕</span>
            <span>Ajouter</span>
          </button>
          <button
            onClick={onHistory}
            className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700"
          >
            <span>📜</span>
            <span>Historique</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAutoAlloc}
            className="flex items-center justify-center gap-1 px-2 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-purple-100 border border-purple-200"
          >
            <span>⚡</span>
            <span>Auto-épargne</span>
          </button>
          <button
            onClick={onBadges}
            className="flex items-center justify-center gap-1 px-2 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-yellow-100 border border-yellow-200"
          >
            <span>🏆</span>
            <span>Badges</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Modals (identiques à avant mais avec classes responsive corrigées)
const ContributionModal = ({ goal, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold">💰 Contribution</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              name="amount"
              required
              min="1"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Ex: 50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source (optionnel)</label>
            <input
              type="text"
              name="source"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Ex: Salaire mars"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optionnel)</label>
            <textarea
              name="note"
              rows="2"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Ex: Économie sur loisirs"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 text-base"
          >
            ✓ Ajouter la contribution
          </button>
        </form>
      </div>
    </div>
  </div>
);

const HistoryModal = ({ goal, contributions, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold">📜 Historique</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        {contributions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-500 text-sm">Aucune contribution encore</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contributions.map((contrib, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  contrib.type === 'add' ? 'bg-green-100' :
                  contrib.type === 'remove' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <span className="text-xl">
                    {contrib.type === 'add' ? '➕' : contrib.type === 'remove' ? '➖' : '⚡'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-semibold text-sm sm:text-base">
                      {contrib.type === 'remove' ? '-' : '+'}{(contrib.amount / 1000).toFixed(0)}k FCFA
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(contrib.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">{contrib.source}</p>
                  {contrib.note && (
                    <p className="text-xs text-gray-500 mt-1 italic break-words">{contrib.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const AutoAllocModal = ({ goal, envelopes, allocations, onClose, onSubmit }) => {
  const [percentages, setPercentages] = useState({});
  const total = Object.values(percentages).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  useEffect(() => {
    const initial = {};
    allocations.forEach(alloc => {
      initial[alloc.envelope_id] = alloc.percentage;
    });
    setPercentages(initial);
  }, [allocations]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold">⚡ Auto-épargne</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs sm:text-sm text-blue-900">
              💡 Configure un pourcentage de chaque enveloppe à allouer automatiquement.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {envelopes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Aucune enveloppe disponible
              </div>
            ) : (
              <div className="space-y-3">
                {envelopes.map(env => (
                  <div key={env.id} className="flex items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">{env.category}</div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Dispo: {((env.allocated_amount - env.spent_amount) / 1000).toFixed(0)}k FCFA
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <input
                        type="number"
                        name={`envelope_${env.id}`}
                        min="0"
                        max="100"
                        step="0.1"
                        value={percentages[env.id] || ''}
                        onChange={(e) => setPercentages({...percentages, [env.id]: e.target.value})}
                        className="w-16 sm:w-20 px-2 py-1 text-sm sm:text-base border border-gray-300 rounded text-center"
                        placeholder="0"
                      />
                      <span className="text-gray-600 text-sm sm:text-base">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`p-3 rounded-lg ${total > 100 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm sm:text-base">Total alloué :</span>
                <span className={`font-bold text-base sm:text-lg ${total > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                  {total.toFixed(1)}%
                </span>
              </div>
              {total > 100 && (
                <p className="text-xs text-red-600 mt-1">⚠️ Le total ne peut pas dépasser 100%</p>
              )}
            </div>

            <button
              type="submit"
              disabled={total > 100}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-base"
            >
              ✓ Configurer l'auto-épargne
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const BadgesModal = ({ goal, badges, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold">🏆 Badges</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        <div className="mb-4">
          <div className="text-center">
            <div className="text-5xl mb-2">
              {goal.progress_percentage >= 100 ? '🎉' :
               goal.progress_percentage >= 75 ? '🚀' :
               goal.progress_percentage >= 50 ? '🔥' :
               goal.progress_percentage >= 25 ? '💪' : '🎯'}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {goal.progress_percentage}% accompli
            </div>
          </div>
        </div>

        {badges.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏅</div>
            <p className="text-gray-500 text-sm">Continue ! Les badges arrivent bientôt</p>
          </div>
        ) : (
          <div className="space-y-3">
            {badges.map((badge, idx) => (
              <div key={idx} className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">{badge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm sm:text-base">{badge.title}</div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{badge.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default GoalsPage;
