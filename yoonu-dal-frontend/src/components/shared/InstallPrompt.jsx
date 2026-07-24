// src/components/shared/InstallPrompt.jsx
// Installation PWA — bannière auto (si Chrome le permet) + bouton permanent
import React, { useState, useEffect } from 'react';

const DISMISS_KEY = 'yoonu_install_dismissed';
const DISMISS_DAYS = 7;
const DELAY_BANNER = 15000;

// ── Détection plateforme ──────────────────────────────────────
export const getPlatform = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return { isIOS, isAndroid, isSafari, isDesktop: !isIOS && !isAndroid };
};

export const isAppInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

// ── Hook partagé : expose le prompt natif s'il existe ─────────
let globalDeferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new CustomEvent('yoonu-installable'));
  });
  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    localStorage.removeItem(DISMISS_KEY);
  });
}

export const useInstall = () => {
  const [canPromptNatively, setCanPromptNatively] = useState(!!globalDeferredPrompt);

  useEffect(() => {
    const handler = () => setCanPromptNatively(true);
    window.addEventListener('yoonu-installable', handler);
    return () => window.removeEventListener('yoonu-installable', handler);
  }, []);

  const triggerInstall = async () => {
    if (!globalDeferredPrompt) return 'unavailable';
    globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    globalDeferredPrompt = null;
    setCanPromptNatively(false);
    return outcome; // 'accepted' | 'dismissed'
  };

  return { canPromptNatively, triggerInstall };
};

// ── Guide manuel selon la plateforme ──────────────────────────
export const InstallGuide = ({ onClose }) => {
  const { isIOS, isAndroid } = getPlatform();

  const steps = isIOS
    ? [
        { n: 1, text: <>Appuyez sur <strong>Partager</strong> <span className="text-blue-500">⬆️</span> en bas de l'écran</> },
        { n: 2, text: <>Choisissez <strong>Sur l'écran d'accueil</strong> ➕</> },
      ]
    : isAndroid
    ? [
        { n: 1, text: <>Appuyez sur le menu <strong>⋮</strong> en haut à droite</> },
        { n: 2, text: <>Choisissez <strong>Installer l'application</strong> ou <strong>Ajouter à l'écran d'accueil</strong></> },
      ]
    : [
        { n: 1, text: <>Cliquez sur l'icône <strong>⊕</strong> dans la barre d'adresse</> },
        { n: 2, text: <>Ou menu <strong>⋮</strong> → <strong>Installer Yoonu Dal</strong></> },
      ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
            🌱
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Installer Yoonu Dal</h3>
          <p className="text-sm text-gray-500">Deux étapes rapides</p>
        </div>

        <div className="space-y-3 mb-6">
          {steps.map((s) => (
            <div key={s.n} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.n}
              </div>
              <p className="text-sm text-gray-700">{s.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
};

// ── Bannière automatique (si Chrome émet l'événement) ─────────
const InstallPrompt = () => {
  const { canPromptNatively, triggerInstall } = useInstall();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isAppInstalled()) return;
    if (!canPromptNatively) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const days = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
      if (days < DISMISS_DAYS) return;
    }

    const timer = setTimeout(() => setShowBanner(true), DELAY_BANNER);
    return () => clearTimeout(timer);
  }, [canPromptNatively]);

  const handleInstall = async () => {
    const outcome = await triggerInstall();
    if (outcome !== 'accepted') {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm animate-slide-up-install">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
            🌱
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">Installer Yoonu Dal</p>
            <p className="text-xs text-gray-500 mt-0.5">Accès direct depuis votre écran d'accueil</p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 text-sm text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Plus tard
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-md"
          >
            Installer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up-install {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up-install { animation: slide-up-install 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default InstallPrompt;
