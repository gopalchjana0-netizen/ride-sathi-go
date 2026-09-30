// RideSathiGo Service Worker - v2.5.0 (Lifetime Free Push & Notification Engine)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Cache bypass / network first for live operational freshness
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Handle incoming messages from web app clients to show native system notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || 'RideSathiGo Alert';
    const isSilent = Boolean(event.data.silent);
    const options = {
      body: event.data.body || '',
      icon: event.data.icon || '/logo.png',
      badge: event.data.badge || '/logo.png',
      tag: event.data.tag || 'ridesathi-alert',
      renotify: isSilent ? false : (event.data.renotify !== undefined ? event.data.renotify : true),
      silent: isSilent,
      vibrate: isSilent ? [] : (event.data.vibrate || [300, 100, 300, 100, 300]),
      data: event.data.data || { url: '/' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Handle notification click: focus existing window or open target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});