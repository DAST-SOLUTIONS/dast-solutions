/**
 * Service Worker pour DAST Solutions PWA
 * Gère le cache, le mode offline et les notifications push
 */

const CACHE_NAME = 'dast-v1';
const STATIC_CACHE = 'dast-static-v1';
const DYNAMIC_CACHE = 'dast-dynamic-v1';

// Ressources statiques à cacher
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch avec stratégie Network First
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'DAST', body: 'Notification' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { url: data.url || '/' }
    })
  );
});

// Clic notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const pending = JSON.parse(localStorage.getItem('pending_sync') || '[]');
  for (const item of pending) {
    try {
      await fetch(item.url, { method: item.method, body: JSON.stringify(item.data) });
    } catch (e) {
      console.error('[SW] Sync failed:', e);
    }
  }
  localStorage.removeItem('pending_sync');
}
