import React, { useState, useEffect } from 'react';
import './App.css';
import YoonuScorePage from './components/score/YoonuScorePage';
import AlertsPage from './components/alerts/AlertsPage';
import AlertsBadge from './components/alerts/AlertsBadge';
import SimpleDiagnostic from './components/diagnostic/SimpleDiagnostic';

import authService from './services/authService';
import API from './services/api';

import Navigation from './components/shared/Navigation';
import Footer from './components/shared/Footer';
import { ToastContainer, useToast } from './components/shared/Toast';
import Home from './components/Home';
import Dashboard from './components/dashboard/Dashboard';
import ValueSelector from './components/consciousness/ValueSelector';
import ExpenseTracker from './components/control/ExpenseTracker';
import TontinesList from './components/tontines/TontinesList';
import TontineDetail from './components/tontines/TontineDetail';
import TontineInvitePage from './components/tontines/Tontineinvitepage';
import IncomesPage from './components/incomes/IncomesPage';
import TontineAnalysis from './components/tontines/TontineAnalysis';
import EnvelopeManager from './components/envelopeManager/EnvelopeManager';

import TransactionsPage from './components/transactions/TransactionsPage';

import AIChatWidget from './components/ai/AIChatWidget';
import Onboarding from './components/onboarding/Onboarding';

import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import SubscriptionPage from './pages/SubscriptionPage';
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
      console.log('🔄 Initialisation de l\'authentification...');
      setIsLoading(true);
      
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          console.log('✅ Token valide trouvé, utilisateur:', currentUser?.username);
          
          if (currentUser) {
            setIsAuthenticated(true);
            setUser(currentUser);
          } else {
            authService.clearTokens();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          console.log('❌ Aucun token valide trouvé');
          authService.clearTokens();
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('🚨 Erreur initialisation auth:', error);
        authService.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
        setAuthError('Erreur de connexion au serveur');
      } finally {
        setIsLoading(false);

        // ✅ Détecter un lien d'invitation dans l'URL au chargement
        const path = window.location.pathname;
        if (path.startsWith('/join/')) {
          const code = path.replace('/join/', '').trim();
          if (code) {
            console.log('🔗 Code d\'invitation détecté dans l\'URL:', code);
            setCurrentPage('tontine-invite');
            setPageParams({ code });
          }
        }
      }
    };

    initializeAuth();
  }, []);

  const handleNavigate = (page, params = {}) => {
    console.log('🧭 Navigation vers:', page);
    
    const protectedPages = [
      'dashboard', 'expenses', 'transactions', 'incomes', 'envelopes', 'tontines', 
      'tontine-detail', 'tontine-analysis',
      'profile', 'settings', 'score', 'alerts',
      'diagnostic', 'values'
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
      
      if (result.user) {
        setIsAuthenticated(true);
        setUser(result.user);
        
        try {
          const response = await API.get('/onboarding/status/');
          
          // Vérifier si un code d'invitation est en attente
          const pendingCode = localStorage.getItem('pending_invite_code');

          if (response.data.onboarding_complete) {
            if (pendingCode) {
              localStorage.removeItem('pending_invite_code');
              handleNavigate('tontine-invite', { code: pendingCode });
            } else {
              handleNavigate('dashboard');
            }
          } else {
            // Laisser le pending_invite_code en localStorage, sera géré après onboarding
            handleNavigate('onboarding');
          }
        } catch (error) {
          console.error('Erreur vérification onboarding:', error);
          handleNavigate('dashboard');
        }
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      const errorMsg = error.response?.data?.detail || 'Nom d\'utilisateur ou mot de passe incorrect';
      setAuthError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleRegister = async (userData) => {
    console.log('📝 Tentative d\'inscription pour:', userData.username);
    setAuthError(null);
    
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        console.log('✅ Inscription réussie:', result.user?.username);
        setIsAuthenticated(true);
        setUser(result.user);
        handleNavigate('onboarding');
        return { success: true };
      } else {
        console.log('❌ Inscription échouée:', result.error);
        setAuthError(result.error);
        showError(result.error || 'Erreur lors de l\'inscription');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('🚨 Erreur lors de l\'inscription:', error);
      const errorMsg = 'Erreur de connexion au serveur lors de l\'inscription.';
      setAuthError(errorMsg);
      showError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const handleLogout = async () => {
    console.log('🚪 Déconnexion...');
    
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setAuthError(null);
      setCurrentPage('home');
    } catch (error) {
      console.error('🚨 Erreur lors de la déconnexion:', error);
      setIsAuthenticated(false);
      setUser(null);
      setAuthError(null);
      setCurrentPage('home');
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const toastMethods = {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  const authMethods = {
    onLogout: handleLogout,
    isAuthenticated,
    user,
    authError,
    clearAuthError
  };

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
        return <Home onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;
      
      case 'login':
        if (isAuthenticated) {
          handleNavigate('dashboard');
          return null;
        }
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce-slow">🌱</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
                <p className="text-gray-600">Bienvenue sur Yoonu Dal</p>
              </div>
              
              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {authError}
                  <button 
                    onClick={clearAuthError}
                    className="ml-2 text-red-800 hover:text-red-900 font-semibold"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                await handleLogin({
                  username: formData.get('username'),
                  password: formData.get('password')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      name="username"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="votre_nom"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mot de passe
                    </label>
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
              
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Pas encore de compte ?{' '}
                  <button
                    onClick={() => handleNavigate('register')}
                    className="text-green-600 font-semibold hover:text-green-700"
                  >
                    S'inscrire
                  </button>
                </p>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => handleNavigate('home')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        );

      case 'register':
        if (isAuthenticated) {
          handleNavigate('dashboard');
          return null;
        }
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce-slow">🌱</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Inscription</h2>
                <p className="text-gray-600">Rejoignez Yoonu Dal</p>
              </div>
              
              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {authError}
                  <button 
                    onClick={clearAuthError}
                    className="ml-2 text-red-800 hover:text-red-900 font-semibold"
                  >
                    ✕
                  </button>
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
                  <button onClick={() => handleNavigate('login')}
                    className="text-green-600 font-semibold hover:text-green-700">
                    Se connecter
                  </button>
                </p>
              </div>
              
              <div className="mt-4 text-center">
                <button onClick={() => handleNavigate('home')}
                  className="text-sm text-gray-500 hover:text-gray-700">
                  ← Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        );

      case 'onboarding':
        return (
          <Onboarding 
            toast={toastMethods} 
            onNavigate={handleNavigate}
            setAuth={setUser} 
          />
        );

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
        return (
          <CheckoutPage 
            onNavigate={handleNavigate} 
            toast={toastMethods}
            plan={pageParams?.plan || 'monthly'}
          />
        );

      case 'subscription':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <SubscriptionPage onNavigate={handleNavigate} user={user} toast={toastMethods} />;

      case 'dashboard':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <Dashboard toast={toastMethods} auth={authMethods} onNavigate={handleNavigate} user={user} />;
      
      case 'envelopes':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <EnvelopeManager onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

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
        return (
          <TontineInvitePage
            inviteCode={pageParams?.code}
            onNavigate={handleNavigate}
            toast={toastMethods}
            isAuthenticated={isAuthenticated}
          />
        );

      case 'diagnostic':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <SimpleDiagnostic onNavigate={handleNavigate} toast={toastMethods} />;
      
      case 'values':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <ValueSelector onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

      case 'tontine-detail':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return (
          <TontineDetail 
            onNavigate={handleNavigate} 
            tontineId={pageParams?.id}
            toast={toastMethods}
            user={user}
          />
        );
      
      case 'tontine-analysis':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return <TontineAnalysis onNavigate={handleNavigate} toast={toastMethods} auth={authMethods} />;

      case 'profile':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6 text-center">👤 Profil Utilisateur</h2>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {user?.first_name?.charAt(0) || user?.username?.charAt(0) || '?'}
                  </div>
                </div>
                <div className="space-y-3">
                  <p><strong>Nom :</strong> {user?.first_name} {user?.last_name}</p>
                  <p><strong>Nom d'utilisateur :</strong> {user?.username}</p>
                  <p><strong>Email :</strong> {user?.email}</p>
                  <p><strong>Statut :</strong> {user?.is_staff ? '👑 Admin' : '⭐ Utilisateur'}</p>
                  <p><strong>Membre depuis :</strong> {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="border-t pt-4 mt-6">
                  <button 
                    onClick={() => handleNavigate('values')}
                    className="w-full bg-blue-100 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-200 transition-colors duration-200 mb-3"
                  >
                    💎 Gérer mes valeurs personnelles
                  </button>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => handleNavigate('dashboard')}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  ← Dashboard
                </button>
                <button 
                  onClick={() => handleNavigate('settings')}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  ⚙️ Paramètres
                </button>
              </div>
            </div>
          </div>
        );

      case 'settings':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6 text-center">⚙️ Paramètres</h2>
              <div className="space-y-4">
                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  🔔 Notifications
                </button>
                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  🔒 Sécurité et mot de passe
                </button>
                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  🎨 Apparence
                </button>
                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  📱 Préférences
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left p-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                >
                  🚪 Déconnexion
                </button>
              </div>
              <button 
                onClick={() => handleNavigate('dashboard')}
                className="w-full mt-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                ← Retour au tableau de bord
              </button>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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
                    <p className="font-semibold">📞 Téléphone</p>
                    <p className="text-green-600">+221 XX XXX XX XX</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="font-semibold">💬 Chat en direct</p>
                    <p className="text-purple-600">Bientôt disponible</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleNavigate(isAuthenticated ? 'dashboard' : 'home')}
                className="w-full mt-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                ← Retour {isAuthenticated ? 'au dashboard' : 'à l\'accueil'}
              </button>
            </div>
          </div>
        );
      
      default:
        console.log('🏠 Page par défaut, retour à Home');
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
      <div className="flex-grow">
        {renderPage()}
      </div>
      <Footer />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {isAuthenticated && (
        <AIChatWidget 
          onNavigate={handleNavigate}
          toast={toastMethods}
          user={user}
        />
      )}
    </div>
  );
}

export default App;
