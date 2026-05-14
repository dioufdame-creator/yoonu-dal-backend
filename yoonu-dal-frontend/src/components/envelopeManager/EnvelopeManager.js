import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const EnvelopeManagerPremium = ({ toast, onNavigate, auth }) => {
  const [loading, setLoading] = useState(true);
  const [envelopes, setEnvelopes] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPercentages, setAdjustPercentages] = useState({
    essentiel: 50,
    plaisir: 30,
    projet: 20,
    liberation: 0
  });
  const [hoveredEnvelope, setHoveredEnvelope] = useState(null);

  const ENVELOPE_CONFIG = {
    essentiel: {
      name: 'Essentiels',
      icon: '🏠',
      description: 'Loyer, transport, alimentation, santé',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      glowColor: 'shadow-red-500/20',
      recommendedMin: 40,
      recommendedMax: 60,
      colorHex: ['#ef4444', '#ec4899']
    },
    plaisir: {
      name: 'Plaisirs',
      icon: '🎉',
      description: 'Loisirs, sorties, divertissements',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      glowColor: 'shadow-blue-500/20',
      recommendedMin: 20,
      recommendedMax: 30,
      colorHex: ['#3b82f6', '#6366f1']
    },
    projet: {
      name: 'Projets',
      icon: '💎',
      description: 'Épargne, investissements, famille',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      glowColor: 'shadow-green-500/20',
      recommendedMin: 20,
      recommendedMax: 30,
      colorHex: ['#10b981', '#059669']
    },
    liberation: {
      name: 'Libération',
      icon: '🔓',
      description: 'Dettes, crédits, solidarité familiale',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      glowColor: 'shadow-orange-500/20',
      recommendedMin: 0,
      recommendedMax: 20,
      colorHex: ['#f97316', '#f59e0b']
    }
  };

  // Mapping backend → frontend key
  const BACKEND_TO_FRONTEND = {
    'essentiels': 'essentiel',
    'plaisirs': 'plaisir',
    'projets': 'projet',
    'liberation': 'liberation',
    'essentiel': 'essentiel',
    'plaisir': 'plaisir',
    'projet': 'projet',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await API.get('/meta-envelopes/');
      const envList = response.data?.envelopes || [];
      const income = response.data?.monthly_income || 0;

      const enrichedEnvelopes = envList.map(env => {
        const frontendKey = BACKEND_TO_FRONTEND[env.envelope_type] || env.envelope_type;
        return {
          ...env,
          envelope_type: frontendKey,
          ...ENVELOPE_CONFIG[frontendKey] || {},
          history: generateMockHistory(env.current_spent || 0)
        };
      });

      setEnvelopes(enrichedEnvelopes);
      setMonthlyIncome(income);

      // Charger les pourcentages depuis le backend
      const percentages = { essentiel: 50, plaisir: 30, projet: 20, liberation: 0 };
      envList.forEach(env => {
        const key = BACKEND_TO_FRONTEND[env.envelope_type] || env.envelope_type;
        if (key in percentages) {
          percentages[key] = parseFloat(env.allocated_percentage) || 0;
        }
      });
      setAdjustPercentages(percentages);

    } catch (error) {
      console.error('Erreur chargement:', error);
      toast?.showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const generateMockHistory = (currentValue) => {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const variance = Math.random() * 0.3 - 0.15;
      const value = currentValue * (0.7 + i * 0.05) * (1 + variance);
      history.push({ day: 7 - i, value: Math.max(0, value) });
    }
    return history;
  };

  const updatePercentage = (envType, rawValue) => {
    const value = Math.min(100, Math.max(0, parseFloat(rawValue) || 0));
    setAdjustPercentages(prev => ({ ...prev, [envType]: value }));
  };

  const handleAdjustSubmit = async () => {
    const total = Object.values(adjustPercentages).reduce((sum, val) => sum + val, 0);

    if (Math.abs(total - 100) > 0.1) {
      toast?.showError(`Total = ${total.toFixed(1)}%. Doit être 100%`);
      return;
    }

    try {
      await API.post('/meta-envelopes/', {
        monthly_income: monthlyIncome,
        percentages: adjustPercentages
      });
      toast?.showSuccess('Budgets ajustés avec succès');
      setShowAdjustModal(false);
      loadData();
    } catch (error) {
      toast?.showError('Erreur lors de l\'ajustement');
    }
  };

  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) =>
    new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';

  const totalAllocated = Object.values(adjustPercentages).reduce((sum, val) => sum + val, 0);
  const totalBudget = envelopes.reduce((sum, env) => sum + (env.monthly_budget || 0), 0);

  const getEnvelopeStatus = (env) => {
    const percentage = env.current_spent && env.monthly_budget
      ? (env.current_spent / env.monthly_budget) * 100 : 0;
    if (percentage >= 100) return { label: 'Dépassé', color: 'red', emoji: '🔴' };
    if (percentage >= 80) return { label: 'Attention', color: 'amber', emoji: '🟡' };
    return { label: 'Bon', color: 'green', emoji: '🟢' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de vos enveloppes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">

        {/* Header */}
        <div className="mb-6 sm:mb-8 backdrop-blur-xl bg-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                📁 Mes Enveloppes
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Gère tes finances selon la méthode Yoonu Dal
              </p>
            </div>
            <button
              onClick={() => setShowAdjustModal(true)}
              className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span className="text-xl group-hover:rotate-180 transition-transform duration-500">⚙️</span>
              <span>Ajuster les budgets</span>
            </button>
          </div>
        </div>

        {/* Income Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl sm:rounded-3xl shadow-2xl shadow-green-500/30 p-4 sm:p-6 lg:p-10 mb-6 sm:mb-8 text-white">
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="backdrop-blur-sm bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <p className="text-xs sm:text-sm text-green-100 mb-1 flex items-center gap-2"><span>💰</span> Revenus mensuels</p>
              <p className="text-3xl sm:text-4xl font-bold mb-1">{formatCurrency(monthlyIncome)}</p>
              <p className="text-xs text-green-100">{formatCurrencyFull(monthlyIncome)}</p>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <p className="text-xs sm:text-sm text-green-100 mb-1 flex items-center gap-2"><span>📊</span> Budget alloué</p>
              <p className="text-3xl sm:text-4xl font-bold mb-1">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-green-100">{monthlyIncome > 0 ? (totalBudget / monthlyIncome * 100).toFixed(1) : 0}% des revenus</p>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <p className="text-xs sm:text-sm text-green-100 mb-1 flex items-center gap-2"><span>🎯</span> Enveloppes actives</p>
              <p className="text-3xl sm:text-4xl font-bold mb-1">{envelopes.length}</p>
              <p className="text-xs text-green-100">4 piliers Yoonu Dal</p>
            </div>
          </div>
        </div>

        {/* Envelopes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {envelopes.map(envelope => {
            const config = ENVELOPE_CONFIG[envelope.envelope_type] || {
              name: envelope.envelope_type,
              icon: '📦',
              color: 'from-gray-500 to-gray-600',
              bgColor: 'bg-gray-50',
              borderColor: 'border-gray-200',
              textColor: 'text-gray-700',
              glowColor: 'shadow-gray-500/20',
            };
            const status = getEnvelopeStatus(envelope);
            const currentSpent = envelope.current_spent || 0;
            const budget = envelope.monthly_budget || 0;
            const spentPercentage = budget > 0 ? (currentSpent / budget) * 100 : 0;
            const remaining = budget - currentSpent;
            const isHovered = hoveredEnvelope === envelope.id;

            return (
              <div key={envelope.id}
                className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border-2 ${config.borderColor} overflow-hidden hover:shadow-2xl transition-all duration-500 sm:transform sm:hover:scale-105`}
                onMouseEnter={() => setHoveredEnvelope(envelope.id)}
                onMouseLeave={() => setHoveredEnvelope(null)}
              >
                <div className={`relative ${config.bgColor} border-b-2 ${config.borderColor} p-4 sm:p-6`}>
                  <div className="text-center mb-3">
                    <span className={`text-4xl sm:text-5xl inline-block transition-transform duration-500 ${isHovered ? 'sm:scale-125' : ''}`}>
                      {config.icon}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 text-center mb-1">{config.name}</h3>
                  <p className="text-xs text-gray-600 text-center mb-3">{config.description}</p>
                  <div className="backdrop-blur-sm bg-white/90 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Budget mensuel</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${config.color} text-white`}>
                        {parseFloat(envelope.allocated_percentage || 0).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(budget)}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrencyFull(budget)}</p>
                  </div>
                </div>

                <div className="relative p-4 sm:p-6">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Ce mois-ci</span>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                        status.color === 'red' ? 'bg-red-100 text-red-700' :
                        status.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {status.emoji} {status.label}
                      </div>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                      <div className={`h-2 rounded-full bg-gradient-to-r ${config.color} transition-all duration-1000`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Dépensé:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(currentSpent)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{remaining < 0 ? 'Dépassement:' : 'Restant:'}</span>
                        <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                        <span>Utilisation:</span>
                        <span className="font-semibold">{spentPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-50/80 via-purple-50/80 to-pink-50/80 rounded-2xl p-5 sm:p-6 border-2 border-indigo-200/50 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="text-4xl">💡</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Les 4 Piliers de Yoonu Dal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(ENVELOPE_CONFIG).map(([key, config]) => (
                  <div key={key} className="bg-white/60 rounded-xl p-3 border border-white/40 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl flex-shrink-0">{config.icon}</span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-0.5">{config.name}</h4>
                        <p className="text-xs text-gray-700">{config.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajuster */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-8 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">⚙️ Ajuster les budgets</h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="space-y-4 mb-6">
              {Object.keys(ENVELOPE_CONFIG).map(envType => {
                const config = ENVELOPE_CONFIG[envType];
                const value = adjustPercentages[envType] ?? 0;
                const montant = Math.round((monthlyIncome * value) / 100);

                return (
                  <div key={envType} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    {/* Nom + montant */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{config.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{config.name}</h3>
                        <p className="text-xs text-gray-500">{config.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatCurrencyFull(montant)}</p>
                      </div>
                    </div>

                    {/* Slider + Input côte à côte */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={value}
                        onChange={(e) => updatePercentage(envType, e.target.value)}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, ${config.colorHex[0]} 0%, ${config.colorHex[1]} ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
                        }}
                      />
                      {/* Input numérique direct */}
                      <div className="flex items-center gap-1 bg-white border-2 border-gray-200 rounded-xl px-3 py-2 min-w-20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => updatePercentage(envType, e.target.value)}
                          className="w-10 text-center font-bold text-gray-900 bg-transparent outline-none text-sm"
                        />
                        <span className="text-gray-500 text-sm font-medium">%</span>
                      </div>
                    </div>

                    {/* Recommandation */}
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                      <span>Recommandé : {config.recommendedMin}%–{config.recommendedMax}%</span>
                      {(value < config.recommendedMin || value > config.recommendedMax) && (
                        <span className="text-amber-500 font-medium">⚠️ Hors recommandation</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className={`rounded-xl p-4 mb-4 border-2 ${
              Math.abs(totalAllocated - 100) < 0.1 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Total alloué</span>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${Math.abs(totalAllocated - 100) < 0.1 ? 'text-green-600' : 'text-amber-600'}`}>
                    {totalAllocated.toFixed(1)}%
                  </p>
                  {Math.abs(totalAllocated - 100) >= 0.1 && (
                    <p className="text-xs text-amber-600">
                      {totalAllocated > 100 ? `⚠️ Dépassement de ${(totalAllocated - 100).toFixed(1)}%` : `⚠️ Il manque ${(100 - totalAllocated).toFixed(1)}%`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton reset */}
            <button
              onClick={() => setAdjustPercentages({ essentiel: 50, plaisir: 30, projet: 20, liberation: 0 })}
              className="w-full py-2 mb-3 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
            >
              🔄 Réinitialiser aux valeurs par défaut (50/30/20/0)
            </button>

            <div className="flex gap-3">
              <button onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">
                Annuler
              </button>
              <button onClick={handleAdjustSubmit}
                disabled={Math.abs(totalAllocated - 100) >= 0.1}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite; }
        @media (min-width: 475px) {
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
          .xs\\:block { display: block; }
        }
      `}</style>
    </div>
  );
};

export default EnvelopeManagerPremium;
