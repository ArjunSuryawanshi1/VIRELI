const VIRELI_CACHE = "vireli-day12-shell-v2";
const VIRELI_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=day12-intelligent-scheduling-20260820b",
  "./script.js?v=day12-intelligent-scheduling-20260820b",
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

  if (requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) =>
      cachedResponse || fetch(event.request).catch(() => caches.match("./index.html")),
    ),
  );
});
