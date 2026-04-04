import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const DebtsPage = ({ toast, onNavigate }) => {
  const [debts, setDebts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [filter, setFilter] = useState('active'); // active, all, paid

  // Formulaire création dette
  const [debtForm, setDebtForm] = useState({
    name: '',
    debt_type: 'autre',
    creditor: '',
    total_amount: '',
    monthly_payment: '',
    start_date: new Date().toISOString().split('T')[0],
    target_end_date: '',
    interest_rate: '0',
    notes: ''
  });

  // Formulaire paiement
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  const DEBT_TYPES = [
    { value: 'credit_bancaire', label: 'Crédit bancaire', emoji: '🏦' },
    { value: 'pret_personnel', label: 'Prêt personnel', emoji: '💰' },
    { value: 'dette_famille', label: 'Dette familiale', emoji: '👨‍👩‍👧' },
    { value: 'dette_ami', label: 'Dette à un ami', emoji: '🤝' },
    { value: 'credit_commerce', label: 'Crédit commerce', emoji: '🏪' },
    { value: 'tontine', label: 'Tontine', emoji: '🦁' },
    { value: 'autre', label: 'Autre', emoji: '📋' }
  ];

  const PAYMENT_METHODS = [
    { value: 'cash', label: 'Espèces' },
    { value: 'virement', label: 'Virement' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'autre', label: 'Autre' }
  ];

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtsRes, statsRes] = await Promise.all([
        API.get(`/debts/?is_active=${filter === 'active'}`),
        API.get('/debts/stats/')
      ]);
      
      let debtsList = debtsRes.data;
      
      if (filter === 'paid') {
        debtsList = debtsList.filter(d => d.is_fully_paid);
      }
      
      setDebts(debtsList);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast?.showError('Erreur lors du chargement des dettes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDebt = async (e) => {
    e.preventDefault();
    
    try {
      await API.post('/debts/', debtForm);
      toast?.showSuccess('Dette créée avec succès !');
      setShowCreateModal(false);
      setDebtForm({
        name: '',
        debt_type: 'autre',
        creditor: '',
        total_amount: '',
        monthly_payment: '',
        start_date: new Date().toISOString().split('T')[0],
        target_end_date: '',
        interest_rate: '0',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de la création');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    try {
      await API.post(`/debts/${selectedDebt.id}/payments/`, paymentForm);
      toast?.showSuccess('Paiement enregistré !');
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const handleDeleteDebt = async (debtId, debtName) => {
    if (!window.confirm(`Supprimer la dette "${debtName}" ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      await API.delete(`/debts/${debtId}/`);
      toast?.showSuccess('Dette supprimée');
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de la suppression');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
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

  const getStatusLabel = (status) => {
    const labels = {
      paid: '✅ Payée',
      almost_done: '🎯 Presque terminée',
      halfway: '⏳ À mi-chemin',
      in_progress: '📊 En cours',
      started: '🚀 Démarrée'
    };
    return labels[status] || status;
  };

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ←
              </button>
              <h1 className="text-2xl font-bold text-gray-900">💳 Mes Dettes</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              + Nouvelle dette
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats globales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">💰 Total dettes</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_debt)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">✅ Déjà payé</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_paid)}</p>
              <p className="text-xs text-gray-500">{stats.progress_percentage}%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">⏳ Reste à payer</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.total_remaining)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">📅 Paiement mensuel</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.monthly_payments)}</p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Actives ({stats?.active_debt_count || 0})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'paid'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Payées ({stats?.fully_paid_count || 0})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Toutes
          </button>
        </div>

        {/* Liste des dettes */}
        {debts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune dette</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'active' 
                ? 'Tu n\'as aucune dette active. Bravo !'
                : filter === 'paid'
                ? 'Aucune dette payée pour le moment'
                : 'Commence par ajouter une dette'}
            </p>
            {filter === 'active' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                + Ajouter une dette
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {debts.map(debt => {
              const debtType = DEBT_TYPES.find(t => t.value === debt.debt_type);
              
              return (
                <div key={debt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{debtType?.emoji || '📋'}</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{debt.name}</h3>
                        <p className="text-sm text-gray-600">
                          {debt.creditor && `Créancier: ${debt.creditor} • `}
                          {debtType?.label || debt.debt_type}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStatusColor(debt.status)}`}>
                      {getStatusLabel(debt.status)}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progression</span>
                      <span className="font-bold text-gray-900">{debt.progress_percentage?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full bg-gradient-to-r ${getStatusColor(debt.status)} transition-all duration-500`}
                        style={{ width: `${Math.min(debt.progress_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Détails financiers */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Montant total</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(debt.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Déjà payé</p>
                      <p className="font-semibold text-green-600">{formatCurrency(debt.amount_paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reste à payer</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(debt.remaining_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Paiement mensuel</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(debt.monthly_payment)}</p>
                    </div>
                  </div>

                  {/* Info supplémentaire */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>⏱️ {debt.months_remaining} mois restants</span>
                    {debt.interest_rate > 0 && <span>📊 Taux: {debt.interest_rate}%</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate('debt-detail', { debtId: debt.id })}
                      className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold border-2 border-blue-200 hover:bg-blue-100 transition-all"
                    >
                      📊 Voir détails
                    </button>
                    {debt.is_active && !debt.is_fully_paid && (
                      <button
                        onClick={() => {
                          setSelectedDebt(debt);
                          setShowPaymentModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold border-2 border-green-200 hover:bg-green-100 transition-all"
                      >
                        💰 Paiement
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDebt(debt.id, debt.name)}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold border-2 border-red-200 hover:bg-red-100 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Création Dette */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">💳 Nouvelle dette</h3>
            
            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({...debtForm, name: e.target.value})}
                  placeholder="Ex: Crédit voiture"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={debtForm.debt_type}
                    onChange={(e) => setDebtForm({...debtForm, debt_type: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {DEBT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.emoji} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Créancier</label>
                  <input
                    type="text"
                    value={debtForm.creditor}
                    onChange={(e) => setDebtForm({...debtForm, creditor: e.target.value})}
                    placeholder="Ex: BICIS"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant total (FCFA) *</label>
                  <input
                    type="number"
                    value={debtForm.total_amount}
                    onChange={(e) => setDebtForm({...debtForm, total_amount: e.target.value})}
                    placeholder="Ex: 1000000"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paiement mensuel (FCFA) *</label>
                  <input
                    type="number"
                    value={debtForm.monthly_payment}
                    onChange={(e) => setDebtForm({...debtForm, monthly_payment: e.target.value})}
                    placeholder="Ex: 50000"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date début *</label>
                  <input
                    type="date"
                    value={debtForm.start_date}
                    onChange={(e) => setDebtForm({...debtForm, start_date: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date fin prévue</label>
                  <input
                    type="date"
                    value={debtForm.target_end_date}
                    onChange={(e) => setDebtForm({...debtForm, target_end_date: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taux d'intérêt (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={debtForm.interest_rate}
                  onChange={(e) => setDebtForm({...debtForm, interest_rate: e.target.value})}
                  placeholder="Ex: 5.5"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={debtForm.notes}
                  onChange={(e) => setDebtForm({...debtForm, notes: e.target.value})}
                  rows={3}
                  placeholder="Informations supplémentaires..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
                >
                  Créer la dette
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Paiement */}
      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">💰 Ajouter un paiement</h3>
            <p className="text-gray-600 mb-6">{selectedDebt.name}</p>
            
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  placeholder={`Ex: ${selectedDebt.monthly_payment}`}
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
                      {method.label}
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
                    setSelectedDebt(null);
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

export default DebtsPage;
