import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const Onboarding = ({ toast, onNavigate, setAuth }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [onboardingData, setOnboardingData] = useState({
    selectedValues: [],
    priorities: [],
    monthlyIncome: ''
  });

  const [calculatedScore, setCalculatedScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);

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

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await API.get('/profile/');
        const userId = response.data.user.id;
        setCurrentUserId(userId);
        
        const savedKey = `onboarding_progress_${userId}`;
        const saved = localStorage.getItem(savedKey);
        
        if (saved) {
          const { step, data } = JSON.parse(saved);
          console.log('📦 Progression chargée pour user', userId);
          setCurrentStep(step);
          setOnboardingData(data);
        }
      } catch (error) {
        console.error('Erreur récupération user ID:', error);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    if (currentStep > 0 && currentUserId) {
      const savedKey = `onboarding_progress_${currentUserId}`;
      localStorage.setItem(savedKey, JSON.stringify({
        step: currentStep,
        data: onboardingData
      }));
      console.log('💾 Progression sauvegardée pour user', currentUserId);
    }
  }, [currentStep, onboardingData, currentUserId]);

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
    if (currentStep === 1 && onboardingData.selectedValues.length !== 3) {
      toast?.showError('Sélectionne exactement 3 valeurs');
      return;
    }

    if (currentStep === 2) {
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
      calculateAndRevealScore();
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const calculateAndRevealScore = async () => {
    setIsLoading(true);
    
    try {
      for (let i = 0; i < onboardingData.priorities.length; i++) {
        const valueId = onboardingData.priorities[i];
        await API.post('/values/', { 
          value: valueId,
          priority: i + 1
        });
      }

      const income = parseFloat(onboardingData.monthlyIncome.replace(/\s/g, ''));
      const response = await API.post('/onboarding/complete/', {
        monthly_income: income,
        financial_goals: 'Objectifs définis via onboarding'
      });

      const score = response.data.score?.total_score || 47;
      setCalculatedScore(score);

      setCurrentStep(4);
      
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
        
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);
  };

  const completeOnboarding = () => {
    if (currentUserId) {
      const savedKey = `onboarding_progress_${currentUserId}`;
      localStorage.removeItem(savedKey);
      console.log('🗑️ Progression supprimée pour user', currentUserId);
    }
    
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

  const getScoreLevel = (score) => {
    if (score >= 80) return { label: 'Expert', icon: '🏆', color: 'amber' };
    if (score >= 60) return { label: 'Avancé', icon: '⭐', color: 'blue' };
    if (score >= 40) return { label: 'En chemin', icon: '🌿', color: 'amber' };
    return { label: 'Débutant', icon: '🌱', color: 'green' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {currentStep < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Yoonu Dal</h1>
              <div className="text-sm font-medium text-gray-600">
                {currentStep > 0 && `Étape ${currentStep}/${totalSteps - 1}`}
              </div>
            </div>
            
            {currentStep > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        <div className="relative">
          {currentStep === 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-12 text-center animate-fadeIn">
              <div className="mb-8">
                <div className="text-6xl mb-6 animate-bounce-slow">🌿</div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Bienvenue dans <span className="text-green-600">Yoonu Dal</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  La première app de finance personnelle qui aligne ton argent avec tes valeurs
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-8 max-w-xl mx-auto">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Dans les 3 prochaines minutes, tu vas :
                </h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💚</span>
                    <p className="text-gray-700">Définir tes 3 valeurs principales</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📊</span>
                    <p className="text-gray-700">Calculer ton Score Yoonu Dal</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✨</span>
                    <p className="text-gray-700">Activer ton essai Premium gratuit (7 jours)</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                C'est parti ! 🚀
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-10 animate-fadeIn">
              <div className="mb-6">
                <p className="text-sm text-green-600 font-semibold mb-2">ÉTAPE 1/3</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Sélectionne tes 3 valeurs
                </h2>
                <p className="text-gray-600">
                  Choisis ce qui compte vraiment pour toi
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {availableValues.map(value => (
                  <button
                    key={value.id}
                    onClick={() => handleValueToggle(value.id)}
                    className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      onboardingData.selectedValues.includes(value.id)
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{value.icon}</div>
                    <div className="font-semibold text-sm text-gray-900">{value.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{value.description}</div>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Valeurs sélectionnées:</span>
                  <span className="text-sm font-bold text-green-600">
                    {onboardingData.selectedValues.length}/3
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(onboardingData.selectedValues.length / 3) * 100}%` }}
                  />
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

          {currentStep === 2 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-10 animate-fadeIn">
              <div className="mb-6">
                <p className="text-sm text-green-600 font-semibold mb-2">ÉTAPE 2/3</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Priorise tes valeurs
                </h2>
                <p className="text-gray-600">
                  Classe-les par ordre d'importance pour toi
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {(onboardingData.priorities.length > 0 
                  ? onboardingData.priorities 
                  : onboardingData.selectedValues
                ).map((valueId, index) => {
                  const value = availableValues.find(v => v.id === valueId);
                  return (
                    <div
                      key={valueId}
                      className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border-2 border-gray-200 hover:border-green-300 transition-all"
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full font-bold text-green-700 text-lg">
                        #{index + 1}
                      </div>
                      <div className="text-3xl">{value?.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{value?.label}</div>
                        <div className="text-sm text-gray-500">{value?.description}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handlePriorityMove(index, -1)}
                          disabled={index === 0}
                          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => handlePriorityMove(index, 1)}
                          disabled={index === (onboardingData.priorities.length || onboardingData.selectedValues.length) - 1}
                          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          ⬇️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                💡 La valeur en haut est ta priorité #1
              </p>

              <div className="flex gap-3 mt-6">
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

          {currentStep === 4 && (
            <div className="text-center animate-fadeIn relative">
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
