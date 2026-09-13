import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Register = ({ onNavigate, toast, onRegisterSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '',
    username: '', password: '', confirmPassword: '',
    phone: '', birth_date: '', accept_terms: false, newsletter: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, error, clearError } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) clearError();
  };

  const validateStep1 = () => {
    if (!formData.first_name.trim()) { toast.showError('Veuillez saisir votre prénom'); return false; }
    if (!formData.last_name.trim()) { toast.showError('Veuillez saisir votre nom'); return false; }
    if (!formData.email.trim()) { toast.showError('Veuillez saisir votre email'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.showError('Veuillez saisir un email valide'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.username.trim()) { toast.showError('Veuillez choisir un nom d\'utilisateur'); return false; }
    if (formData.username.length < 3) { toast.showError('Le nom d\'utilisateur doit contenir au moins 3 caractères'); return false; }
    if (!formData.password) { toast.showError('Veuillez saisir un mot de passe'); return false; }
    if (formData.password.length < 8) { toast.showError('Le mot de passe doit contenir au moins 8 caractères'); return false; }
    if (formData.password !== formData.confirmPassword) { toast.showError('Les mots de passe ne correspondent pas'); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.accept_terms) { toast.showError('Veuillez accepter les conditions d\'utilisation'); return false; }
    return true;
  };

  const nextStep = () => {
    let isValid = false;
    switch (currentStep) {
      case 1: isValid = validateStep1(); break;
      case 2: isValid = validateStep2(); break;
      default: isValid = true;
    }
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
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

  const progressPercentage = (currentStep / 3) * 100;
  const stepTitles = { 1: { icon: '👤', label: 'Informations personnelles' }, 2: { icon: '🔐', label: 'Authentification' }, 3: { icon: '✨', label: 'Finalisation' } };

  const inputClass = "w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-green-500";
  const labelClass = "block text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6">

        <div className="text-center mb-5">
          <div className="text-5xl mb-3">📝</div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Inscription</h1>
          <p className="text-sm text-gray-500">Rejoignez la communauté Yoonu Dal</p>
        </div>

        {/* Barre de progression */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-500">Étape {currentStep} sur 3</span>
            <span className="text-xs font-bold text-green-600">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-green-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
            <span className="text-lg">{stepTitles[currentStep].icon}</span>
            {stepTitles[currentStep].label}
          </h2>

          {currentStep === 1 && (
            <>
              <div>
                <label className={labelClass}>Prénom</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                  className={inputClass} placeholder="Votre prénom" required />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                  className={inputClass} placeholder="Votre nom" required />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className={inputClass} placeholder="votre@email.com" required />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div>
                <label className={labelClass}>Nom d'utilisateur</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange}
                  className={inputClass} placeholder="Choisissez un nom d'utilisateur" required />
                <p className="text-[11px] text-gray-400 mt-1">Au moins 3 caractères, sans espaces</p>
              </div>
              <div>
                <label className={labelClass}>Mot de passe</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                    className={`${inputClass} pr-11`} placeholder="Mot de passe sécurisé" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Au moins 8 caractères</p>
              </div>
              <div>
                <label className={labelClass}>Confirmer le mot de passe</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    className={`${inputClass} pr-11`} placeholder="Répétez votre mot de passe" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div>
                <label className={labelClass}>Téléphone (optionnel)</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className={inputClass} placeholder="+221 XX XXX XX XX" />
              </div>
              <div>
                <label className={labelClass}>Date de naissance (optionnel)</label>
                <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" name="newsletter" checked={formData.newsletter} onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded" />
                Recevoir les actualités et conseils Yoonu Dal
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input type="checkbox" name="accept_terms" checked={formData.accept_terms} onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded mt-0.5" required />
                <span>
                  J'accepte les <a href="#" className="text-green-600 font-semibold">conditions d'utilisation</a> et la{' '}
                  <a href="#" className="text-green-600 font-semibold">politique de confidentialité</a>
                </span>
              </label>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} disabled={isLoading}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">
                ← Précédent
              </button>
            )}
            {currentStep < 3 ? (
              <button type="button" onClick={nextStep} disabled={isLoading}
                className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg">
                Suivant →
              </button>
            ) : (
              <button type="submit" disabled={isLoading || !formData.accept_terms}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-sm text-white ${
                  isLoading || !formData.accept_terms ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg'
                }`}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Inscription...
                  </span>
                ) : '🎉 Créer mon compte'}
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Déjà un compte ?{' '}
            <button onClick={() => onNavigate('login')} className="text-green-600 font-bold" disabled={isLoading}>
              Se connecter
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

export default Register;
