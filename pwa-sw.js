// PWA Service Worker for GB Lottery B2B
// Handles offline functionality and caching strategy

const CACHE_NAME = 'gb-lottery-v1';
const RUNTIME_CACHE = 'gb-lottery-runtime-v1';

// Assets to cache on install
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('[PWA-SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[PWA-SW] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE).catch(() => {
                    console.log('[PWA-SW] Some assets could not be cached');
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[PWA-SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
                        .map((cacheName) => {
                            console.log('[PWA-SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - network-first strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Network first, fallback to cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone the response
                const clonedResponse = response.clone();

                // Cache successful responses
                if (response.status === 200) {
                    caches.open(RUNTIME_CACHE)
                        .then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                }

                return response;
            })
            .catch(() => {
                // Return from cache if network fails
                return caches.match(request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        // Return offline page if available
                        return caches.match('/index.html');
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[PWA-SW] Background sync event:', event.tag);

    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Implement your data sync logic here
            Promise.resolve()
        );
    }
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[PWA-SW] Push notification received');

    if (!event.data) {
        return;
    }

    const data = event.data.json();
    const options = {
        body: data.body || 'New notification from GB Lottery',
        icon: '/icons/Icon-192.png',
        badge: '/icons/Icon-192.png',
        tag: data.tag || 'gb-lottery-notification',
        data: data,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'GB Lottery B2B', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[PWA-SW] Notification clicked');
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

console.log('[PWA-SW] Service Worker loaded');
