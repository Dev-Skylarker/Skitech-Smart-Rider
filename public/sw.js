const CACHE_NAME = "smart-rider-pwa-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA Service Worker] Caching app shell assets");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[PWA Service Worker] Error during caching initial assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[PWA Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Stale-While-Revalidate pattern for local assets, Network-only for API calls)
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass non-GET requests and API calls (Supabase / local SSR API routes)
  if (event.request.method !== "GET" || requestUrl.pathname.startsWith("/api") || event.request.url.includes("supabase.co")) {
    return;
  }

  // Handle local assets and pages
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch errors (e.g. offline)
          });
        return cachedResponse;
      }

      // Fetch from network if not cached
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        // Cache the newly fetched local asset
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for document navigation when offline
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
