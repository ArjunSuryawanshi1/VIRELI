const VIRELI_CACHE = "vireli-day19-consistency-planner-shell-v4";
const VIRELI_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=day19-consistency-planner-20260903d",
  "./script.js?v=day19-consistency-planner-20260903d",
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
