import React, { useState } from 'react';
import API from '../services/api';  // ✅ AJOUTÉ

// ==========================================
// PRICING PAGE - FREEMIUM VS PREMIUM
// 1500 FCFA/mois - Essai 30 jours
// ==========================================

const PricingPage = ({ onNavigate, user, toast }) => {  // ✅ AJOUTÉ toast
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);  // ✅ AJOUTÉ
  
  const isPremium = user?.subscription_tier === 'premium';
  const isTrialActive = user?.trial_active;
  const trialDaysLeft = user?.trial_days_remaining || 0;
  const trialUsed = user?.trial_used;  // ✅ AJOUTÉ

  // ✅✅✅ NOUVELLE FONCTION : Démarrer le trial ✅✅✅
  const handleStartTrial = async () => {
    if (trialUsed) {
      toast?.showError?.('Essai gratuit déjà utilisé');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/payments/start-trial/');
      
      if (response.data.success) {
        toast?.showSuccess?.('🎁 ' + response.data.message);
        
        // Recharger la page après 1 seconde pour mettre à jour le user
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast?.showError?.(response.data.error || 'Erreur lors du démarrage du trial');
      }
    } catch (error) {
      console.error('Erreur trial:', error);
      toast?.showError?.(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };
  // ✅✅✅ FIN NOUVELLE FONCTION ✅✅✅

  const features = {
    free: [
      { icon: '✅', text: 'Dashboard complet', included: true },
      { icon: '✅', text: 'Dépenses illimitées', included: true },
      { icon: '✅', text: 'Enveloppes illimitées', included: true },
      { icon: '✅', text: 'Diagnostic valeurs', included: true },
      { icon: '✅', text: 'Score Yoonu', included: true },
      { icon: '✅', text: '1 tontine', included: true },
      { icon: '✅', text: 'Chat IA texte (50/mois)', included: true },
      { icon: '❌', text: 'Scanner OCR', included: false },
      { icon: '❌', text: 'Chat IA vocal', included: false },
      { icon: '❌', text: 'Export PDF/Excel', included: false },
      { icon: '❌', text: 'Tontines illimitées', included: false },
      { icon: '❌', text: 'Analytics avancées', included: false }
    ],
    premium: [
      { icon: '✅', text: 'Tout Freemium +', included: true, highlight: true },
      { icon: '📸', text: 'Scanner OCR illimité', included: true, highlight: true },
      { icon: '🎤', text: 'Chat IA vocal', included: true, highlight: true },
      { icon: '💬', text: 'Chat IA illimité', included: true, highlight: true },
      { icon: '📄', text: 'Export PDF/Excel', included: true, highlight: true },
      { icon: '🦁', text: 'Tontines illimitées', included: true, highlight: true },
      { icon: '📊', text: 'Analytics avancées', included: true, highlight: true },
      { icon: '🔔', text: 'Alertes prédictives', included: true, highlight: true },
      { icon: '⚡', text: 'Support prioritaire', included: true, highlight: true },
      { icon: '🎁', text: '30 jours d\'essai gratuit', included: true, highlight: true }
    ]
  };

  const pricing = {
    monthly: 1500,
    yearly: 15000 // 2 mois gratuits
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choisis ton offre
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Commence gratuitement, passe en Premium quand tu es prêt
          </p>

          {/* Trial Banner */}
          {isTrialActive && (
            <div className="mt-6 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-6 py-3">
              <span className="text-2xl">🎁</span>
              <div className="text-left">
                <div className="font-bold text-green-800">Essai Premium actif !</div>
                <div className="text-sm text-green-600">{trialDaysLeft} jours restants</div>
              </div>
            </div>
          )}

          {isPremium && !isTrialActive && (
            <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl px-6 py-3">
              <span className="text-2xl">💎</span>
              <div className="font-bold">Tu es Premium !</div>
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 rounded-xl p-1 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annuel
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* FREEMIUM */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🌱</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Freemium</h2>
              <div className="text-5xl font-bold text-gray-900 mb-2">
                Gratuit
              </div>
              <p className="text-gray-600">Pour toujours</p>
            </div>

            <div className="space-y-3 mb-8">
              {features.free.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    !feature.included ? 'opacity-40' : ''
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{feature.icon}</span>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>

            {!isPremium && !isTrialActive && (
              <button className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                Plan actuel
              </button>
            )}
          </div>

          {/* PREMIUM */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-2xl border-2 border-green-500 p-8 relative">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                ⭐ Recommandé
              </span>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl mb-4">💎</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium</h2>
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {billingCycle === 'monthly' ? '1 500' : '15 000'} FCFA
              </div>
              <p className="text-gray-600">
                {billingCycle === 'monthly' ? 'Par mois' : 'Par an'}
              </p>
              {billingCycle === 'yearly' && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  Économise 3 000 FCFA/an
                </p>
              )}
            </div>

            <div className="space-y-3 mb-8">
              {features.premium.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    feature.highlight ? 'font-semibold' : ''
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{feature.icon}</span>
                  <span className={feature.highlight ? 'text-green-700' : 'text-gray-700'}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {isPremium ? (
              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg cursor-default">
                ✓ Abonnement actif
              </button>
            ) : isTrialActive ? (
              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all">
                🎁 Essai en cours ({trialDaysLeft}j restants)
              </button>
            ) : (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Activation...' : '🎁 Essayer 30 jours gratuit'}
              </button>
            )}

            <p className="text-center text-xs text-gray-600 mt-4">
              Aucune carte requise • Annulation à tout moment
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          
          <div className="space-y-4">
            <FAQItem
              question="Comment fonctionne l'essai gratuit ?"
              answer="Tu bénéficies de 30 jours d'accès Premium complet sans aucun engagement. Aucune carte requise. À la fin, choisis de continuer en Premium ou revenir en Freemium."
            />
            <FAQItem
              question="Puis-je annuler à tout moment ?"
              answer="Oui, absolument ! Ton abonnement reste actif jusqu'à la fin de la période payée, puis bascule automatiquement en Freemium."
            />
            <FAQItem
              question="Quels moyens de paiement acceptez-vous ?"
              answer="Nous acceptons Mobile Money (Wave, Orange Money, Free Money) et les cartes bancaires internationales."
            />
            <FAQItem
              question="Mes données sont-elles conservées si je reviens en Freemium ?"
              answer="Oui ! Toutes tes données restent intactes. Seules les fonctionnalités Premium deviennent inaccessibles."
            />
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <div className="flex justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">🔒</span>
              <span className="font-semibold">Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">🇸🇳</span>
              <span className="font-semibold">Made in Senegal</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">💚</span>
              <span className="font-semibold">+1000 utilisateurs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <span className={`text-2xl transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
};

export default PricingPage;