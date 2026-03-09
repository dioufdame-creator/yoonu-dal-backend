import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// YOONU SCORE PAGE V2 - PREMIUM DESIGN
// Fix: Better diagnostic detection + navigation
// ==========================================

const YoonuScorePageV2 = ({ toast, onNavigate }) => {
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCompletedDiagnostic, setHasCompletedDiagnostic] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger score, historique ET valeurs
      const [scoreRes, historyRes, valuesRes] = await Promise.all([
        API.get('/yoonu-score/').catch(err => {
          console.log('Score not found:', err);
          return null;
        }),
        API.get('/yoonu-score/history/').catch(() => ({ data: { history: [] } })),
        API.get('/user-values/').catch(() => ({ data: [] }))
      ]);

      console.log('📊 Score Response:', scoreRes?.data);
      console.log('👤 User Values:', valuesRes?.data);

      // ✅ Set score (même si null ou 0)
      if (scoreRes?.data) {
        setScore(scoreRes.data);
      }
      
      setHistory(historyRes?.data?.history || []);
      
      // ✅ FIX: Vérifier si diagnostic complété
      // Un user a fait le diagnostic s'il a 3+ valeurs définies
      const userValues = Array.isArray(valuesRes?.data) ? valuesRes.data : [];
      const diagnosticCompleted = userValues.length >= 3;
      
      console.log(`✅ Diagnostic completed: ${diagnosticCompleted} (${userValues.length} valeurs)`);
      setHasCompletedDiagnostic(diagnosticCompleted);
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast?.showError('Erreur lors du chargement du score');
    } finally {
      setLoading(false);
    }
  };

  const recalculateScore = async () => {
    try {
      toast?.showInfo('Recalcul du score en cours...');
      await API.post('/yoonu-score/calculate/');
      toast?.showSuccess('Score recalculé avec succès');
      loadData();
    } catch (error) {
      console.error('Erreur recalcul:', error);
      toast?.showError('Erreur lors du recalcul');
    }
  };

  // ✅ FIX: Fallback si onNavigate pas disponible
  const handleNavigate = (page) => {
    console.log('🧭 Navigate to:', page);
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate(page);
    } else {
      console.warn('⚠️ onNavigate not provided, using fallback');
      // Fallback: essayer window.location
      const routes = {
        'values': '/values',
        'expenses': '/expenses',
        'envelopes': '/envelopes',
        'diagnostic': '/diagnostic'
      };
      if (routes[page]) {
        window.location.href = routes[page];
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de ton score...</p>
        </div>
      </div>
    );
  }

  // ✅ FIX: Afficher CTA diagnostic SEULEMENT si pas de valeurs définies
  if (!hasCompletedDiagnostic) {
    console.log('🎯 Showing diagnostic CTA');
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-200">
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Découvre ton Score Yoonu Dal
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Le Score Yoonu Dal mesure l'alignement entre tes valeurs et ton utilisation de l'argent.
              Plus tu vis selon tes priorités, plus ton score est élevé.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-sm font-semibold text-green-800">Alignement Valeurs</p>
                <p className="text-xs text-green-600 mt-1">35 points</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm font-semibold text-blue-800">Discipline</p>
                <p className="text-xs text-blue-600 mt-1">35 points</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="text-3xl mb-2">🚀</div>
                <p className="text-sm font-semibold text-purple-800">Progression</p>
                <p className="text-xs text-purple-600 mt-1">30 points</p>
              </div>
            </div>

            <button
              onClick={() => handleNavigate('values')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              🎯 Faire le diagnostic
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Si diagnostic fait mais score null/undefined, proposer de calculer
  if (!score) {
    console.log('⏳ Showing calculate CTA');
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-200">
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Score en attente de calcul
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Ton diagnostic est complété ! Lance le calcul de ton score pour voir ton résultat.
            </p>
            <button
              onClick={recalculateScore}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Calculer mon score
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Showing full score page');

  const { 
    total_score, 
    alignment_score, 
    discipline_score, 
    stability_score, 
    improvement_score,
    alignment_details,
    score_change,
    previous_score
  } = score;

  const getScoreConfig = (scoreValue) => {
    if (scoreValue >= 81) return {
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      label: 'Maître Yoonu',
      emoji: '🏆',
      message: 'Excellence ! Tu maîtrises parfaitement l\'art de Yoonu Dal.'
    };
    if (scoreValue >= 61) return {
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      label: 'Aligné',
      emoji: '🌳',
      message: 'Très bien ! Tes finances sont alignées avec tes valeurs.'
    };
    if (scoreValue >= 41) return {
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      label: 'En chemin',
      emoji: '🌿',
      message: 'Bon début ! Continue d\'améliorer ton alignement.'
    };
    return {
      gradient: 'from-red-500 to-pink-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      label: 'Débutant',
      emoji: '🌱',
      message: 'C\'est le début du voyage. Chaque pas compte !'
    };
  };

  const config = getScoreConfig(total_score);

  const ScoreBar = ({ label, score, maxScore, color, icon }) => {
    const percentage = (score / maxScore) * 100;
    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-semibold text-gray-700">{label}</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {Math.round(score)}/{maxScore}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 shadow-sm`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span>🎯</span>
                <span>Ton Score Yoonu Dal</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Alignement entre tes valeurs et ton argent
              </p>
            </div>

            <button
              onClick={recalculateScore}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Recalculer</span>
            </button>
          </div>
        </div>

        {/* Score Principal Card */}
        <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-8 lg:p-10 mb-6 text-white shadow-xl`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Score Circle */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <svg className="w-48 h-48 lg:w-56 lg:h-56 transform -rotate-90">
                  <circle 
                    cx="50%" 
                    cy="50%" 
                    r="45%" 
                    className="stroke-white stroke-opacity-20" 
                    strokeWidth="12" 
                    fill="none" 
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    className="stroke-white"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${total_score * 4.4} 440`}
                    strokeLinecap="round"
                    style={{ 
                      transition: 'stroke-dasharray 1s ease-out',
                      filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))'
                    }}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl lg:text-7xl font-bold">{total_score}</div>
                  <div className="text-xl opacity-80">/100</div>
                </div>
              </div>
            </div>

            {/* Right: Level Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-6xl">{config.emoji}</span>
                <div>
                  <h2 className="text-3xl font-bold">{config.label}</h2>
                  {score_change !== 0 && score_change !== undefined && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-lg font-semibold ${
                        score_change > 0 ? 'text-green-200' : 'text-red-200'
                      }`}>
                        {score_change > 0 ? '↗️' : '↘️'} {Math.abs(score_change)} points
                      </span>
                      <span className="text-sm opacity-75">vs mois dernier</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-lg opacity-90 mb-6">
                {config.message}
              </p>

              {/* Progress to next level */}
              {total_score < 100 && (
                <div className="bg-white bg-opacity-20 rounded-xl p-4">
                  <p className="text-sm font-semibold mb-2">
                    {total_score < 41 ? 'Prochain niveau : En chemin (41 pts)' :
                     total_score < 61 ? 'Prochain niveau : Aligné (61 pts)' :
                     total_score < 81 ? 'Prochain niveau : Maître (81 pts)' :
                     'Tu es au niveau maximum !'}
                  </p>
                  {total_score < 100 && (
                    <p className="text-xs opacity-75">
                      Plus que {
                        total_score < 41 ? 41 - total_score :
                        total_score < 61 ? 61 - total_score :
                        total_score < 81 ? 81 - total_score :
                        100 - total_score
                      } points !
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Composantes du score */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              📊 Détail des composantes
            </h3>

            <ScoreBar 
              label="Alignement Valeurs" 
              score={alignment_score || 0} 
              maxScore={35}
              color="from-purple-500 to-purple-600"
              icon="✨"
            />
            <ScoreBar 
              label="Discipline Budgétaire" 
              score={discipline_score || 0} 
              maxScore={35}
              color="from-blue-500 to-blue-600"
              icon="📊"
            />
            <ScoreBar 
              label="Stabilité Financière" 
              score={stability_score || 0} 
              maxScore={20}
              color="from-green-500 to-green-600"
              icon="🛡️"
            />
            <ScoreBar 
              label="Amélioration Continue" 
              score={improvement_score || 0} 
              maxScore={10}
              color="from-amber-500 to-orange-600"
              icon="🚀"
            />

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 leading-relaxed">
                💡 <strong>Le saviez-vous ?</strong> L'alignement valeurs compte pour 35% de ton score total.
                Plus tu dépenses selon tes priorités, plus ton score augmente !
              </p>
            </div>
          </div>

          {/* Alignement détaillé */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              💎 Tes valeurs en action
            </h3>
            
            {alignment_details && Object.keys(alignment_details).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(alignment_details)
                  .sort((a, b) => b[1] - a[1])
                  .map(([value, percentage]) => (
                    <div key={value}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 capitalize">
                          {value}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            percentage >= 30 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            percentage >= 20 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                            'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-600 mb-4">
                  Ajoute des dépenses pour voir ton alignement
                </p>
                <button
                  onClick={() => handleNavigate('expenses')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Ajouter une dépense
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Historique */}
        {history.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              📈 Évolution du score
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {history.slice(-6).map((h, idx, arr) => {
                const prevScore = idx > 0 ? arr[idx - 1].total_score : null;
                const change = prevScore ? h.total_score - prevScore : 0;
                
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">{h.month}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{h.total_score}</p>
                    {change !== 0 && (
                      <span className={`text-xs font-semibold ${
                        change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {change > 0 ? '↗️' : '↘️'} {Math.abs(change)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA Card */}
        <div className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 lg:p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">
            💪 Améliore ton score !
          </h3>
          <p className="opacity-90 mb-6 max-w-2xl mx-auto">
            Aligne tes dépenses avec tes valeurs, respecte tes budgets et maintiens une bonne discipline financière
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => handleNavigate('expenses')}
              className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all"
            >
              📝 Gérer mes dépenses
            </button>
            <button
              onClick={() => handleNavigate('envelopes')}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-opacity-30 transition-all"
            >
              📁 Ajuster mes budgets
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default YoonuScorePageV2;