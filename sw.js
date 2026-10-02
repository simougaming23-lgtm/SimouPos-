const C='simou-1.0.3';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html'])).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).pathname.endsWith('version.json'))return;
e.respondWith(fetch(r).then(s=>{if(s.ok||s.type==='opaque'){const c=s.clone();caches.open(C).then(x=>x.put(r,c))}return s}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))))});