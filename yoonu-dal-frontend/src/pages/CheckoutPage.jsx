import React, { useState } from 'react';
import API from '../services/api';

// ==========================================
// CHECKOUT PAGE
// Mobile Money + Carte bancaire
// ==========================================

const CheckoutPage = ({ onNavigate, toast, plan = 'monthly' }) => {
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [mobileProvider, setMobileProvider] = useState('wave');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const pricing = {
    monthly: { amount: 1500, label: '1 500 FCFA/mois' },
    yearly: { amount: 15000, label: '15 000 FCFA/an' }
  };

  const selectedPlan = pricing[plan];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      if (paymentMethod === 'mobile_money') {
        await processMobileMoney();
      } else {
        await processCard();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast?.showError?.(error.response?.data?.error || 'Erreur de paiement');
    } finally {
      setProcessing(false);
    }
  };

  const processMobileMoney = async () => {
    // Validation
    if (!phoneNumber || phoneNumber.length < 9) {
      toast?.showError?.('Numéro de téléphone invalide');
      return;
    }

    const response = await API.post('/payments/mobile-money/', {
      provider: mobileProvider,
      phone_number: phoneNumber,
      amount: selectedPlan.amount,
      plan: plan
    });

    if (response.data.success) {
      // Afficher instructions
      toast?.showSuccess?.('Demande envoyée ! Valide sur ton téléphone');
      
      // Polling pour vérifier le paiement
      pollPaymentStatus(response.data.transaction_id);
    }
  };

  const processCard = async () => {
    // Validation basique
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      toast?.showError?.('Tous les champs sont requis');
      return;
    }

    const response = await API.post('/payments/card/', {
      card_number: cardNumber,
      card_expiry: cardExpiry,
      card_cvc: cardCvc,
      card_name: cardName,
      amount: selectedPlan.amount,
      plan: plan
    });

    if (response.data.success) {
      toast?.showSuccess?.('Paiement réussi ! Bienvenue en Premium 💎');
      setTimeout(() => onNavigate?.('dashboard'), 2000);
    }
  };

  const pollPaymentStatus = async (transactionId, attempts = 0) => {
    if (attempts > 30) { // 30 tentatives = 5 minutes max
      toast?.showError?.('Paiement expiré. Réessaie.');
      return;
    }

    setTimeout(async () => {
      try {
        const response = await API.get(`/payments/status/${transactionId}/`);
        
        if (response.data.status === 'completed') {
          toast?.showSuccess?.('Paiement confirmé ! Bienvenue en Premium 💎');
          setTimeout(() => onNavigate?.('dashboard'), 2000);
        } else if (response.data.status === 'failed') {
          toast?.showError?.('Paiement échoué. Réessaie.');
        } else {
          // En attente, continuer le polling
          pollPaymentStatus(transactionId, attempts + 1);
        }
      } catch (error) {
        console.error('Polling error:', error);
        pollPaymentStatus(transactionId, attempts + 1);
      }
    }, 10000); // Check toutes les 10 secondes
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back button */}
        <button
          onClick={() => onNavigate?.('pricing')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <span>←</span>
          <span>Retour aux tarifs</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Finaliser ton abonnement
          </h1>
          <p className="text-gray-600">
            Sécurisé et crypté • Annulation à tout moment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              
              {/* Payment Method Selector */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Moyen de paiement
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'mobile_money'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">📱</div>
                    <div className="font-semibold">Mobile Money</div>
                    <div className="text-xs text-gray-600">Wave, Orange, Free</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">💳</div>
                    <div className="font-semibold">Carte bancaire</div>
                    <div className="text-xs text-gray-600">Visa, Mastercard</div>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {paymentMethod === 'mobile_money' ? (
                  <>
                    {/* Mobile Money Provider */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Opérateur
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['wave', 'orange', 'free'].map(provider => (
                          <button
                            key={provider}
                            type="button"
                            onClick={() => setMobileProvider(provider)}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              mobileProvider === provider
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-semibold capitalize">{provider}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="77 123 45 67"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format : 77 XXX XX XX
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Card Name */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nom sur la carte
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="PRENOM NOM"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    {/* Card Number */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Numéro de carte
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    {/* Expiry + CVC */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Expiration
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          maxLength="5"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          CVC
                        </label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="123"
                          maxLength="3"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    processing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl'
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      <span>Traitement...</span>
                    </span>
                  ) : (
                    `Payer ${selectedPlan.label}`
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  🔒 Paiement sécurisé et crypté
                </p>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Récapitulatif
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">Plan</span>
                  <span className="font-semibold">Premium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Période</span>
                  <span className="font-semibold capitalize">{plan === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                </div>
                <div className="border-t border-green-200 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-700">
                    {selectedPlan.amount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <span>✅</span>
                    <span>Essai 30 jours gratuit</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✅</span>
                    <span>Accès illimité</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>✅</span>
                    <span>Annulation facile</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 text-center">
                En continuant, tu acceptes nos conditions d'utilisation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
