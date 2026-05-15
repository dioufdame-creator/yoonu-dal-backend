// public/firebase-messaging-sw.js
// Service Worker pour les notifications push FCM

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC7lQeE5qYLO7KRhBFQX7VaTXIuo7QAbGA",
  authDomain: "yoonu-dal.firebaseapp.com",
  projectId: "yoonu-dal",
  storageBucket: "yoonu-dal.firebasestorage.app",
  messagingSenderId: "276703708612",
  appId: "1:276703708612:web:29b4dc8d50afed4a255091"
});

const messaging = firebase.messaging();

// Notifications reçues en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Notification reçue en arrière-plan:', payload);

  const { title, body, icon, data } = payload.notification || {};

  const notificationOptions = {
    body: body || 'Tu as une nouvelle notification Yoonu Dal',
    icon: icon || '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: data || {},
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'dismiss', title: 'Ignorer' }
    ]
  };

  self.registration.showNotification(
    title || 'Yoonu Dal 🌿',
    notificationOptions
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
