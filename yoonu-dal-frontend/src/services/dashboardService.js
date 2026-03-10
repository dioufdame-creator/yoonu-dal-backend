// src/services/tontineService.js
import authService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'https://yoonudal-api.onrender.com/api';

class DashboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Méthode générique pour les appels API
  async apiCall(endpoint, options = {}) {
    try {
      const token = authService.getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      };

      console.log(`🔄 API Call: ${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        console.log('🔒 Token expiré, tentative de refresh...');
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          headers.Authorization = `Bearer ${authService.getToken()}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            console.log(`✅ API Success (après refresh):`, data);
            return data;
          }
        }
        throw new Error('Session expirée');
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        console.log(`❌ API Error ${response.status}:`, errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Cache avec expiration
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`💾 Cache hit for ${key}`);
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cache set for ${key}`);
  }

  // 1. MÉTRIQUES PRINCIPALES - VRAIES DONNÉES
  async getUserMetrics() {
    console.log('📊 Récupération des métriques utilisateur...');
    const cacheKey = 'userMetrics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.apiCall('/dashboard/metrics/');
      
      const metrics = {
        monthlyIncome: data.monthly_income || 0,
        totalExpenses: data.total_expenses || 0,
        totalSavings: data.total_savings || 0,
        activeTontines: data.active_tontines || 0,
        financialHealthScore: data.financial_health_score || 0,
        savingsRate: data.savings_rate || 0,
        expenseRatio: data.expense_ratio || 0,
        tontineParticipation: data.tontine_participation || 0
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.warn('⚠️ Erreur API métriques, retour de données vides:', error);
      
      // ✅ VRAIES DONNÉES VIDES au lieu de données de test
      return {
        monthlyIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        activeTontines: 0,
        financialHealthScore: 0,
        savingsRate: 0,
        expenseRatio: 0,
        tontineParticipation: 0,
        isEmpty: true,
        message: "Aucune donnée disponible. Commencez par ajouter vos revenus et dépenses !"
      };
    }
  }

  // 2. TRIANGLE D'ALIGNEMENT - VRAIES DONNÉES
  async getAlignmentData() {
    console.log('🔺 Récupération des données d\'alignement...');
    const cacheKey = 'alignmentData';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.apiCall('/dashboard/alignment/');
      
      const alignment = {
        revenus: data.revenue_score || 0,
        depenses: data.expense_score || 0,
        valeurs: data.values_score || 0,
        alignmentScore: data.overall_alignment || 0,
        recommendations: data.recommendations || []
      };

      this.setCachedData(cacheKey, alignment);
      console.log('✅ Alignement chargé depuis Django:', alignment);
      return alignment;
    } catch (error) {
      console.warn('⚠️ Erreur alignement, scores vides:', error);
      
      // ✅ VRAIES DONNÉES VIDES
      return {
        revenus: 0,
        depenses: 0,
        valeurs: 0,
        alignmentScore: 0,
        recommendations: [
          "Commencez par définir vos valeurs personnelles",
          "Ajoutez vos revenus et dépenses",
          "Créez vos premiers objectifs financiers"
        ],
        isEmpty: true
      };
    }
  }

  // 3. TRANSACTIONS RÉCENTES - VRAIES DONNÉES
  async getRecentTransactions() {
    console.log('💳 Récupération des transactions récentes...');
    try {
      const data = await this.apiCall('/transactions/recent/');
      
      // Si pas de données, retourner tableau vide
      if (!data || !Array.isArray(data) || data.length === 0) {
        return {
          transactions: [],
          isEmpty: true,
          message: "Aucune transaction enregistrée. Commencez par ajouter vos premières dépenses !"
        };
      }

      return {
        transactions: data.map(transaction => ({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.type === 'expense' ? -transaction.amount : transaction.amount,
          type: transaction.type,
          category: transaction.category,
          date: transaction.date,
          icon: this.getTransactionIcon(transaction.category, transaction.type)
        })),
        isEmpty: false
      };
    } catch (error) {
      console.warn('⚠️ Erreur API transactions:', error);
      return {
        transactions: [],
        isEmpty: true,
        message: "Erreur lors du chargement des transactions. Vérifiez votre connexion."
      };
    }
  }

  // 4. OBJECTIFS UTILISATEUR - VRAIES DONNÉES
  async getUserGoals() {
    console.log('🎯 Récupération des objectifs utilisateur...');
    try {
      const data = await this.apiCall('/goals/');
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return {
          goals: [],
          isEmpty: true,
          message: "Aucun objectif défini. Créez votre premier objectif financier !"
        };
      }

      return {
        goals: data.map(goal => ({
          id: goal.id,
          title: goal.title,
          target: goal.target_amount,
          current: goal.current_amount,
          progress: goal.progress_percentage || 0,
          deadline: goal.deadline,
          category: goal.category,
          icon: this.getGoalIcon(goal.category)
        })),
        isEmpty: false
      };
    } catch (error) {
      console.warn('⚠️ Erreur API objectifs:', error);
      return {
        goals: [],
        isEmpty: true,
        message: "Erreur lors du chargement des objectifs."
      };
    }
  }

  // 5. TONTINES ACTIVES - VRAIES DONNÉES
  async getActiveTontines() {
    console.log('🏦 Récupération des tontines actives...');
    try {
      const data = await this.apiCall('/tontines/active/');
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return {
          tontines: [],
          isEmpty: true,
          message: "Aucune tontine active. Créez votre première tontine !"
        };
      }

      return {
        tontines: data.map(tontine => ({
          id: tontine.id,
          name: tontine.name,
          totalAmount: tontine.total_amount,
          monthlyContribution: tontine.monthly_contribution,
          participants: tontine.current_participants,
          maxParticipants: tontine.max_participants,
          nextPayment: tontine.next_payment_date,
          status: tontine.status,
          progress: tontine.progress_percentage || 0
        })),
        isEmpty: false
      };
    } catch (error) {
      console.warn('⚠️ Erreur API tontines:', error);
      return {
        tontines: [],
        isEmpty: true,
        message: "Erreur lors du chargement des tontines."
      };
    }
  }

  // 6. APERÇU BUDGET - VRAIES DONNÉES
  async getBudgetOverview() {
    console.log('💼 Récupération de l\'aperçu budget...');
    try {
      const data = await this.apiCall('/budget/overview/');
      
      if (!data || !data.categories || data.categories.length === 0) {
        return {
          categories: [],
          totalAllocated: 0,
          totalSpent: 0,
          remainingBudget: 0,
          isEmpty: true,
          message: "Aucun budget défini. Créez votre premier budget !"
        };
      }

      return {
        categories: data.categories.map(cat => ({
          name: cat.name,
          allocated: cat.allocated_amount,
          spent: cat.spent_amount || 0,
          remaining: cat.remaining_amount || cat.allocated_amount,
          progress: cat.usage_percentage || 0,
          status: this.getBudgetStatus(cat.usage_percentage || 0)
        })),
        totalAllocated: data.total_allocated || 0,
        totalSpent: data.total_spent || 0,
        remainingBudget: data.remaining_budget || 0,
        isEmpty: false
      };
    } catch (error) {
      console.warn('⚠️ Erreur API budget:', error);
      return {
        categories: [],
        totalAllocated: 0,
        totalSpent: 0,
        remainingBudget: 0,
        isEmpty: true,
        message: "Erreur lors du chargement du budget."
      };
    }
  }

  // MÉTHODES UTILITAIRES
  getTransactionIcon(category, type) {
    if (type === 'income') return '💰';
    
    const icons = {
      'alimentation': '🛒',
      'transport': '🚗',
      'logement': '🏠',
      'loisirs': '🎮',
      'santé': '⚕️',
      'éducation': '📚',
      'famille': '👨‍👩‍👧‍👦',
      'spiritualité': '🙏'
    };
    return icons[category] || '💸';
  }

  getGoalIcon(category) {
    const icons = {
      'urgence': '🚨',
      'transport': '🚗',
      'logement': '🏠',
      'éducation': '📚',
      'santé': '⚕️',
      'investissement': '📈',
      'retraite': '👴'
    };
    return icons[category] || '🎯';
  }

  getBudgetStatus(percentage) {
    if (percentage <= 70) return 'good';
    if (percentage <= 90) return 'warning';
    return 'over';
  }

  // Méthode pour rafraîchir toutes les données
  async refreshAllData() {
    this.cache.clear();
    console.log('🔄 Cache vidé - Rafraîchissement des données...');
    
    // Préchargement des données principales
    await Promise.all([
      this.getUserMetrics(),
      this.getAlignmentData()
    ]);
    
    console.log('✅ Données rafraîchies');
  }

  // Debug
  getDebugInfo() {
    return {
      cacheSize: this.cache.size,
      cachedKeys: Array.from(this.cache.keys()),
      apiBaseUrl: API_BASE_URL,
      authToken: !!authService.getToken(),
      service: 'DashboardService v2.0 - Real Data Only'
    };
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
