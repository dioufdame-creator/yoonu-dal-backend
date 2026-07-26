// src/components/dashboard/CarryoverCard.jsx
// Carte de décision pour le report du solde mensuel + modals d'affectation
import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const CarryoverCard = ({ onNavigate, toast, onAllocated }) => {
  const [carryover, setCarryover] = useState(null);
  const [deficit, setDeficit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // null | 'goal' | 'manual'
  const [goals, setGoals] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Répartition manuelle
  const [manualAmounts, setManualAmounts] = useState({
    essentiels: '', plaisirs: '', projets: '', liberation: ''
  });

  const formatFCFA = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

  useEffect(() => {
    checkCarryover();
  }, []);

  const checkCarryover = async () => {
    setLoading(true);
    try {
      const res = await API.get('/carryover/check/');
      if (res.data?.has_pending) {
        setCarryover(res.data.carryover);
      } else if (res.data?.deficit) {
        setDeficit(res.data.deficit);
      }
    } catch (error) {
      // silencieux — pas de report à afficher
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const res = await API.get('/goals/');
      const list = Array.isArray(res.data) ? res.data : res.data?.goals || [];
      setGoals(list.filter(g => !g.is_achieved));
    } catch {
      setGoals([]);
    }
  };

  const handleQuickAllocate = async (type) => {
    if (!carryover) return;
    setSubmitting(true);
    try {
      await API.post('/carryover/allocate/', {
        carryover_id: carryover.id,
        allocation_type: type,
      });
      toast?.showSuccess?.(
        type === 'envelopes'
          ? 'Réparti selon vos enveloppes !'
          : 'Ajouté à votre épargne !'
      );
      setCarryover(null);
      onAllocated?.();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors de l\'affectation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoalAllocate = async (goalId) => {
    if (!carryover) return;
    setSubmitting(true);
    try {
      await API.post('/carryover/allocate/', {
        carryover_id: carryover.id,
        allocation_type: 'goal',
        goal_id: goalId,
      });
      toast?.showSuccess?.('Envoyé vers votre projet !');
      setCarryover(null);
      setActiveModal(null);
      onAllocated?.();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors de l\'affectation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualAllocate = async () => {
    if (!carryover) return;
    const total = Object.values(manualAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    if (Math.abs(total - carryover.amount) > 1) {
      toast?.showError?.(`Le total (${formatFCFA(total)}) doit égaler ${formatFCFA(carryover.amount)} FCFA`);
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/carryover/allocate/', {
        carryover_id: carryover.id,
        allocation_type: 'manual',
        manual_amounts: {
          essentiels: parseFloat(manualAmounts.essentiels) || 0,
          plaisirs: parseFloat(manualAmounts.plaisirs) || 0,
          projets: parseFloat(manualAmounts.projets) || 0,
          liberation: parseFloat(manualAmounts.liberation) || 0,
        },
      });
      toast?.showSuccess?.('Répartition enregistrée !');
      setCarryover(null);
      setActiveModal(null);
      onAllocated?.();
    } catch (error) {
      toast?.showError?.(error.response?.data?.error || 'Erreur lors de l\'affectation');
    } finally {
      setSubmitting(false);
    }
  };

  const openGoalModal = () => {
    loadGoals();
    setActiveModal('goal');
  };

  const manualTotal = Object.values(manualAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const manualDiff = carryover ? carryover.amount - manualTotal : 0;

  if (loading) return null;

  // ── Cas déficit — information seulement ─────────────
  if (deficit) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-sm text-red-800 font-medium">
          Vous démarrez le mois avec un déficit de {formatFCFA(deficit.amount)} FCFA
          {' '}({deficit.from_month_label}) à rattraper.
        </p>
      </div>
    );
  }

  // ── Cas rien à signaler ──────────────────────────────
  if (!carryover) return null;

  // ── Cas solde positif — carte de décision ────────────
  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 mb-4 shadow-sm">
        <div className="flex items-start gap-2 mb-4">
          <span className="text-2xl flex-shrink-0">💰</span>
          <div>
            <p className="text-sm font-bold text-gray-900">
              Il vous reste {formatFCFA(carryover.amount)} FCFA de {carryover.from_month_label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Que voulez-vous en faire ?</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleQuickAllocate('envelopes')}
            disabled={submitting}
            className="bg-white rounded-2xl p-3 text-left border border-blue-100 hover:border-blue-300 transition-all disabled:opacity-50"
          >
            <span className="text-lg">✅</span>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">Répartir selon mes enveloppes</p>
          </button>

          <button
            onClick={openGoalModal}
            disabled={submitting}
            className="bg-white rounded-2xl p-3 text-left border border-blue-100 hover:border-blue-300 transition-all disabled:opacity-50"
          >
            <span className="text-lg">🎯</span>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">Envoyer vers un projet</p>
          </button>

          <button
            onClick={() => handleQuickAllocate('emergency')}
            disabled={submitting}
            className="bg-white rounded-2xl p-3 text-left border border-blue-100 hover:border-blue-300 transition-all disabled:opacity-50"
          >
            <span className="text-lg">💰</span>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">Fonds d'urgence</p>
          </button>

          <button
            onClick={() => setActiveModal('manual')}
            disabled={submitting}
            className="bg-white rounded-2xl p-3 text-left border border-blue-100 hover:border-blue-300 transition-all disabled:opacity-50"
          >
            <span className="text-lg">✍️</span>
            <p className="text-xs font-bold text-gray-800 mt-1 leading-snug">Choisir moi-même</p>
          </button>
        </div>
      </div>

      {/* ── Modal : choix d'un projet ────────────────────── */}
      {activeModal === 'goal' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Choisir un projet</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 text-xl">✕</button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">Vous n'avez pas encore de projet actif.</p>
                <button
                  onClick={() => { setActiveModal(null); onNavigate('goals'); }}
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
                >
                  Créer un projet
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGoalAllocate(g.id)}
                    disabled={submitting}
                    className="w-full text-left p-3 rounded-2xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-50"
                  >
                    <p className="text-sm font-bold text-gray-900">{g.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatFCFA(g.current_amount)} / {formatFCFA(g.target_amount)} FCFA
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal : répartition manuelle ─────────────────── */}
      {activeModal === 'manual' && carryover && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-gray-900">Répartir vous-même</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Total à répartir : <strong>{formatFCFA(carryover.amount)} FCFA</strong>
            </p>

            <div className="space-y-3 mb-4">
              {[
                { key: 'essentiels', label: 'Essentiels', icon: '🏠' },
                { key: 'plaisirs', label: 'Plaisirs', icon: '🎉' },
                { key: 'projets', label: 'Projets', icon: '🎯' },
                { key: 'liberation', label: 'Libération', icon: '🕊️' },
              ].map((env) => (
                <div key={env.key} className="flex items-center gap-3">
                  <span className="text-lg w-7">{env.icon}</span>
                  <span className="text-sm text-gray-700 flex-1">{env.label}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={manualAmounts[env.key]}
                    onChange={(e) => setManualAmounts(prev => ({ ...prev, [env.key]: e.target.value }))}
                    placeholder="0"
                    className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm text-right outline-none focus:border-green-500"
                  />
                </div>
              ))}
            </div>

            <div className={`text-xs font-semibold mb-4 text-center ${
              Math.abs(manualDiff) < 1 ? 'text-green-600' : 'text-amber-600'
            }`}>
              {Math.abs(manualDiff) < 1
                ? '✓ Répartition complète'
                : manualDiff > 0
                  ? `Reste ${formatFCFA(manualDiff)} FCFA à répartir`
                  : `Dépassement de ${formatFCFA(Math.abs(manualDiff))} FCFA`}
            </div>

            <button
              onClick={handleManualAllocate}
              disabled={submitting || Math.abs(manualDiff) >= 1}
              className="w-full py-3 bg-green-600 text-white rounded-2xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enregistrement...' : 'Valider la répartition'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CarryoverCard;
