importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

console.log('[firebase-messaging-sw.js] Service Worker loaded');

firebase.initializeApp({
    apiKey: 'AIzaSyAL_g-t6qbGpvTbwwvOebaqO4pn878YtaA',
    authDomain: 'gb-b2b.firebaseapp.com',
    projectId: 'gb-b2b',
    storageBucket: 'gb-b2b.firebasestorage.app',
    messagingSenderId: '342384769046',
    appId: '1:342384769046:web:5fa05cd9157e486663dd37',
});

const messaging = firebase.messaging();

const CACHE_NAME = 'gb-lottery-v1';
const RUNTIME_CACHE = 'gb-lottery-runtime-v1';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
];

self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[firebase-messaging-sw.js] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE).catch(() => {
                    console.log('[firebase-messaging-sw.js] Some assets could not be cached');
                });
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
                        .map((cacheName) => {
                            console.log('[firebase-messaging-sw.js] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.origin !== location.origin) {
        return;
    }

    if (request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                const clonedResponse = response.clone();
                if (response.status === 200) {
                    caches.open(RUNTIME_CACHE)
                        .then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        return caches.match('/index.html');
                    });
            })
    );
});

self.addEventListener('sync', (event) => {
    console.log('[firebase-messaging-sw.js] Background sync event:', event.tag);
    if (event.tag === 'sync-data') {
        event.waitUntil(
            Promise.resolve()
        );
    }
});

self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push notification received');
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

self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    const notificationTitle = payload.notification?.title || 'GB Lottery Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: payload.data || {}
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
