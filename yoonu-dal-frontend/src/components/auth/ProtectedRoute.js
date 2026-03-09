// src/components/auth/ProtectedRoute.js

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, requireGuest = false, fallback = null, onNavigate = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Fonction pour naviguer - utilise onNavigate si disponible, sinon essaie de trouver la fonction globale
  const handleNavigate = (page) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // Fallback : essayer de trouver la fonction de navigation globale
      if (window.navigateToPage) {
        window.navigateToPage(page);
      } else {
        // Dernier recours : émettre un événement custom
        const event = new CustomEvent('appNavigate', { detail: { page } });
        window.dispatchEvent(event);
      }
    }
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Chargement...</h2>
          <p className="text-gray-500">Vérification de votre session</p>
        </div>
      </div>
    );
  }

  // Route protégée : nécessite une authentification
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center animate-scale-in">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Accès Restreint
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à cette page.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => handleNavigate('login')}
              className="w-full bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🔐 Se connecter
            </button>
            <button 
              onClick={() => handleNavigate('register')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              📝 Créer un compte
            </button>
            <button 
              onClick={() => handleNavigate('home')}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200 mt-4"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Route pour invités : nécessite de ne PAS être authentifié
  if (requireGuest && isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center animate-scale-in">
          <div className="text-6xl mb-6">👋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Déjà connecté !
          </h2>
          <p className="text-gray-600 mb-2">
            Bonjour <span className="font-semibold text-primary-600">{user?.first_name || user?.username}</span>
          </p>
          <p className="text-gray-600 mb-6">
            Vous êtes déjà connecté à votre compte.
          </p>
          <button 
            onClick={() => handleNavigate('dashboard')}
            className="w-full bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            📊 Aller au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // Afficher le contenu si les conditions sont remplies
  return children;
};

// Composant spécialisé pour les routes privées
export const PrivateRoute = ({ children, fallback, onNavigate }) => (
  <ProtectedRoute requireAuth={true} fallback={fallback} onNavigate={onNavigate}>
    {children}
  </ProtectedRoute>
);

// Composant spécialisé pour les routes publiques (invités seulement)
export const GuestRoute = ({ children, fallback, onNavigate }) => (
  <ProtectedRoute requireGuest={true} fallback={fallback} onNavigate={onNavigate}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;