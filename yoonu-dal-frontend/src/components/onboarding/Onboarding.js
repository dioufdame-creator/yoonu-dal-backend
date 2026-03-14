import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// ONBOARDING FLOW - PREMIUM ACTIVATION
// 5 écrans - 70 secondes - Score activé
// ==========================================

const Onboarding = ({ toast, onNavigate, setAuth }) => {
  // ✅ UTILISER onNavigate PROP AU LIEU DE useNavigate
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // État onboarding
  const [onboardingData, setOnboardingData] = useState({
    selectedValues: [],
    priorities: [],
    monthlyIncome: ''
  });

  // Score reveal
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Valeurs disponibles
  const availableValues = [
    { id: 'famille', label: 'Famille', icon: '💚', description: 'Proches et relations' },
    { id: 'spiritualite', label: 'Spiritualité', icon: '✨', description: 'Foi et valeurs' },
    { id: 'education', label: 'Éducation', icon: '🎓', description: 'Apprentissage continu' },
    { id: 'sante', label: 'Santé', icon: '💪', description: 'Bien-être physique' },
    { id: 'travail', label: 'Travail', icon: '💼', description: 'Carrière professionnelle' },
    { id: 'loisirs', label: 'Loisirs', icon: '🎨', description: 'Passions et hobbies' },
    { id: 'communaute', label: 'Communauté', icon: '🤝', description: 'Engagement social' },
    { id: 'securite', label: 'Sécurité', icon: '🛡️', description: 'Stabilité financière' }
  ];

  // Sauvegarder progression
  useEffect(() => {
    if (currentStep > 0) {
      localStorage.setItem('onboarding_progress', JSON.stringify({
        step: currentStep,
        data: onboardingData
      }));
    }
  }, [currentStep, onboardingData]);

  // Charger progression si existe
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_progress');
    if (saved) {
      const { step, data } = JSON.parse(saved);
      setCurrentStep(step);
      setOnboardingData(data);
    }
  }, []);

  const totalSteps = 5;

  const handleValueToggle = (valueId) => {
    const { selectedValues } = onboardingData;
    
    if (selectedValues.includes(valueId)) {
      setOnboardingData({
        ...onboardingData,
        selectedValues: selectedValues.filter(v => v !== valueId)
      });
    } else {
      if (selectedValues.length < 3) {
        setOnboardingData({
          ...onboardingData,
          selectedValues: [...selectedValues, valueId]
        });
      } else {
        toast?.showError('Tu peux choisir maximum 3 valeurs');
      }
    }
  };

  const handlePriorityMove = (index, direction) => {
    const newPriorities = [...onboardingData.priorities];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < newPriorities.length) {
      [newPriorities[index], newPriorities[newIndex]] = [newPriorities[newIndex], newPriorities[index]];
      setOnboardingData({
        ...onboardingData,
        priorities: newPriorities
      });
    }
  };

  const handleNext = () => {
    // Validation avant passage
    if (currentStep === 1 && onboardingData.selectedValues.length !== 3) {
      toast?.showError('Sélectionne exactement 3 valeurs');
      return;
    }

    if (currentStep === 2) {
      // Auto-convertir sélection en priorités si pas déjà fait
      if (onboardingData.priorities.length === 0) {
        setOnboardingData({
          ...onboardingData,
          priorities: onboardingData.selectedValues
        });
      }
    }

    if (currentStep === 3) {
      const income = parseFloat(onboardingData.monthlyIncome.replace(/\s/g, ''));
      if (!income || income <= 0) {
        toast?.showError('Entre un montant valide');
        return;
      }
      // Calculer le score
      calculateAndRevealScore();
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // ✅ FONCTION CORRIGÉE : Sauvegarder valeurs et marquer onboarding terminé
  const calculateAndRevealScore = async () => {
    setIsLoading(true);
    
    try {
      // 1. Sauvegarder valeurs avec priorités
      for (let i = 0; i < onboardingData.priorities.length; i++) {
        const valueId = onboardingData.priorities[i];
        await API.post('/values/', { 
          value: valueId,
          priority: i + 1
        });
      }

      // 2. ✅ MARQUER L'ONBOARDING COMME TERMINÉ + CALCULER SCORE
      const income = parseFloat(onboardingData.monthlyIncome.replace(/\s/g, ''));
      const response = await API.post('/onboarding/complete/', {
        monthly_income: income,
        financial_goals: 'Objectifs définis via onboarding'
      });

      // 3. Récupérer le score calculé
      const score = response.data.score?.total_score || 47; // Fallback si pas de score
      setCalculatedScore(score);

      // 4. Passer à l'écran de révélation
      setCurrentStep(4);
      
      // Animation score
      setTimeout(() => animateScore(score), 300);
      
      toast?.showSuccess('Configuration terminée ! 🎉');
      
    } catch (error) {
      console.error('Erreur calcul score:', error);
      toast?.showError('Erreur lors de la configuration. Réessaie.');
      setIsLoading(false);
    }
  };

  const animateScore = (target) => {
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayScore(target);
        clearInterval(timer);
        setShowConfetti(true);
        setIsLoading(false);
        
        // Arrêter confetti après 3s
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);
  };

  // ✅ FONCTION CORRIGÉE : Utiliser onNavigate prop
  const completeOnboarding = () => {
    // Nettoyer localStorage
    localStorage.removeItem('onboarding_progress');
    
    // ✅ REDIRIGER VERS DASHBOARD avec onNavigate prop
    onNavigate('dashboard');
    
    toast?.showSuccess('🎉 Bienvenue dans Yoonu Dal !');
  };

  const formatCurrency = (value) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleIncomeChange = (e) => {
    const value = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(value)) {
      setOnboardingData({
        ...onboardingData,
        monthlyIncome: formatCurrency(value)
      });
    }
  };

  // Progress percentage
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      
      {/* Progress Bar */}
      {currentStep > 0 && currentStep < 4 && (
        <div className="w-full h-1 bg-gray-200 fixed top-0 left-0 z-50">
          <div 
            className="h-1 bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">

          {/* ÉCRAN 0: WELCOME */}
          {currentStep === 0 && (
            <div className="text-center animate-fadeIn">
              <div className="mb-8">
                <div className="inline-block animate-bounce-slow">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center text-5xl shadow-xl mx-auto mb-6">
                    🌿
                  </div>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                  Yoonu Dal
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 mb-2">
                  Ton coach financier personnel
                </p>
                <p className="text-sm text-gray-500">
                  En wolof : "Le Chemin de l'Argent"
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-4xl mb-3">✨</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Score personnalisé</h3>
                    <p className="text-sm text-gray-600">
                      Mesure l'alignement entre tes valeurs et tes dépenses
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl mb-3">🔮</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Simulation intelligente</h3>
                    <p className="text-sm text-gray-600">
                      Teste tes décisions avant de les prendre
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl mb-3">📊</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Analyse automatique</h3>
                    <p className="text-sm text-gray-600">
                      Insights et recommandations personnalisées
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Commencer mon parcours →
                </button>
                
                <p className="text-xs text-gray-500 mt-4">
                  ⏱️ 2 minutes pour activer ton score
                </p>
              </div>
            </div>
          )}

          {/* ÉCRAN 1: VALUES SELECTION */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-10 animate-fadeIn">
              <div className="mb-6">
                <p className="text-sm text-green-600 font-semibold mb-2">ÉTAPE 1/3</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Tes priorités
                </h2>
                <p className="text-gray-600">
                  Qu'est-ce qui compte le plus pour toi dans la vie ?
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-4">
                  Choisis 3 valeurs ({onboardingData.selectedValues.length}/3)
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableValues.map(value => {
                    const isSelected = onboardingData.selectedValues.includes(value.id);
                    const isDisabled = !isSelected && onboardingData.selectedValues.length >= 3;
                    
                    return (
                      <button
                        key={value.id}
                        onClick={() => handleValueToggle(value.id)}
                        disabled={isDisabled}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : isDisabled
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <div className="text-3xl flex-shrink-0">{value.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{value.label}</h3>
                            {isSelected && (
                              <span className="text-green-600 text-xl">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{value.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleNext}
                  disabled={onboardingData.selectedValues.length !== 3}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ÉCRAN 2: PRIORITY RANKING */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-10 animate-fadeIn">
              <div className="mb-6">
                <p className="text-sm text-green-600 font-semibold mb-2">ÉTAPE 2/3</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Ordre d'importance
                </h2>
                <p className="text-gray-600">
                  Classe tes valeurs par ordre de priorité
                </p>
              </div>

              <div className="mb-6">
                <div className="space-y-3">
                  {(onboardingData.priorities.length > 0 
                    ? onboardingData.priorities 
                    : onboardingData.selectedValues
                  ).map((valueId, index) => {
                    const value = availableValues.find(v => v.id === valueId);
                    const isFirst = index === 0;
                    const isLast = index === (onboardingData.priorities.length || onboardingData.selectedValues.length) - 1;
                    
                    return (
                      <div
                        key={valueId}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handlePriorityMove(index, -1)}
                            disabled={isFirst}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handlePriorityMove(index, 1)}
                            disabled={isLast}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ↓
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl border-2 border-green-300 font-bold text-green-600">
                            {index + 1}
                          </div>
                          <div className="text-3xl">{value.icon}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{value.label}</h3>
                            <p className="text-xs text-gray-600">{value.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  💡 La valeur en haut est ta priorité #1
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ÉCRAN 3: INCOME SETUP */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-10 animate-fadeIn">
              <div className="mb-6">
                <p className="text-sm text-green-600 font-semibold mb-2">ÉTAPE 3/3</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Tes revenus mensuels
                </h2>
                <p className="text-gray-600">
                  Pour calculer ton Score, on a besoin de connaître tes revenus
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Revenus mensuels (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={onboardingData.monthlyIncome}
                    onChange={handleIncomeChange}
                    placeholder="1 000 000"
                    className="w-full px-6 py-4 text-2xl font-semibold text-gray-900 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    FCFA
                  </span>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <span>
                      Tu pourras ajuster ce montant plus tard dans les paramètres
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleNext}
                  disabled={isLoading || !onboardingData.monthlyIncome}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Calcul en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Calculer mon Score</span>
                      <span>✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ÉCRAN 4: SCORE REVEAL */}
          {currentStep === 4 && (
            <div className="text-center animate-fadeIn relative">
              {/* Confetti */}
              {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                  {[...Array(50)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-confetti text-2xl"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                      }}
                    >
                      {['🌿', '✨', '💚', '🎉'][Math.floor(Math.random() * 4)]}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-16">
                <h2 className="text-2xl font-semibold text-gray-600 mb-8">
                  Ton Score Yoonu Dal
                </h2>

                <div className="relative inline-block mb-8">
                  <svg className="w-48 h-48 lg:w-64 lg:h-64 transform -rotate-90">
                    <circle 
                      cx="50%" 
                      cy="50%" 
                      r="45%" 
                      className="stroke-gray-100" 
                      strokeWidth="12" 
                      fill="none" 
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      className="stroke-green-500"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${displayScore * 4.4} 440`}
                      strokeLinecap="round"
                      style={{ 
                        transition: 'stroke-dasharray 0.1s linear',
                        filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))'
                      }}
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl lg:text-7xl font-bold text-gray-900 mb-2">
                      {displayScore}
                    </div>
                    <div className="text-2xl text-gray-500">/100</div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 border-2 border-amber-200 rounded-full mb-4">
                    <span className="text-2xl">🌿</span>
                    <span className="font-semibold text-amber-700">En chemin</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Ton Score Yoonu Dal est actif !
                  </h3>
                  
                  <p className="text-gray-600 max-w-md mx-auto">
                    Commence à suivre tes dépenses pour améliorer ton score et voir l'alignement entre tes valeurs et ton argent
                  </p>
                </div>

                <button
                  onClick={completeOnboarding}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Voir mon dashboard →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
