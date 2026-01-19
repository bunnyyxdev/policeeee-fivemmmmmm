// Service Worker for Offline Support
const CACHE_NAME = 'preview-city-police-v3';
const RUNTIME_CACHE = 'preview-city-police-runtime-v3';

// Assets to cache on install
// Note: manifest.json is NOT cached - always fetch from network
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete all old caches
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Also delete any cached manifest.json from runtime cache
      return caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.delete('/manifest.json');
      }).catch(() => {
        // Ignore if manifest.json is not in cache
      });
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests (always use network)
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Always fetch manifest.json from network (don't cache)
  if (event.request.url.includes('/manifest.json')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page if available
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leaves') {
    event.waitUntil(syncLeaves());
  }
});

async function syncLeaves() {
  // Implement offline leave sync logic here
  console.log('Syncing leaves...');
}

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Preview City Police';
  const options = {
    body: data.body || 'คุณมีการแจ้งเตือนใหม่',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || 'notification',
    data: data.url || '/dashboard',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/dashboard')
  );
});
