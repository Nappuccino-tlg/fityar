/* ============ FitYar service worker — offline shell ============ */
const VERSION = 'fityar-v119';
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
  './js/art3d.js',
  './js/moves.js',
  './js/body3d.js',
  './js/intro.js',
  './js/timeline.js',
  './js/targets.js',
  './js/meals.js',
  './js/barcode.js',
  './js/coach.js',
  './js/reminders.js',
  './js/account.js',
  './js/weekcard.js',
  './js/tools.js',
  './js/motion.js',
  './js/icons.js',
  './js/muscles.js',
  './js/xp.js',
  './js/voice.js',
  './js/globe.js', './js/smart.js',
  './js/story.js',
  /* The chat, the globe's geography and پویا. These were added after the
     list was written and never joined it, so the six screens that promise
     «بدون اینترنت هم کار می‌کند» were the six that did not — not until each
     had been opened once with a connection. Runtime caching healed it on
     the second visit, which is no help to someone opening the app on a bus.
     tools/test-shell.mjs now compares this list against js/ so the next
     file cannot go missing quietly. */
  './js/ask.js',
  './js/assistant.js',
  './js/knowledge.js',
  './js/pouya.js',
  './js/land.js',
  './js/compare.js',
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

  // AI calls are never cached, whoever they go to.
  if (url.hostname.endsWith('googleapis.com') && !url.hostname.startsWith('fonts')) return;

  /* Nothing cross-origin is cached.

     This branch was written for fonts and cached everything cross-origin
     instead — and there are no cross-origin fonts: every face is a local
     .woff2 and the CSP's font-src is 'self', so one could not load if it
     tried. What it actually collected was third-party API responses, which
     accumulated in the app's cache under a comment saying "fonts", were
     never evicted, and recorded which products had been scanned. The app
     already keeps the ones it wants in its own `barcodes` store. */
  if (url.origin !== location.origin) return;

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
