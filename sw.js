const CACHE_NAME = 'penny-hunter-v3';

// Install immediately without waiting for app close
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Clear old cache files when updated
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Always check GitHub for fresh code first
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
            });
            return response;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});
