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
  // Legacy payloads with a `notification` block are auto-displayed by the browser/SDK.
  // Skip manual display for those to avoid double tray entries. Current pushes are
  // data-only (see functions buildPushPayloadFromNotification), so we display here
  // and therefore our own notificationclick handler controls the tap.
  if (payload?.notification) {
    return;
  }
  const data = payload?.data || {};
  const title = data.title || 'GISUGO Alert';
  const body = data.body || 'You have a new notification.';
  const link = data.link || payload?.fcmOptions?.link || data.click_action || '/alerts.html';
  // Unique tag per notification so tray entries stack instead of replacing
  // each other (a shared tag = one slot, later alerts silently overwrite).
  const tag = data.notificationId
    ? `gisugo-alert-${data.notificationId}`
    : `gisugo-alert-${Date.now()}`;

  self.registration.showNotification(title, {
    body,
    data: { link },
    tag,
    // Icon/badge identify the sender; their absence is a known trigger for
    // Chrome Android's "possible spam" labeling of web push notifications.
    icon: '/public/images/Gisugo-icon.png',
    badge: '/public/images/Gisugo-icon.png'
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawLink =
    event.notification?.data?.link ||
    event.notification?.data?.click_action ||
    '/alerts.html';
  const targetUrl = new URL(String(rawLink), self.location.origin).href;

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    // Prefer reusing an existing GISUGO tab/app window and force navigate it.
    const sameOriginClient = windowClients.find((client) => {
      try {
        return new URL(client.url).origin === self.location.origin;
      } catch (error) {
        return false;
      }
    });

    if (sameOriginClient) {
      // Chrome Android: after navigate() the old client handle goes stale and
      // focus() on it silently no-ops, leaving the browser in the background.
      // Focus FIRST (raises the app), then navigate, then focus the fresh
      // handle navigate() returns. Any failure falls back to openWindow.
      try {
        if (typeof sameOriginClient.focus === 'function') {
          await sameOriginClient.focus();
        }
        if (typeof sameOriginClient.navigate === 'function') {
          const navigatedClient = await sameOriginClient.navigate(targetUrl);
          if (navigatedClient && typeof navigatedClient.focus === 'function') {
            await navigatedClient.focus();
          }
          return;
        }
      } catch (error) {
        // fall through to openWindow
      }
    }

    await clients.openWindow(targetUrl);
  })());
});
