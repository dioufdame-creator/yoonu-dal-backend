// src/services/authService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'https://yoonudal-api.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur pour refresh token automatique
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        authService.clearTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

const authService = {

  // ── CONNEXION — email OU username ────────────────────────────
  login: async (credentials) => {
    try {
      const identifier = (credentials.username || credentials.email || '').trim().toLowerCase();
      const password = credentials.password;

      // Utiliser la nouvelle route qui accepte email ou username
      const response = await api.post('/auth/login/', {
        username: identifier,
        password: password,
      });

      const { access, refresh, user } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Identifiant ou mot de passe incorrect.';
      return { success: false, error: errorMsg };
    }
  },

  // ── INSCRIPTION ──────────────────────────────────────────────
  register: async (userData) => {
    try {
      const response = await api.post('/register/', {
        username: userData.username.toLowerCase().trim(),
        email: userData.email.trim(),
        password: userData.password,
        first_name: userData.first_name || userData.firstName || '',
        last_name: userData.last_name || userData.lastName || '',
      });

      const { access, refresh, user } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Erreur lors de l\'inscription.';

      if (errorData) {
        if (errorData.username) errorMsg = `Nom d'utilisateur : ${errorData.username[0]}`;
        else if (errorData.email) errorMsg = `Email : ${errorData.email[0]}`;
        else if (errorData.password) errorMsg = `Mot de passe : ${errorData.password[0]}`;
        else if (errorData.error) errorMsg = errorData.error;
        else if (errorData.detail) errorMsg = errorData.detail;
      }

      return { success: false, error: errorMsg };
    }
  },

  // ── MOT DE PASSE OUBLIÉ ──────────────────────────────────────
  forgotPassword: async (identifier) => {
    try {
      const response = await api.post('/auth/forgot-password/', {
        email: identifier.trim(),
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        'Erreur lors de l\'envoi. Contactez le support via WhatsApp.';
      return { success: false, error: errorMsg };
    }
  },

  // ── RÉINITIALISATION MOT DE PASSE ────────────────────────────
  resetPassword: async (uid, token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password/', {
        uid,
        token,
        new_password: newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        'Lien invalide ou expiré. Faites une nouvelle demande.';
      return { success: false, error: errorMsg };
    }
  },

  // ── DÉCONNEXION ──────────────────────────────────────────────
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      // ignore
    } finally {
      authService.clearTokens();
    }
  },

  // ── UTILITAIRES ──────────────────────────────────────────────
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getUserProfile: async () => {
    try {
      const response = await api.get('/profile/');
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getToken: () => localStorage.getItem('access_token'),
};

export default authService;
