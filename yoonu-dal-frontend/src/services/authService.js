// src/services/authService.js - Version avec auto-login après inscription

const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'https://yoonudal-api.onrender.com/api';

class AuthService {
  constructor() {
    this.tokenKey = 'yoonu_dal_token';
    this.refreshTokenKey = 'yoonu_dal_refresh_token';
    this.userKey = 'yoonu_dal_user';
  }

  // Obtenir le token d'accès
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Obtenir le refresh token
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Obtenir les données utilisateur
  getCurrentUser() {
    const userStr = localStorage.getItem(this.userKey);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Erreur parsing user data:', error);
      return null;
    }
  }

  // Sauvegarder les tokens et utilisateur
  setAuthData(tokens, user = null) {
    if (tokens.access) {
      localStorage.setItem(this.tokenKey, tokens.access);
    }
    if (tokens.refresh) {
      localStorage.setItem(this.refreshTokenKey, tokens.refresh);
    }
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  
  // Connexion
  async login(credentials) {
    try {
      console.log('🔍 Tentative de connexion...', { username: credentials.username });
      
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur de connexion:', data);
        throw new Error(data.detail || Object.values(data).flat().join(', ') || 'Erreur de connexion');
      }

      console.log('✅ Connexion réussie, tokens reçus');

      // Sauvegarder les tokens
      this.setAuthData(data);

      // Récupérer les infos utilisateur
      const userInfo = await this.getUserProfile();
      
      return {
       success: true,
        user: userInfo,
        data: data
      };
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserProfile() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Pas de token disponible');
      }

      console.log('👤 Récupération du profil utilisateur...');

      const response = await fetch(`${API_BASE_URL}/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const userInfo = await response.json();
      console.log('✅ Profil utilisateur récupéré:', userInfo);
      
      // Vérifier si les champs subscription sont présents
      if (!userInfo.profile.hasOwnProperty('trial_active')) {
        console.log('⚠️ Champs subscription manquants, appel à subscription-status...');
        
        try {
          const subscriptionResponse = await fetch(`${API_BASE_URL}/payments/subscription-status/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json();
            
            // Enrichir le profil
            userInfo.profile = {
              ...userInfo.profile,
              subscription_tier: subscriptionData.subscription_tier,
              trial_active: subscriptionData.trial_active,
              trial_days_remaining: subscriptionData.trial_days_remaining,
              trial_used: subscriptionData.trial_used,
              is_premium: subscriptionData.is_premium,
              ai_messages_count: subscriptionData.ai_messages_count,
              ai_messages_limit: subscriptionData.ai_messages_limit
            };
            
            console.log('✅ Profil enrichi avec subscription-status');
          }
        } catch (subError) {
          console.warn('⚠️ Impossible de récupérer subscription-status:', subError);
        }
      } else {
        console.log('✅ Champs subscription déjà présents dans le profil');
      }
      
      localStorage.setItem(this.userKey, JSON.stringify(userInfo));
      
      return userInfo;
    } catch (error) {
      console.error('❌ Erreur profil utilisateur:', error);
      return null;
    }
  }

  // Rafraîchir le token
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Pas de refresh token');
      }

      console.log('🔄 Rafraîchissement du token...');

      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Impossible de rafraîchir le token');
      }

      const data = await response.json();
      localStorage.setItem(this.tokenKey, data.access);
      
      console.log('✅ Token rafraîchi avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur refresh token:', error);
      this.logout();
      return false;
    }
  }

  // Déconnexion
  logout() {
    console.log('🚪 Déconnexion...');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Nettoyer les tokens
  clearTokens() {
    localStorage.removeItem('yoonu_dal_token');
    localStorage.removeItem('yoonu_dal_refresh_token');
    localStorage.removeItem('yoonu_dal_user');
    this.isAuthenticated = false;
    this.user = null;
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Vérifier si le token n'est pas expiré
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      const isValid = payload.exp > currentTime;
      if (!isValid) {
        console.warn('⚠️ Token expiré');
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ Erreur validation token:', error);
      return false;
    }
  }

  // ✅ INSCRIPTION AVEC AUTO-LOGIN
  async register(userData) {
    try {
      console.log('🔍 Tentative d\'inscription...', { username: userData.username });
      
      // 1. Créer le compte
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur d\'inscription:', data);
        throw new Error(Object.values(data).flat().join(', '));
      }

      console.log('✅ Inscription réussie:', data);
      
      // ✅ 2. AUTO-LOGIN : Se connecter automatiquement
      console.log('🔐 Auto-connexion après inscription...');
      const loginResult = await this.login({
        username: userData.username,
        password: userData.password
      });

      if (loginResult.success) {
        console.log('✅ Auto-connexion réussie');
        return {
          success: true,
          message: data.message,
          user: loginResult.user,  // ✅ RETOURNER LE USER
          userId: data.user_id
        };
      } else {
        // Inscription OK mais auto-login échoué
        console.warn('⚠️ Inscription OK mais auto-login échoué');
        return {
          success: true,
          message: 'Compte créé, veuillez vous connecter',
          user: null,
          userId: data.user_id
        };
      }
    } catch (error) {
      console.error('❌ Erreur d\'inscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Méthode générique pour tous les appels API
  async apiCall(endpoint, options = {}) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Pas de token d\'authentification');
      }

      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const config = {
        method: 'GET',
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      };

      console.log(`🔗 Appel API: ${config.method} ${url}`);

      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expiré, essayer de le rafraîchir
        console.log('🔄 Token expiré, tentative de rafraîchissement...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Refaire l'appel avec le nouveau token
          config.headers['Authorization'] = `Bearer ${this.getToken()}`;
          return await fetch(url, config);
        } else {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
      }

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Réponse reçue de ${endpoint}:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ Erreur appel API ${endpoint}:`, error);
      throw error;
    }
  }

  // Test de connectivité
  async testConnection() {
    try {
      console.log('🔌 Test de connexion à Django...');
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Django accessible:', data);
        return true;
      } else {
        console.error('❌ Django répond avec erreur:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Django inaccessible:', error);
      return false;
    }
  }

  // Debug info
  getDebugInfo() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    let tokenInfo = {};
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        tokenInfo = {
          exp: new Date(payload.exp * 1000).toLocaleString(),
          iat: new Date(payload.iat * 1000).toLocaleString(),
          username: payload.username || 'unknown'
        };
      } catch (error) {
        tokenInfo = { error: 'Invalid token format' };
      }
    }
    
    return {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenInfo,
      user: user ? user.user?.username : 'none',
      userEmail: user ? user.user?.email : 'none',
      isAuthenticated: this.isAuthenticated(),
      apiUrl: API_BASE_URL,
      localStorage: {
        tokenKey: this.tokenKey,
        hasRefreshToken: !!this.getRefreshToken()
      }
    };
  }
}

const authService = new AuthService();
export default authService;
