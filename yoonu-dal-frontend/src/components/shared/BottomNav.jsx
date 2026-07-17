// src/components/shared/BottomNav.jsx
// Bottom navigation mobile — style Wave
import React, { useState } from 'react';

const BottomNav = ({ currentPage, onNavigate, isAuthenticated }) => {
  const [showAddSheet, setShowAddSheet] = useState(false);

  if (!isAuthenticated) return null;

  const navItems = [
    { icon: '🏠', label: 'Accueil', page: 'dashboard' },
    { icon: '🎯', label: 'Mes projets', page: 'goals' },
    null, // emplacement du bouton central ➕
    { icon: '🤝', label: 'Tontines', page: 'tontines' },
    { icon: '👤', label: 'Moi', page: 'profile-hub' },
  ];

  const isActive = (page) => {
    if (page === 'dashboard') return currentPage === 'dashboard';
    if (page === 'goals') return currentPage === 'goals';
    if (page === 'tontines') return ['tontines', 'tontine-detail', 'tontine-analysis'].includes(currentPage);
    if (page === 'profile-hub') return ['profile-hub', 'profile', 'settings', 'score', 'values', 'category-rules', 'subscription', 'diagnostic'].includes(currentPage);
    return false;
  };

  const handleAdd = (type) => {
    setShowAddSheet(false);
    onNavigate('quick-add', { type });
  };

  return (
    <>
      {/* Bottom sheet Ajouter */}
      {showAddSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowAddSheet(false)}
          />
          <div className="fixed bottom-20 left-3 right-3 z-50 lg:hidden animate-slide-up">
            <div className="bg-white rounded-3xl shadow-2xl p-4 space-y-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2"></div>
              <button
                onClick={() => handleAdd('expense')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                  💸
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Dépense</p>
                  <p className="text-xs text-gray-500">Enregistrer une sortie d'argent</p>
                </div>
              </button>
              <button
                onClick={() => handleAdd('income')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-50 hover:bg-green-100 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                  💵
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Revenu</p>
                  <p className="text-xs text-gray-500">Enregistrer une entrée d'argent</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
        <div className="flex items-end justify-around px-2 pb-1 pt-2">
          {navItems.map((item, idx) => {
            if (item === null) {
              // Bouton central ➕
              return (
                <button
                  key="add"
                  onClick={() => setShowAddSheet(!showAddSheet)}
                  className="relative -mt-6 flex flex-col items-center"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl transition-all transform ${
                    showAddSheet
                      ? 'bg-gray-700 rotate-45'
                      : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:scale-110'
                  }`}>
                    +
                  </div>
                </button>
              );
            }
            const active = isActive(item.page);
            return (
              <button
                key={item.page}
                onClick={() => { setShowAddSheet(false); onNavigate(item.page); }}
                className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[60px]"
              >
                <span className={`text-xl transition-transform ${active ? 'scale-110' : 'opacity-60'}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-medium ${active ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                  {item.label}
                </span>
                {active && <div className="w-1 h-1 bg-green-600 rounded-full"></div>}
              </button>
            );
          })}
        </div>
      </nav>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </>
  );
};

export default BottomNav;
