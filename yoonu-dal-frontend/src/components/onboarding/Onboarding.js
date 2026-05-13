import React, { useState } from 'react';
import API from '../../services/api';

// ==========================================
// ONBOARDING V2
// ✅ 2 étapes (valeurs + revenus)
// ✅ 3 valeurs sans classement
// ✅ Score 0 si pas de données
// ==========================================

const Onboarding = ({ toast, onNavigate }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    values: [],
    income: ''
  });
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  const VALUES = [
    { id: 'famille',      emoji: '💚', label: 'Famille',               desc: 'Tes proches, ta maison, tes racines' },
    { id: 'spiritualite', emoji: '✨', label: 'Spiritualité / Foi',     desc: 'Ta foi, tes valeurs, ton ancrage intérieur' },
    { id: 'education',    emoji: '🎓', label: 'Éducation',              desc: 'Apprendre, grandir, transmettre' },
    { id: 'sante',        emoji: '💪', label: 'Santé',                  desc: 'Ton bien-être physique et mental' },
    { id: 'liberte',      emoji: '🚀', label: 'Liberté / Indépendance', desc: 'Entreprendre, ne dépendre de personne' },
    { id: 'securite',     emoji: '🛡️', label: 'Sécurité / Stabilité',  desc: 'Dormir tranquille, avoir un filet' },
    { id: 'solidarite',   emoji: '🤝', label: 'Solidarité / Partage',  desc: 'Donner, soutenir, être là pour les autres' },
    { id: 'reussite',     emoji: '🌟', label: 'Réussite',               desc: 'Progresser, accomplir, laisser une trace' },
  ];

  const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const toggleValue = (id) => {
    setData(prev => {
      const isSelected = prev.values.includes(id);
      if (isSelected) {
        return { ...prev, values: prev.values.filter(v => v !== id) };
      }
      if (prev.values.length >= 3) {
        toast?.error?.('Maximum 3 valeurs — retire une pour en choisir une autre');
        return prev;
      }
      return { ...prev, values: [...prev.values, id] };
    });
  };

  const formatAmount = (value) =>
    value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const handleIncomeChange = (e) => {
    const raw = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(raw)) {
      setData(prev => ({ ...prev, income: raw }));
    }
  };

  const next = () => {
    if (step === 1 && data.values.length !== 3) {
      toast?.error?.('Sélectionne exactement 3 valeurs');
      return;
    }
    if (step === 2 && !data.income) {
      toast?.error?.('Entre ton revenu mensuel');
      return;
    }
    if (step === 2) {
      completeOnboarding();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Sauvegarder les valeurs avec priorité = ordre de sélection
      for (let i = 0; i < data.values.length; i++) {
        await API.post('/values/', {
          value: data.values[i],
          priority: i + 1
        });
      }

      // Compléter l'onboarding
      const response = await API.post('/onboarding/complete/', {
        monthly_income: parseInt(data.income)
      });

      // ✅ Score 0 si pas de données, pas 47
      const finalScore = response.data?.score?.total_score || 0;

      // Activer le trial premium
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
    if (target === 0) {
      setScore(0);
      setLoading(false);
      setTimeout(() => onNavigate('dashboard'), 3000);
      return;
    }

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
        setTimeout(() => onNavigate('dashboard'), 3000);
      } else {
        setScore(Math.floor(current));
      }
    }, duration / steps);
  };

  const getScoreLabel = (s) => {
    if (s === 0) return { label: 'Non évalué ⬜', color: 'bg-gray-100 border-gray-300 text-gray-700' };
    if (s >= 80) return { label: 'Maître Yoonu 🏆', color: 'bg-green-100 border-green-400 text-green-900' };
    if (s >= 60) return { label: 'Aligné 🌳', color: 'bg-blue-100 border-blue-400 text-blue-900' };
    if (s >= 40) return { label: 'En chemin 🌿', color: 'bg-amber-100 border-amber-300 text-amber-900' };
    return { label: 'Débutant 🌱', color: 'bg-red-100 border-red-300 text-red-900' };
  };

  const progress = step === 0 ? 0 : ((step) / 2) * 100;
  const scoreInfo = getScoreLabel(score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">

      {/* Header avec progress */}
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
                Étape {step}/2
              </div>
            </div>
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

        {/* ── STEP 0 : WELCOME ── */}
        {step === 0 && (
          <div className="text-center animate-fadeIn py-12">
            <div className="mb-8">
              <div className="w-32 h-32 bg-green-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
                <span className="text-6xl">🌿</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Yoonu Dal</h1>
              <p className="text-xl text-gray-600 mb-2">Ton coach financier personnel</p>
              <p className="text-sm text-gray-500">En wolof : "Le Chemin de l'Argent"</p>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 text-left space-y-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">✨</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Score personnalisé</h3>
                  <p className="text-gray-600 text-sm">Mesure l'alignement entre tes valeurs et tes dépenses</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">📊</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Analyse automatique</h3>
                  <p className="text-gray-600 text-sm">Insights et recommandations personnalisées</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">🦁</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Tontines digitales</h3>
                  <p className="text-gray-600 text-sm">Gère tes tontines avec tes proches, simplement</p>
                </div>
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

        {/* ── STEP 1 : VALEURS (3 sans classement) ── */}
        {step === 1 && (
          <div className="animate-slideUp">
            <div className="text-center mb-8">
              <p className="text-green-600 font-semibold mb-2">ÉTAPE 1/2</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Qu'est-ce qui compte pour toi en ce moment ?
              </h2>
              <p className="text-gray-500 text-base">
                Choisis 3 valeurs · Tu pourras les modifier à tout moment
              </p>
            </div>

            {/* Compteur */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all ${
                  data.values.length >= i
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {data.values.length >= i
                    ? VALUES.find(v => v.id === data.values[i-1])?.emoji || '✓'
                    : i
                  }
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-8">
              {VALUES.map(value => {
                const isSelected = data.values.includes(value.id);
                const isDisabled = !isSelected && data.values.length >= 3;

                return (
                  <button
                    key={value.id}
                    onClick={() => toggleValue(value.id)}
                    disabled={isDisabled}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-green-600 bg-green-50 shadow-md'
                        : isDisabled
                        ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{value.emoji}</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {value.label}
                          {isSelected && <span className="text-green-600 text-lg">✓</span>}
                        </div>
                        <div className="text-sm text-gray-500">{value.desc}</div>
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
              {data.values.length === 3 ? 'Continuer →' : `${data.values.length}/3 sélectionnées`}
            </button>
          </div>
        )}

        {/* ── STEP 2 : REVENUS ── */}
        {step === 2 && (
          <div className="animate-slideUp">
            <div className="text-center mb-8">
              <p className="text-green-600 font-semibold mb-2">ÉTAPE 2/2</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Tes revenus mensuels
              </h2>
              <p className="text-gray-600 text-lg">
                Pour personnaliser tes enveloppes et ton score
              </p>
            </div>

            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={data.income ? formatAmount(data.income) : ''}
                  onChange={handleIncomeChange}
                  placeholder="400 000"
                  className="w-full px-6 py-5 text-3xl font-bold text-gray-900 bg-white border-2 border-green-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-600/20 transition-all text-center"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xl">
                  FCFA
                </div>
              </div>
            </div>

            {/* Montants rapides */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3 text-center">Montants rapides</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setData(prev => ({ ...prev, income: amount.toString() }))}
                    className={`py-3 px-2 border-2 rounded-xl text-sm font-semibold transition-all ${
                      data.income === amount.toString()
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-400'
                    }`}
                  >
                    {formatAmount(amount)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">
              <div className="flex gap-3">
                <span className="text-xl">💡</span>
                <p className="text-sm text-blue-900">
                  Confidentiel et utilisé uniquement pour tes analyses. Tu pourras ajuster ce montant à tout moment dans ton profil.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
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
                    <span>Activer mon score</span>
                    <span>✨</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── SCORE REVEAL ── */}
        {showScore && (
          <div className="text-center animate-scaleIn py-12">
            <h2 className="text-2xl font-semibold text-gray-600 mb-8">
              Ton Score Yoonu Dal
            </h2>

            <div className="relative inline-block mb-8">
              <svg className="w-64 h-64 transform -rotate-90">
                <circle cx="128" cy="128" r="110" className="stroke-gray-200" strokeWidth="20" fill="none" />
                <circle
                  cx="128" cy="128" r="110"
                  className="stroke-green-600"
                  strokeWidth="20" fill="none"
                  strokeDasharray={`${score * 6.9} 691`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.3s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-7xl font-bold text-gray-900">{score}</div>
                <div className="text-2xl text-gray-500">/100</div>
              </div>
            </div>

            <div className="mb-8">
              <div className={`inline-flex items-center gap-2 px-6 py-3 border-2 rounded-full mb-4 ${scoreInfo.color}`}>
                <span className="font-bold">{scoreInfo.label}</span>
              </div>

              {score === 0 ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Ton score se construira avec tes dépenses
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Commence à enregistrer tes dépenses pour voir comment elles s'alignent avec tes valeurs. Ton score s'activera automatiquement.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Ton Score Yoonu Dal est actif !
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Suis tes dépenses régulièrement pour voir ton alignement avec tes valeurs et améliorer ton score.
                  </p>
                </>
              )}
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.6s ease-out; }
      `}</style>
    </div>
  );
};

export default Onboarding;
