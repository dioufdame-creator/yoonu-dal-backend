import React, { useState } from 'react';
import API from '../services/api';

// ==========================================
// CHECKOUT PAGE — Intégration PayDunya PSR
// Redirection vers page de paiement PayDunya
// ==========================================

const CheckoutPage = ({ onNavigate, toast, plan = 'monthly' }) => {
  const [loading, setLoading] = useState(false);

  const pricing = {
    monthly: { amount: 1500, label: '1 500 FCFA / mois', saving: null },
    yearly:  { amount: 15000, label: '15 000 FCFA / an', saving: 'Économise 3 000 FCFA' },
  };

  const selected = pricing[plan] || pricing.monthly;

  const handlePay = async () => {
    setLoading(true);
    try {
      const response = await API.post('/payments/create/', { plan });

      if (response.data.success && response.data.checkout_url) {
        // Stocker le transaction_id pour vérifier au retour
        localStorage.setItem('pending_transaction_id', response.data.transaction_id);
        // Rediriger vers PayDunya
        window.location.href = response.data.checkout_url;
      } else {
        toast?.showError?.(response.data.error || 'Erreur lors de la création du paiement');
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      toast?.showError?.(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Retour */}
        <button
          onClick={() => onNavigate?.('pricing')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm"
        >
          ← Retour
        </button>

        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">💎</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Passer en Premium
            </h1>
            <p className="text-gray-500 text-sm">
              Sécurisé par PayDunya
            </p>
          </div>

          {/* Récapitulatif */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-900">
                  Premium {plan === 'yearly' ? 'Annuel' : 'Mensuel'}
                </p>
                {selected.saving && (
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    {selected.saving}
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold text-green-700">
                {selected.label}
              </p>
            </div>
          </div>

          {/* Moyens de paiement disponibles */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 text-center mb-3">
              Moyens de paiement disponibles
            </p>
            <div className="flex justify-center gap-3">
              {['Wave', 'Orange Money', 'Free Money', 'Visa'].map(method => (
                <span key={method}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium">
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Bouton paiement */}
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Redirection...</span>
              </>
            ) : (
              <>
                <span>Payer {selected.label}</span>
                <span>→</span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400 mt-4">
            🔒 Paiement sécurisé · Annulation à tout moment
          </p>
        </div>

        {/* Info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Tu seras redirigé vers la plateforme sécurisée PayDunya pour finaliser ton paiement.
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
