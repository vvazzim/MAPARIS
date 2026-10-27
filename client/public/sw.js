const CACHE_NAME = 'maparis-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.jpg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Installation du Service Worker et mise en cache des assets essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie Réseau en priorité (Network-First) avec fallback Cache
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignorer les requêtes non-GET, les WebSockets et les flux dynamiques d'API
  if (event.request.method !== 'GET' || url.includes('/socket.io/') || url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Hors-ligne', { status: 503, statusText: 'Offline' });
      }))
  );
});
