import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// ENVELOPE MANAGER V3 - 4 ENVELOPPES YOONU DAL
// Système complet avec Libération
// ==========================================

const EnvelopeManagerV3 = ({ toast, onNavigate, auth }) => {
  const [loading, setLoading] = useState(true);
  const [envelopes, setEnvelopes] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPercentages, setAdjustPercentages] = useState({
    essentiels: 50,
    plaisirs: 30,
    projets: 20,
    liberation: 0
  });

  // ✅ Configuration 4 enveloppes
  const ENVELOPE_CONFIG = {
    essentiels: {
      name: 'Essentiels',
      icon: '🏠',
      description: 'Loyer, transport, alimentation, santé',
      color: 'from-red-500 to-red-400',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      recommendedMin: 40,
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
    },
    liberation: {
      name: 'Libération',
      icon: '🔓',
      description: 'Dettes, crédits, solidarité familiale',
      color: 'from-orange-500 to-orange-400',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      recommendedMin: 0,
      recommendedMax: 20
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // ✅ Utiliser le bon endpoint
      const response = await API.get('/meta-envelopes/');
      
      const envList = response.data?.envelopes || [];
      const income = response.data?.monthly_income || 0;
      
      // Enrichir avec config
      const enrichedEnvelopes = envList.map(env => ({
        ...env,
        ...ENVELOPE_CONFIG[env.envelope_type] || {}
      }));

      setEnvelopes(enrichedEnvelopes);
      setMonthlyIncome(income);
      
      // Initialiser les pourcentages
      const percentages = {};
      envList.forEach(env => {
        percentages[env.envelope_type] = env.allocated_percentage || 0;
      });
      setAdjustPercentages(percentages);
      
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
  const handleSaveAdjustments = async () => {
    // Vérifier que total = 100%
    const total = Object.values(adjustPercentages).reduce((sum, val) => sum + val, 0);
    
    if (Math.abs(total - 100) > 0.1) {
      toast?.showError(`Le total doit être 100% (actuellement: ${total.toFixed(1)}%)`);
      return;
    }

    try {
      await API.post('/meta-envelopes/', {
        essentiels_percentage: adjustPercentages.essentiels,
        plaisirs_percentage: adjustPercentages.plaisirs,
        projets_percentage: adjustPercentages.projets,
        liberation_percentage: adjustPercentages.liberation
      });

      toast?.showSuccess('Budgets mis à jour avec succès');
      setShowAdjustModal(false);
      loadData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast?.showError(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const updatePercentage = (envelopeType, value) => {
    setAdjustPercentages(prev => ({
      ...prev,
      [envelopeType]: parseFloat(value)
    }));
  };

  // Calculs
  const totalAllocated = Object.values(adjustPercentages).reduce((sum, val) => sum + val, 0);
  
  const totalBudget = envelopes.reduce((sum, env) => sum + (env.monthly_budget || 0), 0);
  
  const unallocated = monthlyIncome - totalBudget;

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
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                📁 Mes Enveloppes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gère tes budgets mensuels selon la méthode Yoonu Dal
              </p>
            </div>
            
            <button
              onClick={() => setShowAdjustModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <span>⚙️</span>
              <span>Ajuster</span>
            </button>
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
              <p className="text-xs text-green-100 mt-1">{(totalBudget / monthlyIncome * 100).toFixed(1)}% des revenus</p>
            </div>
            
            <div>
              <p className="text-sm text-green-100 mb-1">Enveloppes actives</p>
              <p className="text-4xl font-bold">{envelopes.length}</p>
              <p className="text-xs text-green-100 mt-1">4 piliers Yoonu Dal</p>
            </div>
          </div>
        </div>

        {/* Envelopes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {envelopes.map(envelope => {
            const config = ENVELOPE_CONFIG[envelope.envelope_type] || {};
            const status = getEnvelopeStatus(envelope);
            const currentSpent = envelope.current_spent || 0;
            const budget = envelope.monthly_budget || 0;
            const spentPercentage = budget > 0 ? (currentSpent / budget) * 100 : 0;
            const remaining = budget - currentSpent;

            return (
              <div key={envelope.id} className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                {/* Header */}
                <div className={`${config.bgColor} border-b-2 ${config.borderColor} p-6`}>
                  <div className="text-center mb-4">
                    <span className="text-5xl">{config.icon}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    {config.name}
                  </h3>
                  <p className="text-xs text-gray-600 text-center mb-4">
                    {config.description}
                  </p>

                  {/* Budget */}
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Budget</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                        {envelope.allocated_percentage?.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(budget)}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrencyFull(budget)}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Progress */}
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

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Dépensé:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(currentSpent)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {remaining < 0 ? 'Dépassement:' : 'Restant:'}
                        </span>
                        <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                    </div>
                  </div>
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
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Les 4 Piliers de Yoonu Dal
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">🏠</span>
                  <span><strong>Essentiels</strong> : Besoins vitaux (loyer, nourriture, transport, santé)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">🎉</span>
                  <span><strong>Plaisirs</strong> : Loisirs et bien-être (sorties, hobbies, détente)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">💎</span>
                  <span><strong>Projets</strong> : Construire l'avenir (épargne, investissement, famille)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">🔓</span>
                  <span><strong>Libération</strong> : Se libérer avant de construire (dettes, crédits, solidarité)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adjust */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ⚙️ Ajuster les budgets
            </h2>

            <div className="space-y-6 mb-6">
              {Object.keys(ENVELOPE_CONFIG).map(envType => {
                const config = ENVELOPE_CONFIG[envType];
                const percentage = adjustPercentages[envType] || 0;
                const budget = (monthlyIncome * percentage) / 100;
                
                return (
                  <div key={envType} className={`${config.bgColor} rounded-xl p-4 border-2 ${config.borderColor}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{config.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{config.name}</h3>
                        <p className="text-xs text-gray-600">{config.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{percentage.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">{formatCurrency(budget)}</p>
                      </div>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={percentage}
                      onChange={(e) => updatePercentage(envType, e.target.value)}
                      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-${config.color.split('-')[1]}-600`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className={`p-4 rounded-xl mb-6 ${
              Math.abs(totalAllocated - 100) < 0.1 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Total alloué:</span>
                <span className={`text-2xl font-bold ${
                  Math.abs(totalAllocated - 100) < 0.1 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalAllocated.toFixed(1)}%
                </span>
              </div>
              {Math.abs(totalAllocated - 100) >= 0.1 && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Le total doit être exactement 100%
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAdjustments}
                disabled={Math.abs(totalAllocated - 100) >= 0.1}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                  Math.abs(totalAllocated - 100) < 0.1
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Sauvegarder
              </button>
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
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnvelopeManagerV3;
