// Bump this version whenever the application shell or module graph changes.
const CACHE_NAME = 'kanishka-fleet-beta-v2-modular';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './js/app.js',
  './js/core/store.js',
  './js/dashboard/aggregator.js',
  './js/domain/work.js',
  './js/domain/fuel.js',
  './js/domain/expenses.js',
  './js/domain/revenue.js',
  './js/domain/maintenance.js',
  './js/domain/loan.js',
  './js/domain/renewals.js',
  './js/screens/work.js',
  './js/screens/fuel.js',
  './js/screens/expenses.js',
  './js/screens/revenue.js',
  './js/screens/maintenance.js',
  './js/screens/loan.js',
  './js/screens/renewals.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first. For HTML navigations, attach the composition root without
// rewriting the legacy UI markup. The legacy shell remains visually intact while
// the new module graph is bootstrapped alongside it.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request).then(async response => {
      if(response.ok && event.request.mode === 'navigate' && response.headers.get('content-type')?.includes('text/html')){
        const html = await response.text();
        const marker = '<script type="module" src="./js/app.js"></script>';
        if(!html.includes(marker)){
          const injected = html.replace('</body>', `${marker}</body>`);
          return new Response(injected, {status:response.status, statusText:response.statusText, headers:response.headers});
        }
        return new Response(html, {status:response.status, statusText:response.statusText, headers:response.headers});
      }
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
