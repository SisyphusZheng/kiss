const CACHE = 'kiss-v1';
const PRECACHE = ['/', '/index.html'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
});
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put(req, r)); return r; });
}
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    caches.open(CACHE).then((c) => c.put(req, res.clone()));
    return res;
  } catch { return caches.match(req); }
}