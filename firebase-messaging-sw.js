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

  self.registration.showNotification(title, {
    body,
    data: { link },
    tag: 'gisugo-alert',
    renotify: true
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
      // navigate() can throw on uncontrolled clients (e.g. after a SW update);
      // fall back to opening a fresh window so the tap always lands on Alerts.
      try {
        if (typeof sameOriginClient.navigate === 'function') {
          await sameOriginClient.navigate(targetUrl);
          await sameOriginClient.focus();
          return;
        }
      } catch (error) {
        // fall through to openWindow
      }
    }

    await clients.openWindow(targetUrl);
  })());
});
