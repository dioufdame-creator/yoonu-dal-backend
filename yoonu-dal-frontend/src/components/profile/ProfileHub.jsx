// src/components/profile/ProfileHub.jsx
// Page "Moi" — hub central du profil
import React from 'react';
import { SubscriptionBadge } from '../subscription/SubscriptionComponents';

const ProfileHub = ({ onNavigate, user, onLogout }) => {
  const getUserDisplayName = () => {
    if (user?.user?.first_name) return user.user.first_name;
    if (user?.user?.username) return user.user.username;
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    return 'Utilisateur';
  };

  const isPremium = user?.profile?.is_premium || user?.subscription_tier === 'premium' || user?.trial_active;

  const sections = [
    {
      title: 'Mon suivi',
      items: [
        { icon: '🎯', label: 'Mon Score Yoonu Dal', page: 'score', color: 'bg-green-50 text-green-700' },
        { icon: '🧭', label: 'Diagnostic financier', page: 'diagnostic', color: 'bg-blue-50 text-blue-700' },
        { icon: '💳', label: 'Mes dettes', page: 'debts', color: 'bg-amber-50 text-amber-700' },
        { icon: '💰', label: 'Historique transactions', page: 'transactions', color: 'bg-purple-50 text-purple-700' },
      ]
    },
    {
      title: 'Personnalisation',
      items: [
        { icon: '💎', label: 'Mes valeurs personnelles', page: 'values', color: 'bg-indigo-50 text-indigo-700' },
        { icon: '🗂️', label: 'Mes règles de classement', page: 'category-rules', color: 'bg-teal-50 text-teal-700' },
        { icon: '📁', label: 'Mes budgets (enveloppes)', page: 'envelopes', color: 'bg-orange-50 text-orange-700' },
      ]
    },
    {
      title: 'Compte',
      items: [
        { icon: '💎', label: 'Mon abonnement', page: 'subscription', color: 'bg-gray-50 text-gray-700' },
        { icon: '❓', label: 'Aide & Support', page: 'help', color: 'bg-gray-50 text-gray-700' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Carte profil */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-green-600 font-bold text-2xl shadow-lg">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{getUserDisplayName()}</h1>
              <p className="text-sm text-green-100 truncate">{user?.email}</p>
              <div className="mt-2">
                <SubscriptionBadge user={user} />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Premium si pas premium */}
        {!isPremium && (
          <button
            onClick={() => onNavigate('pricing')}
            className="w-full mb-6 flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-xl">💎</span>
            <span>Passer Premium</span>
          </button>
        )}

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-2">
              {section.title}
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {section.items.map((item, idx) => (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                    idx < section.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${item.color}`}>
                    {item.icon}
                  </div>
                  <span className="flex-1 text-left text-sm font-semibold text-gray-800">{item.label}</span>
                  <span className="text-gray-300">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Déconnexion */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-all"
        >
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>

      </div>
    </div>
  );
};

export default ProfileHub;
