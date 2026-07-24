// src/components/shared/InstallPrompt.jsx
// Bannière d'installation PWA — un clic pour installer
import React, { useState, useEffect } from 'react';

const DISMISS_KEY = 'yoonu_install_dismissed';
const DISMISS_DAYS = 7;      // Ne plus proposer pendant 7 jours après refus
const DELAY_ANDROID = 15000; // 15s avant d'afficher sur Android/Chrome
const DELAY_IOS = 20000;     // 20s avant d'afficher sur iPhone

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Déjà installée ? On ne propose rien
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // 2. Refus récent ? On respecte le délai
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    // 3. iOS Safari — pas de beforeinstallprompt, on guide manuellement
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
    if (iOS && isSafari) {
      setIsIOS(true);
      const timer = setTimeout(() => setShowBanner(true), DELAY_IOS);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome / Edge — prompt natif
    let promptTimer = null;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      promptTimer = setTimeout(() => setShowBanner(true), DELAY_ANDROID);
    };

    const handleInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      if (promptTimer) clearTimeout(promptTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome !== 'accepted') {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowBanner(false);
    setShowIOSGuide(false);
  };

  if (!showBanner) return null;

  // ── Guide iOS — Safari n'a pas de prompt natif ──────────────
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
          <div className="text-center mb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
              🌱
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Installer Yoonu Dal</h3>
            <p className="text-sm text-gray-500">Deux étapes rapides sur iPhone</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <p className="text-sm text-gray-700">
                Appuyez sur <strong>Partager</strong> <span className="text-blue-500">⬆️</span> en bas de l'écran
              </p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <p className="text-sm text-gray-700">
                Choisissez <strong>Sur l'écran d'accueil</strong> ➕
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
          >
            J'ai compris
          </button>
        </div>
      </div>
    );
  }

  // ── Bannière d'installation ─────────────────────────────────
  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm animate-slide-up-install">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
            🌱
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">Installer Yoonu Dal</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Accès direct depuis votre écran d'accueil
            </p>
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
            className="flex-1 py-2.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-shadow"
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
