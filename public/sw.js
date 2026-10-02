/*
  Same Sky service worker.

  Keeps the app shell available so the installed app opens instantly, and
  still opens (to its last-known screen) without a connection. Live data
  (Firebase, weather) always goes straight to the network and is never
  cached here.

  - Page loads: network first, falling back to the cached shell offline,
    so a new deploy is picked up on the next open.
  - Built assets (/assets/*, content-hashed): cache first, since a given
    file name never changes.
  - Fonts and icons: served from cache, refreshed in the background.

  Bump VERSION to force every installed copy to drop its old caches.
*/

const VERSION = "v2";
const SHELL_CACHE = `same-sky-shell-${VERSION}`;
const ASSET_CACHE = `same-sky-assets-${VERSION}`;

const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/theme-init.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("same-sky-") && key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isFont(url) {
  return url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Page navigations: try the network, fall back to the cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Hashed build output never changes under the same name.
  if (sameOrigin && url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Fonts and our own static files: cache, refreshed in the background.
  if (isFont(url) || (sameOrigin && (url.pathname.startsWith("/icons/") || url.pathname === "/favicon.svg"))) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok || response.type === "opaque") cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);

          return cached || network;
        }),
      ),
    );
  }

  // Everything else (Firebase, weather APIs…) goes to the network untouched.
});
