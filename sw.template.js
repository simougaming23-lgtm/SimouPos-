const V = "__VERSION__";
const C = "vm-" + V;
// تحميل أولي للهيكل. لا نفعّل النسخة الجديدة إلا بعد ضغط المستخدم على "تحديث الآن".
self.addEventListener("install", e => e.waitUntil(caches.open(C).then(c => c.addAll(["./", "manifest.webmanifest", "icon-192.png"]))));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("message", e => { if (e.data === "skip") self.skipWaiting(); });
// الشبكة أولاً (دائماً أحدث نسخة)، والذاكرة عند انقطاع الإنترنت. طلبات الـ API لا تُخزَّن أبداً.
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api")) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match("./"))));
});
