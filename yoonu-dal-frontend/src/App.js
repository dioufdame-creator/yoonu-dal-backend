import React, { useState, useEffect } from 'react';
import './App.css';
import YoonuScorePage from './components/score/YoonuScorePage';
import AlertsPage from './components/alerts/AlertsPage';
import AlertsBadge from './components/alerts/AlertsBadge';
import SimpleDiagnostic from './components/diagnostic/SimpleDiagnostic';

import authService from './services/authService';
import API from './services/api';

import Navigation from './components/shared/Navigation';
import BottomNav from './components/shared/BottomNav';
import Footer from './components/shared/Footer';
import { ToastContainer, useToast } from './components/shared/Toast';
import Home from './components/Home';
import Home2 from './components/Home2';
import Dashboard from './components/dashboard/Dashboard';
import ValueSelector from './components/consciousness/ValueSelector';
import ExpenseTracker from './components/control/ExpenseTracker';
import TontinesList from './components/tontines/TontinesList';
import TontineDetail from './components/tontines/TontineDetail';
import TontineInvitePage from './components/tontines/TontineInvitePage';
import IncomesPage from './components/incomes/IncomesPage';
import TontineAnalysis from './components/tontines/TontineAnalysis';
import EnvelopeManager from './components/envelopeManager/EnvelopeManager';
import CategoryRulesPage from './components/envelopeManager/CategoryRulesPage';
import { ForgotPasswordForm, ResetPasswordForm } from './components/auth/AuthForms';
import ProfileHub from './components/profile/ProfileHub';
import QuickAdd from './components/quickadd/QuickAdd';

import TransactionsPage from './components/transactions/TransactionsPage';

import AIChatWidget from './components/ai/AIChatWidget';
import NotificationManager from './components/notifications/NotificationManager';
import OnboardingTutorial from './components/onboarding/OnboardingTutorial';
import Onboarding from './components/onboarding/Onboarding';

import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentResultPage from './pages/PaymentResultPage';
import {
  SubscriptionBadge,
  PremiumGate,
  PremiumButton,
  UsageLimitIndicator
} from './components/subscription/SubscriptionComponents';

import GoalsPage from './components/goals/GoalsPage';
import DebtsPage from './components/debts/DebtsPage';
import DebtDetailPage from './components/debts/DebtDetailPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setIsAuthenticated(true);
            setUser(currentUser);
          } else {
            authService.clearTokens();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          authService.clearTokens();
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        authService.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
        setAuthError('Erreur de connexion au serveur');
      } finally {
        setIsLoading(false);

        // Détection des paramètres URL
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page');
        const uid = params.get('uid');
        const token = params.get('token');

        if (page === 'reset-password' && uid && token) {
          setCurrentPage('reset-password');
          setPageParams({ uid, token });
        } else if (path.startsWith('/payment/success')) {
          if (authService.isAuthenticated()) {
            setCurrentPage('payment-success');
          } else {
            setCurrentPage('login');
          }
        } else if (path.startsWith('/payment/cancel')) {
          setCurrentPage('pricing');
        } else if (path.startsWith('/join/')) {
          const code = path.replace('/join/', '').trim();
          if (code) {
            setCurrentPage('tontine-invite');
            setPageParams({ code });
          }
        }
      }
    };
    initializeAuth();
  }, []);

  const handlePaymentSuccess = async () => {
    const updatedUser = await authService.getUserProfile();
    if (updatedUser) setUser(updatedUser);
  };

  const handleNavigate = (page, params = {}) => {
    const protectedPages = [
      'dashboard', 'expenses', 'transactions', 'incomes', 'envelopes', 'tontines',
      'tontine-detail', 'tontine-analysis',
      'profile', 'profile-hub', 'quick-add', 'settings', 'score', 'alerts',
      'diagnostic', 'values', 'category-rules', 'goals', 'debts', 'debt-detail',
      'subscription'
    ];
    if (protectedPages.includes(page) && !isAuthenticated) {
      setCurrentPage('login');
      return;
    }
    if ((page === 'login' || page === 'register') && isAuthenticated) {
      setCurrentPage('dashboard');
      return;
    }
    setCurrentPage(page);
    setPageParams(params);
  };

  const handleLogin = async (credentials) => {
    try {
      const result = await authService.login(credentials);
      if (!result.success) {
        const errorMsg = result.error || 'Identifiant ou mot de passe incorrect.';
        setAuthError(errorMsg);
        showError(errorMsg);
        return;
      }
      if (result.user) {
        setIsAuthenticated(true);
        setUser(result.user);
        setAuthError(null);
        try {
          const response = await API.get('/onboarding/status/');
          const pendingCode = localStorage.getItem('pending_invite_code');
          if (response.data.onboarding_complete) {
            if (pendingCode) {
              localStorage.removeItem('pending_invite_code');
              handleNavigate('tontine-invite', { code: pendingCode });
            } else {
              handleNavigate('dashboard');
            }
          } else {
            handleNavigate('onboarding');
          }
        } catch (error) {
          handleNavigate('dashboard');
        }
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        error.message ||
        'Identifiant ou mot de passe incorrect.';
      setAuthError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleRegister = async (userData) => {
    setAuthError(null);
    try {
      const result = await authService.register(userData);
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        handleNavigate('onboarding');
        return { success: true };
      } else {
        setAuthError(result.error);
        showError(result.error || 'Erreur lors de l\'inscription');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = 'Erreur de connexion au serveur lors de l\'inscription.';
      setAuthError(errorMsg);
      showError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // ignore
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setAuthError(null);
      setCurrentPage('home');
    }
  };

  const clearAuthError = () => setAuthError(null);

  const toastMethods = { showSuccess, showError, showWarning, showInfo };
  const authMethods = { onLogout: handleLogout, isAuthenticated, user, authError, clearAuthError };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="mb-8">
            <div className="inline-block animate-bounce">
              <span className="text-6xl">🌱</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Yoonu Dal</h2>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home2 onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

      case 'home2':
        return <Home2 onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

      case 'login':
        if (isAuthenticated) { handleNavigate('dashboard'); return null; }
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce-slow">🌱</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
                <p className="text-gray-600">Bienvenue sur Yoonu Dal</p>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold mb-0.5">Connexion impossible</p>
                    <p>{authError}</p>
                  </div>
                  <button onClick={clearAuthError} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none flex-shrink-0">✕</button>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setAuthError(null);
                const formData = new FormData(e.target);
                await handleLogin({
                  username: formData.get('username'),
                  password: formData.get('password')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email ou nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      name="username"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="email@exemple.com ou votre pseudo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                    <input
                      type="password"
                      name="password"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Se connecter
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => handleNavigate('forgot-password')}
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  🔑 Mot de passe oublié ?
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-600">
                  Pas encore de compte ?{' '}
                  <button onClick={() => handleNavigate('register')} className="text-green-600 font-semibold hover:text-green-700">
                    S'inscrire
                  </button>
                </p>
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => handleNavigate('home')} className="text-sm text-gray-500 hover:text-gray-700">
                  ← Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        );

      case 'forgot-password':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🔑</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Entrez votre email ou nom d'utilisateur. Nous vous enverrons un lien pour créer un nouveau mot de passe.
                </p>
              </div>
              <ForgotPasswordForm onNavigate={handleNavigate} toast={toastMethods} />
              <div className="mt-6 text-center">
                <button onClick={() => handleNavigate('login')} className="text-sm text-gray-500 hover:text-gray-700">
                  ← Retour à la connexion
                </button>
              </div>
            </div>
          </div>
        );

      case 'reset-password':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h2>
                <p className="text-gray-600 text-sm">Choisissez un nouveau mot de passe pour votre compte.</p>
              </div>
              <ResetPasswordForm
                uid={pageParams?.uid}
                token={pageParams?.token}
                onSuccess={() => handleNavigate('login')}
                onNavigate={handleNavigate}
                toast={toastMethods}
              />
            </div>
          </div>
        );

      case 'register':
        if (isAuthenticated) { handleNavigate('dashboard'); return null; }
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce-slow">🌱</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Inscription</h2>
                <p className="text-gray-600">Rejoignez Yoonu Dal</p>
              </div>
              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">⚠️</span>
                  <div className="flex-1">{authError}</div>
                  <button onClick={clearAuthError} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none flex-shrink-0">✕</button>
                </div>
              )}
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const password = formData.get('password');
                const confirmPassword = formData.get('confirmPassword');
                if (password !== confirmPassword) {
                  showError('Les mots de passe ne correspondent pas');
                  return;
                }
                await handleRegister({
                  username: formData.get('username'),
                  email: formData.get('email'),
                  password: password,
                  first_name: formData.get('firstName'),
                  last_name: formData.get('lastName')
                });
              }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                      <input type="text" name="firstName"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                      <input type="text" name="lastName"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom d'utilisateur</label>
                    <input type="text" name="username"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input type="email" name="email"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                    <input type="password" name="password"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
                    <input type="password" name="confirmPassword"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required />
                  </div>
                </div>
                <button type="submit"
                  className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                  S'inscrire
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Déjà un compte ?{' '}
                  <button onClick={() => handleNavigate('login')} className="text-green-600 font-semibold hover:text-green-700">
                    Se connecter
                  </button>
                </p>
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => handleNavigate('home')} className="text-sm text-gray-500 hover:text-gray-700">
                  ← Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        );

      case 'onboarding':
        return <Onboarding toast={toastMethods} onNavigate={handleNavigate} setAuth={setUser} />;

      case 'goals':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <GoalsPage toast={toastMethods} onNavigate={handleNavigate} />;

      case 'score':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <YoonuScorePage toast={toastMethods} onNavigate={handleNavigate} />;

      case 'transactions':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <TransactionsPage onNavigate={handleNavigate} toast={toastMethods} user={user} />;

      case 'expenses':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        handleNavigate('transactions');
        return null;

      case 'incomes':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        handleNavigate('transactions');
        return null;

      case 'alerts':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <AlertsPage />;

      case 'pricing':
        return <PricingPage onNavigate={handleNavigate} user={user} toast={toastMethods} />;

      case 'checkout':
        return <CheckoutPage onNavigate={handleNavigate} toast={toastMethods} plan={pageParams?.plan || 'monthly'} />;

      case 'payment-success':
        return <PaymentResultPage onNavigate={handleNavigate} toast={toastMethods} status="success" onPaymentSuccess={handlePaymentSuccess} />;

      case 'payment-cancel':
        return <PaymentResultPage onNavigate={handleNavigate} toast={toastMethods} status="cancel" />;

      case 'subscription':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <SubscriptionPage onNavigate={handleNavigate} user={user} toast={toastMethods} />;

      case 'dashboard':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <Dashboard toast={toastMethods} auth={authMethods} onNavigate={handleNavigate} user={user} />;

      case 'envelopes':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <EnvelopeManager onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

      case 'category-rules':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <CategoryRulesPage onNavigate={handleNavigate} toast={toastMethods} />;

      // ✅ Hub profil "Moi"
      case 'profile-hub':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <ProfileHub onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;

      // ✅ Saisie rapide dépense/revenu
      case 'quick-add':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <QuickAdd type={pageParams?.type || 'expense'} onNavigate={handleNavigate} toast={toastMethods} />;

      case 'debts':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <DebtsPage toast={toastMethods} onNavigate={handleNavigate} />;

      case 'debt-detail':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <DebtDetailPage debtId={pageParams?.debtId} toast={toastMethods} onNavigate={handleNavigate} />;

      case 'tontines':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <TontinesList onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

      case 'tontine-invite':
        return <TontineInvitePage inviteCode={pageParams?.code} onNavigate={handleNavigate} toast={toastMethods} isAuthenticated={isAuthenticated} />;

      case 'diagnostic':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <SimpleDiagnostic onNavigate={handleNavigate} toast={toastMethods} />;

      case 'values':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <ValueSelector onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

      case 'tontine-detail':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <TontineDetail onNavigate={handleNavigate} tontineId={pageParams?.id} toast={toastMethods} user={user} />;

      case 'tontine-analysis':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <TontineAnalysis onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

      case 'profile':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        handleNavigate('profile-hub');
        return null;

      case 'settings':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 pb-24">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6 text-center">⚙️ Paramètres</h2>
              <div className="space-y-4">
                <button onClick={() => handleNavigate('category-rules')}
                  className="w-full text-left p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
                  🗂️ Mes règles de classement
                </button>
                <button onClick={() => handleNavigate('values')}
                  className="w-full text-left p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                  💎 Mes valeurs personnelles
                </button>
                <button onClick={() => handleNavigate('subscription')}
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  💎 Mon Abonnement
                </button>
                <button onClick={handleLogout}
                  className="w-full text-left p-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium">
                  🚪 Déconnexion
                </button>
              </div>
              <button onClick={() => handleNavigate('dashboard')}
                className="w-full mt-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                ← Retour au tableau de bord
              </button>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 pb-24">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6 text-center">❓ Aide & Support</h2>
              <div className="space-y-4 text-center">
                <p>Besoin d'aide ? Notre équipe est là pour vous !</p>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold">📧 Email</p>
                    <p className="text-blue-600">support@yoonudal.com</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-semibold">💬 WhatsApp</p>
                    <p className="text-green-600">+221 77 356 94 62</p>
                  </div>
                </div>
              </div>
              <button onClick={() => handleNavigate(isAuthenticated ? 'dashboard' : 'home')}
                className="w-full mt-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                ← Retour {isAuthenticated ? 'au dashboard' : 'à l\'accueil'}
              </button>
            </div>
          </div>
        );

      default:
        return <Home onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;
    }
  };

  return (
    <div className="App min-h-screen flex flex-col">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        alertsBadge={isAuthenticated ? (
          <AlertsBadge onClick={() => handleNavigate('alerts')} />
        ) : null}
      />

      {isAuthenticated && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-xs text-amber-800 font-medium">
            🧪 Yoonu Dal est en phase test. Vos retours sont précieux pour construire une application utile et adaptée à nos réalités.
          </p>
        </div>
      )}

      <div className="flex-grow">
        {renderPage()}
      </div>
      <Footer />

      {/* ✅ Bottom navigation mobile */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {isAuthenticated && (
        <AIChatWidget onNavigate={handleNavigate} toast={toastMethods} user={user} />
      )}
      {isAuthenticated && (
        <NotificationManager user={user} toast={toastMethods} />
      )}
      {isAuthenticated && (
        <OnboardingTutorial onNavigate={handleNavigate} onClose={() => {}} />
      )}
    </div>
  );
}

export default App;
