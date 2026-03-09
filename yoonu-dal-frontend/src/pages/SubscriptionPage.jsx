import React, { useState, useEffect } from 'react';
import API from '../services/api';

// ==========================================
// SUBSCRIPTION PAGE - MON ABONNEMENT
// Gérer son abonnement Premium/Trial
// ==========================================

const SubscriptionPage = ({ onNavigate, user, toast }) => {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Charger les données
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Récupérer le statut subscription
      const subResponse = await API.get('/payments/subscription-status/');
      setSubscriptionData(subResponse.data);

      // Récupérer l'historique des transactions (à créer si besoin)
      try {
        const transResponse = await API.get('/payments/transactions/');
        setTransactions(transResponse.data || []);
      } catch (err) {
        console.warn('Pas de transactions disponibles');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast?.showError?.('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const isPremium = subscriptionData?.is_premium;
  const isTrialActive = subscriptionData?.trial_active;
  const trialDaysLeft = subscriptionData?.trial_days_remaining || 0;
  const isFreemium = !isPremium;

  // Calcul de la date d'expiration
  const getExpirationDate = () => {
    if (isTrialActive && user?.profile?.trial_expires_at) {
      return new Date(user.profile.trial_expires_at).toLocaleDateString('fr-FR');
    }
    if (isPremium && user?.profile?.subscription_expires_at) {
      return new Date(user.profile.subscription_expires_at).toLocaleDateString('fr-FR');
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Mon Abonnement</h1>
          <p className="text-gray-600 mt-2">Gérez votre abonnement Yoonu Dal</p>
        </div>

        {/* Carte Status Actuel */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-2 border-gray-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Statut actuel
              </h2>
              
              {/* Badge Status */}
              {isTrialActive && (
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
                  <span className="text-xl">🎁</span>
                  <span>Essai Premium - {trialDaysLeft} jours restants</span>
                </div>
              )}
              
              {isPremium && !isTrialActive && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                  <span className="text-xl">💎</span>
                  <span>Premium Actif</span>
                </div>
              )}
              
              {isFreemium && (
                <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold">
                  <span className="text-xl">🌱</span>
                  <span>Freemium</span>
                </div>
              )}
            </div>
            
            <div className="text-6xl">
              {isTrialActive ? '🎁' : isPremium ? '💎' : '🌱'}
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
            {getExpirationDate() && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Date d'expiration</p>
                <p className="text-lg font-bold text-gray-900">{getExpirationDate()}</p>
              </div>
            )}
            
            {isFreemium && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Messages IA ce mois</p>
                <p className="text-lg font-bold text-gray-900">
                  {subscriptionData?.ai_messages_count || 0} / 50
                </p>
              </div>
            )}
            
            {isPremium && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Messages IA</p>
                <p className="text-lg font-bold text-green-600">Illimités ✨</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t">
            {isFreemium && !subscriptionData?.trial_used && (
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
              >
                🎁 Essayer 30 jours gratuit
              </button>
            )}
            
            {isFreemium && subscriptionData?.trial_used && (
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
              >
                💎 Passer en Premium
              </button>
            )}
            
            {isTrialActive && (
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
              >
                💎 Continuer en Premium
              </button>
            )}
          </div>
        </div>

        {/* Avantages */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isPremium ? 'Vos avantages Premium' : 'Avantages Premium'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '📸', text: 'Scanner OCR illimité', active: isPremium },
              { icon: '🎤', text: 'Chat IA vocal', active: isPremium },
              { icon: '💬', text: 'Messages IA illimités', active: isPremium },
              { icon: '📄', text: 'Export PDF/Excel', active: isPremium },
              { icon: '🦁', text: 'Tontines illimitées', active: isPremium },
              { icon: '📊', text: 'Analytics avancées', active: isPremium },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  feature.active ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className={`font-medium ${feature.active ? 'text-green-700' : 'text-gray-600'}`}>
                  {feature.text}
                </span>
                {feature.active && <span className="ml-auto text-green-600">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Historique Transactions */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Historique des paiements
            </h2>
            
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {transaction.plan === 'monthly' ? 'Abonnement Mensuel' : 'Abonnement Annuel'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {transaction.amount.toLocaleString()} FCFA
                    </p>
                    <p className={`text-sm ${
                      transaction.status === 'completed' ? 'text-green-600' :
                      transaction.status === 'pending' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {transaction.status === 'completed' ? '✓ Payé' :
                       transaction.status === 'pending' ? '⏳ En attente' :
                       '✗ Échoué'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Comment annuler mon abonnement ?
              </h3>
              <p className="text-gray-600 text-sm">
                Contactez-nous à support@yoonudal.com pour annuler votre abonnement. 
                Vous conserverez l'accès jusqu'à la fin de la période payée.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Que se passe-t-il après mon essai gratuit ?
              </h3>
              <p className="text-gray-600 text-sm">
                Votre compte revient automatiquement en mode Freemium. 
                Vous pouvez passer en Premium à tout moment.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je changer de forfait ?
              </h3>
              <p className="text-gray-600 text-sm">
                Oui, vous pouvez passer du mensuel à l'annuel à tout moment. 
                Contactez-nous pour effectuer le changement.
              </p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Besoin d'aide ? Contactez-nous à <a href="mailto:support@yoonudal.com" className="text-green-600 hover:underline">support@yoonudal.com</a></p>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionPage;
