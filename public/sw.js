// Cache name is versioned by deploy time — forces fresh install on each deploy.
// sw.js itself is served with no-cache headers by Vercel so browsers always
// get the latest version on every page load.
const CACHE_NAME = `skitech-smart-rider-pwa-${Date.now()}`;

// Only pre-cache true static assets (never HTML documents).
// HTML must always come from the network so it references the correct
// content-hashed JS/CSS chunk filenames after each deploy.
const STATIC_ASSETS = [
  "/manifest.json",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Pre-cache error (non-fatal):", err);
      });
    })
  );
  // Activate immediately — don't wait for existing tabs to close.
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting stale cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  // Take control of all open clients immediately.
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests entirely.
  if (request.method !== "GET") return;

  // 2. Skip external origins (Supabase, EmailJS, CDNs, etc.).
  if (url.origin !== self.location.origin) return;

  // 3. Skip SSR API routes — always network-only.
  if (url.pathname.startsWith("/api/")) return;

  // 4. HTML document navigations → NETWORK FIRST, no caching.
  //    This ensures fresh HTML (with correct chunk hashes) after every deploy.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        // Only fall back to cached shell if truly offline.
        caches.match("/").then(
          (cached) => cached ?? new Response("Offline", { status: 503 })
        )
      )
    );
    return;
  }

  // 5. Content-hashed JS/CSS assets under /assets/ → CACHE FIRST.
  //    These filenames change on every deploy, so cached versions are
  //    always valid for their lifetime. Old hashes are pruned when the
  //    SW activates and deletes the previous CACHE_NAME bucket.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // 6. Everything else (icons, manifest, fonts) → STALE-WHILE-REVALIDATE.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached ?? networkFetch;
    })
  );
});
