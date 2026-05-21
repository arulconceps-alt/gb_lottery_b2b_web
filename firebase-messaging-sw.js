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

// Handle background messages
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

// Handle notification click
self.addEventListener('notificationclick', event => {
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
