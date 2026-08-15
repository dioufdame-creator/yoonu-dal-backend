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

  // ✅ Onglet principal — le sens de la dette
  const [direction, setDirection] = useState('owed_by_me'); // owed_by_me | owed_to_me

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  const [debtForm, setDebtForm] = useState({
    name: '',
    debt_type: 'autre',
    counterparty: '',
    direction: 'owed_by_me',
    total_amount: '',
    monthly_payment: '',
    start_date: new Date().toISOString().split('T')[0],
    target_end_date: '',
    interest_rate: '0',
    notes: ''
  });

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
  }, [filter, direction]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtsRes, statsRes] = await Promise.all([
        API.get(`/debts/?is_active=${filter === 'active'}`),
        API.get('/debts/stats/')
      ]);

      let debtsList = debtsRes.data.filter(d => d.direction === direction);

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
      const payload = {
        ...debtForm,
        direction,
        monthly_payment: debtForm.monthly_payment ? debtForm.monthly_payment : null,
      };
      await API.post('/debts/', payload);
      toast?.showSuccess(direction === 'owed_by_me' ? 'Dette créée avec succès !' : 'Créance enregistrée avec succès !');
      setShowCreateModal(false);
      setDebtForm({
        name: '', debt_type: 'autre', counterparty: '', direction: 'owed_by_me',
        total_amount: '', monthly_payment: '',
        start_date: new Date().toISOString().split('T')[0],
        target_end_date: '', interest_rate: '0', notes: ''
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
      toast?.showSuccess(direction === 'owed_by_me' ? 'Paiement enregistré !' : 'Remboursement reçu enregistré !');
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentForm({
        amount: '', payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash', notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteDebt = async (debtId, debtName) => {
    const label = direction === 'owed_by_me' ? 'la dette' : 'la créance';
    if (!window.confirm(`Supprimer ${label} "${debtName}" ?\n\nCette action est irréversible.`)) return;
    try {
      await API.delete(`/debts/${debtId}/`);
      toast?.showSuccess('Supprimée');
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError('Erreur lors de la suppression');
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';

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
      paid: direction === 'owed_by_me' ? '✅ Payée' : '✅ Remboursée',
      almost_done: '🎯 Presque terminée',
      halfway: '⏳ À mi-chemin',
      in_progress: '📊 En cours',
      started: '🚀 Démarrée'
    };
    return labels[status] || status;
  };

  // Stats à afficher selon l'onglet actif
  const currentStats = stats ? (direction === 'owed_by_me' ? stats.owed_by_me : stats.owed_to_me) : null;

  const filteredAndSortedDebts = debts
    .filter(debt => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        debt.name.toLowerCase().includes(query) ||
        debt.counterparty?.toLowerCase().includes(query) ||
        debt.debt_type.toLowerCase().includes(query) ||
        DEBT_TYPES.find(t => t.value === debt.debt_type)?.label.toLowerCase().includes(query) ||
        formatCurrency(debt.total_amount).toLowerCase().includes(query) ||
        formatCurrency(debt.remaining_amount).toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return new Date(b.created_at) - new Date(a.created_at);
        case 'date_asc': return new Date(a.created_at) - new Date(b.created_at);
        case 'amount_desc': return b.total_amount - a.total_amount;
        case 'amount_asc': return a.total_amount - b.total_amount;
        case 'progress_desc': return b.progress_percentage - a.progress_percentage;
        case 'progress_asc': return a.progress_percentage - b.progress_percentage;
        default: return 0;
      }
    });

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

  const counterpartyLabel = direction === 'owed_by_me' ? 'Créancier' : 'Débiteur';
  const counterpartyPlaceholder = direction === 'owed_by_me' ? 'Ex: BICIS' : 'Ex: Moussa Diop';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate?.('dashboard')} className="text-gray-600 hover:text-gray-900">←</button>
              <h1 className="text-2xl font-bold text-gray-900">💳 Mes Dettes</h1>
            </div>
            <button
              onClick={() => { setDebtForm(f => ({ ...f, direction })); setShowCreateModal(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              + {direction === 'owed_by_me' ? 'Nouvelle dette' : 'Nouvelle créance'}
            </button>
          </div>

          {/* ✅ Onglets Je dois / On me doit */}
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setDirection('owed_by_me')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                direction === 'owed_by_me' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              💳 Je dois
            </button>
            <button
              onClick={() => setDirection('owed_to_me')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                direction === 'owed_to_me' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              🤝 On me doit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats globales — de l'onglet actif */}
        {currentStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">
                {direction === 'owed_by_me' ? '💰 Total dû' : '💰 Total à recevoir'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentStats.total)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">
                {direction === 'owed_by_me' ? '✅ Déjà payé' : '✅ Déjà reçu'}
              </p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(currentStats.paid)}</p>
              <p className="text-xs text-gray-500">{currentStats.progress_percentage}%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">
                {direction === 'owed_by_me' ? '⏳ Reste à payer' : '⏳ Reste à recevoir'}
              </p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(currentStats.remaining)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">📅 Mensualité</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(currentStats.monthly_payments)}</p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'active' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Actives ({currentStats?.active_count || 0})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'paid' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {direction === 'owed_by_me' ? 'Payées' : 'Remboursées'} ({currentStats?.fully_paid_count || 0})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Toutes
          </button>
        </div>

        {/* Recherche et Tri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`🔍 Rechercher par nom, ${direction === 'owed_by_me' ? 'créancier' : 'débiteur'}, type, montant...`}
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
              <option value="progress_desc">📊 Progression décroissante</option>
              <option value="progress_asc">📊 Progression croissante</option>
            </select>
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              {filteredAndSortedDebts.length} résultat{filteredAndSortedDebts.length > 1 ? 's' : ''} trouvé{filteredAndSortedDebts.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Liste */}
        {filteredAndSortedDebts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">{direction === 'owed_by_me' ? '💳' : '🤝'}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Aucun résultat' : direction === 'owed_by_me' ? 'Aucune dette' : 'Aucune créance'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Essayez avec d\'autres mots-clés'
                : filter === 'active'
                ? direction === 'owed_by_me'
                  ? 'Tu n\'as aucune dette active. Bravo !'
                  : 'Personne ne te doit d\'argent actuellement.'
                : filter === 'paid'
                ? 'Rien pour le moment'
                : direction === 'owed_by_me'
                  ? 'Commence par ajouter une dette'
                  : 'Enregistre un prêt que tu as accordé'}
            </p>
            {!searchQuery && filter === 'active' && (
              <button
                onClick={() => { setDebtForm(f => ({ ...f, direction })); setShowCreateModal(true); }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                + {direction === 'owed_by_me' ? 'Ajouter une dette' : 'Ajouter une créance'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedDebts.map(debt => {
              const debtType = DEBT_TYPES.find(t => t.value === debt.debt_type);

              return (
                <div key={debt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{debtType?.emoji || '📋'}</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{debt.name}</h3>
                        <p className="text-sm text-gray-600">
                          {debt.counterparty && `${counterpartyLabel}: ${debt.counterparty} • `}
                          {debtType?.label || debt.debt_type}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStatusColor(debt.status)}`}>
                      {getStatusLabel(debt.status)}
                    </span>
                  </div>

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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Montant total</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(debt.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{direction === 'owed_by_me' ? 'Déjà payé' : 'Déjà reçu'}</p>
                      <p className="font-semibold text-green-600">{formatCurrency(debt.amount_paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{direction === 'owed_by_me' ? 'Reste à payer' : 'Reste à recevoir'}</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(debt.remaining_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mensualité</p>
                      <p className="font-semibold text-blue-600">
                        {debt.monthly_payment ? formatCurrency(debt.monthly_payment) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>
                      {debt.months_remaining !== null
                        ? `⏱️ ${debt.months_remaining} mois restants`
                        : '⏱️ Pas d\'échéance définie'}
                    </span>
                    {debt.interest_rate > 0 && <span>📊 Taux: {debt.interest_rate}%</span>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate('debt-detail', { debtId: debt.id })}
                      className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold border-2 border-blue-200 hover:bg-blue-100 transition-all"
                    >
                      📊 Voir détails
                    </button>
                    {debt.is_active && !debt.is_fully_paid && (
                      <button
                        onClick={() => { setSelectedDebt(debt); setShowPaymentModal(true); }}
                        className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold border-2 border-green-200 hover:bg-green-100 transition-all"
                      >
                        {direction === 'owed_by_me' ? '💰 Paiement' : '💰 Remboursement reçu'}
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

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {direction === 'owed_by_me' ? '💳 Nouvelle dette' : '🤝 Nouvelle créance'}
            </h3>

            {/* Choix du sens — modifiable même dans le modal */}
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => { setDirection('owed_by_me'); setDebtForm(f => ({ ...f, direction: 'owed_by_me' })); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  direction === 'owed_by_me' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                💳 Je dois
              </button>
              <button
                type="button"
                onClick={() => { setDirection('owed_to_me'); setDebtForm(f => ({ ...f, direction: 'owed_to_me' })); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  direction === 'owed_to_me' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                🤝 On me doit
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({...debtForm, name: e.target.value})}
                  placeholder={direction === 'owed_by_me' ? 'Ex: Crédit voiture' : 'Ex: Prêt à Moussa'}
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
                      <option key={type.value} value={type.value}>{type.emoji} {type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{counterpartyLabel}</label>
                  <input
                    type="text"
                    value={debtForm.counterparty}
                    onChange={(e) => setDebtForm({...debtForm, counterparty: e.target.value})}
                    placeholder={counterpartyPlaceholder}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensualité (FCFA) <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    value={debtForm.monthly_payment}
                    onChange={(e) => setDebtForm({...debtForm, monthly_payment: e.target.value})}
                    placeholder="Ex: 50000 — laisser vide si pas d'échéancier fixe"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Sans mensualité, renseigne plutôt une date de fin prévue ci-dessous.
                  </p>
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
                  {direction === 'owed_by_me' ? 'Créer la dette' : 'Créer la créance'}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {direction === 'owed_by_me' ? '💰 Ajouter un paiement' : '💰 Enregistrer un remboursement reçu'}
            </h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Méthode *</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>{method.label}</option>
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
                  onClick={() => { setShowPaymentModal(false); setSelectedDebt(null); }}
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
