// ChatChip Service Worker
// v3: safe PWA asset refresh. This only manages Cache Storage;
// localStorage/IndexedDB/auth/crypto keys are never touched.
const CACHE_NAME = 'chatchip-v3';

const urlsToCache = [
  '/index.html',
  '/backoffice.html',
  '/admin-panel.html',
  '/pricing.html',
  '/register.html',
  '/tree-detail.html',
  '/cuzdan.html',

  '/css/style.css',
  '/css/backoffice.css',
  '/css/admin-panel.css',
  '/css/pricing.css',
  '/css/register.css',
  '/css/tree-detail.css',
  '/css/cuzdan.css',

  '/js/crypto.js',
  '/js/datamanager.js',
  '/js/sidebar.js',
  '/js/imageServices.js',
  '/js/app.js',
  '/js/backoffice.js',
  '/js/admin-panel.js',
  '/js/pricing.js',
  '/js/tree-detail.js',
  '/js/cuzdan.js',

  '/assets/logo.svg',
  '/assets/pwalogo.png',
  '/assets/icon-72.png',
  '/assets/icon-96.png',
  '/assets/icon-128.png',
  '/assets/icon-144.png',
  '/assets/icon-152.png',
  '/assets/icon-192.png',
  '/assets/icon-384.png',
  '/assets/icon-512.png'
];

// Install the new worker and pre-cache the current app shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch(err => console.error('Cache install hatası:', err))
  );
});

// Remove only old ChatChip caches. Do not touch caches belonging to anything else.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(name => name.startsWith('chatchip-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Navigation + same-origin app assets: network first so deployed updates are seen.
// If offline/network fails, fall back to the cached app shell.
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }

        return new Response('🚀 ChatChip - Çevrimdışı', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});
