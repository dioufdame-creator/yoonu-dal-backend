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
// DASHBOARD V6 - ADVANCED ANALYTICS
// Comparaisons + Filtres + Export PDF
// Tendances + Prédictions
// ==========================================

const DashboardV6 = ({ toast, auth, onNavigate, user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('apercu');
  const [timeFilter, setTimeFilter] = useState('6m'); // 3m, 6m, 1y, custom
  
  // États existants V5
  const [score, setScore] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [previousMetrics, setPreviousMetrics] = useState(null); // Pour comparaisons
  const [envelopes, setEnvelopes] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationReduction, setSimulationReduction] = useState(5000);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [simulatedScore, setSimulatedScore] = useState(null);
  const [projectionData, setProjectionData] = useState(null);

  // États analytics V6
  const [scoreHistory, setScoreHistory] = useState([]);
  const [financialHistory, setFinancialHistory] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [insights, setInsights] = useState([]);
  const [trends, setTrends] = useState(null);
  useEffect(() => {
    loadDashboardData();
  }, [timeFilter]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [
        scoreRes, 
        metricsRes, 
        envelopesRes, 
        expensesRes, 
        incomesRes,
        scoreHistoryRes
      ] = await Promise.all([
        API.get('/yoonu-score/').catch(() => null),
        API.get('/dashboard/metrics/').catch(() => null),
        API.get('/meta-envelopes/').catch(() => null),  // ✅ CORRIGÉ
        API.get('/expenses/').catch(() => null),
        API.get('/incomes/').catch(() => null),
        API.get('/score-history/').catch(() => null)
      ]);

      if (scoreRes?.data) setScore(scoreRes.data);
      
      // Métriques actuelles et précédentes
      if (metricsRes?.data) {
        setMetrics(metricsRes.data);
        // Simuler métriques mois précédent (devrait venir de l'API)
        const prevMetrics = {
          monthly_income: (metricsRes.data.monthly_income || 1000000) * 0.95,
          total_expenses: (metricsRes.data.total_expenses || 900000) * 1.08
        };
        setPreviousMetrics(prevMetrics);
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
        
        const breakdown = generateCategoryBreakdown(expList);
        setCategoryBreakdown(breakdown);
        
        const autoInsights = generateInsights(expList, metricsRes?.data, previousMetrics);
        setInsights(autoInsights);
      }

      // Score history avec filtre temporel
      let historyMonths = 6;
      if (timeFilter === '3m') historyMonths = 3;
      else if (timeFilter === '1y') historyMonths = 12;

      let finalScoreHistory = [];
      if (scoreHistoryRes?.data) {
        finalScoreHistory = scoreHistoryRes.data.history ? scoreHistoryRes.data.history.slice(-historyMonths) : [];
      } else {
        finalScoreHistory = generateMockScoreHistory(score?.total_score || 47, historyMonths);
      }
      setScoreHistory(finalScoreHistory);

      const finalFinancialHistory = generateMockFinancialHistory(metricsRes?.data, historyMonths);
      setFinancialHistory(finalFinancialHistory);

      // Calculer tendances
      const calculatedTrends = calculateTrends(finalScoreHistory, finalFinancialHistory);
      setTrends(calculatedTrends);

      // Projection (code existant)
      if (incomesRes?.data && expensesRes?.data) {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = now.getDate();
        const daysRemaining = daysInMonth - daysElapsed;

        const incList = Array.isArray(incomesRes.data) ? incomesRes.data : incomesRes.data.incomes || [];
        const expList = Array.isArray(expensesRes.data) ? expensesRes.data : expensesRes.data.expenses || [];
        
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const monthlyIncome = incList
          .filter(inc => inc.date && inc.date.startsWith(monthStr))
          .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

        const monthlyExpenses = expList
          .filter(exp => exp.date && exp.date.startsWith(monthStr))
          .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

        if (daysElapsed > 0 && daysRemaining > 0) {
          const dailyAvg = monthlyExpenses / daysElapsed;
          const projectedTotal = dailyAvg * daysInMonth;
          const projectedBalance = monthlyIncome - projectedTotal;

          setProjectionData({
            dailyAvg,
            projectedBalance,
            daysRemaining,
            daysElapsed,
            monthlyIncome,
            currentExpenses: monthlyExpenses,
            daysInMonth
          });
        }
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Utilitaires
  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
  };

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getScoreColor = (scoreValue) => {
    if (!scoreValue || scoreValue === 0) return { text: 'text-gray-500', bg: 'bg-gray-50', ring: 'stroke-gray-300', label: 'Non évalué', color: '#9CA3AF' };
    if (scoreValue >= 70) return { text: 'text-green-600', bg: 'bg-green-50', ring: 'stroke-green-500', label: 'Bonne stabilité', color: '#10B981' };
    if (scoreValue >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50', ring: 'stroke-amber-500', label: 'Situation fragile', color: '#F59E0B' };
    return { text: 'text-red-600', bg: 'bg-red-50', ring: 'stroke-red-500', label: 'Risque élevé', color: '#EF4444' };
  };

  // Badge comparaison
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

  // Générateurs
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
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const generateInsights = (expenses, metrics, previousMetrics) => {
    const insights = [];
    const totalExpenses = metrics?.total_expenses || 0;
    const monthlyIncome = metrics?.monthly_income || 0;
    const prevExpenses = previousMetrics?.total_expenses || totalExpenses;

    // Insight 1: Comparaison dépenses
    const expenseChange = calculatePercentageChange(totalExpenses, prevExpenses);
    if (Math.abs(expenseChange) > 5) {
      insights.push({
        icon: expenseChange > 0 ? '⚠️' : '✅',
        text: `Tes dépenses ont ${expenseChange > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(expenseChange).toFixed(1)}% vs mois dernier`,
        trend: expenseChange > 0 ? 'up' : 'down'
      });
    }

    // Insight 2: Plus grosse catégorie
    if (expenses.length > 0) {
      const categories = {};
      expenses.forEach(exp => {
        const cat = exp.category || 'Autres';
        categories[cat] = (categories[cat] || 0) + parseFloat(exp.amount || 0);
      });
      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
      if (topCategory) {
        const pct = Math.round((topCategory[1] / totalExpenses) * 100);
        insights.push({
          icon: '📊',
          text: `${topCategory[0]} représente ${pct}% de tes dépenses (${formatCurrency(topCategory[1])})`
        });
      }
    }

    // Insight 3: Balance
    if (totalExpenses > monthlyIncome) {
      const deficit = totalExpenses - monthlyIncome;
      insights.push({
        icon: '⚠️',
        text: `Déficit de ${formatCurrency(deficit)} ce mois`
      });
    } else {
      const surplus = monthlyIncome - totalExpenses;
      insights.push({
        icon: '✨',
        text: `Épargne de ${formatCurrency(surplus)} ce mois`
      });
    }

    return insights.slice(0, 4);
  };

  const generateMockScoreHistory = (currentScore, months) => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const baseScore = Math.max(20, currentScore - (months * 2));
    
    return Array.from({ length: months }, (_, i) => {
      const monthIndex = (now.getMonth() - months + i + 1 + 12) % 12;
      return {
        month: monthNames[monthIndex],
        score: Math.min(100, Math.max(0, baseScore + (i * 2) + Math.random() * 5))
      };
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

    // Meilleur/pire score
    const sortedByScore = [...scoreHistory].sort((a, b) => b.score - a.score);
    const bestScoreMonth = sortedByScore[0];
    const worstScoreMonth = sortedByScore[sortedByScore.length - 1];

    // Meilleur/pire balance
    const withBalance = financialHistory.map(m => ({
      ...m,
      balance: m.revenus - m.depenses
    }));
    const sortedByBalance = [...withBalance].sort((a, b) => b.balance - a.balance);
    const bestBalanceMonth = sortedByBalance[0];
    const worstBalanceMonth = sortedByBalance[sortedByBalance.length - 1];

    // Moyenne épargne
    const avgBalance = withBalance.reduce((sum, m) => sum + m.balance, 0) / withBalance.length;

    // Tendance score
    const scoreGrowth = scoreHistory.length > 1 
      ? ((scoreHistory[scoreHistory.length - 1].score - scoreHistory[0].score) / scoreHistory.length)
      : 0;

    return {
      bestScore: { month: bestScoreMonth.month, value: Math.round(bestScoreMonth.score) },
      worstScore: { month: worstScoreMonth.month, value: Math.round(worstScoreMonth.score) },
      bestBalance: { month: bestBalanceMonth.month, value: bestBalanceMonth.balance },
      worstBalance: { month: worstBalanceMonth.month, value: worstBalanceMonth.balance },
      avgBalance,
      scoreGrowth: scoreGrowth.toFixed(1)
    };
  };

  // Export PDF

  // ==========================================
  // EXPORT PDF - DÉSACTIVÉ (Utiliser ExportButtons Premium)
  // ==========================================
  /*
  const exportToPDF = () => {
    setIsExportingPDF(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(24);
      doc.setTextColor(16, 185, 129);
      doc.text('Yoonu Dal', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Rapport Mensuel', 14, 28);
      
      doc.setFontSize(10);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 35);
      doc.text(`Utilisateur: ${user?.first_name || user?.username || 'Utilisateur'}`, 14, 40);

      // Ligne séparation
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 45, pageWidth - 14, 45);

      let yPos = 55;

      // Score
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Score Yoonu Dal: ${score?.total_score || 0}/100`, 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Niveau: ${getScoreColor(score?.total_score).label}`, 14, yPos);
      yPos += 15;

      // KPIs
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Finances du mois', 14, yPos);
      yPos += 10;

      const kpisData = [
        ['Revenus', formatCurrencyFull(metrics?.monthly_income || 0)],
        ['Dépenses', formatCurrencyFull(metrics?.total_expenses || 0)],
        ['Solde', formatCurrencyFull((metrics?.monthly_income || 0) - (metrics?.total_expenses || 0))]
      ];

      doc.autoTable({
        startY: yPos,
        head: [['Indicateur', 'Montant']],
        body: kpisData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // Catégories
      if (categoryBreakdown.length > 0) {
        doc.setFontSize(14);
        doc.text('Répartition par catégorie', 14, yPos);
        yPos += 10;

        const categoryData = categoryBreakdown.map(cat => [
          cat.name,
          `${cat.percentage}%`,
          formatCurrencyFull(cat.value)
        ]);

        doc.autoTable({
          startY: yPos,
          head: [['Catégorie', '%', 'Montant']],
          body: categoryData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] }
        });

        yPos = doc.lastAutoTable.finalY + 15;
      }

      // Insights
      if (insights.length > 0 && yPos < 250) {
        doc.setFontSize(14);
        doc.text('Insights clés', 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        insights.forEach((insight, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${insight.icon} ${insight.text}`, 14, yPos);
          yPos += 7;
        });
      }

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} sur ${totalPages} - Yoonu Dal © ${new Date().getFullYear()}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Sauvegarder
      doc.save(`rapport-yoonu-dal-${new Date().toISOString().slice(0, 10)}.pdf`);
      
      toast?.showSuccess('📥 Rapport PDF téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast?.showError('❌ Erreur lors de l\'export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };  */

  // Reste du code V5 (getIntelligentMessage, calculateScenario, etc.)
  const getIntelligentMessage = (customBalance = null, isSimulation = false) => {
    const totalIncome = metrics?.monthly_income || 0;
    const totalExpenses = metrics?.total_expenses || 0;
    const balance = customBalance !== null ? customBalance : (totalIncome - totalExpenses);
    const originalBalance = totalIncome - totalExpenses;

    if (!score || score.total_score === 0) {
      return { icon: '🎯', text: 'Commence par ton diagnostic pour débloquer ton Score Yoonu Dal', type: 'neutral' };
    }

    if (isSimulation && customBalance !== null) {
      if (balance > 0 && originalBalance < 0) {
        return {
          icon: '💚',
          text: `Tu passes d'un déficit de ${formatCurrency(Math.abs(originalBalance))} à un gain de ${formatCurrency(balance)} !`,
          type: 'transformation'
        };
      }
      
      if (balance > 0) {
        return {
          icon: '✨',
          text: `À ce rythme, tu termines février avec +${formatCurrency(balance)} d'épargne.`,
          type: 'excellent'
        };
      }
      
      if (balance < 0 && balance > originalBalance) {
        return {
          icon: '📈',
          text: `Tu réduis ton déficit de ${formatCurrency(Math.abs(originalBalance))} à ${formatCurrency(Math.abs(balance))}.`,
          type: 'improvement'
        };
      }
    }

    if (balance < -50000) {
      return { 
        icon: '⚠️', 
        text: `Tu dépenses plus que tu gagnes. À ce rythme : ${formatCurrency(Math.abs(balance))} de déficit fin février.`,
        type: 'warning'
      };
    }

    if (balance > 0 && balance < 100000) {
      return { 
        icon: '🟢', 
        text: `Situation stable. Tu épargnes ${formatCurrency(balance)} ce mois.`,
        type: 'good'
      };
    }

    if (balance >= 100000) {
      return { 
        icon: '✨', 
        text: `Excellente maîtrise ! ${formatCurrency(balance)} d'épargne ce mois.`,
        type: 'excellent'
      };
    }

    return { 
      icon: '🟢', 
      text: 'Ton budget est sous contrôle. Continue comme ça.',
      type: 'good'
    };
  };

  const calculateScenario = (dailyReduction) => {
    if (!projectionData) return null;
    
    const { daysRemaining, daysElapsed, monthlyIncome, dailyAvg, currentExpenses } = projectionData;
    

    const pastExpenses = currentExpenses;
    const newDailyAvg = dailyAvg - dailyReduction;
    const futureExpenses = newDailyAvg * daysRemaining;
    const newProjectedTotal = pastExpenses + futureExpenses;
    const newBalance = monthlyIncome - newProjectedTotal;
    
    const currentScore = score?.total_score || 47;
    let scoreBoost = 0;
    if (newBalance > 0) {
      scoreBoost = Math.min(15, Math.floor(newBalance / 10000));
    }
    
    return {
      reduction: dailyReduction,
      impact: newBalance,
      isPositive: newBalance > 0,
      simulatedScore: Math.min(100, currentScore + scoreBoost),
      projectedExpenses: newProjectedTotal,
      economyMade: dailyReduction * daysRemaining
    };
  };

  const getQuickScenarios = () => {
    if (!projectionData) return [];
    return [
      calculateScenario(3000),
      calculateScenario(5000),
      calculateScenario(8000)
    ].filter(Boolean);
  };

  const handleScenarioClick = (scenario) => {
    setActiveSimulation(scenario);
    setSimulatedScore(scenario.simulatedScore);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applySimulation = () => {
    if (!activeSimulation) return;
    toast?.showSuccess(`🎯 Objectif défini : Réduire de ${formatCurrency(activeSimulation.reduction)} FCFA/jour`);
    setActiveSimulation(null);
    setSimulatedScore(null);
    setTimeout(() => onNavigate('envelopes'), 1000);
  };

  const cancelSimulation = () => {
    setActiveSimulation(null);
    setSimulatedScore(null);
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

  const displayScore = simulatedScore || score?.total_score || 0;
  const scoreColor = getScoreColor(displayScore);
  const intelligentMessage = getIntelligentMessage(activeSimulation?.impact, !!activeSimulation);
  const totalIncome = metrics?.monthly_income || 0;
  const totalExpenses = metrics?.total_expenses || 0;
  const balance = totalIncome - totalExpenses;
  const simulatedExpenses = activeSimulation ? activeSimulation.projectedExpenses : totalExpenses;
  const simulatedBalance = activeSimulation ? activeSimulation.impact : balance;
  const quickScenarios = getQuickScenarios();

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Bandeau simulation */}
      {activeSimulation && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm animate-slideDown"
          style={{
            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.92) 0%, rgba(4, 120, 87, 0.92) 100%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-semibold text-white text-sm">
                    Simulation : -{formatCurrency(activeSimulation.reduction)}/jour
                  </p>
                  <p className="text-xs text-green-50">
                    {activeSimulation.isPositive 
                      ? `+${formatCurrency(activeSimulation.impact)} fin février`
                      : `Déficit réduit à ${formatCurrency(Math.abs(activeSimulation.impact))}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applySimulation}
                  className="bg-white text-green-700 px-4 py-1.5 rounded-lg font-semibold hover:bg-green-50 transition-all text-xs shadow-sm"
                >
                  Appliquer
                </button>
                <button
                  onClick={cancelSimulation}
                  className="bg-green-700 bg-opacity-25 text-white px-3 py-1.5 rounded-lg hover:bg-opacity-35 transition-all text-xs"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 transition-all duration-300 ${activeSimulation ? 'pt-18' : ''}`}>
        
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            🤝🏿 Dalal jamm {user?.user?.first_name || user?.user?.username || 'utilisateur'}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Export Buttons Premium */}
        <div className="mb-6 flex justify-end">
          <ExportButtons user={user} onNavigate={onNavigate} toast={toast} />
        </div>

        {/* TABS NAVIGATION */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1">
            {[
              { id: 'apercu', label: '👀 Aperçu', desc: 'Vue d\'action' },
              { id: 'analyse', label: '📊 Analyse', desc: 'Répartition' },
              { id: 'historique', label: '📈 Historique', desc: 'Tendances' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 lg:px-6 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="block">{tab.label}</span>
                <span className="text-xs text-gray-500 hidden lg:block">{tab.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT: APERÇU - Code V5 avec comparaisons ajoutées */}
        {activeTab === 'apercu' && (
          <div className="space-y-6">
            
            {/* Hero V4.4 - INCHANGÉ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <div className="lg:col-span-3 flex flex-col items-center lg:items-start">
                  <div className="relative mb-2">
                    <svg className="w-24 h-24 lg:w-28 lg:h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" className="stroke-gray-100" strokeWidth="5" fill="none" />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className={scoreColor.ring}
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${displayScore * 3.01} 301`}
                        strokeLinecap="round"
                        style={{ 
                          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                          filter: simulatedScore && activeSimulation?.isPositive 
                            ? 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))' 
                            : simulatedScore 
                              ? 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.4))'
                              : 'none',
                          animation: simulatedScore && activeSimulation?.isPositive ? 'gentleGlow 2s ease-in-out infinite' : 'none'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className={`text-4xl font-bold ${scoreColor.text}`}
                        style={{
                          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: simulatedScore ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        {displayScore}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center lg:text-left flex flex-col items-center lg:items-start gap-1.5">
                    {simulatedScore ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
                        <span className="text-xs">✨</span>
                        <span className="text-xs font-medium text-gray-700">Simulé</span>
                      </div>
                    ) : (
                      <p className={`text-xs font-semibold ${scoreColor.text}`}>
                        {scoreColor.label}
                      </p>
                    )}
                    
                    {score?.score_change !== undefined && score?.score_change !== 0 && !simulatedScore && (
                      <p className={`text-xs ${score.score_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {score.score_change > 0 ? '▲' : '▼'} {Math.abs(score.score_change)} pts
                      </p>
                    )}
                  
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div 
                    className="flex items-start gap-2 mb-3"
                    style={{ animation: activeSimulation ? 'slideUp 300ms ease-out' : 'none' }}
                  >
                    <span className="text-xl flex-shrink-0">{intelligentMessage.icon}</span>
                    <p className="text-sm lg:text-base text-gray-900 leading-relaxed font-medium">
                      {intelligentMessage.text}
                    </p>
                  </div>

                  {projectionData && projectionData.projectedBalance < 0 && !activeSimulation && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {quickScenarios.map((scenario, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleScenarioClick(scenario)}
                            className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all transform hover:scale-105 ${
                              scenario.isPositive 
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:shadow-md' 
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <span className="group-hover:scale-110 transition-transform">🔮</span>
                            <span>-{formatCurrency(scenario.reduction)}/j → {scenario.isPositive ? '+' : ''}{formatCurrency(scenario.impact)}</span>
                            {scenario.isPositive && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                            )}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setShowSimulation(true)}
                        className="text-xs text-green-600 hover:text-green-700 font-semibold hover:underline"
                      >
                        Tester un scénario personnalisé →
                      </button>
                    </div>
                  )}

                  {projectionData && projectionData.projectedBalance >= 0 && !activeSimulation && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs">
                      <span>✅</span>
                      <span>Projection : +{formatCurrency(projectionData.projectedBalance)} fin février</span>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-3 flex justify-center lg:justify-end">
                  <button
                    onClick={() => {
                      if (activeSimulation) {
                        setShowSimulation(true);
                      } else if (projectionData?.projectedBalance < 0) {
                        setShowSimulation(true);
                      } else {
                        onNavigate('goals');
                      }
                    }}
                    className={`bg-gradient-to-r ${
                      activeSimulation 
                        ? 'from-amber-600 to-orange-600'
                        : projectionData?.projectedBalance < 0 
                          ? 'from-green-600 to-emerald-600' 
                          : 'from-blue-600 to-indigo-600'
                    } text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-md transition-all transform hover:scale-105 active:scale-95`}
                  >
                    {activeSimulation 
                      ? 'Modifier simulation'
                      : projectionData?.projectedBalance < 0 
                        ? 'Tester scénario' 
                        : 'Renforcer épargne'}
                  </button>
                </div>
              </div>
            </div>

            {/* KPIs AVEC COMPARAISONS V6 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Revenus</p>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
                  {previousMetrics && (
                    <ComparisonBadge 
                      current={totalIncome} 
                      previous={previousMetrics.monthly_income}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatCurrencyFull(totalIncome)}</p>
              </div>

              <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200 relative">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Dépenses</p>
                <div className="flex items-center gap-2 mb-1">
                  <p 
                    className={`text-2xl lg:text-3xl font-bold transition-all duration-500 ${
                      simulatedExpenses > totalIncome ? 'text-red-600' : activeSimulation && simulatedExpenses < totalExpenses ? 'text-green-600' : 'text-gray-900'
                    }`}
                  >
                    {formatCurrency(simulatedExpenses)}
                  </p>
                  {previousMetrics && !activeSimulation && (
                    <ComparisonBadge 
                      current={totalExpenses} 
                      previous={previousMetrics.total_expenses}
                      inverse={true}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatCurrencyFull(simulatedExpenses)}</p>
                {activeSimulation && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-xs text-green-700">
                      <span>🔮</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200 relative">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solde</p>
                <div className="flex items-center gap-2 mb-1">
                  <p 
                    className={`text-2xl lg:text-3xl font-bold transition-all duration-500 ${
                      simulatedBalance < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                    style={{
                      animation: activeSimulation ? 'popIn 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                    }}
                  >
                    {simulatedBalance >= 0 ? '+' : ''}{formatCurrency(simulatedBalance)}
                  </p>
                  {previousMetrics && !activeSimulation && (
                    <ComparisonBadge 
                      current={balance} 
                      previous={previousMetrics.monthly_income - previousMetrics.total_expenses}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatCurrencyFull(simulatedBalance)}</p>
                {activeSimulation && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-xs text-green-700">
                      <span>🔮</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 2 colonnes - reste V5 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-6">
                
                {envelopes.length > 0 && (
                  <div className="bg-white rounded-xl p-5 lg:p-6 shadow-sm border border-gray-200">
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-5">Pression budgétaire</h3>
                    
                    <div className="space-y-4">
                      {envelopes
                        .sort((a, b) => {
                          const order = ['essentiel', 'plaisir', 'projet', 'libération'];
                          const typeA = (a.envelope_type || a.category || '').toLowerCase();
                          const typeB = (b.envelope_type || b.category || '').toLowerCase();
                          return order.indexOf(typeA) - order.indexOf(typeB);
                        })
                        .slice(0, 4)
                        .map(envelope => {
                        const pct = envelope.monthly_budget > 0 ? (envelope.current_spent / envelope.monthly_budget) * 100 : 0;
                        const isOver = pct > 100;
                        
                        return (
                          <div key={envelope.id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-gray-700 capitalize">{envelope.envelope_type || envelope.category}</span>
                              <span className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                                {Math.round(pct)}%
                              </span>
                            </div>
                            
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            
                            {isOver && (
                              <p className="text-xs text-gray-500 mt-1">
                                À ce rythme : +{formatCurrency(envelope.current_spent - envelope.monthly_budget)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {envelopes.length > 4 && (
                      <button
                        onClick={() => onNavigate('envelopes')}
                        className="text-xs text-green-600 hover:text-green-700 font-semibold mt-4"
                      >
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
                    <button
                      onClick={() => onNavigate('expenses')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Tout
                    </button>
                  </div>

                  {recentTransactions.length > 0 ? (
                    <div className="space-y-2.5">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{transaction.description}</p>
                              <span className="inline-block text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded mt-0.5">
                                {transaction.category}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-red-600 ml-2">
                            -{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">Aucune transaction</p>
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
                      <button
                        key={item.page}
                        onClick={() => onNavigate(item.page)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
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

        {/* TAB CONTENT: ANALYSE - Code V5 inchangé */}
        {activeTab === 'analyse' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Répartition par catégorie</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex items-center justify-center">
                  {categoryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrencyFull(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500">Aucune donnée disponible</p>
                  )}
                </div>

                <div className="space-y-3">
                  {categoryBreakdown.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
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
              <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Insights ce mois</h3>
              
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

        {/* TAB CONTENT: HISTORIQUE - V6 avec filtres et export */}
        {activeTab === 'historique' && (
          <div className="space-y-6">
            
            {/* Barre filtres + Export */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex gap-2">
                {[
                  { id: '3m', label: '3 mois' },
                  { id: '6m', label: '6 mois' },
                  { id: '1y', label: '1 an' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setTimeFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timeFilter === filter.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>


              {/* Ancien bouton Export PDF - Désactivé */}
              {/*
              <button
                onClick={exportToPDF}
                disabled={isExportingPDF}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:shadow-md transition-all disabled:opacity-50"
              >
                {isExportingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Export...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Exporter PDF</span>
                  </>
                )}
              </button>
              */}
            </div>

            {/* Graphique Score */}
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Évolution Score Yoonu Dal</h3>
                {trends && (
                  <div className="text-xs text-gray-600">
                    Meilleur: {trends.bestScore.month} ({trends.bestScore.value}) | 
                    Pire: {trends.worstScore.month} ({trends.worstScore.value})
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
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke={scoreColor.color}
                      strokeWidth={3}
                      dot={{ r: 6, fill: scoreColor.color }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">Pas assez de données historiques</p>
              )}
            </div>

            {/* Graphique Finances */}
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Flux financiers</h3>
                {trends && (
                  <div className="text-xs text-gray-600">
                    Moyenne épargne: {formatCurrency(trends.avgBalance)}/mois
                  </div>
                )}
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
              ) : (
                <p className="text-center text-gray-500 py-12">Pas assez de données historiques</p>
              )}
            </div>

            {/* Tendances détectées */}
            {trends && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 lg:p-8 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Tendances détectées</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Progression score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trends.scoreGrowth > 0 ? '+' : ''}{trends.scoreGrowth} pts/mois
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Meilleur mois (balance)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {trends.bestBalance.month}: +{formatCurrency(trends.bestBalance.value)}
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Pire mois (balance)</p>
                    <p className="text-2xl font-bold text-red-600">
                      {trends.worstBalance.month}: {formatCurrency(trends.worstBalance.value)}
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Prédiction mars</p>
                    <p className="text-lg font-bold text-gray-900">
                      Score: {Math.round(displayScore + parseFloat(trends.scoreGrowth))}-{Math.round(displayScore + parseFloat(trends.scoreGrowth) + 4)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Simulation - Code V4.4 inchangé */}
      {showSimulation && projectionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              🔮 Simulateur de scénarios
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Réduction quotidienne
              </label>
              <input
                type="range"
                min="1000"
                max="15000"
                step="1000"
                value={simulationReduction}
                onChange={(e) => setSimulationReduction(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1k/j</span>
                <span className="font-semibold text-gray-900">{formatCurrency(simulationReduction)}/j</span>
                <span>15k/j</span>
              </div>
            </div>

            {(() => {
              const scenario = calculateScenario(simulationReduction);
              return (
                <div className={`rounded-xl p-6 mb-6 ${
                  scenario.isPositive 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200'
                }`}>
                  <p className="text-sm text-gray-700 mb-2">Projection fin février :</p>
                  <p className={`text-3xl font-bold mb-3 ${scenario.isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                    {scenario.isPositive ? '+' : ''}{formatCurrency(scenario.impact)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {scenario.isPositive 
                      ? `✨ Tu termines février avec ${formatCurrency(scenario.impact)} d'épargne !` 
                      : `Encore ${formatCurrency(Math.abs(scenario.impact))} de déficit`}
                  </p>
                </div>
              );
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSimulation(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const scenario = calculateScenario(simulationReduction);
                  handleScenarioClick(scenario);
                  setShowSimulation(false);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Activer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => onNavigate('expenses')}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <span className="text-2xl text-white">+</span>
      </button>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes popIn {
          0% {
            transform: scale(0.95);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes gentleGlow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.6));
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardV6;
