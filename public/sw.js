const CACHE_NAME = "tradgard-app-shell-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest"].map((path) =>
  new URL(path, self.registration.scope).toString(),
);
const STATIC_ASSET_PATH = /\/assets\/|\/icons\/|\/pwa-icon\.svg$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all([
          ...keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
          self.clients.claim(),
        ]),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.startsWith("/api/") || requestUrl.pathname.includes("/api/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match(APP_SHELL[1]))
          .then((cachedShell) => cachedShell || caches.match(APP_SHELL[0])),
      ),
    );
    return;
  }

  if (!STATIC_ASSET_PATH.test(requestUrl.pathname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            const cacheWrite = caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            event.waitUntil(cacheWrite);
          }
          return response;
        })
        .catch(() => caches.match(event.request));
    }),
  );
});
