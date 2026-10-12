const VIRELI_CACHE = "vireli-day29-neon-accounts-20261012b";
const VIRELI_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=day29-neon-accounts-20261012b",
  "./script.js?v=day29-neon-accounts-20261012b",
  "./api-config.js?v=day29-neon-accounts-20261012b",
  "./api-client.js?v=day29-neon-accounts-20261012b",
  "./manifest.webmanifest",
  "./icons/vireli-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VIRELI_CACHE).then((cache) => cache.addAll(VIRELI_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== VIRELI_CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  if (requestUrl.pathname.endsWith("/api-config.js")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(VIRELI_CACHE).then((cache) => cache.put(event.request, copy)));
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request)),
  );
});
