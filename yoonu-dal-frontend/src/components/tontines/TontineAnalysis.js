import React, { useState, useEffect } from 'react';

const TontineAnalysis = ({ onNavigate }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simuler le chargement des données d'analyse
    setTimeout(() => {
      setAnalysisData({
        summary: {
          total_monthly_commitment: 125000,
          budget_impact_percentage: 15.6,
          number_of_active_tontines: 2,
          diversification_score: 65,
          risk_score: 32,
          efficiency_score: 78
        },
        breakdown: {
          by_motivation: [
            { motivation: 'solidarity', label: 'Solidarité', count: 1, amount: 50000, percentage: 40, icon: '🤝' },
            { motivation: 'project', label: 'Projet', count: 1, amount: 75000, percentage: 60, icon: '🎯' }
          ],
          by_frequency: [
            { frequency: 'monthly', label: 'Mensuel', count: 1, amount: 50000, icon: '📅' },
            { frequency: 'biweekly', label: 'Bi-hebdomadaire', count: 1, amount: 25000, icon: '📋' }
          ],
          by_status: [
            { status: 'active', label: 'Actives', count: 2, amount: 125000, icon: '🟢' },
            { status: 'completed', label: 'Terminées', count: 1, amount: 75000, icon: '✅' }
          ]
        },
        recommendations: [
          {
            type: 'diversification',
            priority: 'high',
            title: 'Diversifiez vos fréquences',
            description: 'Vous pourriez bénéficier d\'une meilleure diversification en variant les fréquences de contribution.',
            action: 'Considérez une tontine trimestrielle',
            impact: 'Réduction du risque de 15%',
            icon: '🎯'
          },
          {
            type: 'position',
            priority: 'medium',
            title: 'Optimisez vos positions',
            description: 'Vos positions actuelles sont équilibrées mais vous pourriez améliorer votre retour sur investissement.',
            action: 'Négociez des positions plus précoces',
            impact: 'Gain potentiel de 25,000 FCFA',
            icon: '⬆️'
          },
          {
            type: 'capacity',
            priority: 'low',
            title: 'Capacité d\'engagement disponible',
            description: 'Votre niveau d\'engagement actuel représente 15.6% de vos revenus. Vous avez une marge pour augmenter.',
            action: 'Vous pourriez ajouter 40,000 FCFA/mois',
            impact: 'Optimisation de votre épargne',
            icon: '💪'
          }
        ],
        projections: {
          next_6_months: {
            contributions_to_pay: 375000,
            expected_receipts: 400000,
            net_position: 25000
          },
          next_12_months: {
            contributions_to_pay: 750000,
            expected_receipts: 700000,
            net_position: -50000
          }
        },
        performance: {
          total_contributed: 200000,
          total_received: 450000,
          net_gain: 250000,
          roi_percentage: 125,
          success_rate: 100
        },
        trends: [
          { month: 'Jan', contributions: 75000, receipts: 0 },
          { month: 'Fév', contributions: 75000, receipts: 450000 },
          { month: 'Mar', contributions: 50000, receipts: 0 },
          { month: 'Avr', contributions: 50000, receipts: 0 },
          { month: 'Mai', contributions: 50000, receipts: 400000 },
          { month: 'Jun', contributions: 50000, receipts: 0 }
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => onNavigate && onNavigate('tontines')}
            className="text-primary-600 hover:text-primary-700 mb-2 flex items-center gap-2"
          >
            ← Retour aux tontines
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Analyse de vos Tontines</h1>
          <p className="text-gray-600 mt-1">Insights et recommandations pour optimiser votre stratégie</p>
        </div>
        <div className="text-6xl">📊</div>
      </div>

      {analysisData && (
        <>
          {/* Scores principaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Score de Diversification</h3>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getScoreBarColor(analysisData.summary.diversification_score)}`}
                      style={{ width: `${analysisData.summary.diversification_score}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(analysisData.summary.diversification_score)}`}>
                  {analysisData.summary.diversification_score}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {analysisData.summary.diversification_score >= 80 ? 'Excellente diversification' :
                 analysisData.summary.diversification_score >= 60 ? 'Bonne diversification' :
                 'À améliorer'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Score de Risque</h3>
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getScoreBarColor(100 - analysisData.summary.risk_score)}`}
                      style={{ width: `${100 - analysisData.summary.risk_score}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(100 - analysisData.summary.risk_score)}`}>
                  {analysisData.summary.risk_score}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {analysisData.summary.risk_score <= 30 ? 'Risque faible' :
                 analysisData.summary.risk_score <= 60 ? 'Risque modéré' :
                 'Risque élevé'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Score d'Efficacité</h3>
                <span className="text-2xl">⚡</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getScoreBarColor(analysisData.summary.efficiency_score)}`}
                      style={{ width: `${analysisData.summary.efficiency_score}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(analysisData.summary.efficiency_score)}`}>
                  {analysisData.summary.efficiency_score}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {analysisData.summary.efficiency_score >= 80 ? 'Très efficace' :
                 analysisData.summary.efficiency_score >= 60 ? 'Efficace' :
                 'À optimiser'}
              </p>
            </div>
          </div>

          {/* Onglets */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Vue d\'ensemble', icon: '📋' },
                  { id: 'breakdown', label: 'Répartition', icon: '📊' },
                  { id: 'performance', label: 'Performance', icon: '📈' },
                  { id: 'recommendations', label: 'Recommandations', icon: '💡' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Résumé financier */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Résumé financier</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Engagement mensuel total</span>
                    <span className="text-xl font-bold text-primary-600">
                      {analysisData.summary.total_monthly_commitment.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Impact sur le budget</span>
                    <span className={`text-lg font-semibold ${
                      analysisData.summary.budget_impact_percentage > 25 ? 'text-red-600' :
                      analysisData.summary.budget_impact_percentage > 15 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {analysisData.summary.budget_impact_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tontines actives</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {analysisData.summary.number_of_active_tontines}
                    </span>
                  </div>
                </div>
              </div>

              {/* Projections */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Projections</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Prochains 6 mois</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">À contribuer</span>
                        <span className="font-medium text-red-600">
                          -{analysisData.projections.next_6_months.contributions_to_pay.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">À recevoir</span>
                        <span className="font-medium text-green-600">
                          +{analysisData.projections.next_6_months.expected_receipts.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-600">Position nette</span>
                        <span className={`font-bold ${
                          analysisData.projections.next_6_months.net_position >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {analysisData.projections.next_6_months.net_position >= 0 ? '+' : ''}
                          {analysisData.projections.next_6_months.net_position.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Prochains 12 mois</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">À contribuer</span>
                        <span className="font-medium text-red-600">
                          -{analysisData.projections.next_12_months.contributions_to_pay.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">À recevoir</span>
                        <span className="font-medium text-green-600">
                          +{analysisData.projections.next_12_months.expected_receipts.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-600">Position nette</span>
                        <span className={`font-bold ${
                          analysisData.projections.next_12_months.net_position >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {analysisData.projections.next_12_months.net_position >= 0 ? '+' : ''}
                          {analysisData.projections.next_12_months.net_position.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Par motivation */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Par objectif</h3>
                <div className="space-y-3">
                  {analysisData.breakdown.by_motivation.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.count} tontine(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.percentage}%</p>
                        <p className="text-sm text-gray-600">{item.amount.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Par fréquence */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Par fréquence</h3>
                <div className="space-y-3">
                  {analysisData.breakdown.by_frequency.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.count} tontine(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.amount.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Par statut */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Par statut</h3>
                <div className="space-y-3">
                  {analysisData.breakdown.by_status.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.count} tontine(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.amount.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Métriques de performance */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Performance globale</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total contribué</span>
                    <span className="text-lg font-semibold text-red-600">
                      -{analysisData.performance.total_contributed.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total reçu</span>
                    <span className="text-lg font-semibold text-green-600">
                      +{analysisData.performance.total_received.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-gray-600">Gain net</span>
                    <span className={`text-xl font-bold ${
                      analysisData.performance.net_gain >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analysisData.performance.net_gain >= 0 ? '+' : ''}
                      {analysisData.performance.net_gain.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ROI</span>
                    <span className={`text-xl font-bold ${
                      analysisData.performance.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analysisData.performance.roi_percentage >= 0 ? '+' : ''}
                      {analysisData.performance.roi_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taux de succès</span>
                    <span className="text-lg font-semibold text-green-600">
                      {analysisData.performance.success_rate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphique des tendances */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Tendances (6 derniers mois)</h3>
                <div className="space-y-3">
                  {analysisData.trends.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600 w-12">{month.month}</span>
                      <div className="flex-1 mx-4">
                        <div className="flex gap-1">
                          <div 
                            className="bg-red-200 h-4 rounded"
                            style={{ width: `${(month.contributions / 100000) * 100}%` }}
                            title={`Contributions: ${month.contributions.toLocaleString()} FCFA`}
                          ></div>
                          <div 
                            className="bg-green-200 h-4 rounded"
                            style={{ width: `${(month.receipts / 500000) * 100}%` }}
                            title={`Réceptions: ${month.receipts.toLocaleString()} FCFA`}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-red-600">-{month.contributions.toLocaleString()}</p>
                        {month.receipts > 0 && (
                          <p className="text-green-600">+{month.receipts.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-200 rounded"></div>
                      <span>Contributions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-200 rounded"></div>
                      <span>Réceptions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {analysisData.recommendations.map((rec, index) => (
                <div key={index} className={`p-6 rounded-lg border-2 ${getPriorityColor(rec.priority)}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{rec.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{rec.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(rec.priority)}`}>
                          {rec.priority === 'high' ? 'Priorité haute' :
                           rec.priority === 'medium' ? 'Priorité moyenne' :
                           'Priorité basse'}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{rec.description}</p>
                      <div className="bg-white bg-opacity-50 p-3 rounded">
                        <p className="font-medium text-gray-800 mb-1">Action recommandée :</p>
                        <p className="text-gray-700 text-sm">{rec.action}</p>
                        <p className="text-primary-600 text-sm font-medium mt-2">Impact : {rec.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex justify-center gap-4">
            <button 
              onClick={() => onNavigate && onNavigate('tontines')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Retour à la liste
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('tontine-simulator')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🧮 Simuler une nouvelle tontine
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('tontine-create')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              ➕ Créer une tontine
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TontineAnalysis;