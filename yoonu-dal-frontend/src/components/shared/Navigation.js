import React, { useState } from 'react';
import { SubscriptionBadge } from '../subscription/SubscriptionComponents';  // ✅ AJOUTÉ

const NavigationV2 = ({ currentPage, onNavigate, isAuthenticated, user, onLogout, alertsBadge }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleNavigation = (page) => {
    onNavigate(page);
    closeMenus();
  };

  const getUserDisplayName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'Utilisateur';
  };

  // ✅ Vérifier si Premium
  const isPremium = user?.profile?.is_premium || user?.subscription_tier === 'premium' || user?.trial_active;

  // ✅ 5 PAGES PRINCIPALES
  const mainMenu = [
    { icon: '🏠', label: 'Accueil', page: 'dashboard' },
    { icon: '💰', label: 'Dépenses', page: 'expenses' },
    { icon: '📁', label: 'Budgets', page: 'envelopes' },
    { icon: '🦁', label: 'Tontines', page: 'tontines' },
    { icon: '👤', label: 'Profil', page: 'profile' }
  ];

  const guestMenu = [
    { icon: '🏠', label: 'Accueil', page: 'home' },
    { icon: '🔑', label: 'Connexion', page: 'login' },
    { icon: '📝', label: 'Inscription', page: 'register' }
  ];

  const menuItems = isAuthenticated ? mainMenu : guestMenu;

  return (
    <>
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-xl relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <button 
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              onClick={() => handleNavigation(isAuthenticated ? 'dashboard' : 'home')}
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌱</span>
              </div>
              <div className="text-white">
                <div className="font-bold text-xl">Yoonu Dal</div>
                <div className="text-xs text-green-100 hidden sm:block">Finance consciente</div>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-2">
              {menuItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNavigation(item.page)}
                  className={`relative px-4 py-2 rounded-xl font-medium transition-all ${
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

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {alertsBadge && <div>{alertsBadge}</div>}

                  {/* ✅✅✅ NOUVEAU : Bouton Premium ✅✅✅ */}
                  {!isPremium && (
                    <button
                      onClick={() => handleNavigation('pricing')}
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <span>💎</span>
                      <span>Premium</span>
                    </button>
                  )}
                  {/* ✅✅✅ FIN NOUVEAU ✅✅✅ */}

                  <div className="relative">
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
                          {/* ✅✅✅ NOUVEAU : Badge Premium dans dropdown ✅✅✅ */}
                          <div className="px-4 py-3 border-b">
                            <SubscriptionBadge user={user} />
                            <div className="font-bold text-gray-900 mt-2">{getUserDisplayName()}</div>
                            <div className="text-sm text-gray-600">{user?.email}</div>
                          </div>
                          {/* ✅✅✅ FIN NOUVEAU ✅✅✅ */}

                          <div className="py-2">
                            {/* ✅✅✅ NOUVEAU : Lien Pricing si pas premium ✅✅✅ */}
                            {!isPremium && (
                              <button 
                                onClick={() => handleNavigation('pricing')} 
                                className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 flex items-center gap-3 text-orange-700 font-semibold"
                              >
                                <span>💎</span><span>Passer Premium</span>
                              </button>
                            )}
                            {/* ✅✅✅ FIN NOUVEAU ✅✅✅ */}

                            <button onClick={() => handleNavigation('score')} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                              <span>🎯</span><span>Mon Score</span>
                            </button>
                            <button onClick={() => handleNavigation('diagnostic')} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                              <span>🧭</span><span>Diagnostic</span>
                            </button>
                            <button onClick={() => handleNavigation('settings')} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                              <span>⚙️</span><span>Paramètres</span>
                            </button>
                            {/* ✅✅✅ NOUVEAU : Lien Mon Abonnement ✅✅✅ */}
                            <button onClick={() => handleNavigation('subscription')} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                              <span>💎</span><span>Mon Abonnement</span>
                            </button>
                            {/* ✅✅✅ FIN NOUVEAU ✅✅✅ */}
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
                  <button onClick={() => handleNavigation('login')} className="text-white font-semibold">🔑 Connexion</button>
                  <button onClick={() => handleNavigation('register')} className="bg-white text-green-600 px-6 py-2 rounded-xl font-bold shadow-lg">📝 Inscription</button>
                </>
              )}
            </div>

            {/* Mobile Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden w-10 h-10 flex items-center justify-center">
              <div className="w-6 flex flex-col gap-1.5">
                <span className={`block h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={closeMenus} />
          
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-30 lg:hidden overflow-y-auto">
            <div className="p-4">
              {isAuthenticated && (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 mb-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-green-600 font-bold text-xl">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{getUserDisplayName()}</div>
                      <div className="text-sm text-green-100">{user?.email}</div>
                      {/* ✅✅✅ NOUVEAU : Badge dans mobile menu ✅✅✅ */}
                      <div className="mt-2">
                        <SubscriptionBadge user={user} />
                      </div>
                      {/* ✅✅✅ FIN NOUVEAU ✅✅✅ */}
                    </div>
                  </div>
                </div>
              )}

              {/* ✅✅✅ NOUVEAU : Bouton Premium mobile ✅✅✅ */}
              {isAuthenticated && !isPremium && (
                <button
                  onClick={() => handleNavigation('pricing')}
                  className="w-full mb-4 flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg"
                >
                  <span className="text-xl">💎</span>
                  <span>Passer Premium</span>
                </button>
              )}
              {/* ✅✅✅ FIN NOUVEAU ✅✅✅ */}

              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleNavigation(item.page)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl ${
                      currentPage === item.page
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>

              {isAuthenticated && (
                <>
                  <div className="mt-6 space-y-2">
                    <button onClick={() => handleNavigation('score')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <span>🎯</span><span>Score</span>
                    </button>
                    <button onClick={() => handleNavigation('settings')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <span>⚙️</span><span>Paramètres</span>
                    </button>
                    {/* ✅✅✅ NOUVEAU : Lien Mon Abonnement mobile ✅✅✅ */}
                    <button onClick={() => handleNavigation('subscription')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <span>💎</span><span>Mon Abonnement</span>
                    </button>
                    {/* ✅✅✅ FIN NOUVEAU ✅✅✅ */}
                  </div>

                  <button onClick={() => onLogout()} className="w-full mt-4 flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 font-semibold">
                    <span>🚪</span><span>Déconnexion</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NavigationV2;