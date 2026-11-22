// Cache simple : l'appli fonctionne hors ligne après la première visite.
const CACHE = 'echecs-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request).then((res) => { if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    })
  );
});
