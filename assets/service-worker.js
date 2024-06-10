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
    '/assets/images/marker-shadow.png'
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
                return fetch(event.request);
            })
    );
});
