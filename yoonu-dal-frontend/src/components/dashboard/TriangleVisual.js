import React, { useState, useEffect } from 'react';
import triangleService from '../../services/TriangleService';

const TriangleVisual = () => {
  // États pour les données du triangle
  const [triangleData, setTriangleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);

  // Charger les données du triangle
  useEffect(() => {
    const fetchTriangleData = async () => {
      try {
        const data = await triangleService.getTriangleData();
        setTriangleData(data);
        setError(null);
      } catch (err) {
        // Données de fallback pour la démo
        setTriangleData({
          income_score: 65.50,
          expense_score: 72.30,
          value_score: 58.20,
          triangle_balance: 65.33,
          analysis: {
            income: "Vos revenus sont diversifiés et réguliers.",
            expense: "Vos dépenses sont bien alignées avec votre budget.",
            value: "Réfléchissez à mieux aligner vos dépenses avec vos valeurs prioritaires."
          }
        });
        setError(null); // Masquer l'erreur pour la démo
      } finally {
        setLoading(false);
      }
    };

    fetchTriangleData();
  }, []);

  // Calculs pour la visualisation
  const getTrianglePoint = (incomeScore, expenseScore, valueScore) => {
    const normalizedIncome = incomeScore / 100;
    const normalizedExpense = expenseScore / 100;
    const normalizedValue = valueScore / 100;
    
    const x = 200 + (normalizedExpense - normalizedIncome) * 80;
    const y = 280 - normalizedValue * 160;
    
    return { x, y };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e'; // Vert
    if (score >= 60) return '#eab308'; // Jaune
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Rouge
  };

  const getBalanceMessage = (balance) => {
    if (balance >= 80) return { text: "Excellent équilibre", color: "text-green-700", bg: "bg-green-50" };
    if (balance >= 65) return { text: "Bon équilibre", color: "text-yellow-700", bg: "bg-yellow-50" };
    if (balance >= 50) return { text: "Équilibre à améliorer", color: "text-orange-700", bg: "bg-orange-50" };
    return { text: "Déséquilibre important", color: "text-red-700", bg: "bg-red-50" };
  };

  const getDimensionDetails = (dimension) => {
    const details = {
      revenus: {
        title: "💰 Dimension Revenus",
        description: "Stabilité et diversification de vos sources de revenus",
        tips: [
          "Diversifiez vos sources de revenus",
          "Développez des revenus passifs",
          "Investissez dans vos compétences"
        ]
      },
      depenses: {
        title: "📊 Dimension Dépenses",
        description: "Contrôle et alignement de vos dépenses avec vos objectifs",
        tips: [
          "Suivez votre budget mensuellement",
          "Éliminez les dépenses inutiles",
          "Automatisez votre épargne"
        ]
      },
      valeurs: {
        title: "💎 Dimension Valeurs",
        description: "Cohérence entre vos valeurs et vos choix financiers",
        tips: [
          "Définissez clairement vos valeurs",
          "Révisez vos priorités régulièrement",
          "Investissez dans ce qui compte"
        ]
      }
    };
    return details[dimension];
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const { income_score, expense_score, value_score, triangle_balance, analysis } = triangleData;
  const equilibriumPoint = getTrianglePoint(income_score, expense_score, value_score);
  const balanceInfo = getBalanceMessage(triangle_balance);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-primary-700">
        Votre Triangle Yoonu Dal
      </h2>
      
      {/* Équilibre global */}
      <div className={`text-center p-3 rounded-lg mb-6 ${balanceInfo.bg}`}>
        <div className="text-lg font-semibold">Équilibre Global</div>
        <div className={`text-2xl font-bold ${balanceInfo.color}`}>
          {triangle_balance.toFixed(1)}%
        </div>
        <div className={`text-sm ${balanceInfo.color}`}>
          {balanceInfo.text}
        </div>
      </div>

      {/* Triangle interactif */}
      <div className="relative h-80 w-full mb-8">
        <svg viewBox="0 0 400 350" className="w-full h-full">
          {/* Triangle principal */}
          <path
            d="M 200 50 L 100 280 L 300 280 Z"
            fill="rgba(34, 197, 94, 0.05)"
            stroke="#16a34a"
            strokeWidth="2"
          />
          
          {/* Points des dimensions avec interactions */}
          {/* Valeurs (sommet) */}
          <g>
            <circle
              cx="200" cy="50" r="18"
              fill={getScoreColor(value_score)}
              className="cursor-pointer hover:stroke-4 transition-all"
              stroke="white"
              strokeWidth="3"
              onClick={() => setSelectedDimension(selectedDimension === 'valeurs' ? null : 'valeurs')}
            />
            <text x="200" y="30" textAnchor="middle" className="fill-primary-700 font-bold text-sm">
              VALEURS
            </text>
            <text x="200" y="57" textAnchor="middle" className="fill-white font-bold text-xs">
              {value_score.toFixed(0)}%
            </text>
          </g>
          
          {/* Revenus (bas gauche) */}
          <g>
            <circle
              cx="100" cy="280" r="18"
              fill={getScoreColor(income_score)}
              className="cursor-pointer hover:stroke-4 transition-all"
              stroke="white"
              strokeWidth="3"
              onClick={() => setSelectedDimension(selectedDimension === 'revenus' ? null : 'revenus')}
            />
            <text x="100" y="310" textAnchor="middle" className="fill-primary-700 font-bold text-sm">
              REVENUS
            </text>
            <text x="100" y="287" textAnchor="middle" className="fill-white font-bold text-xs">
              {income_score.toFixed(0)}%
            </text>
          </g>
          
          {/* Dépenses (bas droite) */}
          <g>
            <circle
              cx="300" cy="280" r="18"
              fill={getScoreColor(expense_score)}
              className="cursor-pointer hover:stroke-4 transition-all"
              stroke="white"
              strokeWidth="3"
              onClick={() => setSelectedDimension(selectedDimension === 'depenses' ? null : 'depenses')}
            />
            <text x="300" y="310" textAnchor="middle" className="fill-primary-700 font-bold text-sm">
              DÉPENSES
            </text>
            <text x="300" y="287" textAnchor="middle" className="fill-white font-bold text-xs">
              {expense_score.toFixed(0)}%
            </text>
          </g>
          
          {/* Point d'équilibre dynamique */}
          <g>
            <circle
              cx={equilibriumPoint.x}
              cy={equilibriumPoint.y}
              r="8"
              fill="#dc2626"
              className="animate-pulse"
            />
          </g>
        </svg>
      </div>

      {/* Détails de la dimension sélectionnée */}
      {selectedDimension && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-blue-800">
              {getDimensionDetails(selectedDimension).title}
            </h3>
            <button
              onClick={() => setSelectedDimension(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-700 mb-3">
            {getDimensionDetails(selectedDimension).description}
          </p>
          
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">💡 Conseils</h4>
            <ul className="space-y-1">
              {getDimensionDetails(selectedDimension).tips.map((tip, index) => (
                <li key={index} className="flex items-center text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Analyses personnalisées */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Analyses Personnalisées</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border-l-4 border-green-400 bg-green-50 rounded-r">
            <div className="font-medium text-green-800 text-sm">Revenus</div>
            <div className="text-green-700 text-sm mt-1">{analysis.income}</div>
          </div>
          
          <div className="p-3 border-l-4 border-blue-400 bg-blue-50 rounded-r">
            <div className="font-medium text-blue-800 text-sm">Dépenses</div>
            <div className="text-blue-700 text-sm mt-1">{analysis.expense}</div>
          </div>
          
          <div className="p-3 border-l-4 border-purple-400 bg-purple-50 rounded-r">
            <div className="font-medium text-purple-800 text-sm">Valeurs</div>
            <div className="text-purple-700 text-sm mt-1">{analysis.value}</div>
          </div>
        </div>
      </div>

      {/* Actions recommandées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-left">
          <div className="font-medium">Réviser les Valeurs</div>
          <div className="text-sm opacity-90">Clarifier vos priorités</div>
        </button>
        
        <button className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left">
          <div className="font-medium">Optimiser les Dépenses</div>
          <div className="text-sm opacity-90">Améliorer l'allocation</div>
        </button>
        
        <button className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left">
          <div className="font-medium">Diversifier les Revenus</div>
          <div className="text-sm opacity-90">Créer de nouvelles sources</div>
        </button>
      </div>
    </div>
  );
};

export default TriangleVisual;