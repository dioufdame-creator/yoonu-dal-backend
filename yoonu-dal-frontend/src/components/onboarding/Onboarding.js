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

  const [showScore, setShowScore] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState(null);

  const valuesOptions = [
    { value: 'famille', label: 'Famille', emoji: '👨‍👩‍👧‍👦' },
    { value: 'indépendance', label: 'Indépendance', emoji: '🦅' },
    { value: 'sécurité', label: 'Sécurité', emoji: '🛡️' },
    { value: 'générosité', label: 'Générosité', emoji: '🤲' },
    { value: 'spiritualité', label: 'Spiritualité', emoji: '🕌' },
    { value: 'éducation', label: 'Éducation', emoji: '📚' },
    { value: 'santé', label: 'Santé', emoji: '💪' },
    { value: 'liberté', label: 'Liberté', emoji: '🔓' }
  ];

  const toggleValue = (value) => {
    setOnboardingData(prev => {
      const isSelected = prev.selectedValues.includes(value);
      
      if (isSelected) {
        return {
          ...prev,
          selectedValues: prev.selectedValues.filter(v => v !== value),
          priorities: prev.priorities.filter(p => p !== value)
        };
      } else {
        if (prev.selectedValues.length >= 3) {
          toast?.error?.('Maximum 3 valeurs');
          return prev;
        }
        
        const newValues = [...prev.selectedValues, value];
        const newPriorities = [...prev.priorities, value];
        
        return {
          ...prev,
          selectedValues: newValues,
          priorities: newPriorities
        };
      }
    });
  };

  const moveValueUp = (index) => {
    if (index === 0) return;
    
    setOnboardingData(prev => {
      const newPriorities = [...prev.priorities];
      [newPriorities[index - 1], newPriorities[index]] = 
      [newPriorities[index], newPriorities[index - 1]];
      
      return { ...prev, priorities: newPriorities };
    });
  };

  const moveValueDown = (index) => {
    if (index === onboardingData.priorities.length - 1) return;
    
    setOnboardingData(prev => {
      const newPriorities = [...prev.priorities];
      [newPriorities[index], newPriorities[index + 1]] = 
      [newPriorities[index + 1], newPriorities[index]];
      
      return { ...prev, priorities: newPriorities };
    });
  };

  const handleIncomeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setOnboardingData(prev => ({ ...prev, monthlyIncome: value }));
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      for (let i = 0; i < onboardingData.priorities.length; i++) {
        await API.post('/values/', {
          value: onboardingData.priorities[i],
          priority: i + 1
        });
      }

      const completeResponse = await API.post('/onboarding/complete/', {
        monthly_income: onboardingData.monthlyIncome
      });

      const score = completeResponse.data?.score?.total_score || 0;
      setCalculatedScore(score);

      try {
        await API.post('/premium/activate-trial/');
      } catch (err) {
        console.warn('Trial activation failed:', err);
      }

      setShowScore(true);

      setTimeout(() => {
        onNavigate?.('dashboard');
      }, 3000);

    } catch (error) {
      console.error('Erreur onboarding:', error);
      toast?.error?.(error.response?.data?.error || 'Erreur lors de la finalisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && onboardingData.selectedValues.length < 1) {
      toast?.error?.('Sélectionne au moins 1 valeur');
      return;
    }

    if (currentStep === 2 && !onboardingData.monthlyIncome) {
      toast?.error?.('Entre ton revenu mensuel');
      return;
    }

    if (currentStep === 2) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (showScore) {
    const getScoreLevel = (score) => {
      if (score >= 80) return { label: 'Expert Yoonu', emoji: '🏆', color: 'text-yellow-400' };
      if (score >= 60) return { label: 'Maîtrise', emoji: '⭐', color: 'text-blue-400' };
      if (score >= 40) return { label: 'En Progression', emoji: '🌱', color: 'text-green-400' };
      return { label: 'Débutant', emoji: '🌟', color: 'text-gray-400' };
    };

    const level = getScoreLevel(calculatedScore || 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="mb-6">
            <div className="text-6xl mb-4 animate-bounce">{level.emoji}</div>
            <h2 className="text-3xl font-bold text-white mb-2">Ton Score Yoonu Dal</h2>
            <p className="text-white/80">Calculé à partir de tes réponses</p>
          </div>

          <div className="mb-6">
            <div className="text-7xl font-bold text-white mb-2">
              {calculatedScore || 0}<span className="text-4xl">/100</span>
            </div>
            <div className={`text-xl font-semibold ${level.color}`}>
              {level.label}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <p className="text-white/90 text-sm">
              🎉 <strong>Trial Premium activé !</strong><br />
              Profite de 7 jours d'accès complet gratuit
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            <span>Redirection vers ton dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: 'Tes Valeurs',
      subtitle: 'Choisis 3 valeurs qui te définissent',
      content: (
        <div className="grid grid-cols-2 gap-3">
          {valuesOptions.map(option => (
            <button
              key={option.value}
              onClick={() => toggleValue(option.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                onboardingData.selectedValues.includes(option.value)
                  ? 'border-indigo-500 bg-indigo-50 scale-105'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="text-3xl mb-2">{option.emoji}</div>
              <div className="font-medium text-sm">{option.label}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'Priorise',
      subtitle: 'Classe tes valeurs par ordre d\'importance',
      content: (
        <div className="space-y-3">
          {onboardingData.priorities.map((value, index) => {
            const option = valuesOptions.find(v => v.value === value);
            return (
              <div key={value} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                <div className="text-2xl font-bold text-indigo-600">#{index + 1}</div>
                <div className="text-2xl">{option?.emoji}</div>
                <div className="flex-1 font-medium">{option?.label}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveValueUp(index)}
                    disabled={index === 0}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-30"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => moveValueDown(index)}
                    disabled={index === onboardingData.priorities.length - 1}
                    className="p-2 rounded-lg hover:bg-white disabled:opacity-30"
                  >
                    ⬇️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )
    },
    {
      title: 'Tes Revenus',
      subtitle: 'Quel est ton revenu mensuel moyen ?',
      content: (
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-6">
            <div className="text-sm opacity-80 mb-2">Revenu mensuel</div>
            <div className="flex items-baseline gap-2">
              <input
                type="text"
                value={onboardingData.monthlyIncome}
                onChange={handleIncomeChange}
                placeholder="0"
                className="bg-transparent text-4xl font-bold outline-none w-full"
              />
              <span className="text-2xl">FCFA</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['50000', '100000', '250000', '500000', '750000', '1000000'].map(amount => (
              <button
                key={amount}
                onClick={() => setOnboardingData(prev => ({ ...prev, monthlyIncome: amount }))}
                className="p-3 bg-gray-100 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-sm font-medium"
              >
                {parseInt(amount).toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Yoonu Dal</h1>
            <div className="text-sm text-gray-600">
              Étape {currentStep + 1}/{steps.length}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600">
            {currentStepData.subtitle}
          </p>
        </div>

        <div className="mb-12">
          {currentStepData.content}
        </div>

        <div className="flex gap-4 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            ← Retour
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                Calcul du score...
              </>
            ) : currentStep === steps.length - 1 ? (
              'Terminer →'
            ) : (
              'Suivant →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
