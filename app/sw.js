const C='constat-dde-202611221001';
const F=["./","apple-touch-icon.png","constat.pdf","fonts/archivo-latin-500-normal.woff2","fonts/archivo-latin-700-normal.woff2","fonts/archivo-latin-800-normal.woff2","fonts/fonts.css","fonts/inter-latin-400-normal.woff2","fonts/inter-latin-500-normal.woff2","fonts/inter-latin-600-normal.woff2","icon-192.png","icon-512.png","manifest.webmanifest","pdf-lib.min.js"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok&&new URL(e.request.url).origin===location.origin){const x=r.clone();caches.open(C).then(c=>c.put(e.request,x))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./'))))});
