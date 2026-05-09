import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  Tooltip, Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import ExportButtons from './ExportButtons';

// ==========================================
// DASHBOARD V7
// ✅ Score unifié : Non évalué / Débutant / En chemin / Aligné / Maître Yoonu
// ✅ Message basé sur le score
// ✅ Sélecteur de mois — accès historique
// ✅ Mode lecture pour les mois passés
// ✅ Simulations supprimées
// ==========================================

// ── Sélecteur de mois ───────────────────────────────────────────

const MonthSelector = ({ selectedMonth, onMonthChange }) => {
  const [months, setMonths] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    API.get('/available-months/').then(res => {
      setMonths(res.data.months || []);
    }).catch(() => {});
  }, []);

  const currentMonthData = months.find(m => m.value === selectedMonth);
  const label = currentMonthData?.label || '...';
  const isCurrent = currentMonthData?.is_current ?? true;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
          isCurrent
            ? 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
            : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}
      >
        <span>📅</span>
        <span className="max-w-28 truncate">{label}</span>
        {!isCurrent && (
          <span className="hidden sm:inline text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
            Historique
          </span>
        )}
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-xl border border-gray-200 z-50 min-w-52 max-h-64 overflow-y-auto">
            {months.map(month => (
              <button
                key={month.value}
                onClick={() => { onMonthChange(month.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  month.value === selectedMonth
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{month.label}</span>
                {month.is_current && (
                  <span className="text-xs text-green-600 font-medium">Courant</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Dashboard principal ──────────────────────────────────────────

const DashboardV7 = ({ toast, auth, onNavigate, user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('apercu');
  const [timeFilter, setTimeFilter] = useState('6m');

  // Sélecteur de mois
  const currentMonthValue = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

  const [score, setScore] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const [envelopes, setEnvelopes] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [projectionData, setProjectionData] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [financialHistory, setFinancialHistory] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [insights, setInsights] = useState([]);
  const [trends, setTrends] = useState(null);

  const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long' });

  useEffect(() => {
    if (selectedMonth) loadDashboardData();
  }, [timeFilter, selectedMonth]);

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const monthParam = selectedMonth ? `?month=${selectedMonth}` : '';

      const [scoreRes, metricsRes, envelopesRes, expensesRes, incomesRes, scoreHistoryRes] = await Promise.all([
        API.get('/yoonu-score/').catch(() => null),
        API.get(`/dashboard/metrics/${monthParam}`).catch(() => null),
        API.get(`/meta-envelopes/${monthParam}`).catch(() => null),
        API.get(`/expenses/${monthParam}`).catch(() => null),
        API.get(`/incomes/${monthParam}`).catch(() => null),
        API.get('/score-history/').catch(() => null)
      ]);

      if (scoreRes?.data) setScore(scoreRes.data);

      if (metricsRes?.data) {
        setMetrics(metricsRes.data);
        setIsCurrentMonth(metricsRes.data.is_current_month ?? true);
        setPreviousMetrics({
          monthly_income: (metricsRes.data.monthly_income || 1000000) * 0.95,
          total_expenses: (metricsRes.data.total_expenses || 900000) * 1.08
        });
      }

      if (envelopesRes?.data) {
        const envList = Array.isArray(envelopesRes.data)
          ? envelopesRes.data
          : envelopesRes.data.envelopes || [];
        setEnvelopes(envList);
      }

      if (expensesRes?.data) {
        const expList = Array.isArray(expensesRes.data)
          ? expensesRes.data
          : expensesRes.data.expenses || [];
        setRecentTransactions(expList.slice(0, 5));
        setCategoryBreakdown(generateCategoryBreakdown(expList));
        setInsights(generateInsights(expList, metricsRes?.data, previousMetrics));
      }

      let historyMonths = timeFilter === '3m' ? 3 : timeFilter === '1y' ? 12 : 6;
      let finalScoreHistory = scoreHistoryRes?.data?.history
        ? scoreHistoryRes.data.history.slice(-historyMonths)
        : generateMockScoreHistory(score?.total_score || 0, historyMonths);
      setScoreHistory(finalScoreHistory);

      const finalFinancialHistory = generateMockFinancialHistory(metricsRes?.data, historyMonths);
      setFinancialHistory(finalFinancialHistory);
      setTrends(calculateTrends(finalScoreHistory, finalFinancialHistory));

      // Projection uniquement pour le mois courant
      if (metricsRes?.data?.is_current_month && incomesRes?.data && expensesRes?.data) {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = now.getDate();
        const daysRemaining = daysInMonth - daysElapsed;
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const incList = Array.isArray(incomesRes.data) ? incomesRes.data : incomesRes.data.incomes || [];
        const expList = Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data.expenses || [];

        const monthlyIncome = incList
          .filter(i => i.date?.startsWith(monthStr))
          .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
        const monthlyExpenses = expList
          .filter(e => e.date?.startsWith(monthStr))
          .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        if (daysElapsed > 0) {
          const dailyAvg = monthlyExpenses / daysElapsed;
          setProjectionData({
            projectedBalance: monthlyIncome - dailyAvg * daysInMonth,
            daysRemaining,
            monthlyIncome,
            currentExpenses: monthlyExpenses,
          });
        }
      } else {
        setProjectionData(null);
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Utilitaires ────────────────────────────────────────────────

  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) =>
    new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // ── Score Color — niveaux unifiés ──────────────────────────────

  const getScoreColor = (scoreValue) => {
    if (!scoreValue || scoreValue === 0) return { text: 'text-gray-500', ring: 'stroke-gray-300', label: 'Non évalué ⬜', color: '#9CA3AF' };
    if (scoreValue >= 80) return { text: 'text-green-600', ring: 'stroke-green-500', label: 'Maître Yoonu 🏆', color: '#10B981' };
    if (scoreValue >= 60) return { text: 'text-blue-600', ring: 'stroke-blue-500', label: 'Aligné 🌳', color: '#3B82F6' };
    if (scoreValue >= 40) return { text: 'text-amber-600', ring: 'stroke-amber-500', label: 'En chemin 🌿', color: '#F59E0B' };
    return { text: 'text-red-600', ring: 'stroke-red-500', label: 'Débutant 🌱', color: '#EF4444' };
  };

  // ── Message basé sur le score ──────────────────────────────────

  const getIntelligentMessage = () => {
    const currentScore = score?.total_score || 0;
    const totalIncome = metrics?.monthly_income || 0;
    const totalExpenses = metrics?.total_expenses || 0;
    const balance = totalIncome - totalExpenses;

    if (!isCurrentMonth) {
      return {
        icon: '📚',
        text: `Bilan ${metrics?.month_label || 'du mois'} : solde ${balance >= 0 ? '+' : ''}${formatCurrency(balance)} FCFA. Score : ${currentScore}/100.`,
      };
    }

    if (currentScore === 0) return { icon: '🎯', text: 'Enregistre tes dépenses et définis tes valeurs pour activer ton Score Yoonu Dal.' };
    if (currentScore >= 80) return { icon: '🏆', text: `Maître Yoonu ! Tes finances sont parfaitement alignées avec tes valeurs. Score : ${currentScore}/100.` };
    if (currentScore >= 60) return { icon: '🌳', text: `Aligné ! Tes dépenses reflètent bien tes valeurs. Continue sur cette lancée. Score : ${currentScore}/100.` };
    if (currentScore >= 40) {
      const tip = balance < 0
        ? `Tu as un déficit de ${formatCurrency(Math.abs(balance))} à combler.`
        : `Tu épargnes ${formatCurrency(balance)} ce mois.`;
      return { icon: '🌿', text: `En chemin. ${tip} Score : ${currentScore}/100.` };
    }
    return { icon: '🌱', text: `Débutant. Commence par enregistrer tes dépenses régulièrement et définis tes valeurs. Score : ${currentScore}/100.` };
  };

  // ── Générateurs ────────────────────────────────────────────────

  const ComparisonBadge = ({ current, previous, inverse = false }) => {
    const change = calculatePercentageChange(current, previous);
    const isPositive = inverse ? change < 0 : change > 0;
    const isNegative = inverse ? change > 0 : change < 0;
    if (Math.abs(change) < 1) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isPositive ? 'bg-green-50 text-green-700 border border-green-200' :
        isNegative ? 'bg-red-50 text-red-700 border border-red-200' :
        'bg-gray-50 text-gray-700 border border-gray-200'
      }`}>
        {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const generateCategoryBreakdown = (expenses) => {
    const categories = {};
    let total = 0;
    expenses.forEach(exp => {
      const cat = exp.category || 'Autres';
      const amount = parseFloat(exp.amount || 0);
      categories[cat] = (categories[cat] || 0) + amount;
      total += amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? Math.round((value / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const generateInsights = (expenses, metrics, previousMetrics) => {
    const insights = [];
    const totalExpenses = metrics?.total_expenses || 0;
    const monthlyIncome = metrics?.monthly_income || 0;
    const prevExpenses = previousMetrics?.total_expenses || totalExpenses;
    const expenseChange = calculatePercentageChange(totalExpenses, prevExpenses);

    if (Math.abs(expenseChange) > 5) {
      insights.push({
        icon: expenseChange > 0 ? '⚠️' : '✅',
        text: `Dépenses ${expenseChange > 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(expenseChange).toFixed(1)}% vs mois dernier`
      });
    }
    if (expenses.length > 0) {
      const categories = {};
      expenses.forEach(exp => {
        const cat = exp.category || 'Autres';
        categories[cat] = (categories[cat] || 0) + parseFloat(exp.amount || 0);
      });
      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
      if (topCategory) {
        insights.push({
          icon: '📊',
          text: `${topCategory[0]} représente ${Math.round((topCategory[1] / totalExpenses) * 100)}% des dépenses (${formatCurrency(topCategory[1])})`
        });
      }
    }
    if (totalExpenses > monthlyIncome) {
      insights.push({ icon: '⚠️', text: `Déficit de ${formatCurrency(totalExpenses - monthlyIncome)} ce mois` });
    } else {
      insights.push({ icon: '✨', text: `Épargne de ${formatCurrency(monthlyIncome - totalExpenses)} ce mois` });
    }
    return insights.slice(0, 4);
  };

  const generateMockScoreHistory = (currentScore, months) => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const baseScore = Math.max(0, currentScore - (months * 2));
    return Array.from({ length: months }, (_, i) => {
      const monthIndex = (now.getMonth() - months + i + 1 + 12) % 12;
      return { month: monthNames[monthIndex], score: Math.min(100, Math.max(0, baseScore + (i * 2) + Math.random() * 5)) };
    });
  };

  const generateMockFinancialHistory = (currentMetrics, months) => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const baseIncome = currentMetrics?.monthly_income || 1000000;
    const baseExpenses = currentMetrics?.total_expenses || 900000;
    return Array.from({ length: months }, (_, i) => {
      const monthIndex = (now.getMonth() - months + i + 1 + 12) % 12;
      return {
        month: monthNames[monthIndex],
        revenus: baseIncome + (Math.random() * 200000 - 100000),
        depenses: baseExpenses + (Math.random() * 200000 - 100000)
      };
    });
  };

  const calculateTrends = (scoreHistory, financialHistory) => {
    if (!scoreHistory.length || !financialHistory.length) return null;
    const sortedByScore = [...scoreHistory].sort((a, b) => b.score - a.score);
    const withBalance = financialHistory.map(m => ({ ...m, balance: m.revenus - m.depenses }));
    const sortedByBalance = [...withBalance].sort((a, b) => b.balance - a.balance);
    const avgBalance = withBalance.reduce((sum, m) => sum + m.balance, 0) / withBalance.length;
    const scoreGrowth = scoreHistory.length > 1
      ? (scoreHistory[scoreHistory.length - 1].score - scoreHistory[0].score) / scoreHistory.length
      : 0;
    return {
      bestScore: { month: sortedByScore[0].month, value: Math.round(sortedByScore[0].score) },
      worstScore: { month: sortedByScore[sortedByScore.length - 1].month, value: Math.round(sortedByScore[sortedByScore.length - 1].score) },
      bestBalance: { month: sortedByBalance[0].month, value: sortedByBalance[0].balance },
      worstBalance: { month: sortedByBalance[sortedByBalance.length - 1].month, value: sortedByBalance[sortedByBalance.length - 1].balance },
      avgBalance,
      scoreGrowth: scoreGrowth.toFixed(1)
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const displayScore = score?.total_score || 0;
  const scoreColor = getScoreColor(displayScore);
  const intelligentMessage = getIntelligentMessage();
  const totalIncome = metrics?.monthly_income || 0;
  const totalExpenses = metrics?.total_expenses || 0;
  const balance = totalIncome - totalExpenses;
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                🤝🏿 Dalal jamm {user?.user?.first_name || user?.user?.username || 'utilisateur'}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
          </div>

          {/* Bannière mode historique */}
          {!isCurrentMonth && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
              <span>📚</span>
              <p className="text-sm text-amber-800 font-medium">
                Mode historique — Consultation uniquement
              </p>
              <button
                onClick={() => handleMonthChange(currentMonthValue)}
                className="ml-auto text-xs text-amber-700 font-semibold underline hover:no-underline whitespace-nowrap"
              >
                Revenir au mois courant →
              </button>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="mb-6 flex justify-end">
          <ExportButtons user={user} onNavigate={onNavigate} toast={toast} selectedMonth={selectedMonth} />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1">
            {[
              { id: 'apercu', label: '👀 Aperçu', desc: 'Vue d\'action' },
              { id: 'analyse', label: '📊 Analyse', desc: 'Répartition' },
              { id: 'historique', label: '📈 Historique', desc: 'Tendances' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 lg:px-6 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}>
                <span className="block">{tab.label}</span>
                <span className="text-xs text-gray-500 hidden lg:block">{tab.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── APERÇU ── */}
        {activeTab === 'apercu' && (
          <div className="space-y-6">

            {/* Hero */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

                {/* Score cercle */}
                <div className="lg:col-span-3 flex flex-col items-center lg:items-start">
                  <div className="relative mb-2">
                    <svg className="w-24 h-24 lg:w-28 lg:h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" className="stroke-gray-100" strokeWidth="5" fill="none" />
                      <circle cx="56" cy="56" r="48" className={scoreColor.ring} strokeWidth="5" fill="none"
                        strokeDasharray={`${displayScore * 3.01} 301`} strokeLinecap="round"
                        style={{ transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`text-4xl font-bold ${scoreColor.text}`}>{displayScore}</div>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold ${scoreColor.text}`}>{scoreColor.label}</p>
                  {score?.score_change !== undefined && score?.score_change !== 0 && (
                    <p className={`text-xs mt-1 ${score.score_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {score.score_change > 0 ? '▲' : '▼'} {Math.abs(score.score_change)} pts vs mois dernier
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="lg:col-span-6">
                  <div className="flex items-start gap-2 mb-4">
                    <span className="text-xl flex-shrink-0">{intelligentMessage.icon}</span>
                    <p className="text-sm lg:text-base text-gray-900 leading-relaxed font-medium">
                      {intelligentMessage.text}
                    </p>
                  </div>

                  {/* Projection fin de mois — mois courant seulement */}
                  {isCurrentMonth && projectionData && (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                      projectionData.projectedBalance >= 0
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <span>{projectionData.projectedBalance >= 0 ? '✅' : '⚠️'}</span>
                      <span>
                        Projection fin {currentMonthName} : {projectionData.projectedBalance >= 0 ? '+' : ''}{formatCurrency(projectionData.projectedBalance)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Accès score */}
                <div className="lg:col-span-3 flex justify-center lg:justify-end">
                  <button onClick={() => onNavigate('score')}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-md transition-all transform hover:scale-105 active:scale-95">
                    Voir mon score →
                  </button>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Revenus', value: totalIncome, color: 'text-gray-900', prev: previousMetrics?.monthly_income, inverse: false },
                { label: 'Dépenses', value: totalExpenses, color: 'text-gray-900', prev: previousMetrics?.total_expenses, inverse: true },
                { label: 'Solde', value: balance, color: balance < 0 ? 'text-red-600' : 'text-green-600', prev: null, inverse: false }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{kpi.label}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-2xl lg:text-3xl font-bold ${kpi.color}`}>
                      {kpi.label === 'Solde' && kpi.value >= 0 ? '+' : ''}{formatCurrency(kpi.value)}
                    </p>
                    {kpi.prev && previousMetrics && (
                      <ComparisonBadge current={kpi.value} previous={kpi.prev} inverse={kpi.inverse} />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{formatCurrencyFull(kpi.value)}</p>
                </div>
              ))}
            </div>

            {/* Enveloppes + Transactions + Accès rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">

                {envelopes.length > 0 && (
                  <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-200">
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-5">
                      Pression budgétaire
                      {!isCurrentMonth && (
                        <span className="text-xs text-amber-600 font-normal ml-2">· {metrics?.month_label}</span>
                      )}
                    </h3>
                    <div className="space-y-4">
                      {envelopes.slice(0, 4).map(envelope => {
                        const pct = envelope.monthly_budget > 0
                          ? (envelope.current_spent / envelope.monthly_budget) * 100
                          : 0;
                        const isOver = pct > 100;
                        return (
                          <div key={envelope.id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {envelope.envelope_type || envelope.category}
                              </span>
                              <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                                {Math.round(pct)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'
                              }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            {isOver && (
                              <p className="text-xs text-gray-500 mt-1">
                                Dépassement : +{formatCurrency(envelope.current_spent - envelope.monthly_budget)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {envelopes.length > 4 && (
                      <button onClick={() => onNavigate('envelopes')}
                        className="text-xs text-green-600 hover:text-green-700 font-semibold mt-4">
                        Voir toutes les enveloppes →
                      </button>
                    )}
                  </div>
                )}

                {insights.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{insights[0].icon}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Insight du mois</h4>
                        <p className="text-sm text-gray-700">{insights[0].text}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Transactions</h3>
                    <button onClick={() => onNavigate('expenses')} className="text-xs text-gray-500 hover:text-gray-700">Tout</button>
                  </div>
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-2.5">
                      {recentTransactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{t.description}</p>
                              <span className="inline-block text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded mt-0.5">{t.category}</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-red-600 ml-2">-{formatCurrency(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">Aucune transaction ce mois</p>
                  )}
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Accès rapides</h3>
                  <div className="space-y-1.5">
                    {[
                      { page: 'envelopes', icon: '📁', label: 'Budgets' },
                      { page: 'tontines', icon: '🦁', label: 'Tontines' },
                      { page: 'score', icon: '🎯', label: 'Score' },
                      { page: 'alerts', icon: '🔔', label: 'Alertes' }
                    ].map(item => (
                      <button key={item.page} onClick={() => onNavigate(item.page)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-xs font-medium text-gray-900">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYSE ── */}
        {activeTab === 'analyse' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Répartition par catégorie
                {!isCurrentMonth && <span className="text-sm text-amber-600 font-normal ml-2">· {metrics?.month_label}</span>}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex items-center justify-center">
                  {categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={categoryBreakdown} cx="50%" cy="50%" labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={100} dataKey="value">
                          {categoryBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrencyFull(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-500">Aucune donnée disponible</p>}
                </div>
                <div className="space-y-3">
                  {categoryBreakdown.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{cat.percentage}%</p>
                        <p className="text-xs text-gray-500">{formatCurrency(cat.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Insights</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                    <span className="text-2xl flex-shrink-0">{insight.icon}</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORIQUE ── */}
        {activeTab === 'historique' && (
          <div className="space-y-6">
            <div className="flex gap-2 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              {[{ id: '3m', label: '3 mois' }, { id: '6m', label: '6 mois' }, { id: '1y', label: '1 an' }].map(filter => (
                <button key={filter.id} onClick={() => setTimeFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === filter.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Évolution Score Yoonu Dal</h3>
                {trends && (
                  <div className="text-xs text-gray-600">
                    Meilleur: {trends.bestScore.month} ({trends.bestScore.value}) | Pire: {trends.worstScore.month} ({trends.worstScore.value})
                  </div>
                )}
              </div>
              {scoreHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke={scoreColor.color} strokeWidth={3}
                      dot={{ r: 6, fill: scoreColor.color }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-500 py-12">Pas assez de données historiques</p>}
            </div>

            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Flux financiers</h3>
                {trends && <div className="text-xs text-gray-600">Moyenne épargne : {formatCurrency(trends.avgBalance)}/mois</div>}
              </div>
              {financialHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrencyFull(value)} />
                    <Legend />
                    <Bar dataKey="revenus" fill="#10B981" name="Revenus" />
                    <Bar dataKey="depenses" fill="#EF4444" name="Dépenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-500 py-12">Pas assez de données historiques</p>}
            </div>

            {trends && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 lg:p-8 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Tendances détectées</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { label: 'Progression score', value: `${trends.scoreGrowth > 0 ? '+' : ''}${trends.scoreGrowth} pts/mois`, color: 'text-gray-900' },
                    { label: 'Meilleur mois', value: `${trends.bestBalance.month} : +${formatCurrency(trends.bestBalance.value)}`, color: 'text-green-600' },
                    { label: 'Pire mois', value: `${trends.worstBalance.month} : ${formatCurrency(trends.worstBalance.value)}`, color: 'text-red-600' },
                    { label: 'Prédiction mois prochain', value: `Score : ${Math.round(displayScore + parseFloat(trends.scoreGrowth))}-${Math.round(displayScore + parseFloat(trends.scoreGrowth) + 4)}`, color: 'text-gray-900' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white bg-opacity-60 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB — uniquement mois courant */}
      {isCurrentMonth && (
        <button onClick={() => onNavigate('expenses')}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-40">
          <span className="text-2xl text-white">+</span>
        </button>
      )}

      <style jsx>{`
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default DashboardV7;
