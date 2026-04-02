import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const Onboarding = ({ toast, onNavigate }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    values: [],
    income: ''
  });
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  // Valeurs pré-sélectionnées (8 essentielles)
  const VALUES = [
    { id: 'famille', emoji: '👨‍👩‍👧‍👦', label: 'Famille', gradient: 'from-pink-500 to-rose-500' },
    { id: 'spiritualite', emoji: '🕌', label: 'Spiritualité', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'sante', emoji: '💪', label: 'Santé', gradient: 'from-green-500 to-emerald-500' },
    { id: 'education', emoji: '📚', label: 'Éducation', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'securite', emoji: '🛡️', label: 'Sécurité', gradient: 'from-amber-500 to-orange-500' },
    { id: 'independance', emoji: '🦅', label: 'Indépendance', gradient: 'from-sky-500 to-blue-500' },
    { id: 'generosite', emoji: '🤲', label: 'Générosité', gradient: 'from-teal-500 to-green-500' },
    { id: 'liberte', emoji: '✨', label: 'Liberté', gradient: 'from-violet-500 to-purple-500' }
  ];

  const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

  // Toggle value selection
  const toggleValue = (id) => {
    setData(prev => {
      const isSelected = prev.values.includes(id);
      
      if (isSelected) {
        return { ...prev, values: prev.values.filter(v => v !== id) };
      }
      
      if (prev.values.length >= 3) {
        toast?.error?.('Maximum 3 valeurs');
        return prev;
      }
      
      return { ...prev, values: [...prev.values, id] };
    });
  };

  // Format currency
  const formatAmount = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Handle income input
  const handleIncomeChange = (e) => {
    const raw = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(raw)) {
      setData(prev => ({ ...prev, income: raw }));
    }
  };

  // Next step
  const next = () => {
    if (step === 0 && data.values.length < 1) {
      toast?.error?.('Choisis au moins 1 valeur');
      return;
    }
    
    if (step === 1 && !data.income) {
      toast?.error?.('Entre ton revenu mensuel');
      return;
    }

    if (step === 1) {
      completeOnboarding();
    } else {
      setStep(prev => prev + 1);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    setLoading(true);

    try {
      // Save values
      for (let i = 0; i < data.values.length; i++) {
        await API.post('/values/', {
          value: data.values[i],
          priority: i + 1
        });
      }

      // Complete & get score
      const response = await API.post('/onboarding/complete/', {
        monthly_income: parseInt(data.income)
      });

      const finalScore = response.data?.score?.total_score || 47;
      
      // Activate trial
      try {
        await API.post('/premium/activate-trial/');
      } catch (err) {
        console.warn('Trial activation failed:', err);
      }

      // Animate score reveal
      setShowScore(true);
      animateScore(finalScore);

    } catch (error) {
      console.error('Error:', error);
      toast?.error?.('Une erreur est survenue');
      setLoading(false);
    }
  };

  // Animate score
  const animateScore = (target) => {
    let current = 0;
    const duration = 2000;
    const steps = 50;
    const increment = target / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setScore(target);
        clearInterval(timer);
        setLoading(false);
        
        // Auto-redirect after 3s
        setTimeout(() => {
          onNavigate('dashboard');
        }, 3000);
      } else {
        setScore(Math.floor(current));
      }
    }, duration / steps);
  };

  // Progress percentage
  const progress = step === 0 ? 50 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* Header - Hide on score reveal */}
        {!showScore && (
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🌿</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Yoonu Dal</h1>
              </div>
              
              <div className="text-sm font-medium text-slate-600">
                Étape {step + 1}/2
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 0: VALUES */}
        {step === 0 && !showScore && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-slideUp">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Qu'est-ce qui compte pour toi ?
              </h2>
              <p className="text-slate-600 text-lg">
                Choisis jusqu'à 3 valeurs qui guident tes choix financiers
              </p>
            </div>

            {/* Values grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {VALUES.map(value => {
                const isSelected = data.values.includes(value.id);
                
                return (
                  <button
                    key={value.id}
                    onClick={() => toggleValue(value.id)}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-transparent shadow-xl scale-105'
                        : 'border-slate-200 hover:border-slate-300 hover:scale-102'
                    }`}
                  >
                    {/* Background gradient (only when selected) */}
                    {isSelected && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-10 rounded-2xl`} />
                    )}
                    
                    {/* Content */}
                    <div className="relative">
                      <div className="text-4xl mb-3">{value.emoji}</div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {value.label}
                      </div>
                    </div>

                    {/* Check indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selection counter */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Valeurs sélectionnées</span>
                <span className="font-bold text-emerald-600">{data.values.length}/3</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${(data.values.length / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={next}
              disabled={data.values.length === 0}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              Continuer →
            </button>
          </div>
        )}

        {/* STEP 1: INCOME */}
        {step === 1 && !showScore && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-slideUp">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Tes revenus mensuels ?
              </h2>
              <p className="text-slate-600 text-lg">
                Pour calculer ton Score Yoonu et personnaliser ton expérience
              </p>
            </div>

            {/* Income input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Revenu mensuel moyen
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={data.income ? formatAmount(data.income) : ''}
                  onChange={handleIncomeChange}
                  placeholder="500 000"
                  className="w-full px-6 py-5 text-3xl font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xl">
                  FCFA
                </div>
              </div>
            </div>

            {/* Quick amounts */}
            <div className="mb-8">
              <p className="text-sm text-slate-600 mb-3">Montants rapides</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setData(prev => ({ ...prev, income: amount.toString() }))}
                    className="py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-all hover:scale-105"
                  >
                    {formatAmount(amount)}
                  </button>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">
              <div className="flex gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    <strong>Pourquoi on demande ça ?</strong><br />
                    Pour calculer ton Score Yoonu Dal et te donner des conseils personnalisés
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-4 border-2 border-slate-300 text-slate-700 rounded-2xl font-semibold hover:bg-slate-50 transition-all"
              >
                ← Retour
              </button>
              
              <button
                onClick={next}
                disabled={loading || !data.income}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

        {/* SCORE REVEAL */}
        {showScore && (
          <div className="text-center animate-scaleIn">
            <div className="bg-white rounded-3xl shadow-2xl p-12 relative overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-blue-500/5" />
              
              {/* Content */}
              <div className="relative">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                    <span>✓</span>
                    <span>Configuration terminée</span>
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-slate-600 mb-2">
                    Ton Score Yoonu Dal
                  </h2>
                </div>

                {/* Score circle */}
                <div className="relative inline-block mb-8">
                  <svg className="w-56 h-56 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      className="stroke-slate-100"
                      strokeWidth="16"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      className="stroke-emerald-500"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${score * 6.28} 628`}
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-dasharray 0.3s ease-out',
                        filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))'
                      }}
                    />
                  </svg>

                  {/* Score number */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-bold text-slate-900 mb-1">
                      {score}
                    </div>
                    <div className="text-xl text-slate-500">/100</div>
                  </div>
                </div>

                {/* Level badge */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-200 rounded-full">
                    <span className="text-2xl">🌿</span>
                    <span className="font-bold text-amber-900">En construction</span>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Ton parcours commence maintenant !
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Ton score évoluera au fil de tes actions. Commence par suivre tes dépenses pour voir l'impact.
                  </p>
                </div>

                {/* Premium trial badge */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 mb-8">
                  <div className="flex items-center justify-center gap-2 text-purple-900">
                    <span className="text-xl">✨</span>
                    <span className="font-semibold">7 jours Premium gratuits activés</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-12 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  Découvrir mon dashboard →
                </button>

                {/* Auto-redirect indicator */}
                <p className="text-xs text-slate-400 mt-4">
                  Redirection automatique dans quelques secondes...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out;
        }
        
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
