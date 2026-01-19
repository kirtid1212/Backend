// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/icon-192x192.png',
        badge: payload.notification?.badge || '/badge-72x72.png',
        tag: payload.data?.notificationId || 'notification',
        data: {
            click_action: payload.data?.click_action || '/admin/notifications',
            ...payload.data
        },
        requireInteraction: true,
        vibrate: [200, 100, 200]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    const clickAction = event.notification.data?.click_action || '/admin/notifications';
    const orderId = event.notification.data?.orderId;

    // Determine the URL to open
    let urlToOpen = clickAction;
    if (orderId && clickAction === '/admin/notifications') {
        // Optionally navigate to specific order details
        // urlToOpen = `/admin/orders/${orderId}`;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes('/admin') && 'focus' in client) {
                    client.postMessage({
                        type: 'NOTIFICATION_CLICKED',
                        data: event.notification.data
                    });
                    return client.focus();
                }
            }

            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle push event (alternative to onBackgroundMessage)
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push event received:', event);

    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('Push payload:', payload);

            // This will be handled by onBackgroundMessage
            // But we keep this as a fallback
        } catch (error) {
            console.error('Error parsing push payload:', error);
        }
    }
});

// Service worker activation
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service worker activated');
    event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service worker installed');
    self.skipWaiting();
});
