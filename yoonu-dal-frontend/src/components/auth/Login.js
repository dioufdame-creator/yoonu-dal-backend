import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Login = ({ onNavigate, toast, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, error, clearError } = useAuth();

  // Gérer les changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur lorsque l'utilisateur tape
    if (error) {
      clearError();
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation côté client
    if (!formData.username.trim()) {
      toast.showError('Veuillez saisir votre nom d\'utilisateur ou email');
      return;
    }
    
    if (!formData.password) {
      toast.showError('Veuillez saisir votre mot de passe');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login({
        username: formData.username.trim(),
        password: formData.password
      });
      // Vérifier onboarding
      const user = result.user;

      if (user?.profile?.onboarding_completed === false) {
        onNavigate('onboarding');
        return;
      }

      if (result.success) {
        toast.showSuccess('Connexion réussie !');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        toast.showError(result.error || 'Erreur de connexion');
      }
    } catch (error) {
      toast.showError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion démo (optionnel)
  const handleDemoLogin = async () => {
    setIsLoading(true);
    toast.showInfo('Connexion avec compte démo...');
    
    try {
      const result = await login({
        username: 'demo@yoonudal.com',
        password: 'demo123'
      });

      if (result.success) {
        toast.showSuccess('Connexion démo réussie !');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        toast.showError('Compte démo non disponible');
      }
    } catch (error) {
      toast.showError('Erreur de connexion démo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connexion
          </h1>
          <p className="text-gray-600">
            Accédez à votre espace personnel Yoonu Dal
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom d'utilisateur / Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom d'utilisateur ou Email
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Votre nom d'utilisateur ou email"
                disabled={isLoading}
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                👤
              </span>
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pl-12 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Votre mot de passe"
                disabled={isLoading}
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                🔒
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Erreur d'authentification */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 text-xl">⚠️</span>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:shadow-lg hover:scale-105'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connexion en cours...</span>
              </div>
            ) : (
              '🚀 Se connecter'
            )}
          </button>

          {/* Mot de passe oublié */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
              disabled={isLoading}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>

        {/* Séparateur */}
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-500">ou</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Connexion démo */}
        <button
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🎭 Essayer avec un compte démo
        </button>

        {/* Lien vers inscription */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
              disabled={isLoading}
            >
              Créer un compte
            </button>
          </p>
        </div>

        {/* Retour à l'accueil */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
            disabled={isLoading}
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;