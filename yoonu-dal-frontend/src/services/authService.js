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

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getCurrentUser() {
    const userStr = localStorage.getItem(this.userKey);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Erreur parsing user data:', error);
      return null;
    }
  }

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

  // ✅ Connexion — username en minuscules
  async login(credentials) {
    try {
      console.log('🔍 Tentative de connexion...', { username: credentials.username });

      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          username: credentials.username.toLowerCase().trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur de connexion:', data);
        throw new Error(data.detail || Object.values(data).flat().join(', ') || 'Erreur de connexion');
      }

      console.log('✅ Connexion réussie, tokens reçus');
      this.setAuthData(data);

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
      if (!token) throw new Error('Pas de token disponible');

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
      }

      localStorage.setItem(this.userKey, JSON.stringify(userInfo));
      return userInfo;
    } catch (error) {
      console.error('❌ Erreur profil utilisateur:', error);
      return null;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error('Pas de refresh token');

      console.log('🔄 Rafraîchissement du token...');

      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (!response.ok) throw new Error('Impossible de rafraîchir le token');

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

  logout() {
    console.log('🚪 Déconnexion...');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  clearTokens() {
    localStorage.removeItem('yoonu_dal_token');
    localStorage.removeItem('yoonu_dal_refresh_token');
    localStorage.removeItem('yoonu_dal_user');
    this.isAuthenticated = false;
    this.user = null;
  }

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp > Date.now() / 1000;
      if (!isValid) console.warn('⚠️ Token expiré');
      return isValid;
    } catch (error) {
      console.error('❌ Erreur validation token:', error);
      return false;
    }
  }

  // ✅ Inscription avec auto-login — username en minuscules
  async register(userData) {
    try {
      console.log('🔍 Tentative d\'inscription...', { username: userData.username });

      const normalizedData = {
        ...userData,
        username: userData.username.toLowerCase().trim()
      };

      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur d\'inscription:', data);
        throw new Error(Object.values(data).flat().join(', '));
      }

      console.log('✅ Inscription réussie:', data);

      // Auto-login avec username normalisé
      console.log('🔐 Auto-connexion après inscription...');
      const loginResult = await this.login({
        username: normalizedData.username,
        password: userData.password
      });

      if (loginResult.success) {
        console.log('✅ Auto-connexion réussie');
        return {
          success: true,
          message: data.message,
          user: loginResult.user,
          userId: data.user_id
        };
      } else {
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

  async apiCall(endpoint, options = {}) {
    try {
      const token = this.getToken();
      if (!token) throw new Error('Pas de token d\'authentification');

      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

      const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const config = {
        method: 'GET',
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) }
      };

      const response = await fetch(url, config);

      if (response.status === 401) {
        console.log('🔄 Token expiré, tentative de rafraîchissement...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          config.headers['Authorization'] = `Bearer ${this.getToken()}`;
          return await fetch(url, config);
        } else {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
      }

      if (!response.ok) throw new Error(`Erreur ${response.status}: ${response.statusText}`);

      return await response.json();
    } catch (error) {
      console.error(`❌ Erreur appel API ${endpoint}:`, error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Django accessible:', data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Django inaccessible:', error);
      return false;
    }
  }

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
