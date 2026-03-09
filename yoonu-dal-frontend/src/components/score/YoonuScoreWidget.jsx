import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const YoonuScoreWidget = ({ onViewDetails, onNavigate }) => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScore();
    const interval = setInterval(loadScore, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadScore = async () => {
  try {
    const response = await API.get('/yoonu-score/');
    setScore(response.data);
  } catch (error) {
    console.error('Erreur chargement score:', error);
    // ✅ En cas d'erreur, mettre un objet vide pour éviter le loading infini
    if (error.response?.status === 401) {
      console.log('Token invalide, score reste à null');
    }
    setScore(null);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse border border-gray-100">
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!score || score.total_score === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🎯</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Score Yoonu Dal</h3>
              <p className="text-sm text-gray-600">
                Mesure l'alignement entre tes valeurs et ton argent
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('diagnostic')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Faire le diagnostic
          </button>
        </div>
      </div>
    );
  }

  const { total_score, score_change, level, emoji } = score;
  
  const getScoreColor = (score) => {
    if (score >= 81) return 'from-green-500 to-emerald-500';
    if (score >= 61) return 'from-blue-500 to-cyan-500';
    if (score >= 41) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const scoreColor = getScoreColor(total_score);
  const percentage = total_score;

  return (
    <div 
      onClick={onViewDetails}
      className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all border-2 border-transparent hover:border-purple-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">{emoji}</span>
          <h3 className="font-bold text-gray-900 text-lg">Score Yoonu Dal</h3>
        </div>
        {score_change !== 0 && (
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            score_change > 0 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {score_change > 0 ? '+' : ''}{score_change}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={`url(#gradient-${total_score})`}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${percentage * 3.51} 351.68`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id={`gradient-${total_score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={scoreColor.split(' ')[0].replace('from-', 'text-')} stopColor="currentColor" />
                <stop offset="100%" className={scoreColor.split(' ')[1].replace('to-', 'text-')} stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-4xl font-bold bg-gradient-to-br ${scoreColor} bg-clip-text text-transparent`}>
                {total_score}
              </div>
              <div className="text-xs text-gray-500">/ 100</div>
            </div>
          </div>
        </div>

        <div className="flex-1 ml-6">
          <div className="text-sm font-semibold text-gray-700 mb-2">{level}</div>
          {score_change !== 0 && (
            <div className="text-sm text-gray-600 mb-3">
              {score_change > 0 ? '📈 En progression' : '📉 En baisse'}
            </div>
          )}
          <button className="text-sm text-purple-600 hover:text-purple-700 font-semibold hover:underline">
            Voir détails →
          </button>
        </div>
      </div>
    </div>
  );
};

export default YoonuScoreWidget;
