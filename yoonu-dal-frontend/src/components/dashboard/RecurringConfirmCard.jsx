// src/components/dashboard/RecurringConfirmCard.jsx
// Carte de confirmation des transactions récurrentes du mois
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const RecurringConfirmCard = ({ toast, onProcessed }) => {
  const [items, setItems] = useState([]);
  const [monthLabel, setMonthLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatFCFA = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

  useEffect(() => { check(); }, []);

  const check = async () => {
    setLoading(true);
    try {
      const res = await API.get('/recurring/check/');
      if (res.data?.has_pending) {
        setItems(res.data.items);
        setMonthLabel(res.data.month_label);
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  const confirmAll = async () => {
    setSubmitting(true);
    try {
      const decisions = items.map(i => ({ generation_id: i.generation_id, action: 'confirm' }));
      await API.post('/recurring/confirm/', { decisions });
      toast?.showSuccess?.(`${items.length} transaction(s) confirmée(s) !`);
      setItems([]);
      onProcessed?.();
    } catch {
      toast?.showError?.('Erreur lors de la confirmation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOne = async (item, action, amount = null) => {
    setSubmitting(true);
    try {
      const decision = { generation_id: item.generation_id, action };
      if (amount !== null) decision.amount = amount;
      await API.post('/recurring/confirm/', { decisions: [decision] });
      setItems(prev => prev.filter(i => i.generation_id !== item.generation_id));
      setEditingId(null);
      toast?.showSuccess?.(action === 'skip' ? 'Ignorée ce mois' : 'Confirmée');
      onProcessed?.();
    } catch {
      toast?.showError?.('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.generation_id);
    setEditAmount(item.amount.toString());
  };

  if (loading || items.length === 0) return null;

  const total = items.reduce((s, i) => s + (i.type === 'expense' ? -i.amount : i.amount), 0);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-5 mb-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-2xl flex-shrink-0">🔁</span>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {items.length} transaction{items.length > 1 ? 's' : ''} récurrente{items.length > 1 ? 's' : ''} — {monthLabel}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">À confirmer ou ajuster</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-purple-600 font-semibold flex-shrink-0"
        >
          {expanded ? 'Réduire' : 'Détails'}
        </button>
      </div>

      {!expanded ? (
        <button
          onClick={confirmAll}
          disabled={submitting}
          className="w-full py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50"
        >
          {submitting ? 'Confirmation...' : `✅ Tout confirmer (${items.length})`}
        </button>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.generation_id} className="bg-white rounded-2xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.description}</p>
                  <p className="text-xs text-gray-400">Le {item.day_of_month}</p>
                </div>

                {editingId === item.generation_id ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs text-right outline-none focus:border-green-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleOne(item, 'modify', parseFloat(editAmount))}
                      className="text-green-600 text-sm font-bold px-1"
                    >✓</button>
                  </div>
                ) : (
                  <p
                    onClick={() => startEdit(item)}
                    className={`text-sm font-bold cursor-pointer flex-shrink-0 ${
                      item.type === 'expense' ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {item.type === 'expense' ? '-' : '+'}{formatFCFA(item.amount)}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleOne(item, 'confirm')}
                  disabled={submitting}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => handleOne(item, 'skip')}
                  disabled={submitting}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100"
                >
                  Ignorer ce mois
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringConfirmCard;
