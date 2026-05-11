const CACHE_NAME = 'study-clock-v6.5.26';
const BASE_PATH = '/clock/'; 

const filesToCache = [
  'index.html',
  'style.css',
  'study-clock.png',
  'manifest.json',
  'worker.js',
  'main.js',
  'utils.js',
  'state.js',
  'context.js',
  'globalController.js',
  'clock.js',
  'timer.js',
  'stopwatch.js',
  'alarm.js',
  'event.js',
  'focus.js',
  'todo.js',
  'music.js'
];
const urlsToCache = filesToCache.map(file => BASE_PATH + file);
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
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
    const requestUrl = new URL(event.request.url);
    if (!requestUrl.origin.includes(self.location.origin)) {
        return;
    }
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {});
                return cachedResponse || fetchPromise;
            });
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