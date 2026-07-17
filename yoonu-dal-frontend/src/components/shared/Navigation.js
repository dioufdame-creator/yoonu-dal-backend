// src/components/shared/Navigation.jsx
// Desktop : navbar complète | Mobile : barre fine (logo + alertes + IA)
import React, { useState } from 'react';
import { SubscriptionBadge } from '../subscription/SubscriptionComponents';

const TUTORIAL_KEY = 'yoonu_tutorial_done';

const Navigation = ({ currentPage, onNavigate, isAuthenticated, user, onLogout, alertsBadge }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleNavigation = (page) => {
    onNavigate(page);
    setIsUserMenuOpen(false);
  };

  const handleShowTutorial = () => {
    localStorage.removeItem(TUTORIAL_KEY);
    window.location.reload();
  };

  const getUserDisplayName = () => {
    if (user?.user?.first_name) return user.user.first_name;
    if (user?.user?.username) return user.user.username;
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    return 'Utilisateur';
  };

  const isPremium = user?.profile?.is_premium || user?.subscription_tier === 'premium' || user?.trial_active;

  const desktopMenu = [
    { icon: '🏠', label: 'Accueil', page: 'dashboard' },
    { icon: '📁', label: 'Budgets', page: 'envelopes' },
    { icon: '💰', label: 'Transactions', page: 'transactions' },
    { icon: '💳', label: 'Dettes', page: 'debts' },
    { icon: '🤝', label: 'Tontines', page: 'tontines' },
    { icon: '🎯', label: 'Mes projets', page: 'goals' },
  ];

  return (
    <header className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-xl relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 lg:h-16">

          {/* Logo */}
          <button
            className="flex items-center gap-2 lg:gap-3 hover:opacity-90 transition-opacity"
            onClick={() => handleNavigation(isAuthenticated ? 'dashboard' : 'home')}
          >
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xl lg:text-2xl">🌱</span>
            </div>
            <div className="text-white">
              <div className="font-bold text-lg lg:text-xl">Yoonu Dal</div>
              <div className="text-xs text-green-100 hidden lg:block">Finance consciente</div>
            </div>
          </button>

          {/* Desktop navigation */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2">
              {desktopMenu.map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNavigation(item.page)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    currentPage === item.page
                      ? 'bg-white text-green-600 shadow-lg'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          )}

          {/* Actions droite */}
          <div className="flex items-center gap-2 lg:gap-3">
            {isAuthenticated ? (
              <>
                {/* Alertes — mobile et desktop */}
                {alertsBadge && <div>{alertsBadge}</div>}

                {/* Premium — desktop uniquement */}
                {!isPremium && (
                  <button
                    onClick={() => handleNavigation('pricing')}
                    className="hidden lg:flex bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all items-center gap-2"
                  >
                    <span>💎</span><span>Premium</span>
                  </button>
                )}

                {/* Menu utilisateur — desktop uniquement */}
                <div className="relative hidden lg:block">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 transition-all"
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 font-bold">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="text-white">
                      <div className="text-sm font-semibold">{getUserDisplayName()}</div>
                      <div className="text-xs text-green-100">{user?.is_staff ? '👑 Admin' : '⭐ Membre'}</div>
                    </div>
                    <span className={`text-white transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl py-2 z-20">
                        <div className="px-4 py-3 border-b">
                          <SubscriptionBadge user={user} />
                          <div className="font-bold text-gray-900 mt-2">{getUserDisplayName()}</div>
                          <div className="text-sm text-gray-600">{user?.email}</div>
                        </div>
                        <div className="py-2">
                          {!isPremium && (
                            <button
                              onClick={() => handleNavigation('pricing')}
                              className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 flex items-center gap-3 text-orange-700 font-semibold"
                            >
                              <span>💎</span><span>Passer Premium</span>
                            </button>
                          )}
                          <button onClick={() => handleNavigation('score')} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                            <span>🎯</span><span>Mon Score</span>
                          </button>
                          <button onClick={() => handleNavigation('diagnostic')} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                            <span>🧭</span><span>Diagnostic</span>
                          </button>
                          <button onClick={() => handleNavigation('category-rules')} className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 text-green-700 font-medium">
                            <span>🗂️</span><span>Mes règles de classement</span>
                          </button>
                          <button onClick={() => handleNavigation('settings')} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                            <span>⚙️</span><span>Paramètres</span>
                          </button>
                          <button onClick={() => handleNavigation('subscription')} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                            <span>💎</span><span>Mon Abonnement</span>
                          </button>
                          <button onClick={handleShowTutorial} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-blue-700">
                            <span>❓</span><span>Revoir le tutoriel</span>
                          </button>
                        </div>
                        <div className="border-t pt-2">
                          <button onClick={() => onLogout()} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-semibold flex items-center gap-3">
                            <span>🚪</span><span>Déconnexion</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => handleNavigation('login')} className="text-white font-semibold text-sm lg:text-base">🔑 Connexion</button>
                <button onClick={() => handleNavigation('register')} className="bg-white text-green-600 px-3 lg:px-6 py-2 rounded-xl font-bold shadow-lg text-sm lg:text-base">📝 Inscription</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
