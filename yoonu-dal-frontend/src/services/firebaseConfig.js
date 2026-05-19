// src/services/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyC7lQeE5qYLO7KRhBFQX7VaTXIuo7QAbGA",
  authDomain: "yoonu-dal.firebaseapp.com",
  projectId: "yoonu-dal",
  storageBucket: "yoonu-dal.firebasestorage.app",
  messagingSenderId: "276703708612",
  appId: "1:276703708612:web:29b4dc8d50afed4a255091"
};

const VAPID_KEY = "QNHFEsUDplDN0Lg0FVcniM2M2OL2MCFQSPd-M01DD9I";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    console.log('🔔 Étape 1: vérification support...');
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('❌ Non supporté');
      return null;
    }

    console.log('🔔 Étape 2: permission actuelle =', Notification.permission);
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      console.log('❌ Permission refusée:', permission);
      return null;
    }
    console.log('✅ Permission accordée');

    console.log('🔔 Étape 3: SW existants...');
    const registrations = await navigator.serviceWorker.getRegistrations();
    registrations.forEach(r => console.log('  SW:', r.scope, r.active?.state));

    console.log('🔔 Étape 4: enregistrement firebase SW...');
    let swReg;
    try {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      console.log('✅ SW enregistré:', swReg.scope);
    } catch (e) {
      console.log('⚠️ Erreur SW:', e.message, '— utilisation SW ready');
      swReg = await navigator.serviceWorker.ready;
    }

    console.log('🔔 Étape 5: getToken...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg
    });

    if (token) {
      console.log('✅ Token:', token.substring(0, 30) + '...');
      return token;
    }
    console.log('⚠️ Token vide');
    return null;

  } catch (error) {
    console.error('❌ Erreur:', error.code, error.message);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export { messaging };
export default app;
