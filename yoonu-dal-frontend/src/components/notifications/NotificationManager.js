// src/components/notifications/NotificationManager.js
import { useEffect, useRef, useState } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../../services/firebaseConfig';
import API from '../../services/api';

const NotificationManager = ({ user, toast }) => {
  const initialized = useRef(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;

    // Vérifier si notifications supportées et pas encore demandées
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    if (Notification.permission === 'default') {
      // Montrer le bandeau après 3 secondes
      setTimeout(() => setShowBanner(true), 3000);
    } else if (Notification.permission === 'granted') {
      // Déjà accordé — initialiser silencieusement
      initNotifications();
    }
  }, [user]);

  const initNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (!token) return;

      await API.post('/register-fcm-token/', { token });
      console.log('✅ Token FCM enregistré');

      await API.post('/notifications/check/');

      onForegroundMessage((payload) => {
        const { title, body } = payload.notification || {};
        toast?.showInfo?.(`${title}: ${body}`);
      });

    } catch (error) {
      console.error('Erreur notifications:', error);
    }
  };

  const handleEnable = async () => {
    setShowBanner(false);
    await initNotifications();
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slideUp">
      <div className="bg-white rounded-2xl shadow-xl border border-green-200 p-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🔔</span>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm mb-0.5">
            Activer les notifications
          </p>
          <p className="text-xs text-gray-500">
            Reçois des alertes pour tes tontines, budgets et rappels financiers.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-xl hover:bg-green-700 transition-all"
            >
              Activer
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
