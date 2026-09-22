// ChatChip Service Worker
// v4: public AI Employee routes keep their own shell/fallback.
const CACHE_NAME = 'chatchip-v21';

const urlsToCache = [
  '/index.html','/l/index.html','/admin-panel.html','/pricing.html','/register.html',
  '/css/style.css','/css/admin-panel.css','/css/pricing.css','/css/register.css',
  '/js/crypto.js','/js/datamanager.js','/js/sidebar.js','/js/preferences.js','/js/messages.js','/js/imageServices.js','/js/imageState.js','/js/imageUpload.js','/js/messageRouter.js','/js/chatEngine.js','/js/app.js','/js/composer.js','/js/models.js','/js/plan.js','/js/auth.js','/js/ui.js','/js/sessions.js','/js/voice.js','/js/admin-panel.js','/js/pricing.js',
  '/assets/logo.svg','/assets/pwalogo.png','/assets/icon-72.png','/assets/icon-96.png','/assets/icon-128.png','/assets/icon-144.png','/assets/icon-152.png','/assets/icon-192.png','/assets/icon-384.png','/assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(() => self.skipWaiting()).catch(err => console.error('Cache install hatası:', err)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();

    await Promise.all(
      names
        .filter(name => name.startsWith('chatchip-') && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );

    await self.clients.claim();

    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    await Promise.all(
      clients.map(client => {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) {
            return client.navigate(client.url);
          }
        } catch (_) {}
        return Promise.resolve();
      })
    );
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(fetch(request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      // Never turn /l/<slug> into the logged-in personal ChatChip shell.
      const fallbackPath = url.pathname.startsWith('/l/') ? '/l/index.html' : '/index.html';
      const fallback = await caches.match(fallbackPath);
      if (fallback) return fallback;
    }
    return new Response('🚀 ChatChip - Çevrimdışı', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
