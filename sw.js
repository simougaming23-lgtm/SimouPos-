/* SimouPos service worker. غيّر VERSION عند كل إصدار جديد ليصل التحديث للمستخدمين */
const VERSION = '1.0.2';
const CACHE = 'simoupos-' + VERSION;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const EXT = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('simoupos-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && !EXT.includes(u.hostname)) return;
  if (r.mode === 'navigate') {
    // الصفحة: من الشبكة أولاً، وإن لم يوجد إنترنت فمن الذاكرة
    e.respondWith(
      fetch(r).then(x => { const c = x.clone(); caches.open(CACHE).then(k => k.put('index.html', c)); return x; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  // بقية الملفات: من الذاكرة فوراً مع تحديثها في الخلفية
  e.respondWith(
    caches.match(r).then(h => {
      const n = fetch(r).then(x => {
        if (x && (x.ok || x.type === 'opaque')) { const c = x.clone(); caches.open(CACHE).then(k => k.put(r, c)); }
        return x;
      }).catch(() => h);
      return h || n;
    })
  );
});
