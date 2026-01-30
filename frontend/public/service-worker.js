const CACHE_NAME = 'sistema-pdv-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/1.chunk.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return a fallback response for API calls
          if (event.request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ 
                error: 'Offline mode - API unavailable',
                offline: true 
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync for offline actions
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Sistema PDV',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/logo192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Sistema PDV', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

function syncData() {
  // Sync data with server
  return Promise.resolve();
}
