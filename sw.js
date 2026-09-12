/* ============ FitYar service worker — offline shell ============ */
const VERSION = 'fityar-v28';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './privacy.html',
  './css/app.css',
  './js/app.js',
  './js/boot.js',
  './js/boot-check.js',
  './js/db.js',
  './js/ui.js',
  './js/i18n.js',
  './js/store.js',
  './js/config.js',
  './js/ai.js',
  './js/nutrition.js',
  './js/workouts.js',
  './js/progress.js',
  './js/settings.js',
  './js/plan.js',
  './js/data-foods.js',
  './js/data-recipes.js',
  './js/data-exercises.js',
  './js/wizard.js',
  './js/report.js',
  './js/art.js',
  './js/targets.js',
  './js/meals.js',
  './js/barcode.js',
  './js/coach.js',
  './js/tools.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './fonts/vazirmatn-400.woff2',
  './fonts/vazirmatn-500.woff2',
  './fonts/vazirmatn-600.woff2',
  './fonts/vazirmatn-700.woff2',
  './fonts/vazirmatn-latin-400.woff2',
  './fonts/vazirmatn-latin-600.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache AI calls or anything cross-origin except fonts.
  if (url.hostname.endsWith('googleapis.com') && !url.hostname.startsWith('fonts')) return;

  if (url.origin !== location.origin) {
    // fonts: cache-first, fall back to network
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // same-origin: network-first for navigations so updates land, cache-first for assets
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // same-origin assets: stale-while-revalidate — instant offline, fresh on next load
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});
