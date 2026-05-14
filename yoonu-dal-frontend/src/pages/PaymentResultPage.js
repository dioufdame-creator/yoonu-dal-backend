import React, { useState, useEffect } from 'react';
import API from '../services/api';

// ==========================================
// PAYMENT RESULT PAGE
// Page de retour après paiement PayDunya
// Vérifie le statut et active le Premium
// ==========================================

const PaymentResultPage = ({ onNavigate, toast, status: urlStatus }) => {
  const [checking, setChecking] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const transactionId = localStorage.getItem('pending_transaction_id');

    if (!transactionId) {
      setPaymentStatus('unknown');
      setChecking(false);
      return;
    }

    // Vérifier le statut auprès du backend
    checkStatus(transactionId);
  }, []);

  const checkStatus = async (transactionId, attempts = 0) => {
    try {
      const response = await API.get(`/payments/status/${transactionId}/`);
      const { status, is_premium } = response.data;

      if (status === 'completed' || is_premium) {
        localStorage.removeItem('pending_transaction_id');
        setPaymentStatus('success');
        setChecking(false);
        // Redirection dashboard après 3s
        setTimeout(() => onNavigate?.('dashboard'), 3000);

      } else if (status === 'failed') {
        localStorage.removeItem('pending_transaction_id');
        setPaymentStatus('failed');
        setChecking(false);

      } else if (attempts < 12) {
        // Réessayer toutes les 5s pendant 1 minute max
        setTimeout(() => checkStatus(transactionId, attempts + 1), 5000);

      } else {
        setPaymentStatus('pending');
        setChecking(false);
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
      if (attempts < 3) {
        setTimeout(() => checkStatus(transactionId, attempts + 1), 5000);
      } else {
        setPaymentStatus('unknown');
        setChecking(false);
      }
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Vérification du paiement...
          </h2>
          <p className="text-gray-500 text-sm">
            Ne ferme pas cette page
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Paiement confirmé !
            </h2>
            <p className="text-gray-600 mb-2">
              Bienvenue en Premium 💎
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Redirection vers le dashboard...
            </p>
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Voir mon dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Paiement échoué
            </h2>
            <p className="text-gray-600 mb-8">
              Le paiement n'a pas pu être traité. Réessaie ou contacte le support.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate?.('pricing')}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Réessayer
              </button>
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending ou unknown
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Paiement en attente
          </h2>
          <p className="text-gray-600 mb-2">
            Ton paiement est en cours de traitement.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Si tu as payé, ton compte sera activé automatiquement dans quelques minutes.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Vérifier à nouveau
            </button>
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Dashboard
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Problème ? Contacte-nous à support@yoonudal.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
