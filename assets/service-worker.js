const CACHE_NAME = 'places-map-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/assets/css/styles.css',
    '/assets/js/Leaflet.GoogleMutant.js',
    '/assets/js/leaflet-src.js',
    '/src/js/main.js',
    '/src/js/map.js',
    '/src/js/placeTypes.js',
    '/src/js/utils.js',
    '/assets/images/marker-icon-2x.png',
    '/assets/images/marker-icon.png',
    '/assets/images/marker-shadow.png',
    '/assets/images/icon-192x192.png',
    '/assets/images/icon-512x512.png',
    '/assets/images/icon-192x192-maskable.png',
    '/assets/images/icon-512x512-maskable.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});