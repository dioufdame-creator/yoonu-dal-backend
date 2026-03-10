// src/services/tontineService.js
import authService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'https://yoonudal-api.onrender.com/api';

class TontineService {
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
        // Token expiré, essayer de refresh
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          headers.Authorization = `Bearer ${authService.getToken()}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
          });
          return retryResponse.json();
        } else {
          throw new Error('Session expirée');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
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
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ========================================
  // TONTINES - GESTION PRINCIPALE
  // ========================================

  // Créer une nouvelle tontine
  async createTontine(tontineData) {
    try {
      return await this.apiCall('/tontines/', {
        method: 'POST',
        body: JSON.stringify(tontineData)
      });
    } catch (error) {
      console.error('❌ Erreur création tontine:', error);
      throw error;
    }
  }

  // Obtenir toutes les tontines de l'utilisateur
  async getUserTontines() {
    const cacheKey = 'userTontines';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.apiCall('/tontines/user/');
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.warn('❌ Erreur récupération tontines, données de démo:', error);
      return this.getFallbackTontines();
    }
  }

  // Obtenir les tontines actives
  async getActiveTontines() {
    try {
      return await this.apiCall('/tontines/active/');
    } catch (error) {
      console.warn('❌ Erreur tontines actives, données de démo:', error);
      return this.getFallbackActiveTontines();
    }
  }

  // Obtenir une tontine spécifique
  async getTontineById(id) {
    try {
      return await this.apiCall(`/tontines/${id}/`);
    } catch (error) {
      console.warn(`❌ Erreur récupération tontine ${id}:`, error);
      return null;
    }
  }

  // Rejoindre une tontine avec code d'invitation
  async joinTontine(invitationCode) {
    try {
      return await this.apiCall('/tontines/join/', {
        method: 'POST',
        body: JSON.stringify({ invitation_code: invitationCode })
      });
    } catch (error) {
      console.error('❌ Erreur pour rejoindre la tontine:', error);
      throw error;
    }
  }

  // Quitter une tontine
  async leaveTontine(tontineId) {
    try {
      return await this.apiCall(`/tontines/${tontineId}/leave/`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('❌ Erreur pour quitter la tontine:', error);
      throw error;
    }
  }

  // ========================================
  // CONTRIBUTIONS
  // ========================================

  // Faire une contribution
  async makeContribution(tontineId, amount, notes = '') {
    try {
      return await this.apiCall(`/tontines/${tontineId}/contribute/`, {
        method: 'POST',
        body: JSON.stringify({ amount, notes })
      });
    } catch (error) {
      console.error('❌ Erreur contribution:', error);
      throw error;
    }
  }

  // Obtenir l'historique des contributions
  async getContributionHistory(tontineId) {
    try {
      return await this.apiCall(`/tontines/${tontineId}/contributions/`);
    } catch (error) {
      console.warn('❌ Erreur historique contributions:', error);
      return [];
    }
  }

  // ========================================
  // STATISTIQUES ET ANALYTICS
  // ========================================

  // Obtenir les statistiques de l'utilisateur
  async getUserStats() {
    try {
      return await this.apiCall('/tontines/stats/');
    } catch (error) {
      console.warn('❌ Erreur stats utilisateur:', error);
      return this.getFallbackStats();
    }
  }

  // Calculateur de recommandations
  async getRecommendations(userProfile = {}) {
    try {
      return await this.apiCall('/tontines/recommendations/', {
        method: 'POST',
        body: JSON.stringify(userProfile)
      });
    } catch (error) {
      console.warn('❌ Erreur recommandations:', error);
      return this.getFallbackRecommendations();
    }
  }

  // ========================================
  // SIMULATEUR DE TONTINES
  // ========================================

  // Simuler différents scénarios de tontine
  simulateTontine(params) {
    const {
      monthlyContribution = 50000,
      participants = 10,
      desiredPosition = 5,
      frequency = 'monthly'
    } = params;

    // Calculs financiers
    const totalPot = monthlyContribution * participants;
    const contributedAmount = monthlyContribution * desiredPosition;
    const netGain = totalPot - contributedAmount;
    const roi = ((netGain / contributedAmount) * 100).toFixed(2);
    
    // Analyse de risque
    const riskLevel = this.calculateRiskLevel(participants, desiredPosition);
    
    // Timeline des événements
    const timeline = this.generateTimeline(participants, desiredPosition, frequency);
    
    // Recommandations
    const recommendations = this.generateRecommendations(desiredPosition, participants, roi);

    return {
      totalPot,
      monthlyContribution,
      contributedAmount,
      netGain,
      roi: parseFloat(roi),
      riskLevel,
      timeline,
      recommendations,
      isRecommended: riskLevel <= 3 && parseFloat(roi) >= 0,
      scenario: desiredPosition <= participants / 2 ? 'early_benefit' : 'late_savings'
    };
  }

  // Calculer le niveau de risque (1-5)
  calculateRiskLevel(participants, position) {
    const ratio = position / participants;
    if (ratio <= 0.2) return 1; // Très faible risque
    if (ratio <= 0.4) return 2; // Faible risque
    if (ratio <= 0.6) return 3; // Risque modéré
    if (ratio <= 0.8) return 4; // Risque élevé
    return 5; // Risque très élevé
  }

  // Générer la timeline des événements
  generateTimeline(participants, position, frequency) {
    const timeline = [];
    const frequencyDays = {
      'weekly': 7,
      'biweekly': 14,
      'monthly': 30,
      'quarterly': 90
    };

    const daysBetween = frequencyDays[frequency] || 30;
    const startDate = new Date();

    for (let i = 1; i <= participants; i++) {
      const eventDate = new Date(startDate.getTime() + (i - 1) * daysBetween * 24 * 60 * 60 * 1000);
      timeline.push({
        position: i,
        date: eventDate.toISOString().split('T')[0],
        isUserTurn: i === position,
        type: i === position ? 'receive' : 'contribute',
        description: i === position 
          ? `Vous recevez le montant total`
          : `Contribution #${i}`
      });
    }

    return timeline;
  }

  // Générer des recommandations intelligentes
  generateRecommendations(position, participants, roi) {
    const recommendations = [];
    const ratio = position / participants;

    if (ratio <= 0.3) {
      recommendations.push({
        type: 'success',
        icon: '🎯',
        message: 'Position excellente ! Vous bénéficierez rapidement du système.'
      });
    } else if (ratio <= 0.5) {
      recommendations.push({
        type: 'good',
        icon: '👍',
        message: 'Bonne position équilibrée entre bénéfice et épargne.'
      });
    } else if (ratio <= 0.7) {
      recommendations.push({
        type: 'warning',
        icon: '⚖️',
        message: 'Position d\'épargne forcée. Bon pour la discipline financière.'
      });
    } else {
      recommendations.push({
        type: 'caution',
        icon: '⚠️',
        message: 'Position tardive. Assurez-vous de votre capacité d\'épargne.'
      });
    }

    if (participants > 20) {
      recommendations.push({
        type: 'info',
        icon: '👥',
        message: 'Grande tontine : gestion plus complexe mais montants plus importants.'
      });
    }

    if (parseFloat(roi) < -20) {
      recommendations.push({
        type: 'warning',
        icon: '💰',
        message: 'ROI négatif élevé. Considérez une position plus précoce.'
      });
    }

    return recommendations;
  }

  // ========================================
  // DONNÉES DE FALLBACK
  // ========================================

  getFallbackTontines() {
    return [
      {
        id: 'demo_1',
        name: '🎯 Créez votre première tontine',
        description: 'Commencez votre aventure Yoonu Dal',
        total_amount: 0,
        monthly_contribution: 0,
        current_participants: 0,
        max_participants: 0,
        status: 'demo',
        start_date: new Date().toISOString().split('T')[0],
        frequency: 'monthly',
        is_demo: true
      }
    ];
  }

  getFallbackActiveTontines() {
    return [
      {
        id: 'demo_active',
        name: 'Tontine de démonstration',
        total_amount: 500000,
        monthly_contribution: 25000,
        participants: 5,
        next_payment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'demo',
        user_position: 3,
        progress: 60,
        is_demo: true
      }
    ];
  }

  getFallbackStats() {
    return {
      total_tontines: 0,
      active_tontines: 0,
      total_contributed: 0,
      total_received: 0,
      net_balance: 0,
      success_rate: 0,
      avg_monthly_contribution: 0,
      is_demo: true
    };
  }

  getFallbackRecommendations() {
    return [
      {
        type: 'info',
        icon: '🚀',
        message: 'Commencez par créer votre première tontine !',
        action: 'create_tontine'
      },
      {
        type: 'tip',
        icon: '💡',
        message: 'Utilisez le simulateur pour optimiser vos paramètres.',
        action: 'use_simulator'
      }
    ];
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  // Vider le cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache tontines vidé');
  }

  // Rafraîchir toutes les données
  async refreshAllData() {
    this.clearCache();
    await Promise.all([
      this.getUserTontines(),
      this.getActiveTontines(),
      this.getUserStats()
    ]);
    console.log('🔄 Toutes les données tontines rafraîchies');
  }

  // Informations de debug
  getDebugInfo() {
    return {
      cacheSize: this.cache.size,
      cachedKeys: Array.from(this.cache.keys()),
      apiBaseUrl: API_BASE_URL,
      authToken: !!authService.getToken(),
      service: 'TontineService v1.0'
    };
  }

  // Valider un code d'invitation
  validateInvitationCode(code) {
    // Format attendu : 6-8 caractères alphanumériques
    const regex = /^[A-Z0-9]{6,8}$/;
    return regex.test(code.toUpperCase());
  }

  // Générer un code d'invitation
  generateInvitationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Formater les montants en FCFA
  formatAmount(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  // Calculer le statut d'une tontine
  calculateTontineStatus(tontine) {
    const now = new Date();
    const startDate = new Date(tontine.start_date);
    
    if (startDate > now) return 'pending';
    if (tontine.current_participants < tontine.max_participants) return 'recruiting';
    if (tontine.current_round < tontine.max_participants) return 'active';
    return 'completed';
  }
}

const tontineService = new TontineService();
export default tontineService;
