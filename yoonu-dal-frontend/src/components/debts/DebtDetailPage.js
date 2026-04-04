import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const DebtDetailPage = ({ debtId, onNavigate, toast }) => {
  const [debt, setDebt] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  const PAYMENT_METHODS = [
    { value: 'cash', label: 'Espèces', emoji: '💵' },
    { value: 'virement', label: 'Virement', emoji: '🏦' },
    { value: 'mobile_money', label: 'Mobile Money', emoji: '📱' },
    { value: 'cheque', label: 'Chèque', emoji: '📝' },
    { value: 'autre', label: 'Autre', emoji: '📋' }
  ];

  const DEBT_TYPE_EMOJI = {
    'credit_bancaire': '🏦',
    'pret_personnel': '💰',
    'dette_famille': '👨‍👩‍👧',
    'dette_ami': '🤝',
    'credit_commerce': '🏪',
    'tontine': '🦁',
    'autre': '📋'
  };

  useEffect(() => {
    loadData();
  }, [debtId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtRes, paymentsRes] = await Promise.all([
        API.get(`/debts/${debtId}/`),
        API.get(`/debts/${debtId}/payments/`)
      ]);
      
      setDebt(debtRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast?.showError('Erreur lors du chargement');
      onNavigate?.('debts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    try {
      await API.post(`/debts/${debtId}/payments/`, paymentForm);
      toast?.showSuccess('Paiement enregistré !');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      await API.delete(`/debts/payments/${paymentId}/`);
      toast?.showSuccess('Paiement supprimé');
      setConfirmDeleteId(null);
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de la suppression');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'from-green-500 to-emerald-500',
      almost_done: 'from-blue-500 to-indigo-500',
      halfway: 'from-yellow-500 to-orange-500',
      in_progress: 'from-orange-500 to-red-500',
      started: 'from-red-500 to-pink-500'
    };
    return colors[status] || 'from-gray-500 to-gray-600';
  };

  const getMethodEmoji = (method) => {
    return PAYMENT_METHODS.find(m => m.value === method)?.emoji || '📋';
  };

  // Filtrer et trier les paiements
  const filteredPayments = payments
    .filter(payment => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        payment.notes?.toLowerCase().includes(query) ||
        payment.payment_method.toLowerCase().includes(query) ||
        formatCurrency(payment.amount).toLowerCase().includes(query) ||
        formatDate(payment.payment_date).toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.payment_date) - new Date(a.payment_date);
        case 'date_asc':
          return new Date(a.payment_date) - new Date(b.payment_date);
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

  // Calculer stats paiements
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const avgPayment = payments.length > 0 ? totalPaid / payments.length : 0;
  const lastPayment = payments.length > 0 
    ? payments.reduce((latest, p) => 
        new Date(p.payment_date) > new Date(latest.payment_date) ? p : latest
      ) 
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Dette introuvable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('debts')}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ←
              </button>
              <div className="flex items-center gap-2">
                <span className="text-3xl">{DEBT_TYPE_EMOJI[debt.debt_type] || '📋'}</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{debt.name}</h1>
                  {debt.creditor && (
                    <p className="text-sm text-gray-600">Créancier: {debt.creditor}</p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              + Paiement
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Carte résumé */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Barre de progression */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progression</span>
              <span className="font-bold text-gray-900">{debt.progress_percentage?.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full bg-gradient-to-r ${getStatusColor(debt.status)} transition-all duration-500`}
                style={{ width: `${Math.min(debt.progress_percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Stats financières */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Montant total</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(debt.total_amount)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Déjà payé</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(debt.amount_paid)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Reste à payer</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(debt.remaining_amount)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Paiement mensuel</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(debt.monthly_payment)}</p>
            </div>
          </div>

          {/* Info supplémentaire */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Mois restants</p>
              <p className="font-semibold text-gray-900">⏱️ {debt.months_remaining} mois</p>
            </div>
            {debt.interest_rate > 0 && (
              <div>
                <p className="text-xs text-gray-500">Taux d'intérêt</p>
                <p className="font-semibold text-gray-900">📊 {debt.interest_rate}%</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Date début</p>
              <p className="font-semibold text-gray-900">📅 {formatDate(debt.start_date)}</p>
            </div>
            {debt.target_end_date && (
              <div>
                <p className="text-xs text-gray-500">Date fin prévue</p>
                <p className="font-semibold text-gray-900">🎯 {formatDate(debt.target_end_date)}</p>
              </div>
            )}
          </div>

          {debt.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{debt.notes}</p>
            </div>
          )}
        </div>

        {/* Stats paiements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total paiements</p>
            <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Paiement moyen</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(avgPayment)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Dernier paiement</p>
            <p className="text-lg font-bold text-green-600">
              {lastPayment ? formatDate(lastPayment.payment_date) : 'Aucun'}
            </p>
          </div>
        </div>

        {/* Historique paiements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                📅 Historique des paiements ({filteredPayments.length})
              </h2>
            </div>

            {/* Recherche et tri */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par montant, méthode, notes..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="date_desc">📅 Plus récent</option>
                <option value="date_asc">📅 Plus ancien</option>
                <option value="amount_desc">💰 Montant décroissant</option>
                <option value="amount_asc">💰 Montant croissant</option>
              </select>
            </div>
          </div>

          {/* Liste paiements */}
          <div className="divide-y divide-gray-200">
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">💸</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'Aucun paiement trouvé' : 'Aucun paiement'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? 'Essayez avec d\'autres mots-clés'
                    : 'Commencez par ajouter un paiement'
                  }
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                  >
                    + Ajouter un paiement
                  </button>
                )}
              </div>
            ) : (
              filteredPayments.map(payment => (
                <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">{getMethodEmoji(payment.payment_method)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-gray-900">
                            {formatCurrency(payment.amount)}
                          </span>
                          <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          📅 {formatDate(payment.payment_date)}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-gray-500 mt-1">💬 {payment.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Bouton suppression */}
                    {confirmDeleteId === payment.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(payment.id)}
                        className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-lg border-2 border-red-200 hover:bg-red-100 transition-all"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">💰 Ajouter un paiement</h3>
            <p className="text-gray-600 mb-6">{debt.name}</p>
            
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  placeholder={`Ex: ${debt.monthly_payment}`}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date du paiement *</label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement *</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.emoji} {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note (optionnelle)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  rows={2}
                  placeholder="Ex: Paiement mars 2026"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({
                      amount: '',
                      payment_date: new Date().toISOString().split('T')[0],
                      payment_method: 'cash',
                      notes: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtDetailPage;
