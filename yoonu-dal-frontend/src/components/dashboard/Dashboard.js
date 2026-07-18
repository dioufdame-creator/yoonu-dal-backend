// src/components/dashboard/Dashboard.js
// Dashboard V5.2 — carte solde + message coach intelligent
import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const ENVELOPE_CONFIG = {
  essentiel:  { label: 'Essentiels', icon: '🏠', color: 'bg-red-500' },
  plaisir:    { label: 'Plaisirs',   icon: '🎉', color: 'bg-blue-500' },
  projet:     { label: 'Projets',    icon: '🎯', color: 'bg-green-500' },
  liberation: { label: 'Libération', icon: '🕊️', color: 'bg-amber-500' },
};

const CATEGORY_ICONS = {
  loyer: '🏠', alimentation: '🍽️', transport: '🚗', sante_courante: '💊',
  eau_electricite: '💡', telephone_internet: '📱', aide_menagere: '🧹',
  solidarite_famille: '👨‍👩‍👧', maison_courses: '🛒', restaurant: '🍜',
  loisirs: '🎬', vetements: '👔', beaute: '💅', voyage: '✈️',
  education: '📚', epargne: '💰', fetes_ceremonies: '🎊', spiritualite: '🕌',
  sante_exceptionnelle: '🏥', immobilier: '🏗️', tontine_epargne: '🤝',
  remboursement_dette: '💳', autre: '📝',
};

const Dashboard = ({ toast, auth, onNavigate, user }) => {
  const [loading, setLoading] = useState(true);
  const [envelopes, setEnvelopes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [tontines, setTontines] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [score, setScore] = useState(null);

  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = lastDayOfMonth - now.getDate();

  const getUserName = () => {
    if (user?.user?.first_name) return user.user.first_name;
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    return '';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [envelopesRes, expensesRes, incomesRes, scoreRes, goalsRes, debtsRes, tontinesRes] = await Promise.all([
        API.get('/meta-envelopes/').catch(() => ({ data: { envelopes: [] } })),
        API.get('/expenses/').catch(() => ({ data: [] })),
        API.get('/incomes/').catch(() => ({ data: [] })),
        API.get('/yoonu-score/').catch(() => null),
        API.get('/goals/').catch(() => ({ data: [] })),
        API.get('/debts/').catch(() => ({ data: [] })),
        API.get('/tontines/my/').catch(() => ({ data: [] })),
      ]);

      setEnvelopes(envelopesRes.data?.envelopes || []);
      setMonthlyIncome(envelopesRes.data?.monthly_income || 0);

      const expList = Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data?.expenses || [];
      setExpenses(expList);

      const incList = Array.isArray(incomesRes.data) ? incomesRes.data : incomesRes.data?.incomes || [];
      setIncomes(incList);

      const goalList = Array.isArray(goalsRes.data) ? goalsRes.data : goalsRes.data?.goals || [];
      setGoals(goalList);

      const debtList = Array.isArray(debtsRes.data) ? debtsRes.data : debtsRes.data?.debts || [];
      setDebts(debtList);

      const tontineList = Array.isArray(tontinesRes.data) ? tontinesRes.data : tontinesRes.data?.tontines || [];
      setTontines(tontineList);

      if (scoreRes?.data) setScore(scoreRes.data);
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const formatFCFA = (value) =>
    new Intl.NumberFormat('fr-FR').format(Math.round(value || 0));

  const formatShort = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return `${Math.round(num)}`;
  };

  // ── CALCULS ──────────────────────────────────────────
  const monthlyExpensesTotal = expenses
    .filter(e => e.date && e.date.startsWith(currentMonthKey))
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const monthlyIncomesTotal = incomes
    .filter(i => i.date && i.date.startsWith(currentMonthKey))
    .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

  const effectiveIncome = monthlyIncomesTotal > 0 ? monthlyIncomesTotal : monthlyIncome;
  const remaining = effectiveIncome - monthlyExpensesTotal;
  const dailyAvailable = daysRemaining > 0 ? remaining / daysRemaining : remaining;

  const recentExpenses = expenses
    .filter(e => e.date && e.date.startsWith(currentMonthKey))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  // ── MESSAGE COACH — une seule phrase, par priorité ──
  const getCoachMessage = () => {
    // P1 : dépassement global du budget
    if (remaining < 0) {
      return {
        icon: '⚠️',
        style: 'bg-red-50 border-red-200 text-red-800',
        text: `Vous avez dépassé votre budget de ${formatFCFA(Math.abs(remaining))} FCFA ce mois.`,
        action: () => onNavigate('envelopes'),
      };
    }

    // P2 : tontine active avec contribution en retard
    const lateTontine = tontines.find(t =>
      t.status === 'active' &&
      (t.my_contribution_status === 'late' || t.my_contribution_status === 'behind' || t.contribution_status === 'late' || t.contribution_status === 'behind')
    );
    if (lateTontine) {
      return {
        icon: '🤝',
        style: 'bg-orange-50 border-orange-200 text-orange-800',
        text: `Votre contribution à la tontine ${lateTontine.name} est en retard.`,
        action: () => onNavigate('tontine-detail', { id: lateTontine.id }),
      };
    }

    // P3 : dette avec paiement mensuel dû (aucun remboursement enregistré ce mois)
    const debtDue = debts.find(d => {
      const isActive = d.is_active !== false;
      const monthlyPayment = parseFloat(d.monthly_payment || 0);
      if (!isActive || monthlyPayment <= 0) return false;
      // Vérifier si un remboursement a été fait ce mois dans les dépenses
      const paidThisMonth = expenses.some(e =>
        e.category === 'remboursement_dette' &&
        e.date && e.date.startsWith(currentMonthKey)
      );
      return !paidThisMonth;
    });
    if (debtDue) {
      return {
        icon: '💳',
        style: 'bg-orange-50 border-orange-200 text-orange-800',
        text: `Pensez au remboursement de ${formatFCFA(debtDue.monthly_payment)} FCFA pour "${debtDue.name}".`,
        action: () => onNavigate('debts'),
      };
    }

    // P4 : enveloppe dépassée
    const overEnvelope = envelopes.find(env => {
      const spent = env.current_spent ?? env.spent ?? 0;
      const budget = env.monthly_budget ?? env.budget ?? 0;
      return budget > 0 && spent > budget;
    });
    if (overEnvelope) {
      const config = ENVELOPE_CONFIG[overEnvelope.envelope_type] || ENVELOPE_CONFIG[overEnvelope.type] || {};
      const overspent = (overEnvelope.current_spent ?? overEnvelope.spent ?? 0) - (overEnvelope.monthly_budget ?? overEnvelope.budget ?? 0);
      return {
        icon: '💡',
        style: 'bg-amber-50 border-amber-200 text-amber-800',
        text: `Attention, vos dépenses ${config.label} dépassent votre budget de ${formatFCFA(overspent)} FCFA.`,
        action: () => onNavigate('envelopes'),
      };
    }

    // P5 : enveloppe presque épuisée (>90%)
    const almostEmpty = envelopes.find(env => {
      const spent = env.current_spent ?? env.spent ?? 0;
      const budget = env.monthly_budget ?? env.budget ?? 0;
      return budget > 0 && spent / budget >= 0.9 && spent <= budget;
    });
    if (almostEmpty) {
      const config = ENVELOPE_CONFIG[almostEmpty.envelope_type] || ENVELOPE_CONFIG[almostEmpty.type] || {};
      const left = (almostEmpty.monthly_budget ?? almostEmpty.budget ?? 0) - (almostEmpty.current_spent ?? almostEmpty.spent ?? 0);
      return {
        icon: '💡',
        style: 'bg-amber-50 border-amber-200 text-amber-800',
        text: `Votre enveloppe ${config.label} est presque épuisée (${formatFCFA(left)} FCFA restants).`,
        action: () => onNavigate('envelopes'),
      };
    }

    // P6 : marge confortable + un projet en cours → suggestion de transfert
    const activeGoal = goals.find(g => !g.is_achieved);
    if (activeGoal && remaining > 0 && daysRemaining <= 7) {
      const suggested = Math.floor(remaining * 0.5 / 1000) * 1000; // 50% arrondi au millier
      if (suggested >= 5000) {
        return {
          icon: '💡',
          style: 'bg-blue-50 border-blue-200 text-blue-800',
          text: `Vous pouvez transférer ${formatFCFA(suggested)} FCFA vers votre projet "${activeGoal.title}".`,
          action: () => onNavigate('goals'),
        };
      }
    }

    // P7 : tout va bien
    return {
      icon: '✅',
      style: 'bg-green-50 border-green-200 text-green-800',
      text: 'Vous êtes dans votre budget. Continuez ainsi.',
      action: null,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  const coach = getCoachMessage();

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* ── SALUTATION ─────────────────────────────── */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">
            Bonjour {getUserName()} 👋
          </h1>
          <p className="text-xs text-gray-400">
            {MONTHS_FR[now.getMonth()]} {now.getFullYear()} · {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
          </p>
        </div>

        {/* ── CARTE SOLDE DU MOIS ────────────────────── */}
        <div className={`rounded-3xl p-6 mb-3 text-white shadow-xl ${
          remaining >= 0
            ? 'bg-gradient-to-br from-green-600 to-emerald-700'
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
          <p className="text-sm opacity-80 mb-1">
            {remaining >= 0 ? 'Il vous reste ce mois' : 'Dépassement ce mois'}
          </p>
          <p className="text-4xl font-bold mb-4">
            {formatFCFA(Math.abs(remaining))} <span className="text-lg font-normal opacity-70">FCFA</span>
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] opacity-75">↓ Revenus</p>
              <p className="text-base font-bold">{formatShort(effectiveIncome)}</p>
            </div>
            <div className="bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] opacity-75">↑ Dépenses</p>
              <p className="text-base font-bold">{formatShort(monthlyExpensesTotal)}</p>
            </div>
          </div>

          {remaining > 0 && daysRemaining > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span>💡</span>
              <span className="opacity-90">
                Disponible : <strong>{formatFCFA(dailyAvailable)} FCFA/jour</strong>
              </span>
            </div>
          )}
        </div>

        {/* ── MESSAGE COACH — une phrase ─────────────── */}
        <div
          onClick={coach.action || undefined}
          className={`border rounded-2xl p-4 mb-4 flex items-start gap-3 ${coach.style} ${coach.action ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
        >
          <span className="text-lg flex-shrink-0">{coach.icon}</span>
          <p className="text-sm font-medium flex-1">{coach.text}</p>
          {coach.action && <span className="text-lg opacity-40">›</span>}
        </div>

        {/* ── SCORE — compact et cliquable ───────────── */}
        {score && (
          <button
            onClick={() => onNavigate('score')}
            className="w-full bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex items-center gap-4 hover:border-green-300 transition-all shadow-sm"
          >
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg viewBox="0 0 56 56" width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r="24" stroke="#e5e7eb" strokeWidth="5" fill="none" />
                <circle
                  cx="28" cy="28" r="24"
                  stroke={score.total_score >= 70 ? '#10b981' : score.total_score >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="5" fill="none" strokeLinecap="round"
                  strokeDasharray={`${(score.total_score / 100) * 151} 151`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-gray-900">{score.total_score}</span>
              </div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">Score Yoonu Dal</p>
              <p className="text-xs text-gray-500">
                {score.total_score >= 85 ? '🏆 Maître Yoonu' :
                 score.total_score >= 70 ? '🌳 Aligné' :
                 score.total_score >= 50 ? '🌿 En chemin' :
                 score.total_score >= 30 ? '🌱 Débutant' : 'Non évalué'}
              </p>
            </div>
            <span className="text-gray-300 text-xl">›</span>
          </button>
        )}

        {/* ── DERNIÈRES DÉPENSES ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-gray-900">Dernières dépenses</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-green-600 font-semibold hover:text-green-700"
            >
              Voir tout ›
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm text-gray-500 mb-3">Aucune dépense ce mois</p>
              <button
                onClick={() => onNavigate('quick-add', { type: 'expense' })}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                ➕ Ajouter ma première dépense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {CATEGORY_ICONS[exp.category] || '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{exp.description}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(exp.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-red-500 flex-shrink-0">
                    -{formatShort(exp.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ENVELOPPES ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Mes enveloppes</h2>
            <button
              onClick={() => onNavigate('envelopes')}
              className="text-xs text-green-600 font-semibold hover:text-green-700"
            >
              Gérer ›
            </button>
          </div>

          <div className="space-y-3">
            {envelopes.map((env) => {
              const config = ENVELOPE_CONFIG[env.envelope_type] || ENVELOPE_CONFIG[env.type] || {};
              const spent = env.current_spent ?? env.spent ?? 0;
              const budget = env.monthly_budget ?? env.budget ?? 0;
              const pct = budget > 0 ? (spent / budget) * 100 : 0;
              const isOver = pct > 100;

              return (
                <div key={env.envelope_type || env.type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{config.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{config.label}</span>
                    </div>
                    <span className={`text-xs font-bold ${isOver ? 'text-red-500' : 'text-gray-500'}`}>
                      {isOver
                        ? `+${formatShort(spent - budget)} dépassé`
                        : `${formatShort(budget - spent)} restant`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : config.color || 'bg-gray-400'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── LIENS SECONDAIRES ──────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('transactions')}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-green-300 transition-all shadow-sm"
          >
            <span className="text-xl">🗓️</span>
            <p className="text-xs font-bold text-gray-800 mt-1">Historique</p>
            <p className="text-[10px] text-gray-400">Tous vos mouvements</p>
          </button>
          <button
            onClick={() => onNavigate('debts')}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-green-300 transition-all shadow-sm"
          >
            <span className="text-xl">💳</span>
            <p className="text-xs font-bold text-gray-800 mt-1">Mes dettes</p>
            <p className="text-[10px] text-gray-400">Suivi et remboursements</p>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
