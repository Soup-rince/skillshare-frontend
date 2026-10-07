const CACHE_VERSION = 'skillshare-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/icon-192.png'
];

// ============ INSTALL ============
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(function (cache) {
            return cache.addAll(PRECACHE_ASSETS).catch(function (err) {
                console.log('Precache failed:', err);
            });
        })
    );
    self.skipWaiting();
});

// ============ ACTIVATE ============
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys
                    .filter(function (key) {
                        return key.indexOf(CACHE_VERSION) !== 0;
                    })
                    .map(function (key) {
                        return caches.delete(key);
                    })
            );
        })
    );
    self.clients.claim();
});

// ============ FETCH (OFFLINE CACHING) ============
self.addEventListener('fetch', function (event) {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET
    if (request.method !== 'GET') return;

    // Skip cross-origin (Cloudinary images, atbp.)
    if (url.origin !== self.location.origin) return;

    // API requests — network first, fallback sa cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(function (response) {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(API_CACHE).then(function (cache) {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                })
                .catch(function () {
                    return caches.match(request).then(function (cached) {
                        if (cached) return cached;
                        return new Response(
                            JSON.stringify({ message: 'Offline — no cached data' }),
                            { status: 503, headers: { 'Content-Type': 'application/json' } }
                        );
                    });
                })
        );
        return;
    }

    // Static assets — cache first, fallback sa network
    event.respondWith(
        caches.match(request).then(function (cached) {
            if (cached) return cached;
            return fetch(request).then(function (response) {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then(function (cache) {
                        cache.put(request, clone);
                    });
                }
                return response;
            });
        })
    );
});

// ============ PUSH NOTIFICATIONS ============
self.addEventListener('push', function (event) {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: "SkillShare", body: event.data.text() };
    }

    const options = {
        body: data.body || "",
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: data.url || '/' },
        vibrate: [100, 50, 100]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || "SkillShare", options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});