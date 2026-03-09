import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const ProjectionWidget = () => {
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjection();
  }, []);

  const loadProjection = async () => {
    try {
      const response = await API.get('/projection/');
      setProjection(response.data);
    } catch (error) {
      console.error('Erreur projection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!projection?.projection) {
    return null;
  }

  const { 
    projected_balance, 
    projected_savings,
    days_remaining, 
    is_positive,
    daily_avg_expense 
  } = projection.projection;

  const { risks, recommendations } = projection;
  const criticalRisk = risks?.find(r => r.severity === 'critical');

  return (
    <div className={`rounded-2xl shadow-lg p-6 ${
      is_positive 
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' 
        : 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <span className="mr-2">{is_positive ? '📊' : '⚠️'}</span>
          Projection Fin de Mois
        </h3>
        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
          J-{days_remaining}
        </span>
      </div>

      {/* Projection principale */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Si tu continues ainsi :</p>
        <div className={`text-3xl font-bold ${is_positive ? 'text-green-600' : 'text-red-600'}`}>
          {projected_balance >= 0 ? '+' : ''}{Math.round(projected_balance).toLocaleString()} FCFA
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Solde prévu fin février
        </p>
      </div>

      {/* Détails */}
      {is_positive ? (
        <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">💰</span>
            <div>
              <p className="font-semibold text-gray-900">
                Épargne probable : {Math.round(projected_savings).toLocaleString()} FCFA
              </p>
              <p className="text-xs text-gray-600">
                Moyenne {Math.round(daily_avg_expense).toLocaleString()} FCFA/jour
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold text-red-600">
                {criticalRisk?.message || 'Attention au dépassement'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {criticalRisk?.recommendation || 'Réduis tes dépenses quotidiennes'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommandation */}
      {recommendations && recommendations.length > 0 && (
        <div className={`rounded-lg p-3 ${
          recommendations[0].type === 'positive' 
            ? 'bg-green-100 border border-green-300' 
            : 'bg-blue-100 border border-blue-300'
        }`}>
          <div className="flex items-start space-x-2">
            <span className="text-lg">
              {recommendations[0].type === 'positive' ? '✅' : '💡'}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {recommendations[0].message}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {recommendations[0].action}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lien voir détails */}
      {risks && risks.length > 0 && (
        <button 
          onClick={() => window.location.href = '#/alerts'}
          className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900 font-semibold"
        >
          Voir toutes les alertes ({risks.length}) →
        </button>
      )}
    </div>
  );
};

export default ProjectionWidget;
