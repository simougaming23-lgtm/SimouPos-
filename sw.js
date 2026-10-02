const C='simou-1.1.0';
const X=['https://cdn.tailwindcss.com','https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all([c.addAll(['./','index.html']).catch(()=>{}),...X.map(u=>fetch(new Request(u,{mode:'no-cors'})).then(r=>c.put(u,r)).catch(()=>{}))])))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).pathname.endsWith('version.json'))return;
e.respondWith(fetch(r).then(s=>{if(s.ok||s.type==='opaque'){const c=s.clone();caches.open(C).then(x=>x.put(r,c))}return s}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))))});