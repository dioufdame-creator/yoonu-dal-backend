import axios from 'axios';

// ✅ CORRECTION FINALE : Logique identique à authService
const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'https://yoonudal-api.onrender.com/api';

// Créer une instance axios avec l'URL correcte
const API = axios.create({
  baseURL: API_BASE_URL,
});

console.log('🔧 API Base URL:', API_BASE_URL); // ✅ Debug log

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

// Intercepteur response : gérer les erreurs 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('yoonu_dal_token');
      localStorage.removeItem('yoonu_dal_refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
