import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'https://yoonudal-api.onrender.com/api';

const API = axios.create({
  baseURL: API_BASE_URL,
});

console.log('🔧 API Base URL:', API_BASE_URL);

// Intercepteur request : ajouter le token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('yoonu_dal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variable pour éviter les boucles infinies de refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Intercepteur response : auto-refresh token sur 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si 401 et qu'on n'a pas déjà tenté un refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Si un refresh est déjà en cours, mettre en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('yoonu_dal_refresh_token');

      if (!refreshToken) {
        // Pas de refresh token → déconnexion
        localStorage.removeItem('yoonu_dal_token');
        localStorage.removeItem('yoonu_dal_refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Tenter le refresh
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken
        });

        const newToken = response.data.access;
        localStorage.setItem('yoonu_dal_token', newToken);

        // Mettre à jour le header par défaut
        API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        
        console.log('🔄 Token rafraîchi avec succès');
        
        // Rejouer la requête originale
        return API(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Refresh échoué → déconnexion
        localStorage.removeItem('yoonu_dal_token');
        localStorage.removeItem('yoonu_dal_refresh_token');
        console.log('❌ Refresh token expiré, déconnexion');
        window.location.href = '/login';
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
