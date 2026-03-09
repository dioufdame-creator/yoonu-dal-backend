import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Register = ({ onNavigate, toast, onRegisterSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Étape 1: Informations de base
    first_name: '',
    last_name: '',
    email: '',
    
    // Étape 2: Authentification
    username: '',
    password: '',
    confirmPassword: '',
    
    // Étape 3: Préférences
    phone: '',
    birth_date: '',
    accept_terms: false,
    newsletter: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, error, clearError } = useAuth();

  // Gérer les changements de formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur lorsque l'utilisateur tape
    if (error) {
      clearError();
    }
  };

  // Validation étape 1
  const validateStep1 = () => {
    if (!formData.first_name.trim()) {
      toast.showError('Veuillez saisir votre prénom');
      return false;
    }
    if (!formData.last_name.trim()) {
      toast.showError('Veuillez saisir votre nom');
      return false;
    }
    if (!formData.email.trim()) {
      toast.showError('Veuillez saisir votre email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.showError('Veuillez saisir un email valide');
      return false;
    }
    return true;
  };

  // Validation étape 2
  const validateStep2 = () => {
    if (!formData.username.trim()) {
      toast.showError('Veuillez choisir un nom d\'utilisateur');
      return false;
    }
    if (formData.username.length < 3) {
      toast.showError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }
    if (!formData.password) {
      toast.showError('Veuillez saisir un mot de passe');
      return false;
    }
    if (formData.password.length < 8) {
      toast.showError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.showError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  // Validation étape 3
  const validateStep3 = () => {
    if (!formData.accept_terms) {
      toast.showError('Veuillez accepter les conditions d\'utilisation');
      return false;
    }
    return true;
  };

  // Naviguer entre les étapes
  const nextStep = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      default:
        isValid = true;
    }
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      toast.showSuccess(`Étape ${currentStep} terminée !`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Gérer la soumission finale
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    setIsLoading(true);
    
    try {
      // Préparer les données pour l'API
      const registrationData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || null,
        birth_date: formData.birth_date || null,
        newsletter: formData.newsletter
      };

      const result = await register(registrationData);

      if (result.success) {
        toast.showSuccess('Inscription réussie ! Bienvenue chez Yoonu Dal !');
        onNavigate('onboarding');
      } else {
        toast.showError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      toast.showError('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Barre de progression
  const progressPercentage = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inscription
          </h1>
          <p className="text-gray-600">
            Rejoignez la communauté Yoonu Dal
          </p>
        </div>

        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Étape {currentStep} sur 3
            </span>
            <span className="text-sm font-medium text-primary-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          {/* ÉTAPE 1: Informations personnelles */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">👤</span>
                Informations personnelles
              </h2>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Votre prénom"
                  required
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Votre nom"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 2: Authentification */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🔐</span>
                Authentification
              </h2>

              {/* Nom d'utilisateur */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Choisissez un nom d'utilisateur"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Au moins 3 caractères, sans espaces
                </p>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Choisissez un mot de passe sécurisé"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Au moins 8 caractères
                </p>
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Répétez votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3: Finalisation */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">✨</span>
                Finalisation
              </h2>

              {/* Téléphone (optionnel) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="+221 XX XXX XX XX"
                />
              </div>

              {/* Date de naissance (optionnel) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de naissance (optionnel)
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Newsletter */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="newsletter"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="newsletter" className="ml-2 text-sm text-gray-700">
                  Recevoir les actualités et conseils Yoonu Dal
                </label>
              </div>

              {/* Conditions d'utilisation */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="accept_terms"
                  name="accept_terms"
                  checked={formData.accept_terms}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 mt-1"
                  required
                />
                <label htmlFor="accept_terms" className="ml-2 text-sm text-gray-700">
                  J'accepte les{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    conditions d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    politique de confidentialité
                  </a>
                  *
                </label>
              </div>
            </div>
          )}

          {/* Erreur d'authentification */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in mt-6">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 text-xl">⚠️</span>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex space-x-4 mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all duration-200"
                disabled={isLoading}
              >
                ← Précédent
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-primary-600 to-green-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                disabled={isLoading}
              >
                Suivant →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !formData.accept_terms}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                  isLoading || !formData.accept_terms
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-green-600 hover:shadow-lg hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Inscription...</span>
                  </div>
                ) : (
                  '🎉 Créer mon compte'
                )}
              </button>
            )}
          </div>
        </form>

        {/* Lien vers connexion */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
              disabled={isLoading}
            >
              Se connecter
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

export default Register;