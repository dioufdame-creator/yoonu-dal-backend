// src/services/firebaseConfig.js
// Configuration Firebase + FCM pour Yoonu Dal

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

const VAPID_KEY = "BCw3v3J96FnOiZk95HcEs65y10EELRtb-SEt5gSrtLLlbAXv1nQCIE3IAuRJyjTVrcFUTMVOthbgAXmnf2HSf8w";

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ==========================================
// DEMANDER LA PERMISSION + OBTENIR LE TOKEN
// ==========================================
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('❌ Permission notifications refusée');
      return null;
    }

    console.log('✅ Permission notifications accordée');

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      console.log('🔑 FCM Token:', token);
      return token;
    } else {
      console.log('⚠️ Pas de token FCM');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur FCM:', error);
    return null;
  }
};

// ==========================================
// ÉCOUTER LES NOTIFICATIONS EN PREMIER PLAN
// ==========================================
export const onForegroundMessage = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log('📩 Notification en premier plan:', payload);
    callback(payload);
  });
};

export { messaging };
export default app;
