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

const VAPID_KEY = "BCw3v3J96FnOiZk95HcEs65y10EELRtb-SEt5gSrtLLlbAXv1nQCIE3IAuRJyjTVrcFUTMVOthbgAXmnf2HSf8w";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    // Vérifier support
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('❌ Notifications non supportées');
      return null;
    }

    // Demander permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('❌ Permission refusée:', permission);
      return null;
    }

    console.log('✅ Permission accordée');

    // Enregistrer explicitement le service worker Firebase
    let swRegistration;
    try {
      swRegistration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      );
      console.log('✅ SW Firebase enregistré:', swRegistration.scope);

      // Attendre que le SW soit actif
      await navigator.serviceWorker.ready;
      console.log('✅ SW prêt');
    } catch (swError) {
      console.error('❌ Erreur enregistrement SW:', swError);
      // Essayer avec le SW existant
      swRegistration = await navigator.serviceWorker.ready;
    }

    // Obtenir le token FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      console.log('✅ Token FCM:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.log('⚠️ Token vide - vérifier VAPID key');
      return null;
    }

  } catch (error) {
    console.error('❌ Erreur FCM complète:', error.code, error.message);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log('📩 Notification premier plan:', payload);
    callback(payload);
  });
};

export { messaging };
export default app;
