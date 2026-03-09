import React from 'react';

// ==========================================
// SUBSCRIPTION BADGE
// Badge Premium à afficher partout
// ==========================================

export const SubscriptionBadge = ({ user }) => {
  // ✅ CORRIGÉ : Chercher dans user.profile
  const isPremium = user?.profile?.subscription_tier === 'premium' || user?.subscription_tier === 'premium';
  const isTrialActive = user?.profile?.trial_active || user?.trial_active;

  if (isPremium && !isTrialActive) {
    return (
      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
        <span>💎</span>
        <span>Premium</span>
      </div>
    );
  }

  if (isTrialActive) {
    return (
      <div className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
        <span>🎁</span>
        <span>Essai Premium</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
      <span>🌱</span>
      <span>Freemium</span>
    </div>
  );
};

// ==========================================
// PREMIUM GATE
// Wrapper pour bloquer features Premium
// ==========================================

export const PremiumGate = ({ 
  user, 
  feature, 
  children, 
  onUpgrade,
  fallback 
}) => {
  // ✅ CORRIGÉ : Chercher dans user.profile
  const isPremium = user?.profile?.subscription_tier === 'premium' || user?.subscription_tier === 'premium';
  const isTrialActive = user?.profile?.trial_active || user?.trial_active;
  const hasAccess = isPremium || isTrialActive;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback si fourni
  if (fallback) {
    return <>{fallback}</>;
  }

  // Modal upgrade par défaut
  return (
    <div className="relative">
      {/* Blur overlay */}
      <div className="pointer-events-none opacity-40 blur-sm">
        {children}
      </div>

      {/* Upgrade CTA */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md border-2 border-green-500 text-center">
          <div className="text-6xl mb-4">💎</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Feature Premium
          </h3>
          <p className="text-gray-600 mb-6">
            {feature} est réservé aux membres Premium
          </p>
          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all mb-3"
          >
            🎁 Essayer 30 jours gratuit
          </button>
          <p className="text-xs text-gray-500">
            Aucune carte requise • Annulation à tout moment
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PREMIUM BUTTON
// Bouton avec lock si pas Premium
// ==========================================

export const PremiumButton = ({ 
  user, 
  feature,
  onUpgrade,
  onClick,
  children,
  className = "",
  ...props 
}) => {
  // ✅ CORRIGÉ : Chercher dans user.profile
  const isPremium = user?.profile?.subscription_tier === 'premium' || user?.subscription_tier === 'premium';
  const isTrialActive = user?.profile?.trial_active || user?.trial_active;
  const hasAccess = isPremium || isTrialActive;

  if (hasAccess) {
    return (
      <button
        onClick={onClick}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onUpgrade}
      className={`${className} relative`}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span>🔒</span>
        {children}
        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
          Premium
        </span>
      </div>
    </button>
  );
};

// ==========================================
// USAGE LIMIT INDICATOR
// Indicateur limite atteinte (ex: chat IA)
// ==========================================

export const UsageLimitIndicator = ({ 
  used, 
  limit, 
  label,
  onUpgrade 
}) => {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;

  if (isAtLimit) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-red-800">Limite atteinte</div>
            <div className="text-sm text-red-600">
              {used}/{limit} {label}
            </div>
          </div>
          <span className="text-3xl">🚫</span>
        </div>
        <button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
        >
          💎 Passer en Premium
        </button>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-amber-800 font-semibold">
            Bientôt la limite
          </div>
          <div className="text-xs text-amber-600">
            {used}/{limit} {label}
          </div>
        </div>
        <div className="w-full bg-amber-200 rounded-full h-2 mb-3">
          <div 
            className="bg-amber-600 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <button
          onClick={onUpgrade}
          className="w-full bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-semibold text-xs hover:bg-amber-200 transition-all"
        >
          💎 Upgrade pour usage illimité
        </button>
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-500">
      {used}/{limit} {label}
    </div>
  );
};

// ==========================================
// PREMIUM FEATURE BADGE
// Badge "Premium" à afficher sur features
// ==========================================

export const PremiumFeatureBadge = () => (
  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
    <span>💎</span>
    <span>Premium</span>
  </span>
);