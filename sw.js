const CACHE_NAME = 'study-clock-v4/5/26';
const urlsToCache = [
  './',
  './index.html',
  './study-clock.png',
  './manifest.json',
  './style.css',
  './context.js',
  './utils.js',
  './state.js',
  './globalController.js',
  './clock.js',
  './timer.js',
  './stopwatch.js',
  './alarm.js',
  './event.js',
  './focus.js',
  './todo.js',
  './music.js',
  './main.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            if (windowClients.length > 0) {
                return windowClients[0].focus();
            } else {
                return clients.openWindow('/');
            }
        })
    );
});
