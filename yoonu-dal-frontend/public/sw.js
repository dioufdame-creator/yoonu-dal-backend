/* public/sw.js — Service Worker Yoonu Dal
   Rôle : rendre l'app installable (handler fetch obligatoire pour Chrome)
   + page de repli hors-ligne. Ne met PAS en cache les appels API. */

const CACHE_NAME = 'yoonu-dal-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
];

// Installation — on précharge le minimum
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activation — on nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — indispensable pour l'installabilité
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorer tout ce qui n'est pas GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ne jamais toucher aux appels API — toujours réseau frais
  if (url.hostname.includes('onrender.com') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation (ouverture de page) — réseau d'abord, repli hors-ligne
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || caches.match('/'))
      )
    );
    return;
  }

  // Ressources statiques — cache d'abord, réseau en secours
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
