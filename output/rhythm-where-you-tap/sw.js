self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('neon-dash-v1').then(cache => cache.addAll([
      './',
      './index.html',
      './game.js'
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});