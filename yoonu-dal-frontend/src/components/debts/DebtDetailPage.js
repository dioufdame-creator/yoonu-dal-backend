import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces', emoji: '💵' },
  { value: 'virement', label: 'Virement', emoji: '🏦' },
  { value: 'mobile_money', label: 'Mobile Money', emoji: '📱' },
  { value: 'cheque', label: 'Chèque', emoji: '📝' },
  { value: 'autre', label: 'Autre', emoji: '📋' }
];

const DEBT_TYPE_EMOJI = {
  credit_bancaire: '🏦', pret_personnel: '💰', dette_famille: '👨‍👩‍👧',
  dette_ami: '🤝', credit_commerce: '🏪', tontine: '🦁', autre: '📋'
};

const emptyPaymentForm = {
  amount: '', payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'cash', notes: ''
};

const DebtDetailPage = ({ debtId, onNavigate, toast }) => {
  const [debt, setDebt] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const formatFCFA = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => { loadData(); }, [debtId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtRes, paymentsRes] = await Promise.all([
        API.get(`/debts/${debtId}/`),
        API.get(`/debts/${debtId}/payments/`)
      ]);
      setDebt(debtRes.data);
      setPayments(paymentsRes.data);
    } catch {
      toast?.showError?.('Erreur lors du chargement');
      onNavigate?.('debts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount) {
      toast?.showError?.('Montant requis');
      return;
    }
    try {
      await API.post(`/debts/${debtId}/payments/`, paymentForm);
      toast?.showSuccess?.(isOwedByMe ? 'Paiement enregistré !' : 'Remboursement reçu enregistré !');
      setShowPaymentSheet(false);
      setPaymentForm(emptyPaymentForm);
      loadData();
    } catch {
      toast?.showError?.('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      await API.delete(`/debts/payments/${paymentId}/`);
      toast?.showSuccess?.('Supprimé');
      setConfirmDeleteId(null);
      loadData();
    } catch {
      toast?.showError?.('Erreur lors de la suppression');
    }
  };

  const getMethodEmoji = (m) => PAYMENT_METHODS.find(x => x.value === m)?.emoji || '📋';
  const getStateColor = (pct) => pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';

  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const avgPayment = payments.length > 0 ? totalPaid / payments.length : 0;
  const lastPayment = payments.length > 0
    ? payments.reduce((l, p) => new Date(p.payment_date) > new Date(l.payment_date) ? p : l)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Introuvable</p>
      </div>
    );
  }

  const isOwedByMe = debt.direction === 'owed_by_me';
  const counterpartyLabel = isOwedByMe ? 'Créancier' : 'Débiteur';
  const pct = debt.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => onNavigate?.('debts')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 flex-shrink-0"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 truncate">{debt.name}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                isOwedByMe ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
              }`}>
                {isOwedByMe ? 'Je dois' : 'On me doit'}
              </span>
            </div>
            {debt.counterparty && (
              <p className="text-xs text-gray-400 truncate">{counterpartyLabel}: {debt.counterparty}</p>
            )}
          </div>
          <button
            onClick={() => setShowPaymentSheet(true)}
            className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-md"
          >
            +
          </button>
        </div>

        {/* Carte résumé */}
        <div className={`rounded-3xl p-5 mb-4 text-white shadow-xl ${
          isOwedByMe
            ? 'bg-gradient-to-br from-red-500 to-rose-600'
            : 'bg-gradient-to-br from-green-600 to-emerald-700'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{DEBT_TYPE_EMOJI[debt.debt_type] || '📋'}</span>
            <p className="text-sm opacity-80">{isOwedByMe ? 'Reste à payer' : 'Reste à recevoir'}</p>
          </div>
          <p className="text-3xl font-bold mb-3">{formatFCFA(debt.remaining_amount)} FCFA</p>

          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mb-3">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] opacity-75">{isOwedByMe ? 'Déjà payé' : 'Déjà reçu'}</p>
              <p className="text-sm font-bold">{formatFCFA(debt.amount_paid)} ({pct.toFixed(0)}%)</p>
            </div>
            <div className="bg-black/20 rounded-2xl px-3 py-2.5">
              <p className="text-[11px] opacity-75">Mensualité</p>
              <p className="text-sm font-bold">{debt.monthly_payment ? formatFCFA(debt.monthly_payment) : '—'}</p>
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-gray-400">Montant total</p>
            <p className="text-sm font-bold text-gray-800">{formatFCFA(debt.total_amount)} FCFA</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Échéance</p>
            <p className="text-sm font-bold text-gray-800">
              {debt.months_remaining !== null ? `${debt.months_remaining} mois` : 'Non définie'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Date début</p>
            <p className="text-sm font-bold text-gray-800">{formatDate(debt.start_date)}</p>
          </div>
          {debt.target_end_date && (
            <div>
              <p className="text-[11px] text-gray-400">Fin prévue</p>
              <p className="text-sm font-bold text-gray-800">{formatDate(debt.target_end_date)}</p>
            </div>
          )}
          {debt.interest_rate > 0 && (
            <div>
              <p className="text-[11px] text-gray-400">Taux d'intérêt</p>
              <p className="text-sm font-bold text-gray-800">{debt.interest_rate}%</p>
            </div>
          )}
          {debt.notes && (
            <div className="col-span-2 pt-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 mb-0.5">Notes</p>
              <p className="text-xs text-gray-600">{debt.notes}</p>
            </div>
          )}
        </div>

        {/* Mini-stats paiements */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-900">{payments.length}</p>
            <p className="text-[10px] text-gray-400">{isOwedByMe ? 'Paiements' : 'Remb.'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-sm font-bold text-blue-600">{formatFCFA(avgPayment)}</p>
            <p className="text-[10px] text-gray-400">Moyenne</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-sm font-bold text-green-600">{lastPayment ? formatDate(lastPayment.payment_date) : '—'}</p>
            <p className="text-[10px] text-gray-400">Dernier</p>
          </div>
        </div>

        {/* Historique */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-gray-900">
              Historique {isOwedByMe ? 'des paiements' : 'des remboursements'}
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-3xl mb-2">💸</div>
              <p className="text-sm text-gray-500 mb-3">
                {isOwedByMe ? 'Aucun paiement' : 'Aucun remboursement'}
              </p>
              <button
                onClick={() => setShowPaymentSheet(true)}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                + Ajouter {isOwedByMe ? 'un paiement' : 'un remboursement'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {payments
                .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
                .map(payment => (
                  <div key={payment.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                      {getMethodEmoji(payment.payment_method)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{formatFCFA(payment.amount)} FCFA</p>
                      <p className="text-[11px] text-gray-400">
                        {formatDate(payment.payment_date)}
                        {payment.notes && ` · ${payment.notes}`}
                      </p>
                    </div>

                    {confirmDeleteId === payment.id ? (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleDeletePayment(payment.id)} className="text-xs font-bold text-red-600 px-2 py-1">✓</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-gray-400 px-2 py-1">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(payment.id)}
                        className="text-gray-300 hover:text-red-500 text-sm flex-shrink-0 px-2"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet paiement */}
      {showPaymentSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPaymentSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
            <div className="pt-3 pb-2 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  {isOwedByMe ? '💰 Ajouter un paiement' : '💰 Remboursement reçu'}
                </h2>
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
                  placeholder={debt.monthly_payment ? `Ex: ${debt.monthly_payment}` : '0'}
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
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
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

export default DebtDetailPage;
