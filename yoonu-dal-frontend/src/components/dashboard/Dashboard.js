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

const DashboardV7 = ({ toast, auth, onNavigate, user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('apercu');
  const [timeFilter, setTimeFilter] = useState('6m');

  // Sélecteur de mois
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);
  const [currentMonthName, setCurrentMonthName] = useState(
    new Date().toLocaleDateString('fr-FR', { month: 'long' })
  );

  const [score, setScore] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const [envelopes, setEnvelopes] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationPct, setSimulationPct] = useState(10);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [simulatedScore, setSimulatedScore] = useState(null);
  const [projectionData, setProjectionData] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [financialHistory, setFinancialHistory] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [insights, setInsights] = useState([]);
  const [trends, setTrends] = useState(null);

  useEffect(() => { loadAvailableMonths(); }, []);

  useEffect(() => {
    loadDashboardData();
    setActiveSimulation(null);
    setSimulatedScore(null);
  }, [selectedMonth, timeFilter]);

  const loadAvailableMonths = async () => {
    try {
      const res = await API.get('/available-months/').catch(() => null);
      if (res?.data?.months) setAvailableMonths(res.data.months);
    } catch (e) { console.error(e); }
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
        const isCurrent = metricsRes.data.is_current_month !== false;
        setIsCurrentMonth(isCurrent);
        setCurrentMonthName(metricsRes.data.month_label || new Date().toLocaleDateString('fr-FR', { month: 'long' }));
        setPreviousMetrics({
          monthly_income: (metricsRes.data.monthly_income || 1000000) * 0.95,
          total_expenses: (metricsRes.data.total_expenses || 900000) * 1.08
        });
      }

      if (envelopesRes?.data) {
        const envList = Array.isArray(envelopesRes.data) ? envelopesRes.data : envelopesRes.data.envelopes || [];
        setEnvelopes(envList);
      }

      if (expensesRes?.data) {
        const expList = Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data.expenses || [];
        setRecentTransactions(expList.slice(0, 5));
        setCategoryBreakdown(generateCategoryBreakdown(expList));
        setInsights(generateInsights(expList, metricsRes?.data, previousMetrics));
      }

      let historyMonths = timeFilter === '3m' ? 3 : timeFilter === '1y' ? 12 : 6;
      const finalScoreHistory = scoreHistoryRes?.data?.history
        ? scoreHistoryRes.data.history.slice(-historyMonths)
        : generateMockScoreHistory(score?.total_score || 0, historyMonths);
      setScoreHistory(finalScoreHistory);

      const finalFinancialHistory = generateMockFinancialHistory(metricsRes?.data, historyMonths);
      setFinancialHistory(finalFinancialHistory);
      setTrends(calculateTrends(finalScoreHistory, finalFinancialHistory));

      // Projection uniquement mois courant
      const isCurrent = metricsRes?.data?.is_current_month !== false;
      if (isCurrent && incomesRes?.data && expensesRes?.data) {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = now.getDate();
        const daysRemaining = daysInMonth - daysElapsed;
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const incList = Array.isArray(incomesRes.data) ? incomesRes.data : incomesRes.data.incomes || [];
        const expList = Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data.expenses || [];
        const monthlyIncome = incList.filter(i => i.date?.startsWith(monthStr)).reduce((s, i) => s + parseFloat(i.amount || 0), 0);
        const monthlyExpenses = expList.filter(e => e.date?.startsWith(monthStr)).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        if (daysElapsed > 0) {
          const dailyAvg = monthlyExpenses / daysElapsed;
          setProjectionData({ dailyAvg, projectedBalance: monthlyIncome - dailyAvg * daysInMonth, daysRemaining, daysElapsed, monthlyIncome, currentExpenses: monthlyExpenses, daysInMonth, projectedTotal: dailyAvg * daysInMonth });
        }
      } else {
        setProjectionData(null);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const formatCurrency = (v) => { const n = Math.abs(v || 0); return n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n/1000)}k` : n.toString(); };
  const formatCurrencyFull = (v) => new Intl.NumberFormat('fr-FR').format(v || 0) + ' FCFA';
  const pctChange = (c, p) => (!p || p === 0) ? 0 : ((c - p) / p) * 100;

  const getScoreColor = (s) => {
    if (!s || s === 0) return { text: 'text-gray-500', ring: 'stroke-gray-300', label: 'Non évalué', color: '#9CA3AF' };
    if (s >= 80) return { text: 'text-green-600', ring: 'stroke-green-500', label: 'Maître Yoonu 🏆', color: '#10B981' };
    if (s >= 60) return { text: 'text-blue-600', ring: 'stroke-blue-500', label: 'Aligné 🌳', color: '#3B82F6' };
    if (s >= 40) return { text: 'text-amber-600', ring: 'stroke-amber-500', label: 'En chemin 🌿', color: '#F59E0B' };
    return { text: 'text-red-600', ring: 'stroke-red-500', label: 'Débutant 🌱', color: '#EF4444' };
  };

  const getIntelligentMessage = (isSimulation = false, simResult = null) => {
    const currentScore = score?.total_score || 0;
    const balance = (metrics?.monthly_income || 0) - (metrics?.total_expenses || 0);
    if (!isCurrentMonth) {
      return { icon: '📅', text: `${currentMonthName} — ${balance >= 0 ? `Épargne de ${formatCurrency(balance)}` : `Déficit de ${formatCurrency(Math.abs(balance))}`}. Score : ${currentScore}/100.`, type: 'history' };
    }
    if (isSimulation && simResult) {
      return { icon: '🔮', text: `Économie de ${formatCurrency(simResult.economyAmount)}. Solde projeté fin ${currentMonthName} : ${simResult.newBalance >= 0 ? '+' : ''}${formatCurrency(simResult.newBalance)}.`, type: 'simulation' };
    }
    if (currentScore === 0) return { icon: '🎯', text: 'Enregistre tes dépenses et définis tes valeurs pour activer ton Score Yoonu Dal.', type: 'neutral' };
    if (currentScore >= 80) return { icon: '🏆', text: `Maître Yoonu ! Tes finances sont parfaitement alignées. Score : ${currentScore}/100.`, type: 'excellent' };
    if (currentScore >= 60) return { icon: '🌳', text: `Aligné ! Tes dépenses reflètent bien tes valeurs. Score : ${currentScore}/100.`, type: 'good' };
    if (currentScore >= 40) return { icon: '🌿', text: `En chemin. ${balance < 0 ? `Déficit de ${formatCurrency(Math.abs(balance))} à combler.` : `Tu épargnes ${formatCurrency(balance)} ce mois.`} Score : ${currentScore}/100.`, type: 'warning' };
    return { icon: '🌱', text: `Débutant. Enregistre tes dépenses régulièrement. Score : ${currentScore}/100.`, type: 'danger' };
  };

  const calcScenario = (pct) => {
    if (!projectionData) return null;
    const { daysRemaining, monthlyIncome, currentExpenses, dailyAvg, daysInMonth } = projectionData;
    const futureExp = dailyAvg * (1 - pct / 100) * daysRemaining;
    const newTotal = currentExpenses + futureExp;
    const newBalance = monthlyIncome - newTotal;
    const origBalance = monthlyIncome - dailyAvg * daysInMonth;
    const economyAmount = newBalance - origBalance;
    const currentScore = score?.total_score || 0;
    let boost = 0;
    if (newBalance > 0 && monthlyIncome > 0) {
      const sr = (newBalance / monthlyIncome) * 100;
      boost = sr >= 20 ? 8 : sr >= 10 ? 5 : sr >= 5 ? 3 : 1;
    }
    return { reductionPct: pct, newBalance, originalBalance: origBalance, economyAmount, newProjectedTotal: newTotal, newScore: Math.min(100, currentScore + boost) };
  };

  const quickScenarios = [10, 20, 30].map(p => calcScenario(p)).filter(Boolean);

  const handleScenarioClick = (s) => { setActiveSimulation(s); setSimulatedScore(s.newScore); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const applySimulation = () => { if (!activeSimulation) return; toast?.showSuccess(`🎯 Objectif : -${activeSimulation.reductionPct}% de dépenses`); setActiveSimulation(null); setSimulatedScore(null); setTimeout(() => onNavigate('envelopes'), 1000); };
  const cancelSimulation = () => { setActiveSimulation(null); setSimulatedScore(null); };

  const ComparisonBadge = ({ current, previous, inverse = false }) => {
    const change = pctChange(current, previous);
    if (Math.abs(change) < 1) return null;
    const isPos = inverse ? change < 0 : change > 0;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isPos ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
        {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const generateCategoryBreakdown = (expenses) => {
    const cats = {}; let total = 0;
    expenses.forEach(e => { const c = e.category || 'Autres'; cats[c] = (cats[c] || 0) + parseFloat(e.amount || 0); total += parseFloat(e.amount || 0); });
    return Object.entries(cats).map(([name, value]) => ({ name, value, percentage: total > 0 ? Math.round((value / total) * 100) : 0 })).sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const generateInsights = (expenses, metrics, previousMetrics) => {
    const insights = [];
    const totalExp = metrics?.total_expenses || 0;
    const income = metrics?.monthly_income || 0;
    const prevExp = previousMetrics?.total_expenses || totalExp;
    const change = pctChange(totalExp, prevExp);
    if (Math.abs(change) > 5) insights.push({ icon: change > 0 ? '⚠️' : '✅', text: `Dépenses ${change > 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(change).toFixed(1)}% vs mois précédent` });
    if (expenses.length > 0) {
      const cats = {};
      expenses.forEach(e => { const c = e.category || 'Autres'; cats[c] = (cats[c] || 0) + parseFloat(e.amount || 0); });
      const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
      if (top) insights.push({ icon: '📊', text: `${top[0]} = ${Math.round((top[1] / totalExp) * 100)}% des dépenses (${formatCurrency(top[1])})` });
    }
    insights.push(totalExp > income
      ? { icon: '⚠️', text: `Déficit de ${formatCurrency(totalExp - income)}` }
      : { icon: '✨', text: `Épargne de ${formatCurrency(income - totalExp)}` });
    return insights.slice(0, 4);
  };

  const generateMockScoreHistory = (currentScore, months) => {
    const names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date(); const base = Math.max(0, currentScore - months * 2);
    return Array.from({ length: months }, (_, i) => ({ month: names[(now.getMonth() - months + i + 1 + 12) % 12], score: Math.min(100, Math.max(0, base + i * 2 + Math.random() * 5)) }));
  };

  const generateMockFinancialHistory = (currentMetrics, months) => {
    const names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date(); const bInc = currentMetrics?.monthly_income || 1000000; const bExp = currentMetrics?.total_expenses || 900000;
    return Array.from({ length: months }, (_, i) => ({ month: names[(now.getMonth() - months + i + 1 + 12) % 12], revenus: bInc + Math.random() * 200000 - 100000, depenses: bExp + Math.random() * 200000 - 100000 }));
  };

  const calculateTrends = (sh, fh) => {
    if (!sh.length || !fh.length) return null;
    const ss = [...sh].sort((a, b) => b.score - a.score);
    const wb = fh.map(m => ({ ...m, balance: m.revenus - m.depenses }));
    const sb = [...wb].sort((a, b) => b.balance - a.balance);
    return { bestScore: { month: ss[0].month, value: Math.round(ss[0].score) }, worstScore: { month: ss[ss.length-1].month, value: Math.round(ss[ss.length-1].score) }, bestBalance: { month: sb[0].month, value: sb[0].balance }, worstBalance: { month: sb[sb.length-1].month, value: sb[sb.length-1].balance }, avgBalance: wb.reduce((s, m) => s + m.balance, 0) / wb.length, scoreGrowth: sh.length > 1 ? ((sh[sh.length-1].score - sh[0].score) / sh.length).toFixed(1) : '0' };
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600">Chargement...</p></div>
    </div>
  );

  const displayScore = simulatedScore || score?.total_score || 0;
  const scoreColor = getScoreColor(displayScore);
  const intelligentMessage = getIntelligentMessage(!!activeSimulation, activeSimulation);
  const totalIncome = metrics?.monthly_income || 0;
  const totalExpenses = metrics?.total_expenses || 0;
  const balance = totalIncome - totalExpenses;
  const simulatedExpenses = activeSimulation ? activeSimulation.newProjectedTotal : totalExpenses;
  const simulatedBalance = activeSimulation ? activeSimulation.newBalance : balance;
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Bandeau simulation */}
      {activeSimulation && (
        <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm animate-slideDown" style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.92),rgba(4,120,87,0.92))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔮</span>
              <div>
                <p className="font-semibold text-white text-sm">Simulation : -{activeSimulation.reductionPct}% de dépenses</p>
                <p className="text-xs text-green-50">Économie {formatCurrency(activeSimulation.economyAmount)} · Solde fin {currentMonthName} : {activeSimulation.newBalance >= 0 ? '+' : ''}{formatCurrency(activeSimulation.newBalance)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={applySimulation} className="bg-white text-green-700 px-4 py-1.5 rounded-lg font-semibold text-xs shadow-sm hover:bg-green-50 transition-all">Appliquer</button>
              <button onClick={cancelSimulation} className="bg-green-700 bg-opacity-25 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-opacity-35 transition-all">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Bandeau mode historique */}
      {!isCurrentMonth && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white py-2 px-4 text-center text-sm font-medium animate-slideDown">
          📅 Mode historique — <span className="font-bold">{currentMonthName}</span> · Lecture seule
          <button onClick={() => setSelectedMonth('')} className="ml-4 underline text-gray-300 hover:text-white text-xs">Retour au mois courant →</button>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 transition-all duration-300 ${(activeSimulation || !isCurrentMonth) ? 'pt-20' : ''}`}>

        {/* Header + sélecteur de mois */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              🤝🏿 Dalal jamm {user?.user?.first_name || user?.user?.username || 'utilisateur'}
            </h1>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>

          {/* ✅ Sélecteur de mois */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isCurrentMonth && (
              <button onClick={() => setSelectedMonth('')}
                className="text-xs text-green-600 font-semibold border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-all whitespace-nowrap">
                ← Mois courant
              </button>
            )}
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className={`text-sm border rounded-xl px-3 py-2 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                !isCurrentMonth ? 'border-gray-400 bg-gray-100 text-gray-700' : 'border-gray-200 bg-white text-gray-700 hover:border-green-400'
              }`}>
              {availableMonths.length > 0
                ? availableMonths.map(m => (
                    <option key={m.value} value={m.is_current ? '' : m.value}>
                      {m.is_current ? `📅 ${m.label} (courant)` : m.label}
                    </option>
                  ))
                : <option value="">📅 {currentMonthName} (courant)</option>
              }
            </select>
          </div>
        </div>

        {/* Export — mois courant uniquement */}
        {isCurrentMonth && (
          <div className="mb-6 flex justify-end">
            <ExportButtons user={user} onNavigate={onNavigate} toast={toast} />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1">
            {[{ id: 'apercu', label: '👀 Aperçu' }, { id: 'analyse', label: '📊 Analyse' }, { id: 'historique', label: '📈 Historique' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 lg:px-6 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== APERÇU ===== */}
        {activeTab === 'apercu' && (
          <div className="space-y-6">

            {/* Avertissement revenu estimé */}
            {metrics?.is_estimated && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
                <span>⚠️</span>
                <span>Budgets basés sur ton revenu estimé — saisis tes revenus de {currentMonthName} pour plus de précision.</span>
              </div>
            )}

            {/* Hero */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Score */}
                <div className="lg:col-span-3 flex flex-col items-center lg:items-start">
                  <div className="relative mb-2">
                    <svg className="w-24 h-24 lg:w-28 lg:h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" className="stroke-gray-100" strokeWidth="5" fill="none" />
                      <circle cx="56" cy="56" r="48" className={scoreColor.ring} strokeWidth="5" fill="none"
                        strokeDasharray={`${displayScore * 3.01} 301`} strokeLinecap="round"
                        style={{ transition: 'all 500ms cubic-bezier(0.4,0,0.2,1)', filter: simulatedScore ? 'drop-shadow(0 0 10px rgba(16,185,129,0.4))' : 'none' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`text-4xl font-bold ${scoreColor.text}`}>{displayScore}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center lg:items-start gap-1">
                    {simulatedScore
                      ? <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700">🔮 Simulé</span>
                      : <p className={`text-xs font-semibold ${scoreColor.text}`}>{scoreColor.label}</p>}
                    {score?.score_change !== undefined && score?.score_change !== 0 && !simulatedScore && (
                      <p className={`text-xs ${score.score_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {score.score_change > 0 ? '▲' : '▼'} {Math.abs(score.score_change)} pts
                      </p>
                    )}
                  </div>
                </div>

                {/* Message + simulations */}
                <div className="lg:col-span-6">
                  <div className="flex items-start gap-2 mb-4">
                    <span className="text-xl flex-shrink-0">{intelligentMessage.icon}</span>
                    <p className="text-sm lg:text-base text-gray-900 leading-relaxed font-medium">{intelligentMessage.text}</p>
                  </div>

                  {/* Simulations mois courant */}
                  {isCurrentMonth && projectionData && !activeSimulation && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium">🔮 Simuler une réduction :</p>
                      <div className="flex flex-wrap gap-2">
                        {quickScenarios.map((s, idx) => (
                          <button key={idx} onClick={() => handleScenarioClick(s)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${
                              s.newBalance > balance ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                            }`}>
                            <span>-{s.reductionPct}%</span>
                            <span className="text-gray-400">→</span>
                            <span>{s.newBalance >= 0 ? '+' : ''}{formatCurrency(s.newBalance)}</span>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowSimulation(true)} className="text-xs text-green-600 hover:text-green-700 font-semibold hover:underline">
                        Simuler un % personnalisé →
                      </button>
                    </div>
                  )}

                  {/* Projection */}
                  {isCurrentMonth && projectionData && !activeSimulation && (
                    <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                      projectionData.projectedBalance >= 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <span>{projectionData.projectedBalance >= 0 ? '✅' : '⚠️'}</span>
                      <span>Projection fin {currentMonthName} : {projectionData.projectedBalance >= 0 ? '+' : ''}{formatCurrency(projectionData.projectedBalance)}</span>
                    </div>
                  )}

                  {/* Mode historique */}
                  {!isCurrentMonth && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs">
                      <span>📅</span>
                      <span>Simulations disponibles uniquement pour le mois courant</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="lg:col-span-3 flex justify-center lg:justify-end">
                  {isCurrentMonth
                    ? <button onClick={() => setShowSimulation(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-md transition-all transform hover:scale-105">
                        {activeSimulation ? 'Modifier' : '🔮 Simuler'}
                      </button>
                    : <button onClick={() => onNavigate('expenses')} className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-md transition-all">
                        📝 Dépenses
                      </button>
                  }
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Revenus</p>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
                  {previousMetrics && !activeSimulation && <ComparisonBadge current={totalIncome} previous={previousMetrics.monthly_income} />}
                </div>
                <p className="text-xs text-gray-400">{formatCurrencyFull(totalIncome)}</p>
              </div>

              <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200 relative">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Dépenses</p>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-2xl lg:text-3xl font-bold transition-all duration-500 ${activeSimulation ? 'text-green-600' : simulatedExpenses > totalIncome ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(simulatedExpenses)}
                  </p>
                  {previousMetrics && !activeSimulation && <ComparisonBadge current={totalExpenses} previous={previousMetrics.total_expenses} inverse={true} />}
                </div>
                <p className="text-xs text-gray-400">{formatCurrencyFull(simulatedExpenses)}</p>
                {activeSimulation && <span className="absolute top-2 right-2 text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">🔮</span>}
              </div>

              <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200 relative">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solde</p>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-2xl lg:text-3xl font-bold transition-all duration-500 ${simulatedBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {simulatedBalance >= 0 ? '+' : ''}{formatCurrency(simulatedBalance)}
                  </p>
                  {previousMetrics && !activeSimulation && <ComparisonBadge current={balance} previous={previousMetrics.monthly_income - previousMetrics.total_expenses} />}
                </div>
                <p className="text-xs text-gray-400">{formatCurrencyFull(simulatedBalance)}</p>
                {activeSimulation && <span className="absolute top-2 right-2 text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">🔮</span>}
              </div>
            </div>

            {/* Enveloppes + insights + transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {envelopes.length > 0 && (
                  <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-200">
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-5">
                      Pression budgétaire
                      {!isCurrentMonth && <span className="ml-2 text-xs text-gray-400 font-normal">({currentMonthName})</span>}
                    </h3>
                    <div className="space-y-4">
                      {envelopes.sort((a, b) => ['essentiel','plaisir','projet','libération'].indexOf((a.envelope_type||'').toLowerCase()) - ['essentiel','plaisir','projet','libération'].indexOf((b.envelope_type||'').toLowerCase()))
                        .slice(0, 4).map(env => {
                          const pct = env.monthly_budget > 0 ? (env.current_spent / env.monthly_budget) * 100 : 0;
                          const isOver = pct > 100;
                          return (
                            <div key={env.id}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-gray-700 capitalize">{env.envelope_type || env.category}</span>
                                <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>{Math.round(pct)}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-1.5 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              {isOver && <p className="text-xs text-gray-500 mt-1">Dépassement : +{formatCurrency(env.current_spent - env.monthly_budget)}</p>}
                            </div>
                          );
                        })}
                    </div>
                    {envelopes.length > 4 && <button onClick={() => onNavigate('envelopes')} className="text-xs text-green-600 hover:text-green-700 font-semibold mt-4">Voir toutes →</button>}
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
                  {recentTransactions.length > 0
                    ? <div className="space-y-2.5">
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
                    : <p className="text-xs text-gray-500 text-center py-4">Aucune transaction</p>
                  }
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Accès rapides</h3>
                  <div className="space-y-1.5">
                    {[{ page: 'envelopes', icon: '📁', label: 'Budgets' }, { page: 'tontines', icon: '🦁', label: 'Tontines' }, { page: 'score', icon: '🎯', label: 'Score' }, { page: 'alerts', icon: '🔔', label: 'Alertes' }].map(item => (
                      <button key={item.page} onClick={() => onNavigate(item.page)} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
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

        {/* ===== ANALYSE ===== */}
        {activeTab === 'analyse' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Répartition par catégorie {!isCurrentMonth && <span className="text-sm text-gray-400 font-normal">— {currentMonthName}</span>}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex items-center justify-center">
                  {categoryBreakdown.length > 0
                    ? <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={categoryBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name} ${percentage}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                            {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrencyFull(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    : <p className="text-gray-500">Aucune donnée disponible</p>
                  }
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

        {/* ===== HISTORIQUE ===== */}
        {activeTab === 'historique' && (
          <div className="space-y-6">
            <div className="flex gap-2 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              {[{ id: '3m', label: '3 mois' }, { id: '6m', label: '6 mois' }, { id: '1y', label: '1 an' }].map(f => (
                <button key={f.id} onClick={() => setTimeFilter(f.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeFilter === f.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{f.label}</button>
              ))}
            </div>

            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Évolution Score Yoonu Dal</h3>
                {trends && <div className="text-xs text-gray-600">Meilleur: {trends.bestScore.month} ({trends.bestScore.value}) | Pire: {trends.worstScore.month} ({trends.worstScore.value})</div>}
              </div>
              {scoreHistory.length > 0
                ? <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={scoreHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" /><YAxis domain={[0, 100]} /><Tooltip />
                      <Line type="monotone" dataKey="score" stroke={scoreColor.color} strokeWidth={3} dot={{ r: 6, fill: scoreColor.color }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                : <p className="text-center text-gray-500 py-12">Pas assez de données historiques</p>
              }
            </div>

            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Flux financiers</h3>
                {trends && <div className="text-xs text-gray-600">Moyenne épargne: {formatCurrency(trends.avgBalance)}/mois</div>}
              </div>
              {financialHistory.length > 0
                ? <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v) => formatCurrencyFull(v)} /><Legend />
                      <Bar dataKey="revenus" fill="#10B981" name="Revenus" />
                      <Bar dataKey="depenses" fill="#EF4444" name="Dépenses" />
                    </BarChart>
                  </ResponsiveContainer>
                : <p className="text-center text-gray-500 py-12">Pas assez de données historiques</p>
              }
            </div>

            {trends && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 lg:p-8 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Tendances détectées</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { label: 'Progression score', value: `${trends.scoreGrowth > 0 ? '+' : ''}${trends.scoreGrowth} pts/mois`, color: 'text-gray-900' },
                    { label: 'Meilleur mois', value: `${trends.bestBalance.month}: +${formatCurrency(trends.bestBalance.value)}`, color: 'text-green-600' },
                    { label: 'Mois difficile', value: `${trends.worstBalance.month}: ${formatCurrency(trends.worstBalance.value)}`, color: 'text-red-600' },
                    { label: 'Prédiction mois prochain', value: `Score: ${Math.round(displayScore + parseFloat(trends.scoreGrowth))}-${Math.round(displayScore + parseFloat(trends.scoreGrowth) + 4)}`, color: 'text-gray-900' }
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

      {/* Modal simulation */}
      {showSimulation && projectionData && isCurrentMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">🔮 Simulateur de budget</h3>
            <p className="text-sm text-gray-500 mb-6">Que se passe-t-il si je réduis mes dépenses de X% ce mois-ci ?</p>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Réduction</label>
                <span className="text-2xl font-bold text-green-600">{simulationPct}%</span>
              </div>
              <input type="range" min="5" max="50" step="5" value={simulationPct} onChange={(e) => setSimulationPct(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" />
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>5%</span><span>50%</span></div>
            </div>
            {(() => {
              const s = calcScenario(simulationPct);
              if (!s) return null;
              return (
                <div className={`rounded-xl p-5 mb-6 ${s.newBalance > s.originalBalance ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200'}`}>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div><p className="text-xs text-gray-500 mb-1">Économie</p><p className="text-xl font-bold text-green-600">+{formatCurrency(s.economyAmount)}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Solde fin {currentMonthName}</p><p className={`text-xl font-bold ${s.newBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{s.newBalance >= 0 ? '+' : ''}{formatCurrency(s.newBalance)}</p></div>
                  </div>
                  <p className="text-xs text-gray-600">Score estimé : <span className="font-bold">{s.newScore}/100</span></p>
                </div>
              );
            })()}
            <div className="flex gap-3">
              <button onClick={() => setShowSimulation(false)} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Fermer</button>
              <button onClick={() => { const s = calcScenario(simulationPct); handleScenarioClick(s); setShowSimulation(false); }} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">Activer</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {isCurrentMonth && (
        <button onClick={() => onNavigate('expenses')} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-40">
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
