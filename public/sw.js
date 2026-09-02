const CACHE_NAME = 'tinyfingers-v2';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/favicon-32.png',
  '/icons/tinyfingers-192.png',
  '/icons/tinyfingers-512.png',
  '/icons/apple-touch-icon.png',
];

// Astro emits content-hashed bundles under /_astro/, so a given URL there never changes
// contents. Serving those from cache first is what makes a cold launch offline-fast.
const IMMUTABLE_PREFIX = '/_astro/';

// ignoreVary is essential, not a tweak. Static hosts commonly send `Vary: Origin`, and a
// module script is fetched with an Origin header while the stored request may not have
// had one. Honouring Vary then misses, we fall through to the network, and offline the
// page renders its shell but never boots. Hashed URLs identify their own content.
function fromCache(request) {
  return caches.match(request, { ignoreVary: true });
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

function store(request, response) {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith(IMMUTABLE_PREFIX)) {
    event.respondWith(
      fromCache(request)
        .then((cached) => cached ?? fetch(request).then((response) => store(request, response)))
        .catch(() => fromCache(request).then((cached) => cached ?? Response.error())),
    );
    return;
  }

  event.respondWith(
    fetch(request).then((response) => store(request, response)).catch(() => fromCache(request).then((cached) => {
      if (cached) return cached;
      return request.mode === 'navigate' ? fromCache('/') : Response.error();
    })),
  );
});
