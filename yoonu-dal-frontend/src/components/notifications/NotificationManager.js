// src/components/notifications/NotificationManager.js
// Gestion des notifications push FCM côté frontend

import { useEffect, useRef } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../../services/firebaseConfig';
import API from '../../services/api';

const NotificationManager = ({ user, toast }) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;

    initNotifications();
  }, [user]);

  const initNotifications = async () => {
    try {
      // Vérifier si les notifications sont supportées
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Notifications non supportées');
        return;
      }

      // Demander la permission et obtenir le token
      const token = await requestNotificationPermission();

      if (!token) return;

      // Enregistrer le token sur le backend
      await API.post('/notifications/register-token/', { token });
      console.log('✅ Token FCM enregistré');

      // Vérifier les notifications à envoyer
      await API.post('/notifications/check/');

      // Écouter les notifications en premier plan
      onForegroundMessage((payload) => {
        const { title, body } = payload.notification || {};

        // Afficher comme toast dans l'app
        toast?.showInfo?.(`${title}: ${body}`);

        // Afficher aussi une vraie notification navigateur
        if (Notification.permission === 'granted') {
          new Notification(title || 'Yoonu Dal', {
            body: body,
            icon: '/logo192.png',
            badge: '/logo192.png',
          });
        }
      });

    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
    }
  };

  // Ce composant ne rend rien visuellement
  return null;
};

export default NotificationManager;
