const CACHE_NAME = 'dodge-dot-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/game.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)));
});
