const CACHE_NAME = 'penny-hunter-v2';

// 1. Install & immediately force the new version to take over
self.addEventListener('install', (event) => {
    self.skipWaiting(); // MAGIC FIX: Don't wait for the user to close the app!
});

// 2. Activate & clear out any old cached versions
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
    self.clients.claim(); // MAGIC FIX: Take control of the open app instantly!
});

// 3. Network-First Strategy: Always try to get the newest file from GitHub first
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).then((response) => {
            // Network succeeded! Update the cache quietly in the background
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
            });
            return response; // Return the fresh file
        }).catch(() => {
            // Offline? Use the cached version
            return caches.match(event.request);
        })
    );
});
