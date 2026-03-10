import axios from 'axios';

// Créer une instance axios avec l'URL de production
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://yoonudal-api.onrender.com/api',
});

// ✅ Intercepteur request : utiliser la BONNE clé
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('yoonu_dal_token'); // 👈 CORRECTION ICI
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur response
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optionnel : nettoyer
      localStorage.removeItem('yoonu_dal_token');
      localStorage.removeItem('yoonu_dal_refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
