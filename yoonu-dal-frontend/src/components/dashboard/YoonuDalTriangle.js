// src/components/dashboard/YoonuDalTriangle.js
import React, { useState, useEffect } from 'react';

const YoonuDalTriangle = ({ 
  revenusScore = 0, 
  depensesScore = 0, 
  valeursScore = 0, 
  showDetails = false,
  recommendations = []
}) => {
  const [animatedScores, setAnimatedScores] = useState({ revenus: 0, depenses: 0, valeurs: 0 });
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Animation progressive des scores
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScores({
        revenus: revenusScore,
        depenses: depensesScore,
        valeurs: valeursScore
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [revenusScore, depensesScore, valeursScore]);

  // Calcul du score d'alignement global
  const alignmentScore = Math.round((revenusScore + depensesScore + valeursScore) / 3);

  // Déterminer le niveau d'alignement
  const getAlignmentLevel = (score) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 60) return { level: 'Bon', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 40) return { level: 'Moyen', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { level: 'À améliorer', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const alignmentInfo = getAlignmentLevel(alignmentScore);

  // Coordonnées du triangle (SVG viewBox 400x400)
  const trianglePoints = {
    revenus: { x: 200, y: 50, label: 'Revenus' },
    depenses: { x: 350, y: 300, label: 'Dépenses' },
    valeurs: { x: 50, y: 300, label: 'Valeurs' }
  };

  // Couleurs selon le score
  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981'; // vert
    if (score >= 60) return '#3B82F6'; // bleu
    if (score >= 40) return '#F59E0B'; // orange
    return '#EF4444'; // rouge
  };

  // Détails pour chaque point
  const pointDetails = {
    revenus: {
      title: 'Revenus',
      score: revenusScore,
      description: 'Stabilité et diversification de vos sources de revenus',
      icon: '💰',
      tips: revenusScore < 60 ? [
        'Diversifiez vos sources de revenus',
        'Développez des revenus passifs',
        'Négociez une augmentation'
      ] : [
        'Excellente gestion des revenus !',
        'Maintenez cette stabilité',
        'Investissez l\'excédent'
      ]
    },
    depenses: {
      title: 'Dépenses',
      score: depensesScore,
      description: 'Maîtrise et optimisation de vos dépenses',
      icon: '💸',
      tips: depensesScore < 60 ? [
        'Analysez vos dépenses non essentielles',
        'Créez un budget mensuel',
        'Utilisez la règle 50/30/20'
      ] : [
        'Excellente maîtrise budgétaire !',
        'Continuez ce contrôle',
        'Automatisez vos épargnes'
      ]
    },
    valeurs: {
      title: 'Valeurs',
      score: valeursScore,
      description: 'Alignement de vos finances avec vos valeurs personnelles',
      icon: '⭐',
      tips: valeursScore < 60 ? [
        'Définissez vos priorités de vie',
        'Alignez vos dépenses à vos valeurs',
        'Investissez dans ce qui compte'
      ] : [
        'Parfait alignement avec vos valeurs !',
        'Votre argent reflète vos priorités',
        'Inspirez votre entourage'
      ]
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-fade-in">
      {/* En-tête */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <span className="mr-3 text-2xl">🔺</span>
          Triangle d'alignement Yoonu Dal
        </h2>
        <p className="text-gray-600 text-sm">
          Visualisez l'harmonie entre vos revenus, dépenses et valeurs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triangle SVG */}
        <div className="flex justify-center">
          <div className="relative">
            <svg 
              width="300" 
              height="300" 
              viewBox="0 0 400 400"
              className="drop-shadow-lg"
            >
              {/* Fond du triangle */}
              <defs>
                <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F3F4F6" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#E5E7EB" stopOpacity="0.8"/>
                </linearGradient>
              </defs>
              
              <polygon
                points={`${trianglePoints.revenus.x},${trianglePoints.revenus.y} ${trianglePoints.depenses.x},${trianglePoints.depenses.y} ${trianglePoints.valeurs.x},${trianglePoints.valeurs.y}`}
                fill="url(#triangleGradient)"
                stroke="#D1D5DB"
                strokeWidth="2"
                className="transition-all duration-500"
              />

              {/* Lignes de connexion */}
              <line
                x1={trianglePoints.revenus.x} y1={trianglePoints.revenus.y}
                x2={trianglePoints.depenses.x} y2={trianglePoints.depenses.y}
                stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5"
              />
              <line
                x1={trianglePoints.depenses.x} y1={trianglePoints.depenses.y}
                x2={trianglePoints.valeurs.x} y2={trianglePoints.valeurs.y}
                stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5"
              />
              <line
                x1={trianglePoints.valeurs.x} y1={trianglePoints.valeurs.y}
                x2={trianglePoints.revenus.x} y2={trianglePoints.revenus.y}
                stroke="#E5E7EB" strokeWidth="1" strokeDasharray="5,5"
              />

              {/* Points des sommets */}
              {Object.entries(trianglePoints).map(([key, point]) => {
                const score = animatedScores[key];
                const radius = 15 + (score / 100) * 10; // Taille basée sur le score
                const color = getScoreColor(score);
                
                return (
                  <g key={key}>
                    {/* Effet de pulsation */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={radius + 5}
                      fill={color}
                      opacity="0.3"
                      className="animate-ping"
                    />
                    {/* Point principal */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={radius}
                      fill={color}
                      stroke="white"
                      strokeWidth="3"
                      className="cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => setSelectedPoint(selectedPoint === key ? null : key)}
                    />
                    {/* Score au centre du point */}
                    <text
                      x={point.x}
                      y={point.y + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {Math.round(score)}
                    </text>
                    {/* Label */}
                    <text
                      x={point.x}
                      y={point.y + radius + 15}
                      textAnchor="middle"
                      fill="#374151"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {point.label}
                    </text>
                  </g>
                );
              })}

              {/* Score central */}
              <circle
                cx="200"
                cy="200"
                r="30"
                fill="white"
                stroke={getScoreColor(alignmentScore)}
                strokeWidth="3"
                className="drop-shadow-md"
              />
              <text
                x="200"
                y="195"
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill={getScoreColor(alignmentScore)}
              >
                {alignmentScore}%
              </text>
              <text
                x="200"
                y="210"
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
              >
                Alignement
              </text>
            </svg>
          </div>
        </div>

        {/* Informations et détails */}
        <div className="space-y-4">
          {/* Score d'alignement global */}
          <div className={`p-4 rounded-xl ${alignmentInfo.bg} border-l-4 border-${alignmentInfo.color.split('-')[1]}-500`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900">Alignement Global</h3>
              <span className={`text-2xl font-bold ${alignmentInfo.color}`}>
                {alignmentScore}%
              </span>
            </div>
            <p className={`text-sm ${alignmentInfo.color} font-semibold`}>
              {alignmentInfo.level}
            </p>
          </div>

          {/* Scores détaillés */}
          <div className="space-y-3">
            {Object.entries(pointDetails).map(([key, details]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  selectedPoint === key 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPoint(selectedPoint === key ? null : key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{details.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{details.title}</h4>
                      <p className="text-xs text-gray-600">{details.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold`} style={{color: getScoreColor(details.score)}}>
                      {Math.round(details.score)}%
                    </span>
                  </div>
                </div>
                
                {/* Détails étendus */}
                {selectedPoint === key && (
                  <div className="mt-3 pt-3 border-t border-gray-200 animate-slide-in">
                    <h5 className="font-semibold text-gray-800 mb-2">Conseils personnalisés :</h5>
                    <ul className="space-y-1">
                      {details.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommandations générales */}
          {recommendations && recommendations.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                Recommandations
              </h4>
              <ul className="space-y-1">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-center space-x-6 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            80-100% Excellent
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            60-79% Bon
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            40-59% Moyen
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            0-39% À améliorer
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoonuDalTriangle;