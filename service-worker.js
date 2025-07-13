const CACHE_NAME = "ebmo-cache-v2";
const OFFLINE_PAGE = "./offline.html"; // Fallback page for offline access
const CACHE_VERSION = "v2"; // Increment this version to update the cache

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./event-catering.html",
  "./security-services.html",
  "./cleaning-services.html",
  "./contact.html",
  "./offline.html",
  "./about.html",
  "./manifest.json",
  "./images/service.jpg",
  "./images/catering.jpg",
  "./images/cleaning.jpg",
  "./images/favicon.ico",
  "./images/web-app-manifest-192x192.png",
  "./images/web-app-manifest-512x512.png",
];

// ✅ Install Event
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ✅ Activate Event
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// ✅ Fetch Event with advanced caching strategy
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Cache-first strategy for static files
  if (
    request.method === "GET" &&
    request.destination.match(/image|style|script/)
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((cachedResponse) => {
          return (
            cachedResponse ||
            fetch(request).then((networkResponse) => {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
                return networkResponse;
              });
            })
          );
        })
        .catch(() => {
          if (request.destination === "image") {
            return caches.match("./images/web-app-manifest-192x192.png"); // fallback image
          }
        })
    );
    return;
  }

  // Network-first for HTML pages
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() =>
          caches.match(request).then((res) => res || caches.match(OFFLINE_PAGE))
        )
    );
    return;
  }

  // Default fallback
  event.respondWith(
    caches.match(request).then((response) => response || fetch(request))
  );
});
