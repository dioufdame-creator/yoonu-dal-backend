import React, { useState } from 'react';
import API from '../../services/api';

const Onboarding = ({ toast, onNavigate }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    values: [],
    priorities: [],
    income: ''
  });
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  const VALUES = [
    { id: 'famille', emoji: '💚', label: 'Famille', desc: 'Proches et relations' },
    { id: 'spiritualite', emoji: '✨', label: 'Spiritualité', desc: 'Foi et valeurs' },
    { id: 'education', emoji: '🎓', label: 'Éducation', desc: 'Apprentissage continu' },
    { id: 'sante', emoji: '💪', label: 'Santé', desc: 'Bien-être physique' },
    { id: 'travail', emoji: '💼', label: 'Travail', desc: 'Carrière professionnelle' },
    { id: 'loisirs', emoji: '🎨', label: 'Loisirs', desc: 'Passions et hobbies' },
    { id: 'communaute', emoji: '🤝', label: 'Communauté', desc: 'Engagement social' },
    { id: 'securite', emoji: '🛡️', label: 'Sécurité', desc: 'Stabilité financière' }
  ];

  const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

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

  const movePriority = (index, direction) => {
    const newPriorities = data.priorities.length > 0 ? [...data.priorities] : [...data.values];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < newPriorities.length) {
      [newPriorities[index], newPriorities[newIndex]] = [newPriorities[newIndex], newPriorities[index]];
      setData(prev => ({ ...prev, priorities: newPriorities }));
    }
  };

  const formatAmount = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleIncomeChange = (e) => {
    const raw = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(raw)) {
      setData(prev => ({ ...prev, income: raw }));
    }
  };

  const next = () => {
    if (step === 1 && data.values.length < 3) {
      toast?.error?.('Sélectionne exactement 3 valeurs');
      return;
    }

    if (step === 2) {
      if (data.priorities.length === 0) {
        setData(prev => ({ ...prev, priorities: prev.values }));
      }
    }

    if (step === 3 && !data.income) {
      toast?.error?.('Entre ton revenu mensuel');
      return;
    }

    if (step === 3) {
      completeOnboarding();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      for (let i = 0; i < data.priorities.length; i++) {
        await API.post('/values/', {
          value: data.priorities[i],
          priority: i + 1
        });
      }

      const response = await API.post('/onboarding/complete/', {
        monthly_income: parseInt(data.income)
      });

      const finalScore = response.data?.score?.total_score || 47;

      try {
        await API.post('/premium/activate-trial/');
      } catch (err) {
        console.warn('Trial failed:', err);
      }

      setShowScore(true);
      animateScore(finalScore);

    } catch (error) {
      console.error('Error:', error);
      toast?.error?.('Une erreur est survenue');
      setLoading(false);
    }
  };

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
        
        setTimeout(() => {
          onNavigate('dashboard');
        }, 3000);
      } else {
        setScore(Math.floor(current));
      }
    }, duration / steps);
  };

  const progress = step === 0 ? 0 : ((step) / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Simple Header - PAS de double bande verte */}
      {!showScore && step > 0 && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl">🌿</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Yoonu Dal</h1>
              </div>
              
              <div className="text-sm font-medium text-gray-600">
                Étape {step}/3
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        
        {/* STEP 0: WELCOME */}
        {step === 0 && (
          <div className="text-center animate-fadeIn py-12">
            <div className="mb-8">
              <div className="w-32 h-32 bg-green-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
                <span className="text-6xl">🌿</span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Yoonu Dal
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Ton coach financier personnel
              </p>
              <p className="text-sm text-gray-500">
                En wolof : "Le Chemin de l'Argent"
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
              <div className="mb-6">
                <span className="text-4xl mb-3 block">✨</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Score personnalisé
                </h3>
                <p className="text-gray-600 text-sm">
                  Mesure l'alignement entre tes valeurs et tes dépenses
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl mb-3 block">🔮</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Simulation intelligente
                </h3>
                <p className="text-gray-600 text-sm">
                  Teste tes décisions avant de les prendre
                </p>
              </div>

              <div>
                <span className="text-4xl mb-3 block">📊</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Analyse automatique
                </h3>
                <p className="text-gray-600 text-sm">
                  Insights et recommandations personnalisées
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="bg-green-600 text-white w-full py-4 rounded-2xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-all mb-4"
            >
              Commencer mon parcours →
            </button>

            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <span>⏱️</span>
              <span>2 minutes pour activer ton score</span>
            </p>
          </div>
        )}

        {/* STEP 1: VALUES */}
        {step === 1 && (
          <div className="animate-slideUp">
            <div className="text-center mb-8">
              <p className="text-green-600 font-semibold mb-2">ÉTAPE 1/3</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Tes priorités
              </h2>
              <p className="text-gray-600 text-lg">
                Qu'est-ce qui compte le plus pour toi dans la vie ?
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-700">
                Choisis 3 valeurs <span className="font-bold">({data.values.length}/3)</span>
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {VALUES.map(value => {
                const isSelected = data.values.includes(value.id);
                
                return (
                  <button
                    key={value.id}
                    onClick={() => toggleValue(value.id)}
                    className={`w-full p-5 rounded-2xl border-3 transition-all ${
                      isSelected
                        ? 'border-green-600 bg-green-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{value.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {value.label}
                          {isSelected && <span className="text-green-600">✓</span>}
                        </div>
                        <div className="text-sm text-gray-600">{value.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={next}
              disabled={data.values.length !== 3}
              className="bg-green-600 text-white w-full py-4 rounded-2xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer →
            </button>
          </div>
        )}

        {/* STEP 2: PRIORITIES */}
        {step === 2 && (
          <div className="animate-slideUp">
            <div className="text-center mb-8">
              <p className="text-green-600 font-semibold mb-2">ÉTAPE 2/3</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Ordre d'importance
              </h2>
              <p className="text-gray-600 text-lg">
                Classe tes valeurs par ordre de priorité
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {(data.priorities.length > 0 ? data.priorities : data.values).map((valueId, index) => {
                const value = VALUES.find(v => v.id === valueId);
                const arrayLength = data.priorities.length > 0 ? data.priorities.length : data.values.length;
                
                return (
                  <div
                    key={valueId}
                    className="bg-green-50 border-2 border-green-600 rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => movePriority(index, -1)}
                          disabled={index === 0}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-all"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => movePriority(index, 1)}
                          disabled={index === arrayLength - 1}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-all"
                        >
                          ↓
                        </button>
                      </div>
                      
                      <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl">
                        {index + 1}
                      </div>
                      
                      <span className="text-4xl">{value?.emoji}</span>
                      
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{value?.label}</div>
                        <div className="text-sm text-gray-600">{value?.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-sm text-gray-600 mb-6">
              💡 La valeur en haut est ta priorité #1
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
              >
                ← Retour
              </button>
              
              <button
                onClick={next}
                className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-all"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INCOME */}
        {step === 3 && (
          <div className="animate-slideUp">
            <div className="text-center mb-8">
              <p className="text-green-600 font-semibold mb-2">ÉTAPE 3/3</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Tes revenus mensuels
              </h2>
              <p className="text-gray-600 text-lg">
                Pour calculer ton Score Yoonu et personnaliser ton expérience
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Revenu mensuel moyen
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={data.income ? formatAmount(data.income) : ''}
                  onChange={handleIncomeChange}
                  placeholder="400 000"
                  className="w-full px-6 py-5 text-3xl font-bold text-gray-900 bg-white border-3 border-green-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-600/20 transition-all"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xl">
                  FCFA
                </div>
              </div>
            </div>

            {/* Montants rapides */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Montants rapides</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setData(prev => ({ ...prev, income: amount.toString() }))}
                    className="py-3 px-4 bg-white border-2 border-gray-200 hover:border-green-600 hover:bg-green-50 rounded-xl text-sm font-semibold text-gray-700 transition-all"
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
                    Pour calculer ton Score Yoonu Dal et te donner des conseils personnalisés. Tu pourras ajuster ce montant plus tard dans les paramètres. C’est confidentiel et utilisé uniquement pour tes analyses.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
              >
                ← Retour
              </button>
              
              <button
                onClick={next}
                disabled={loading || !data.income}
                className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
          <div className="text-center animate-scaleIn py-12">
            <h2 className="text-2xl font-semibold text-gray-600 mb-8">
              Ton Score Yoonu Dal
            </h2>

            <div className="relative inline-block mb-8">
              <svg className="w-64 h-64 transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  className="stroke-gray-200"
                  strokeWidth="20"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  className="stroke-green-600"
                  strokeWidth="20"
                  fill="none"
                  strokeDasharray={`${score * 6.9} 691`}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dasharray 0.3s ease-out',
                    filter: 'drop-shadow(0 0 10px rgba(22, 163, 74, 0.3))'
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-7xl font-bold text-gray-900">
                  {score}
                </div>
                <div className="text-2xl text-gray-500">/100</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-100 border-2 border-amber-300 rounded-full mb-4">
                <span className="text-2xl">🌿</span>
                <span className="font-bold text-amber-900">En chemin</span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ton Score Yoonu Dal est actif !
              </h3>
              
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                Commence à suivre tes dépenses pour améliorer ton score et voir l'alignement entre tes valeurs et ton argent
              </p>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-green-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:bg-green-700 transition-all transform hover:scale-105"
            >
              Voir mon dashboard →
            </button>
          </div>
        )}
      </div>

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
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out;
        }
        
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
