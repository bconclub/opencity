// Cache only this app's own assets. Third-party map tiles and CDN files retain
// their provider-controlled caching behavior.
const version=new URL(self.location.href).searchParams.get('v')||'dev';
const cacheName='opencity-assets-'+version;
const root=new URL('./',self.location.href);
const files=['performance-panel.js','performance-panel.css','index.html','app.js','styles.css','flight.js','flight.css','flight-physics.js','helicopter.js','auto-mode.js','auto-model.js','auto-physics.js','auto-roads.js','auto-world.js','auto.css','district.js','district-data.json','building-context.js','landmarks.js','landmark-data.json','cbd-boundary.js','cbd-dome.js','cockpit.css','mobile-controls.css','tilt-controls.js','gamepad-controls.js','vehicle-shell.js','vehicle-shell.css','focus-pointer.js','focus-pointer.css','mobile-dashboard.js','mobile-dashboard.css'];
const allowed=new Set(files.map(f=>new URL(f,root).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll([...allowed]))));
// Old tabs retain their old worker until closed, so releases cannot mix assets.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('opencity-assets-')&&k!==cacheName).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);if(url.origin!==root.origin||!allowed.has(url.href))return;
 event.respondWith(caches.open(cacheName).then(async cache=>{const stored=await cache.match(event.request);if(stored)return stored;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}));
});
