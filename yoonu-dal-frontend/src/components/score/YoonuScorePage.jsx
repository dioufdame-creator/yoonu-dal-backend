import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const getScoreConfig = (score) => {
  if (score >= 80) return {
    gradient: 'from-green-500 to-emerald-600',
    label: 'Maître Yoonu',
    emoji: '🏆',
    message: "Excellence ! Tu maîtrises parfaitement l'art de Yoonu Dal.",
    nextLevel: null,
    nextMin: null,
  };
  if (score >= 60) return {
    gradient: 'from-blue-500 to-indigo-600',
    label: 'Aligné',
    emoji: '🌳',
    message: 'Très bien ! Tes finances sont alignées avec tes valeurs.',
    nextLevel: 'Maître Yoonu',
    nextMin: 80,
  };
  if (score >= 40) return {
    gradient: 'from-amber-500 to-orange-600',
    label: 'En chemin',
    emoji: '🌿',
    message: "Tu progresses. Continue d'aligner tes dépenses avec tes valeurs.",
    nextLevel: 'Aligné',
    nextMin: 60,
  };
  if (score >= 1) return {
    gradient: 'from-red-500 to-pink-600',
    label: 'Débutant',
    emoji: '🌱',
    message: "C'est le début du voyage. Chaque pas compte !",
    nextLevel: 'En chemin',
    nextMin: 40,
  };
  return {
    gradient: 'from-gray-400 to-gray-500',
    label: 'Non évalué',
    emoji: '⬜',
    message: 'Enregistre tes dépenses pour activer ton score Yoonu Dal.',
    nextLevel: 'Débutant',
    nextMin: 1,
  };
};

const YoonuScorePage = ({ toast, onNavigate }) => {
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scoreRes, historyRes] = await Promise.all([
        API.get('/yoonu-score/').catch(() => null),
        API.get('/yoonu-score/history/').catch(() => ({ data: { history: [] } }))
      ]);
      if (scoreRes?.data) setScore(scoreRes.data);
      setHistory(historyRes?.data?.history || []);
    } catch (error) {
      toast?.showError('Erreur lors du chargement');
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
      toast?.showError('Erreur lors du recalcul');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-200">
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Découvre ton Score Yoonu Dal</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Commence par définir tes valeurs pour calculer ton score.
            </p>
            <button onClick={() => onNavigate('values')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all">
              🎯 Définir mes valeurs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    total_score,
    alignment_score,
    discipline_score,
    stability_score,
    improvement_score,
    alignment_details,
    score_change
  } = score;

  const config = getScoreConfig(total_score);
  const isNotEvaluated = total_score === 0;

  const ScoreBar = ({ label, score, maxScore, color, icon, description }) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <div>
              <span className="text-sm font-semibold text-gray-700">{label}</span>
              {description && <p className="text-xs text-gray-400">{description}</p>}
            </div>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {Math.round(score)}/{maxScore}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 shadow-sm`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span>🎯</span>
              <span>Ton Score Yoonu Dal</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Alignement entre tes valeurs et ton argent</p>
          </div>
          <button onClick={recalculateScore}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
            <span>🔄</span>
            <span className="hidden sm:inline">Recalculer</span>
          </button>
        </div>

        {/* Score Principal */}
        <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-8 lg:p-10 mb-6 text-white shadow-xl`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <svg className="w-48 h-48 lg:w-56 lg:h-56 transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" className="stroke-white stroke-opacity-20" strokeWidth="12" fill="none" />
                  <circle cx="50%" cy="50%" r="45%"
                    className="stroke-white" strokeWidth="12" fill="none"
                    strokeDasharray={`${total_score * 4.4} 440`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease-out', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl lg:text-7xl font-bold">{total_score}</div>
                  <div className="text-xl opacity-80">/100</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-6xl">{config.emoji}</span>
                <div>
                  <h2 className="text-3xl font-bold">{config.label}</h2>
                  {score_change !== 0 && score_change !== undefined && !isNotEvaluated && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-lg font-semibold ${score_change > 0 ? 'text-green-200' : 'text-red-200'}`}>
                        {score_change > 0 ? '↗️' : '↘️'} {Math.abs(score_change)} points
                      </span>
                      <span className="text-sm opacity-75">vs mois dernier</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-lg opacity-90 mb-6">{config.message}</p>

              {config.nextMin && (
                <div className="bg-white bg-opacity-20 rounded-xl p-4">
                  <p className="text-sm font-semibold mb-2">
                    Prochain niveau : {config.nextLevel} ({config.nextMin} pts)
                  </p>
                  <p className="text-xs opacity-75">
                    Plus que {config.nextMin - total_score} point{config.nextMin - total_score > 1 ? 's' : ''} !
                  </p>
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-2 overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(((total_score - (config.nextMin - 20)) / 20) * 100, 100)}%` }} />
                  </div>
                </div>
              )}

              {!config.nextMin && total_score >= 80 && (
                <div className="bg-white bg-opacity-20 rounded-xl p-4">
                  <p className="text-sm font-semibold">🏆 Niveau maximum atteint !</p>
                  <p className="text-xs opacity-75 mt-1">Tu es au sommet de Yoonu Dal</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message si pas évalué */}
        {isNotEvaluated && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <span className="text-3xl">💡</span>
            <div>
              <p className="font-semibold text-amber-900 mb-1">Comment activer ton score ?</p>
              <p className="text-sm text-amber-800 mb-3">
                Ton score se calcule à partir de tes dépenses du mois. Il faut aussi avoir défini tes valeurs et configuré tes enveloppes budgétaires.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onNavigate('expenses')}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all">
                  📝 Ajouter des dépenses
                </button>
                <button onClick={() => onNavigate('values')}
                  className="bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-all">
                  💎 Définir mes valeurs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid composantes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Composantes — maxScores corrigés selon le backend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">📊 Détail des composantes</h3>
            <p className="text-xs text-gray-400 mb-6">Total sur 100 pts = 30 + 30 + 20 + 20</p>

            <ScoreBar
              label="Alignement Valeurs"
              score={alignment_score || 0}
              maxScore={30}
              color="from-purple-500 to-purple-600"
              icon="✨"
              description="Tes dépenses reflètent-elles tes valeurs ?"
            />
            <ScoreBar
              label="Discipline Budgétaire"
              score={discipline_score || 0}
              maxScore={30}
              color="from-blue-500 to-blue-600"
              icon="📊"
              description="Respectes-tu tes enveloppes ?"
            />
            <ScoreBar
              label="Stabilité Financière"
              score={stability_score || 0}
              maxScore={20}
              color="from-green-500 to-green-600"
              icon="🛡️"
              description="Dépenses-tu moins que tu gagnes ?"
            />
            <ScoreBar
              label="Amélioration & Engagement"
              score={improvement_score || 0}
              maxScore={20}
              color="from-amber-500 to-orange-600"
              icon="🚀"
              description="Progression + objectifs, tontines, dettes"
            />

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 leading-relaxed">
                💡 <strong>Comment progresser ?</strong> Aligne tes dépenses avec tes valeurs et maintiens une bonne discipline financière.
              </p>
            </div>
          </div>

          {/* Alignement valeurs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">💎 Tes valeurs en action</h3>

            {alignment_details && Object.keys(alignment_details).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(alignment_details)
                  .sort((a, b) => b[1] - a[1])
                  .map(([value, percentage]) => {
                    const pct = parseFloat(percentage);
                    return (
                      <div key={value}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-700 capitalize">{value}</span>
                          <span className={`text-sm font-bold ${
                            pct >= 25 ? 'text-green-600' : pct >= 15 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              pct >= 25 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              pct >= 15 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                              'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                <p className="text-xs text-gray-500 mt-4">
                  Vert ≥25% · Orange ≥15% · Rouge &lt;15% de tes dépenses
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-600 mb-4">Ajoute des dépenses pour voir ton alignement</p>
                <button onClick={() => onNavigate('expenses')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  Ajouter une dépense
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Historique */}
        {history.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">📈 Évolution du score</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {history.slice(-6).map((h, idx, arr) => {
                const prevScore = idx > 0 ? arr[idx - 1].total_score : null;
                const change = prevScore !== null ? h.total_score - prevScore : 0;
                const conf = getScoreConfig(h.total_score);
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                    <p className="text-xs text-gray-600 mb-1">{h.month}</p>
                    <p className="text-2xl mb-0.5">{conf.emoji}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{h.total_score}</p>
                    <p className="text-xs text-gray-500">{conf.label}</p>
                    {change !== 0 && (
                      <span className={`text-xs font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change > 0 ? '↗️' : '↘️'} {Math.abs(change)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 lg:p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">💪 Améliore ton score !</h3>
          <p className="opacity-90 mb-6 max-w-2xl mx-auto">
            Aligne tes dépenses avec tes valeurs et maintiens une bonne discipline financière
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => onNavigate('expenses')}
              className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all">
              📝 Gérer mes dépenses
            </button>
            <button onClick={() => onNavigate('envelopes')}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-opacity-30 transition-all">
              📁 Ajuster mes budgets
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default YoonuScorePage;
