// ChatChip Service Worker
const CACHE_NAME = 'chatchip-v2';

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

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache açıldı');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache hatası:', err))
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eski cache silindi:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).catch(() => {
          return new Response('🚀 ChatChip - Çevrimdışı', {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
        });
      })
  );
});
