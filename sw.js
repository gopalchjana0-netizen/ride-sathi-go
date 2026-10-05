// RideSathiGo Service Worker - v2.6.0 (High Performance Edge Caching + Lifetime Free Push)
const CACHE_NAME = 'rsg-cache-v2.6.0';
const CORE_STATIC_ASSETS = [
  '/',
  '/index.html',
  '/driver.html',
  '/admin.html',
  '/logo.png',
  '/index-192.png',
  '/index-512.png',
  '/driver-192.png',
  '/driver-512.png',
  '/admin-192.png',
  '/admin-512.png',
  '/alarm.ogg',
  '/alarm.wav',
  '/siren.wav',
  '/manifest.json',
  '/manifest-driver.json',
  '/manifest-admin.json',
  '/manifest-reg.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Smart Cache Strategy: Instant open for assets/HTML, Bypass for Live Firebase/APIs
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Bypass Live Realtime Database, Firestore, WebSockets, Google Analytics & Ads
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebasedatabase.app') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('googlesyndication') ||
    url.hostname.includes('monetag') ||
    url.pathname.includes('socket') ||
    url.search.includes('key=')
  ) {
    return;
  }

  // 2. Static Media & Assets (Images, Audio, Fonts, Scripts): Cache-First with Background Update
  const isStaticAsset = (
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|wav|ogg|ico|woff|woff2|ttf|eot|css)$/i) ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Serve from cache immediately, update in background if online
          fetch(req).then((res) => {
            if (res && res.status === 200) {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(()=>{});
            }
          }).catch(()=>{});
          return cached;
        }
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(()=>{});
          }
          return res;
        }).catch(() => new Response('', { status: 408, statusText: 'Request timed out' }));
      })
    );
    return;
  }

  // 3. HTML Pages (Navigation): Fast Open (Network with 1.2s timeout fallback to Cache)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      new Promise((resolve) => {
        let isSettled = false;
        const timer = setTimeout(() => {
          if (!isSettled) {
            caches.match(req).then((cached) => {
              if (cached) {
                isSettled = true;
                resolve(cached);
              }
            });
          }
        }, 1200);

        fetch(req)
          .then((networkRes) => {
            clearTimeout(timer);
            if (!isSettled) {
              isSettled = true;
              if (networkRes && networkRes.status === 200) {
                const resClone = networkRes.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(()=>{});
              }
              resolve(networkRes);
            }
          })
          .catch(() => {
            clearTimeout(timer);
            if (!isSettled) {
              isSettled = true;
              caches.match(req).then((cached) => {
                if (cached) resolve(cached);
                else caches.match('/index.html').then((fallback) => resolve(fallback || new Response('Offline', { status: 503 })));
              });
            }
          });
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
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