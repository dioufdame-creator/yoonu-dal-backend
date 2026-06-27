import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const getScoreConfig = (score) => {
  if (score >= 85) return {
    gradient: 'from-green-500 to-emerald-600',
    label: 'Maître Yoonu',
    emoji: '🏆',
    message: "Excellence ! Moins de 5% des utilisateurs atteignent ce niveau.",
    nextLevel: null,
    nextMin: null,
  };
  if (score >= 70) return {
    gradient: 'from-blue-500 to-indigo-600',
    label: 'Aligné',
    emoji: '🌳',
    message: 'Solide ! Tu maîtrises les bases et construis ton avenir.',
    nextLevel: 'Maître Yoonu',
    nextMin: 85,
  };
  if (score >= 50) return {
    gradient: 'from-amber-500 to-orange-600',
    label: 'En chemin',
    emoji: '🌿',
    message: "Tu progresses. Des zones à améliorer pour atteindre le niveau supérieur.",
    nextLevel: 'Aligné',
    nextMin: 70,
  };
  if (score >= 30) return {
    gradient: 'from-red-500 to-pink-600',
    label: 'Débutant',
    emoji: '🌱',
    message: "Les fondations se posent. Continue d'enregistrer tes dépenses.",
    nextLevel: 'En chemin',
    nextMin: 50,
  };
  return {
    gradient: 'from-gray-400 to-gray-500',
    label: 'Non évalué',
    emoji: '⬜',
    message: 'Enregistre tes dépenses et revenus pour activer ton score.',
    nextLevel: 'Débutant',
    nextMin: 30,
  };
};

const CIRCUMFERENCE = 2 * Math.PI * 85; // ≈ 534

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
      await API.get('/yoonu-score/');
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
    engagement_score,
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
        <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-6 lg:p-10 mb-6 text-white shadow-xl`}>
          <div className="flex flex-col lg:flex-row gap-8 items-center">

            {/* ✅ Cercle score — viewBox élargi pour éviter la troncature du stroke */}
            <div className="flex-shrink-0 flex justify-center">
              <div style={{ position: 'relative', width: '192px', height: '192px' }}>
                <svg
                  viewBox="-7 -7 214 214"
                  width="192"
                  height="192"
                  style={{ transform: 'rotate(-90deg)', display: 'block' }}
                >
                  {/* Fond */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="14"
                    fill="none"
                  />
                  {/* Progression */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    stroke="white"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(total_score / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                </svg>
                {/* Score centré */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '52px', fontWeight: 'bold', lineHeight: 1, color: 'white' }}>
                    {total_score}
                  </span>
                  <span style={{ fontSize: '18px', opacity: 0.8, marginTop: '4px', color: 'white' }}>
                    /100
                  </span>
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <span className="text-5xl">{config.emoji}</span>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold">{config.label}</h2>
                  {score_change !== 0 && score_change !== undefined && !isNotEvaluated && (
                    <div className="flex items-center justify-center lg:justify-start gap-2 mt-1">
                      <span className={`text-lg font-semibold ${score_change > 0 ? 'text-green-200' : 'text-red-200'}`}>
                        {score_change > 0 ? '↗️' : '↘️'} {Math.abs(score_change)} points
                      </span>
                      <span className="text-sm opacity-75">vs mois dernier</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-base lg:text-lg opacity-90 mb-6">{config.message}</p>

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
                      style={{ width: `${Math.min(((total_score - (config.nextMin - 15)) / 15) * 100, 100)}%` }} />
                  </div>
                </div>
              )}

              {!config.nextMin && total_score >= 85 && (
                <div className="bg-white bg-opacity-20 rounded-xl p-4">
                  <p className="text-sm font-semibold">🏆 Niveau maximum atteint !</p>
                  <p className="text-xs opacity-75 mt-1">Tu es dans le top 5% des utilisateurs Yoonu Dal</p>
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
                Ton score nécessite : des valeurs définies, des dépenses ce mois, et un revenu enregistré.
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

          {/* Composantes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">📊 Détail des composantes</h3>
            <p className="text-xs text-gray-400 mb-6">Total sur 100 pts = 25 + 25 + 25 + 15 + 10</p>

            <ScoreBar
              label="Alignement Valeurs"
              score={alignment_score || 0}
              maxScore={25}
              color="from-purple-500 to-purple-600"
              icon="✨"
              description="Tes dépenses reflètent-elles tes valeurs ?"
            />
            <ScoreBar
              label="Discipline Budgétaire"
              score={discipline_score || 0}
              maxScore={25}
              color="from-blue-500 to-blue-600"
              icon="📊"
              description="Respectes-tu tes enveloppes ?"
            />
            <ScoreBar
              label="Stabilité Financière"
              score={stability_score || 0}
              maxScore={25}
              color="from-green-500 to-green-600"
              icon="🛡️"
              description="Épargnes-tu au moins 10% de tes revenus ?"
            />
            <ScoreBar
              label="Construction Patrimoniale"
              score={improvement_score || 0}
              maxScore={15}
              color="from-amber-500 to-orange-600"
              icon="🏗️"
              description="Objectifs, tontines, dettes"
            />
            <ScoreBar
              label="Régularité & Engagement"
              score={engagement_score || 0}
              maxScore={10}
              color="from-pink-500 to-rose-600"
              icon="📅"
              description="Assiduité dans le suivi financier"
            />

            {/* Niveaux */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-700 mb-3">Niveaux</p>
              <div className="space-y-1.5">
                {[
                  { min: 85, label: 'Maître Yoonu 🏆', color: 'text-green-600' },
                  { min: 70, label: 'Aligné 🌳', color: 'text-blue-600' },
                  { min: 50, label: 'En chemin 🌿', color: 'text-amber-600' },
                  { min: 30, label: 'Débutant 🌱', color: 'text-red-600' },
                ].map(level => (
                  <div key={level.min} className={`flex justify-between text-xs ${total_score >= level.min ? 'font-bold' : 'text-gray-400'}`}>
                    <span className={total_score >= level.min ? level.color : ''}>{level.label}</span>
                    <span>{level.min}+ pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alignement valeurs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">💎 Tes valeurs en action</h3>
            <p className="text-xs text-gray-400 mb-6">Part de tes dépenses par valeur déclarée</p>

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
                            pct >= 20 ? 'text-green-600' : pct >= 10 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              pct >= 20 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              pct >= 10 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                              'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${Math.min(pct * 2, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    Vert ≥20% · Orange ≥10% · Rouge &lt;10% de tes dépenses
                  </p>
                </div>

                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-800 font-medium mb-1">💡 Pour progresser</p>
                  <p className="text-xs text-blue-700">
                    Ta valeur prioritaire doit représenter au moins 20% de tes dépenses pour le score maximum.
                  </p>
                </div>
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
            Épargne au moins 10% de tes revenus, respecte tes enveloppes, et contribue à tes objectifs chaque mois.
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
            <button onClick={() => onNavigate('goals')}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-opacity-30 transition-all">
              🎯 Mes objectifs
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default YoonuScorePage;
