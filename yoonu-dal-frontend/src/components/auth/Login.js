import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Login = ({ onNavigate, toast, onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, error, clearError } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const user = result.user;

      if (user?.profile?.onboarding_completed === false) {
        onNavigate('onboarding');
        return;
      }

      if (result.success) {
        toast.showSuccess('Connexion réussie !');
        if (onLoginSuccess) onLoginSuccess();
      } else {
        toast.showError(result.error || 'Erreur de connexion');
      }
    } catch (error) {
      toast.showError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6">

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Connexion</h1>
          <p className="text-sm text-gray-500">Accédez à votre espace Yoonu Dal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
              Nom d'utilisateur ou Email
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 pl-11 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Votre nom d'utilisateur ou email"
                disabled={isLoading}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pl-11 pr-11 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Votre mot de passe"
                disabled={isLoading}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all ${
              isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connexion...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-green-600 text-sm font-semibold"
              disabled={isLoading}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <button onClick={() => onNavigate('register')} className="text-green-600 font-bold" disabled={isLoading}>
              Créer un compte
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button onClick={() => onNavigate('home')} className="text-gray-400 text-xs" disabled={isLoading}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
