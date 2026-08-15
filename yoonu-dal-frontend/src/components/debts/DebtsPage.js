import React, { useState, useEffect } from 'react';
import API from '../../services/api';

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

const emptyDebtForm = {
  name: '', debt_type: 'autre', counterparty: '', direction: 'owed_by_me',
  total_amount: '', monthly_payment: '',
  start_date: new Date().toISOString().split('T')[0],
  target_end_date: '', interest_rate: '0', notes: ''
};

const emptyPaymentForm = {
  amount: '', payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'cash', notes: ''
};

const DebtsPage = ({ toast, onNavigate }) => {
  const [debts, setDebts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [filter, setFilter] = useState('active');
  const [direction, setDirection] = useState('owed_by_me');
  const [debtForm, setDebtForm] = useState(emptyDebtForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const formatFCFA = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

  useEffect(() => { loadData(); }, [filter, direction]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtsRes, statsRes] = await Promise.all([
        API.get(`/debts/?is_active=${filter === 'active'}`),
        API.get('/debts/stats/')
      ]);
      let list = debtsRes.data.filter(d => d.direction === direction);
      if (filter === 'paid') list = list.filter(d => d.is_fully_paid);
      setDebts(list);
      setStats(statsRes.data);
    } catch {
      toast?.showError?.('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDebt = async () => {
    if (!debtForm.name || !debtForm.total_amount) {
      toast?.showError?.('Nom et montant total requis');
      return;
    }
    try {
      const payload = {
        ...debtForm,
        direction,
        monthly_payment: debtForm.monthly_payment ? debtForm.monthly_payment : null,
      };
      await API.post('/debts/', payload);
      toast?.showSuccess?.(direction === 'owed_by_me' ? 'Dette créée !' : 'Créance enregistrée !');
      setShowCreateSheet(false);
      setDebtForm(emptyDebtForm);
      loadData();
    } catch {
      toast?.showError?.('Erreur lors de la création');
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount) {
      toast?.showError?.('Montant requis');
      return;
    }
    try {
      await API.post(`/debts/${selectedDebt.id}/payments/`, paymentForm);
      toast?.showSuccess?.(direction === 'owed_by_me' ? 'Paiement enregistré !' : 'Remboursement reçu enregistré !');
      setShowPaymentSheet(false);
      setSelectedDebt(null);
      setPaymentForm(emptyPaymentForm);
      loadData();
    } catch {
      toast?.showError?.('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (debtId, debtName) => {
    const label = direction === 'owed_by_me' ? 'la dette' : 'la créance';
    if (!window.confirm(`Supprimer ${label} "${debtName}" ?`)) return;
    try {
      await API.delete(`/debts/${debtId}/`);
      toast?.showSuccess?.('Supprimée');
      loadData();
    } catch {
      toast?.showError?.('Erreur lors de la suppression');
    }
  };

  const getStateColor = (pct) => pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';

  const currentStats = stats ? (direction === 'owed_by_me' ? stats.owed_by_me : stats.owed_to_me) : null;
  const counterpartyLabel = direction === 'owed_by_me' ? 'Créancier' : 'Débiteur';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">💳 Mes dettes</h1>
            <p className="text-xs text-gray-400">Suivi et remboursements</p>
          </div>
          <button
            onClick={() => { setDebtForm(f => ({ ...f, direction })); setShowCreateSheet(true); }}
            className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md"
          >
            +
          </button>
        </div>

        {/* Onglets Je dois / On me doit */}
        <div className="flex gap-2 bg-white rounded-2xl p-1 mb-4 border border-gray-200 shadow-sm">
          <button
            onClick={() => setDirection('owed_by_me')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              direction === 'owed_by_me' ? 'bg-red-50 text-red-600' : 'text-gray-400'
            }`}
          >
            💳 Je dois
          </button>
          <button
            onClick={() => setDirection('owed_to_me')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              direction === 'owed_to_me' ? 'bg-green-50 text-green-600' : 'text-gray-400'
            }`}
          >
            🤝 On me doit
          </button>
        </div>

        {/* Résumé */}
        {currentStats && (
          <div className={`rounded-3xl p-5 mb-4 text-white shadow-xl ${
            direction === 'owed_by_me'
              ? 'bg-gradient-to-br from-red-500 to-rose-600'
              : 'bg-gradient-to-br from-green-600 to-emerald-700'
          }`}>
            <p className="text-sm opacity-80 mb-1">
              {direction === 'owed_by_me' ? 'Reste à payer' : 'Reste à recevoir'}
            </p>
            <p className="text-3xl font-bold mb-3">{formatFCFA(currentStats.remaining)} FCFA</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/20 rounded-2xl px-3 py-2.5">
                <p className="text-[11px] opacity-75">{direction === 'owed_by_me' ? 'Déjà payé' : 'Déjà reçu'}</p>
                <p className="text-sm font-bold">{formatFCFA(currentStats.paid)} ({currentStats.progress_percentage}%)</p>
              </div>
              <div className="bg-black/20 rounded-2xl px-3 py-2.5">
                <p className="text-[11px] opacity-75">Mensualité</p>
                <p className="text-sm font-bold">{formatFCFA(currentStats.monthly_payments)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { id: 'active', label: `Actives (${currentStats?.active_count || 0})` },
            { id: 'paid', label: `${direction === 'owed_by_me' ? 'Payées' : 'Remboursées'} (${currentStats?.fully_paid_count || 0})` },
            { id: 'all', label: 'Toutes' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.id ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {debts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">{direction === 'owed_by_me' ? '💳' : '🤝'}</div>
            <p className="text-sm text-gray-500 mb-4">
              {filter === 'active'
                ? direction === 'owed_by_me' ? 'Aucune dette active. Bravo !' : 'Personne ne te doit d\'argent.'
                : 'Rien pour le moment'}
            </p>
            {filter === 'active' && (
              <button
                onClick={() => { setDebtForm(f => ({ ...f, direction })); setShowCreateSheet(true); }}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                + {direction === 'owed_by_me' ? 'Ajouter une dette' : 'Ajouter une créance'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map(debt => {
              const type = DEBT_TYPES.find(t => t.value === debt.debt_type);
              const pct = debt.progress_percentage || 0;

              return (
                <div key={debt.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {type?.emoji || '📋'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{debt.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {debt.counterparty && `${counterpartyLabel}: ${debt.counterparty}`}
                        </p>
                      </div>
                    </div>
                    {debt.is_fully_paid && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-600 flex-shrink-0">
                        ✅ Soldée
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">{pct.toFixed(0)}%</span>
                      <span className="font-bold text-gray-700">
                        {formatFCFA(debt.remaining_amount)} FCFA restants
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getStateColor(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>
                      {debt.months_remaining !== null ? `⏱️ ${debt.months_remaining} mois restants` : '⏱️ Pas d\'échéance'}
                    </span>
                    {debt.interest_rate > 0 && <span>📊 {debt.interest_rate}%</span>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate('debt-detail', { debtId: debt.id })}
                      className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-blue-50 text-blue-600"
                    >
                      Détails
                    </button>
                    {debt.is_active && !debt.is_fully_paid && (
                      <button
                        onClick={() => { setSelectedDebt(debt); setShowPaymentSheet(true); }}
                        className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-green-50 text-green-600"
                      >
                        {direction === 'owed_by_me' ? 'Payer' : 'Remboursement reçu'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(debt.id, debt.name)}
                      className="px-3 py-2.5 rounded-xl bg-red-50 text-red-500 text-xs"
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

      {/* ── BOTTOM SHEET — Créer une dette/créance ── */}
      {showCreateSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCreateSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  {direction === 'owed_by_me' ? '💳 Nouvelle dette' : '🤝 Nouvelle créance'}
                </h2>
                <button onClick={() => setShowCreateSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Sens */}
              <div className="flex gap-2 bg-gray-50 rounded-2xl p-1">
                <button
                  onClick={() => { setDirection('owed_by_me'); setDebtForm(f => ({ ...f, direction: 'owed_by_me' })); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold ${direction === 'owed_by_me' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}
                >
                  💳 Je dois
                </button>
                <button
                  onClick={() => { setDirection('owed_to_me'); setDebtForm(f => ({ ...f, direction: 'owed_to_me' })); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold ${direction === 'owed_to_me' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}
                >
                  🤝 On me doit
                </button>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Nom</label>
                <input
                  type="text"
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
                  placeholder={direction === 'owed_by_me' ? 'Ex: Crédit voiture' : 'Ex: Prêt à Moussa'}
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Type</label>
                  <select
                    value={debtForm.debt_type}
                    onChange={(e) => setDebtForm({ ...debtForm, debt_type: e.target.value })}
                    className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                  >
                    {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{counterpartyLabel}</label>
                  <input
                    type="text"
                    value={debtForm.counterparty}
                    onChange={(e) => setDebtForm({ ...debtForm, counterparty: e.target.value })}
                    placeholder={direction === 'owed_by_me' ? 'BICIS' : 'Moussa Diop'}
                    className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Montant total</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={debtForm.total_amount}
                  onChange={(e) => setDebtForm({ ...debtForm, total_amount: e.target.value })}
                  placeholder="0"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  Mensualité <span className="font-normal normal-case">(optionnel)</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={debtForm.monthly_payment}
                  onChange={(e) => setDebtForm({ ...debtForm, monthly_payment: e.target.value })}
                  placeholder="Laisser vide si pas d'échéancier fixe"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Début</label>
                  <input
                    type="date"
                    value={debtForm.start_date}
                    onChange={(e) => setDebtForm({ ...debtForm, start_date: e.target.value })}
                    className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Fin prévue</label>
                  <input
                    type="date"
                    value={debtForm.target_end_date}
                    onChange={(e) => setDebtForm({ ...debtForm, target_end_date: e.target.value })}
                    className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Note</label>
                <textarea
                  value={debtForm.notes}
                  onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Informations supplémentaires"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none resize-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <button
                onClick={handleCreateDebt}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
              >
                {direction === 'owed_by_me' ? 'Créer la dette' : 'Créer la créance'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── BOTTOM SHEET — Paiement ── */}
      {showPaymentSheet && selectedDebt && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPaymentSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
            <div className="pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {direction === 'owed_by_me' ? '💰 Ajouter un paiement' : '💰 Remboursement reçu'}
                  </h2>
                  <p className="text-xs text-gray-400">{selectedDebt.name}</p>
                </div>
                <button onClick={() => setShowPaymentSheet(false)} className="text-gray-400 text-xl">✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Montant</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder={selectedDebt.monthly_payment ? `Ex: ${selectedDebt.monthly_payment}` : '0'}
                  autoFocus
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Méthode</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full mt-1 px-3 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Note</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optionnel"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none"
                />
              </div>
            </div>

            <div className="p-4 pb-6">
              <button
                onClick={handleAddPayment}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
};

export default DebtsPage;
