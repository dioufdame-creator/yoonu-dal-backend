import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// ENVELOPE MANAGER V2 - PREMIUM DESIGN
// Budgets par enveloppe avec simulation
// ==========================================

const EnvelopeManagerV2 = ({ toast, onNavigate, auth }) => {
  const [loading, setLoading] = useState(true);
  const [envelopes, setEnvelopes] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ allocated_percentage: 0, monthly_budget: 0 });
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulatedEnvelopes, setSimulatedEnvelopes] = useState([]);

  // Configuration enveloppes
  const ENVELOPE_CONFIG = {
    essentiels: {
      name: 'Essentiels',
      icon: '🏠',
      description: 'Loyer, transport, alimentation, santé',
      color: 'from-red-500 to-red-400',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      recommendedMin: 50,
      recommendedMax: 60
    },
    plaisirs: {
      name: 'Plaisirs',
      icon: '🎉',
      description: 'Loisirs, sorties, divertissements',
      color: 'from-blue-500 to-blue-400',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      recommendedMin: 20,
      recommendedMax: 30
    },
    projets: {
      name: 'Projets',
      icon: '💎',
      description: 'Épargne, investissements, famille',
      color: 'from-green-500 to-green-400',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      recommendedMin: 20,
      recommendedMax: 30
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [envelopesRes, profileRes] = await Promise.all([
        API.get('/envelopes/').catch(() => ({ data: [] })),
        API.get('/profile/').catch(() => ({ data: { monthly_income: 0 } }))
      ]);

      const envList = Array.isArray(envelopesRes.data) ? envelopesRes.data : envelopesRes.data.envelopes || [];
      
      // Enrichir avec config
      const enrichedEnvelopes = envList.map(env => ({
        ...env,
        ...ENVELOPE_CONFIG[env.envelope_type] || {}
      }));

      setEnvelopes(enrichedEnvelopes);
      setMonthlyIncome(profileRes.data.monthly_income || 0);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast?.showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
  };

  // Actions
  const handleAdjust = (envelope) => {
    setSelectedEnvelope(envelope);
    setAdjustForm({
      allocated_percentage: envelope.allocated_percentage || 0,
      monthly_budget: envelope.monthly_budget || 0
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async () => {
    if (!selectedEnvelope) return;

    try {
      await API.patch(`/envelopes/${selectedEnvelope.id}/`, {
        allocated_percentage: parseFloat(adjustForm.allocated_percentage),
        monthly_budget: parseFloat(adjustForm.monthly_budget)
      });

      toast?.showSuccess('Budget ajusté avec succès');
      setShowAdjustModal(false);
      setSelectedEnvelope(null);
      loadData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast?.showError('Erreur lors de la sauvegarde');
    }
  };

  const handleSimulate = () => {
    setSimulationMode(true);
    setSimulatedEnvelopes(envelopes.map(env => ({
      ...env,
      simulated_percentage: env.allocated_percentage,
      simulated_budget: env.monthly_budget
    })));
  };

  const handleApplySimulation = async () => {
    try {
      for (const env of simulatedEnvelopes) {
        await API.patch(`/envelopes/${env.id}/`, {
          allocated_percentage: env.simulated_percentage,
          monthly_budget: env.simulated_budget
        });
      }
      
      toast?.showSuccess('Simulation appliquée avec succès');
      setSimulationMode(false);
      setSimulatedEnvelopes([]);
      loadData();
    } catch (error) {
      console.error('Erreur application:', error);
      toast?.showError('Erreur lors de l\'application');
    }
  };

  const updateSimulation = (envelopeId, percentage) => {
    const newBudget = (monthlyIncome * percentage) / 100;
    
    setSimulatedEnvelopes(prev => prev.map(env =>
      env.id === envelopeId
        ? { ...env, simulated_percentage: percentage, simulated_budget: newBudget }
        : env
    ));
  };

  // Calculs
  const displayEnvelopes = simulationMode ? simulatedEnvelopes : envelopes;
  
  const totalAllocated = displayEnvelopes.reduce((sum, env) => {
    const pct = simulationMode ? env.simulated_percentage : env.allocated_percentage;
    return sum + (pct || 0);
  }, 0);

  const totalBudget = displayEnvelopes.reduce((sum, env) => {
    const budget = simulationMode ? env.simulated_budget : env.monthly_budget;
    return sum + (budget || 0);
  }, 0);

  const unallocated = monthlyIncome - totalBudget;
  const unallocatedPercentage = 100 - totalAllocated;

  const getEnvelopeStatus = (env) => {
    const percentage = env.current_spent && env.monthly_budget 
      ? (env.current_spent / env.monthly_budget) * 100 
      : 0;
    
    if (percentage >= 100) return { label: 'Dépassé', color: 'red' };
    if (percentage >= 80) return { label: 'Attention', color: 'amber' };
    return { label: 'Bon', color: 'green' };
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* Bandeau simulation */}
        {simulationMode && (
          <div 
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm animate-slideDown"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.92) 0%, rgba(37, 99, 235, 0.92) 100%)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔮</span>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Mode Simulation Activé
                    </p>
                    <p className="text-xs text-blue-50">
                      Ajuste tes budgets sans les sauvegarder
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplySimulation}
                    className="bg-white text-blue-700 px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-all text-xs shadow-sm"
                  >
                    Appliquer
                  </button>
                  <button
                    onClick={() => { setSimulationMode(false); setSimulatedEnvelopes([]); }}
                    className="bg-blue-700 bg-opacity-25 text-white px-3 py-1.5 rounded-lg hover:bg-opacity-35 transition-all text-xs"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={`mb-6 transition-all duration-300 ${simulationMode ? 'pt-20' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                📁 Mes Enveloppes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gère tes budgets mensuels par catégorie
              </p>
            </div>
            
            {!simulationMode && (
              <button
                onClick={handleSimulate}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <span>🔮</span>
                <span>Simuler</span>
              </button>
            )}
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 lg:p-8 mb-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-green-100 mb-1">Revenus mensuels</p>
              <p className="text-4xl font-bold">{formatCurrency(monthlyIncome)}</p>
              <p className="text-xs text-green-100 mt-1">{formatCurrencyFull(monthlyIncome)}</p>
            </div>
            
            <div>
              <p className="text-sm text-green-100 mb-1">Budget alloué</p>
              <p className="text-4xl font-bold">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-green-100 mt-1">{totalAllocated.toFixed(1)}% des revenus</p>
            </div>
            
            <div>
              <p className="text-sm text-green-100 mb-1">Non alloué</p>
              <p className={`text-4xl font-bold ${unallocated < 0 ? 'text-red-200' : ''}`}>
                {formatCurrency(unallocated)}
              </p>
              <p className="text-xs text-green-100 mt-1">
                {unallocatedPercentage.toFixed(1)}% restant
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
              <div
                className="h-3 bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalAllocated, 100)}%` }}
              />
            </div>
            <p className="text-xs text-green-100 mt-2 text-center">
              {totalAllocated > 100 && '⚠️ Attention : Budget supérieur aux revenus'}
              {totalAllocated === 100 && '✅ Budget parfaitement alloué'}
              {totalAllocated < 100 && `${unallocatedPercentage.toFixed(1)}% à répartir`}
            </p>
          </div>
        </div>

        {/* Envelopes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {displayEnvelopes.map(envelope => {
            const config = ENVELOPE_CONFIG[envelope.envelope_type];
            const status = getEnvelopeStatus(envelope);
            const displayPercentage = simulationMode ? envelope.simulated_percentage : envelope.allocated_percentage;
            const displayBudget = simulationMode ? envelope.simulated_budget : envelope.monthly_budget;
            const currentSpent = envelope.current_spent || 0;
            const spentPercentage = displayBudget > 0 ? (currentSpent / displayBudget) * 100 : 0;
            const remaining = displayBudget - currentSpent;

            return (
              <div key={envelope.id} className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
                {/* Header */}
                <div className={`${config.bgColor} border-b-2 ${config.borderColor} p-6`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{config.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{config.name}</h3>
                        <p className="text-xs text-gray-600">{config.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Budget Card */}
                  <div className="bg-white rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Budget mensuel</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                        {displayPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(displayBudget)}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrencyFull(displayBudget)}</p>
                  </div>

                  {/* Recommendations */}
                  {!simulationMode && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600">Recommandé:</span>
                      <span className={`font-semibold ${
                        displayPercentage >= config.recommendedMin && displayPercentage <= config.recommendedMax
                          ? 'text-green-600'
                          : 'text-amber-600'
                      }`}>
                        {config.recommendedMin}-{config.recommendedMax}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Current Month Stats */}
                  {!simulationMode && (
                    <>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Ce mois</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            status.color === 'red' ? 'bg-red-100 text-red-700' :
                            status.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                            style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Dépensé: {formatCurrency(currentSpent)}
                          </span>
                          <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {remaining < 0 ? 'Dépassement' : 'Reste'}: {formatCurrency(Math.abs(remaining))}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Simulation Mode Slider */}
                  {simulationMode && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Ajuster le budget: {displayPercentage.toFixed(1)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={displayPercentage}
                        onChange={(e) => updateSimulation(envelope.id, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0%</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(displayBudget)}</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!simulationMode && (
                    <button
                      onClick={() => handleAdjust(envelope)}
                      className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:shadow-md transition-all"
                    >
                      ⚙️ Ajuster le budget
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 lg:p-8 border-2 border-indigo-200">
          <div className="flex items-start gap-4">
            <span className="text-4xl">💡</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Conseils pour bien répartir ton budget
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Essentiels (50-60%)</strong> : Loyer, transport, alimentation, santé</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Projets (20-30%)</strong> : Épargne, investissements, objectifs futurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Plaisirs (20-30%)</strong> : Loisirs, sorties, bien-être</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adjust */}
      {showAdjustModal && selectedEnvelope && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ⚙️ Ajuster {ENVELOPE_CONFIG[selectedEnvelope.envelope_type]?.name}
            </h2>

            <div className="space-y-6">
              {/* Percentage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pourcentage des revenus: {adjustForm.allocated_percentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={adjustForm.allocated_percentage}
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value);
                    setAdjustForm({
                      allocated_percentage: pct,
                      monthly_budget: (monthlyIncome * pct) / 100
                    });
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Budget Result */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Budget mensuel résultant</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(adjustForm.monthly_budget)}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrencyFull(adjustForm.monthly_budget)}</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAdjustModal(false); setSelectedEnvelope(null); }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveAdjustment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnvelopeManagerV2;