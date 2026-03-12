/* global importScripts, firebase */

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC5w-ITUnCDaA-ZXTmwAwgGo1mErS-k-BE',
  authDomain: 'gisugo1.firebaseapp.com',
  projectId: 'gisugo1',
  storageBucket: 'gisugo1.firebasestorage.app',
  messagingSenderId: '380568649178',
  appId: '1:380568649178:web:725c745becbb89412094e3'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // If FCM already includes a notification payload, browsers may auto-display it.
  // Avoid double tray entries by only showing manually for data-only payloads.
  if (payload?.notification) {
    return;
  }
  const title = payload?.notification?.title || 'GISUGO Alert';
  const body = payload?.notification?.body || 'You have a new notification.';
  const link = payload?.fcmOptions?.link || payload?.data?.click_action || '/messages.html';

  self.registration.showNotification(title, {
    body,
    data: { link },
    tag: 'gisugo-alert',
    renotify: true
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.link || '/messages.html';
  event.waitUntil(clients.openWindow(targetUrl));
});
