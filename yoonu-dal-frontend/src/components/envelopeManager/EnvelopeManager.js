import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

// ==========================================
// ENVELOPE MANAGER PREMIUM V4.1
// 100% RESPONSIVE - Mobile First
// Glassmorphism + Charts + Perfect Mobile UX
// ==========================================

const EnvelopeManagerPremium = ({ toast, onNavigate, auth }) => {
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
  const [hoveredEnvelope, setHoveredEnvelope] = useState(null);

  // ✅ Configuration 4 enveloppes PREMIUM
  const ENVELOPE_CONFIG = {
    // PLURIEL (pour compatibilité)
    essentiels: {
      name: 'Essentiels',
      icon: '🏠',
      description: 'Loyer, transport, alimentation, santé',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      glowColor: 'shadow-red-500/20',
      recommendedMin: 40,
      recommendedMax: 60
    },
    plaisirs: {
      name: 'Plaisirs',
      icon: '🎉',
      description: 'Loisirs, sorties, divertissements',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      glowColor: 'shadow-blue-500/20',
      recommendedMin: 20,
      recommendedMax: 30
    },
    projets: {
      name: 'Projets',
      icon: '💎',
      description: 'Épargne, investissements, famille',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      glowColor: 'shadow-green-500/20',
      recommendedMin: 20,
      recommendedMax: 30
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
      recommendedMax: 20
    },
    
    // ✅ SINGULIER (utilisé par le backend)
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
      recommendedMax: 60
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
      recommendedMax: 30
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
      recommendedMax: 30
    },
    libération: {
      name: 'Libération',
      icon: '🔓',
      description: 'Dettes, crédits, solidarité familiale',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      glowColor: 'shadow-orange-500/20',
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
      const response = await API.get('/meta-envelopes/');
      
      const envList = response.data?.envelopes || [];
      const income = response.data?.monthly_income || 0;
      
      const enrichedEnvelopes = envList.map(env => ({
        ...env,
        ...ENVELOPE_CONFIG[env.envelope_type] || {},
        history: generateMockHistory(env.current_spent || 0)
      }));

      setEnvelopes(enrichedEnvelopes);
      setMonthlyIncome(income);
      
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

  const generateMockHistory = (currentValue) => {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const variance = Math.random() * 0.3 - 0.15;
      const value = currentValue * (0.7 + i * 0.05) * (1 + variance);
      history.push({ day: 7 - i, value: Math.max(0, value) });
    }
    return history;
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
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de l\'ajustement');
    }
  };

  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
  };

  const totalAllocated = Object.values(adjustPercentages).reduce((sum, val) => sum + val, 0);
  const totalBudget = envelopes.reduce((sum, env) => sum + (env.monthly_budget || 0), 0);

  const getEnvelopeStatus = (env) => {
    const percentage = env.current_spent && env.monthly_budget 
      ? (env.current_spent / env.monthly_budget) * 100 
      : 0;
    
    if (percentage >= 100) return { label: 'Dépassé', color: 'red', emoji: '🔴' };
    if (percentage >= 80) return { label: 'Attention', color: 'amber', emoji: '🟡' };
    return { label: 'Bon', color: 'green', emoji: '🟢' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Chargement de vos enveloppes...</p>
          <div className="flex gap-1 justify-center mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
        
        {/* Header RESPONSIVE avec Glassmorphism */}
        <div className="mb-6 sm:mb-8 backdrop-blur-xl bg-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                📁 Mes Enveloppes
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                Gère tes finances selon la méthode Yoonu Dal
              </p>
            </div>
            
            {/* Bouton RESPONSIVE */}
            <button
              onClick={() => setShowAdjustModal(true)}
              className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto"
            >
              <span className="text-xl sm:text-2xl group-hover:rotate-180 transition-transform duration-500">⚙️</span>
              <span className="hidden xs:inline">Ajuster les budgets</span>
              <span className="xs:hidden">Ajuster</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Income Card RESPONSIVE */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl sm:rounded-3xl shadow-2xl shadow-green-500/30 p-4 sm:p-6 lg:p-10 mb-6 sm:mb-8 text-white">
          {/* Effets de lumière - cachés sur très petits écrans */}
          <div className="hidden sm:block absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="hidden sm:block absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="backdrop-blur-sm bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <p className="text-xs sm:text-sm text-green-100 mb-1 sm:mb-2 flex items-center gap-2">
                <span>💰</span> Revenus mensuels
              </p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">{formatCurrency(monthlyIncome)}</p>
              <p className="text-xs text-green-100">{formatCurrencyFull(monthlyIncome)}</p>
            </div>
            
            <div className="backdrop-blur-sm bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <p className="text-xs sm:text-sm text-green-100 mb-1 sm:mb-2 flex items-center gap-2">
                <span>📊</span> Budget alloué
              </p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-green-100">{(totalBudget / monthlyIncome * 100).toFixed(1)}% des revenus</p>
            </div>
            
            <div className="backdrop-blur-sm bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <p className="text-xs sm:text-sm text-green-100 mb-1 sm:mb-2 flex items-center gap-2">
                <span>🎯</span> Enveloppes actives
              </p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">{envelopes.length}</p>
              <p className="text-xs text-green-100">4 piliers Yoonu Dal</p>
            </div>
          </div>
        </div>

        {/* Envelopes Grid 100% RESPONSIVE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {envelopes.map(envelope => {
            const config = ENVELOPE_CONFIG[envelope.envelope_type] || {
              name: 'Enveloppe',
              icon: '📦',
              description: '',
              color: 'from-gray-500 to-gray-600',
              bgColor: 'bg-gray-50',
              borderColor: 'border-gray-200',
              textColor: 'text-gray-700',
              glowColor: 'shadow-gray-500/20',
              recommendedMin: 0,
              recommendedMax: 100
            };
            const status = getEnvelopeStatus(envelope);
            const currentSpent = envelope.current_spent || 0;
            const budget = envelope.monthly_budget || 0;
            const spentPercentage = budget > 0 ? (currentSpent / budget) * 100 : 0;
            const remaining = budget - currentSpent;
            const isHovered = hoveredEnvelope === envelope.id;

            return (
              <div 
                key={envelope.id} 
                className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border-2 ${config.borderColor} overflow-hidden hover:shadow-2xl ${config.glowColor} transition-all duration-500 sm:transform sm:hover:scale-105 sm:hover:-rotate-1`}
                onMouseEnter={() => setHoveredEnvelope(envelope.id)}
                onMouseLeave={() => setHoveredEnvelope(null)}
              >
                {/* Effet de brillance */}
                <div className="hidden sm:block absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Header RESPONSIVE */}
                <div className={`relative ${config.bgColor} border-b-2 ${config.borderColor} p-4 sm:p-6`}>
                  <div className="text-center mb-3 sm:mb-4">
                    <span className={`text-4xl sm:text-5xl lg:text-6xl inline-block transition-transform duration-500 ${isHovered ? 'sm:scale-125 sm:rotate-12' : ''}`}>
                      {config.icon}
                    </span>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-1 sm:mb-2">
                    {config.name}
                  </h3>
                  <p className="text-xs text-gray-600 text-center mb-3 sm:mb-4 line-clamp-2">
                    {config.description}
                  </p>

                  {/* Budget RESPONSIVE */}
                  <div className="backdrop-blur-sm bg-white/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Budget mensuel</span>
                      <span className={`text-xs font-bold px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r ${config.color} text-white shadow-md`}>
                        {envelope.allocated_percentage?.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {formatCurrency(budget)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrencyFull(budget)}</p>
                  </div>
                </div>

                {/* Body RESPONSIVE */}
                <div className="relative p-4 sm:p-6">
                  {/* Mini Chart - caché sur très petits écrans */}
                  {envelope.history && (
                    <div className="hidden xs:block mb-3 sm:mb-4 h-12 sm:h-16 opacity-50 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={envelope.history}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={`url(#gradient-${envelope.envelope_type})`}
                            strokeWidth={2}
                            dot={false}
                          />
                          <defs>
                            <linearGradient id={`gradient-${envelope.envelope_type}`} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={config.color?.includes('red') ? '#ef4444' : config.color?.includes('blue') ? '#3b82f6' : config.color?.includes('green') ? '#10b981' : '#f97316'} />
                              <stop offset="100%" stopColor={config.color?.includes('red') ? '#ec4899' : config.color?.includes('blue') ? '#6366f1' : config.color?.includes('green') ? '#059669' : '#f59e0b'} />
                            </linearGradient>
                          </defs>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255,255,255,0.95)', 
                              backdropFilter: 'blur(10px)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                              fontSize: '12px'
                            }}
                            formatter={(value) => [formatCurrency(value) + ' FCFA', 'Dépensé']}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Status RESPONSIVE */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">Ce mois-ci</span>
                      <div className={`flex items-center gap-1 sm:gap-2 text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                        status.color === 'red' ? 'bg-red-100 text-red-700' :
                        status.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      } shadow-sm`}>
                        <span className="animate-pulse">{status.emoji}</span>
                        <span>{status.label}</span>
                      </div>
                    </div>

                    {/* Progress bar RESPONSIVE */}
                    <div className="relative w-full bg-gray-100 rounded-full h-2 sm:h-3 mb-2 sm:mb-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-2 sm:h-3 rounded-full bg-gradient-to-r ${config.color} transition-all duration-1000 ease-out relative overflow-hidden`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                      {spentPercentage > 100 && (
                        <div className="absolute top-0 right-0 h-2 sm:h-3 w-1 sm:w-2 bg-red-600 animate-pulse"></div>
                      )}
                    </div>

                    {/* Stats RESPONSIVE */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Dépensé:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(currentSpent)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">
                          {remaining < 0 ? 'Dépassement:' : 'Restant:'}
                        </span>
                        <span className={`font-bold ${remaining < 0 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                      <div className="pt-1.5 sm:pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Utilisation:</span>
                          <span className="font-semibold">{spentPercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover indicator - caché sur mobile */}
                {isHovered && (
                  <div className="hidden sm:block absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tips Card 100% RESPONSIVE */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-indigo-50/80 via-purple-50/80 to-pink-50/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-10 border-2 border-indigo-200/50 shadow-xl">
          {/* Particules - cachées sur mobile */}
          <div className="hidden sm:block absolute top-10 right-10 w-24 sm:w-32 h-24 sm:h-32 bg-purple-300/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="hidden sm:block absolute bottom-10 left-10 w-24 sm:w-32 h-24 sm:h-32 bg-blue-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="text-4xl sm:text-5xl lg:text-6xl animate-bounce">💡</div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-3 sm:mb-4">
                Les 4 Piliers de Yoonu Dal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {Object.entries(ENVELOPE_CONFIG).map(([key, config]) => (
                  <div key={key} className="backdrop-blur-sm bg-white/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/40 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-2xl sm:text-3xl flex-shrink-0">{config.icon}</span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">{config.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{config.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 100% RESPONSIVE */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-8 lg:p-10 animate-scaleIn max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent">
                ⚙️ Ajuster les budgets
              </h2>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              {Object.keys(ENVELOPE_CONFIG).map(envType => {
                const config = ENVELOPE_CONFIG[envType];
                const value = adjustPercentages[envType] || 0;
                
                return (
                  <div key={envType} className="backdrop-blur-sm bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:border-gray-300 transition-all">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <span className="text-3xl sm:text-4xl flex-shrink-0">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">{config.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">{config.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          {value.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          {formatCurrency((monthlyIncome * value) / 100)} FCFA
                        </p>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={value}
                      onChange={(e) => setAdjustPercentages({
                        ...adjustPercentages,
                        [envType]: parseFloat(e.target.value)
                      })}
                      className="w-full h-2 sm:h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          ${config.color?.includes('red') ? '#ef4444' : config.color?.includes('blue') ? '#3b82f6' : config.color?.includes('green') ? '#10b981' : '#f97316'} 0%, 
                          ${config.color?.includes('red') ? '#ec4899' : config.color?.includes('blue') ? '#6366f1' : config.color?.includes('green') ? '#059669' : '#f59e0b'} ${value}%, 
                          #e5e7eb ${value}%, 
                          #e5e7eb 100%)`
                      }}
                    />

                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span className="hidden sm:inline">Recommandé: {config.recommendedMin}%-{config.recommendedMax}%</span>
                      <span className="sm:hidden">Reco: {config.recommendedMin}%-{config.recommendedMax}%</span>
                      {(value < config.recommendedMin || value > config.recommendedMax) && (
                        <span className="text-amber-600 font-medium animate-pulse">⚠️</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total RESPONSIVE */}
            <div className={`backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 transition-all ${
              Math.abs(totalAllocated - 100) < 0.1 
                ? 'bg-green-50 border-green-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm sm:text-base">Total alloué:</span>
                <div className="text-right">
                  <p className={`text-2xl sm:text-3xl font-bold ${
                    Math.abs(totalAllocated - 100) < 0.1 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {totalAllocated.toFixed(1)}%
                  </p>
                  {Math.abs(totalAllocated - 100) >= 0.1 && (
                    <p className="text-xs sm:text-sm text-amber-600 animate-pulse">
                      {totalAllocated > 100 ? '⚠️ Dépassement' : '⚠️ Sous-allocation'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions RESPONSIVE */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAdjustSubmit}
                disabled={Math.abs(totalAllocated - 100) >= 0.1}
                className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        /* Breakpoint personnalisé xs */
        @media (min-width: 475px) {
          .xs\:inline { display: inline; }
          .xs\:hidden { display: none; }
          .xs\:block { display: block; }
        }
      `}</style>
    </div>
  );
};

export default EnvelopeManagerPremium;
