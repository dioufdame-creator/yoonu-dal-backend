// src/services/nativeApp.js
//
// Intégration Capacitor — ne s'active QUE quand l'app tourne dans le
// wrapper natif (Android/iOS via Capacitor), jamais dans le navigateur
// web classique. Sur le web, Capacitor.isNativePlatform() renvoie false
// et toutes ces fonctions ne font rien : aucun risque de casser le
// comportement actuel du site.
//
// Gère : notifications push natives (FCM/APNs via le plugin Capacitor,
// séparé du Firebase Web SDK utilisé sur le site), barre de statut,
// écran de démarrage, et le bouton retour matériel Android.

import { Capacitor } from '@capacitor/core';
import API from './api';

export const isNativeApp = () => Capacitor.isNativePlatform();
export const nativePlatform = () => Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

/**
 * Initialise les comportements natifs au démarrage de l'app.
 * À appeler une fois depuis App.js (ex: dans le useEffect d'init auth).
 */
export const initNativeApp = async () => {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    // overlay=false : la barre de statut occupe son propre espace au lieu
    // de se superposer au contenu web (sinon le header de l'app passe
    // derrière l'horloge/batterie/réseau du téléphone).
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#16a34a' }); // vert Yoonu Dal
    }
  } catch (e) {
    console.warn('StatusBar non disponible:', e?.message);
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen non disponible:', e?.message);
  }
};

/**
 * Gère le bouton retour matériel Android : navigue en arrière dans
 * l'app plutôt que de quitter brutalement, sauf sur l'accueil où on
 * laisse le comportement par défaut (minimiser l'app).
 *
 * @param {() => void} goBack - rappelé quand on doit "reculer" dans l'app
 * @param {() => boolean} isAtRoot - renvoie true si on est déjà sur l'accueil
 */
export const registerBackButtonHandler = async (goBack, isAtRoot) => {
  if (!isNativeApp()) return () => {};

  const { App: CapApp } = await import('@capacitor/app');
  const listener = await CapApp.addListener('backButton', () => {
    if (isAtRoot()) {
      CapApp.exitApp();
    } else {
      goBack();
    }
  });

  return () => listener.remove();
};

/**
 * Demande la permission de notifications et enregistre le token natif
 * (FCM sur Android, APNs sur iOS) auprès du backend. Complète — sans
 * le remplacer — le flux Firebase Web déjà en place pour les navigateurs.
 */
export const initNativePushNotifications = async () => {
  if (!isNativeApp()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  let permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }
  if (permStatus.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    try {
      await API.post('/register-fcm-token/', {
        token: token.value,
        platform: nativePlatform(),
      });
    } catch (e) {
      console.error('Erreur enregistrement token push natif:', e);
    }
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Erreur enregistrement push natif:', err);
  });
};
