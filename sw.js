// --- What's the Cost? — offline cache ---
const CACHE_NAME = 'wtc-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png'
];

// install: pre-cache core assets
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// activate: clean up old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// fetch: cache-first for same-origin; fallback to network; final fallback: simple offline page
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  if (new URL(req.url).origin !== self.location.origin) return; // ignore cross-origin
  evt.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          // put a copy in cache (only for GET)
          const resClone = res.clone();
          if (req.method === 'GET' && res.status === 200) {
            caches.open(CACHE_NAME).then((c) => c.put(req, resClone));
          }
          return res;
        }).catch(() => {
          // last-resort offline response
          return new Response(
            `<!doctype html><meta charset="utf-8"><title>Offline</title>
             <style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;padding:24px;}
             h1{font-size:20px;margin:0 0 8px}p{color:#444}</style>
             <h1>You're offline</h1>
             <p>You can still use “What’s the Cost?” once the page has been opened at least once online.</p>`,
            { headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
          );
        })
      );
    })
  );
});
