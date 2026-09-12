import React, { useState } from 'react';
import API from '../services/api';

const PricingPage = ({ onNavigate, user, toast, onUserRefresh }) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const isPremium = user?.profile?.subscription_tier === 'premium' || user?.subscription_tier === 'premium';
  const isTrialActive = user?.profile?.trial_active || user?.trial_active;
  const trialDaysLeft = user?.profile?.trial_days_remaining || user?.trial_days_remaining || 0;
  const trialUsed = user?.profile?.trial_used || user?.trial_used;

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const response = await API.post('/payments/start-trial/');
      if (response.data.success) {
        toast?.showSuccess?.('🎁 ' + response.data.message);
        if (onUserRefresh) await onUserRefresh();
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast?.showError?.(response.data.error || 'Erreur lors du démarrage du trial');
      }
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures = [
    { icon: '✅', text: 'Dashboard complet', included: true },
    { icon: '✅', text: 'Dépenses illimitées', included: true },
    { icon: '✅', text: 'Enveloppes illimitées', included: true },
    { icon: '✅', text: 'Score Yoonu', included: true },
    { icon: '✅', text: '1 tontine', included: true },
    { icon: '✅', text: 'Chat IA texte (50/mois)', included: true },
    { icon: '❌', text: 'Scanner OCR', included: false },
    { icon: '❌', text: 'Tontines illimitées', included: false },
  ];

  const premiumFeatures = [
    { icon: '✅', text: 'Tout Freemium +' },
    { icon: '📸', text: 'Scanner OCR illimité' },
    { icon: '🎤', text: 'Chat IA vocal' },
    { icon: '💬', text: 'Chat IA illimité' },
    { icon: '📄', text: 'Export PDF/Excel' },
    { icon: '🦁', text: 'Tontines illimitées' },
    { icon: '📊', text: 'Analytics avancées' },
    { icon: '🔔', text: 'Alertes prédictives' },
  ];

  const faqItems = [
    { q: "Comment fonctionne l'essai gratuit ?", a: "30 jours d'accès Premium complet sans engagement, aucune carte requise. À la fin, continuez en Premium ou revenez en Freemium." },
    { q: "Puis-je annuler à tout moment ?", a: "Oui — votre abonnement reste actif jusqu'à la fin de la période payée, puis bascule automatiquement en Freemium." },
    { q: "Quels moyens de paiement ?", a: "Mobile Money (Wave, Orange Money, Free Money) et cartes bancaires, via PayDunya." },
    { q: "Mes données si je reviens en Freemium ?", a: "Toutes vos données restent intactes — seules les fonctionnalités Premium deviennent inaccessibles." },
  ];

  const renderPremiumButton = () => {
    if (isPremium) {
      return (
        <button className="w-full py-4 bg-gray-200 text-gray-500 rounded-2xl font-bold">
          ✓ Abonnement actif
        </button>
      );
    }
    if (isTrialActive) {
      return (
        <button
          onClick={() => onNavigate('checkout', { plan: billingCycle })}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
        >
          💎 Continuer en Premium ({trialDaysLeft}j restants)
        </button>
      );
    }
    if (trialUsed) {
      return (
        <button
          onClick={() => onNavigate('checkout', { plan: billingCycle })}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
        >
          💎 Passer en Premium
        </button>
      );
    }
    return (
      <button
        onClick={handleStartTrial}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50"
      >
        {loading ? '⏳ Activation...' : '🎁 Essayer 30 jours gratuit'}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => onNavigate('subscription')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Choisis ton offre</h1>
            <p className="text-xs text-gray-400">Gratuit pour commencer, Premium quand tu es prêt</p>
          </div>
        </div>

        {(isTrialActive || (isPremium && !isTrialActive)) && (
          <div className={`rounded-2xl p-4 mb-4 flex items-center gap-3 ${
            isPremium && !isTrialActive
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            <span className="text-2xl">{isPremium && !isTrialActive ? '💎' : '🎁'}</span>
            <div>
              <p className="text-sm font-bold">{isPremium && !isTrialActive ? 'Tu es Premium !' : 'Essai Premium actif'}</p>
              {isTrialActive && <p className="text-xs opacity-80">{trialDaysLeft} jours restants</p>}
            </div>
          </div>
        )}

        {/* Toggle mensuel/annuel */}
        <div className="flex bg-white border border-gray-200 rounded-2xl p-1 mb-4">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              billingCycle === 'monthly' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              billingCycle === 'yearly' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Annuel
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              billingCycle === 'yearly' ? 'bg-white/20' : 'bg-green-100 text-green-700'
            }`}>-17%</span>
          </button>
        </div>

        {/* Carte Freemium */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 mb-4 shadow-sm">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🌱</div>
            <h2 className="text-base font-bold text-gray-900">Freemium</h2>
            <p className="text-2xl font-bold text-gray-900 mt-1">Gratuit</p>
            <p className="text-xs text-gray-400">Pour toujours</p>
          </div>
          <div className="space-y-2 mb-4">
            {freeFeatures.map((f, idx) => (
              <div key={idx} className={`flex items-center gap-2.5 ${!f.included ? 'opacity-40' : ''}`}>
                <span className="text-sm">{f.icon}</span>
                <span className="text-sm text-gray-700">{f.text}</span>
              </div>
            ))}
          </div>
          {!isPremium && !isTrialActive && (
            <div className="text-center text-xs font-bold text-gray-400 py-2">Plan actuel</div>
          )}
        </div>

        {/* Carte Premium */}
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border-2 border-green-500 p-5 mb-4 shadow-lg mt-6">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
              ⭐ Recommandé
            </span>
          </div>

          <div className="text-center mb-4 pt-2">
            <div className="text-3xl mb-2">💎</div>
            <h2 className="text-base font-bold text-gray-900">Premium</h2>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {billingCycle === 'monthly' ? '1 500' : '15 000'} FCFA
            </p>
            <p className="text-xs text-gray-500">{billingCycle === 'monthly' ? 'Par mois' : 'Par an'}</p>
            {billingCycle === 'yearly' && (
              <p className="text-xs text-green-600 font-semibold mt-1">Économise 3 000 FCFA/an</p>
            )}
          </div>

          <div className="space-y-2 mb-4">
            {premiumFeatures.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <span className="text-sm">{f.icon}</span>
                <span className="text-sm font-semibold text-green-700">{f.text}</span>
              </div>
            ))}
          </div>

          {renderPremiumButton()}

          <p className="text-center text-[11px] text-gray-500 mt-3">
            {trialUsed || isPremium || isTrialActive
              ? 'Paiement sécurisé via PayDunya · Wave, Orange Money, Free Money'
              : 'Aucune carte requise · Annulation à tout moment'}
          </p>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-4">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-gray-900">Questions fréquentes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {faqItems.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-900 pr-3">{item.q}</span>
                  <span className={`text-gray-300 text-xs flex-shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === idx && (
                  <p className="px-4 pb-3 text-xs text-gray-500 leading-relaxed">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-4 flex-wrap text-xs text-gray-400 font-semibold">
          <span className="flex items-center gap-1.5">🔒 Paiement sécurisé</span>
          <span className="flex items-center gap-1.5">🇸🇳 Made in Senegal</span>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;
