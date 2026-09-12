import React, { useState, useEffect } from 'react';
import API from '../services/api';

const SubscriptionPage = ({ onNavigate, user, toast }) => {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const subResponse = await API.get('/payments/subscription-status/');
      setSubscriptionData(subResponse.data);

      try {
        const transResponse = await API.get('/payments/transactions/');
        setTransactions(transResponse.data || []);
      } catch {
        setTransactions([]);
      }
    } catch (error) {
      toast?.showError?.('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPremium = subscriptionData?.is_premium;
  const isTrialActive = subscriptionData?.trial_active;
  const trialDaysLeft = subscriptionData?.trial_days_remaining || 0;
  const isFreemium = !isPremium;

  const getExpirationDate = () => {
    if (isTrialActive && user?.profile?.trial_expires_at) {
      return new Date(user.profile.trial_expires_at).toLocaleDateString('fr-FR');
    }
    if (isPremium && user?.profile?.subscription_expires_at) {
      return new Date(user.profile.subscription_expires_at).toLocaleDateString('fr-FR');
    }
    return null;
  };

  const features = [
    { icon: '📸', text: 'Scanner OCR illimité' },
    { icon: '🎤', text: 'Chat IA vocal' },
    { icon: '💬', text: 'Messages IA illimités' },
    { icon: '📄', text: 'Export PDF/Excel' },
    { icon: '🦁', text: 'Tontines illimitées' },
    { icon: '📊', text: 'Analytics avancées' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Mon abonnement</h1>
            <p className="text-xs text-gray-400">Gérez votre offre Yoonu Dal</p>
          </div>
        </div>

        {/* Carte statut */}
        <div className={`rounded-3xl p-6 mb-4 text-white shadow-xl ${
          isPremium || isTrialActive
            ? 'bg-gradient-to-br from-green-600 to-emerald-700'
            : 'bg-gradient-to-br from-gray-500 to-gray-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-80 mb-1">Statut actuel</p>
              <p className="text-2xl font-bold">
                {isTrialActive ? 'Essai Premium' : isPremium ? 'Premium actif' : 'Freemium'}
              </p>
            </div>
            <span className="text-4xl">{isTrialActive ? '🎁' : isPremium ? '💎' : '🌱'}</span>
          </div>

          {isTrialActive && (
            <div className="bg-black/20 rounded-2xl px-4 py-2.5 mb-3">
              <p className="text-sm font-semibold">{trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {getExpirationDate() && (
              <div className="bg-black/20 rounded-2xl px-3 py-2.5">
                <p className="text-[11px] opacity-75">Expire le</p>
                <p className="text-sm font-bold">{getExpirationDate()}</p>
              </div>
            )}
            <div className="bg-black/20 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] opacity-75">Messages IA</p>
              <p className="text-sm font-bold">
                {isPremium ? 'Illimités ✨' : `${subscriptionData?.ai_messages_count || 0} / 50`}
              </p>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="mb-4">
          {isFreemium && !subscriptionData?.trial_used && (
            <button
              onClick={() => onNavigate('pricing')}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
            >
              🎁 Essayer 30 jours gratuit
            </button>
          )}
          {isFreemium && subscriptionData?.trial_used && (
            <button
              onClick={() => onNavigate('pricing')}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
            >
              💎 Passer en Premium
            </button>
          )}
          {isTrialActive && (
            <button
              onClick={() => onNavigate('pricing')}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
            >
              💎 Continuer en Premium
            </button>
          )}
        </div>

        {/* Avantages */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            {isPremium ? 'Vos avantages Premium' : 'Avantages Premium'}
          </h2>
          <div className="space-y-2">
            {features.map((f, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${
                  isPremium ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <span className="text-lg">{f.icon}</span>
                <span className={`text-sm font-medium flex-1 ${isPremium ? 'text-green-700' : 'text-gray-600'}`}>
                  {f.text}
                </span>
                {isPremium && <span className="text-green-600 text-sm">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Historique */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Historique des paiements</h2>
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.plan === 'monthly' ? 'Mensuel' : 'Annuel'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{t.amount.toLocaleString()} FCFA</p>
                    <p className={`text-xs font-semibold ${
                      t.status === 'completed' ? 'text-green-600' :
                      t.status === 'pending' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {t.status === 'completed' ? '✓ Payé' : t.status === 'pending' ? '⏳ En attente' : '✗ Échoué'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Questions fréquentes</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Comment annuler mon abonnement ?</p>
              <p className="text-xs text-gray-500">
                Contactez-nous à support@yoonudal.com. Vous conservez l'accès jusqu'à la fin de la période payée.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Après mon essai gratuit ?</p>
              <p className="text-xs text-gray-500">
                Retour automatique en Freemium. Vous pouvez passer en Premium à tout moment.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Puis-je changer de forfait ?</p>
              <p className="text-xs text-gray-500">
                Oui, du mensuel à l'annuel à tout moment — contactez-nous pour le changement.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Besoin d'aide ? <a href="mailto:support@yoonudal.com" className="text-green-600 font-semibold">support@yoonudal.com</a>
        </p>

      </div>
    </div>
  );
};

export default SubscriptionPage;
