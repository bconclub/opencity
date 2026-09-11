// Cache only this app's own assets. Third-party map tiles and CDN files retain
// their provider-controlled caching behavior.
const version=new URL(self.location.href).searchParams.get('v')||'dev';
const cacheName='opencity-assets-'+version;
const root=new URL('./',self.location.href);
const files=['map-scene-camera.js','vehicle-contact-shadow.js','street-surface-materials.js','city-loading.js','city-loading.css','vehicle-environment.js','auto-roam-physics.js','assets/vehicles/cybercab-rigged.glb','assets/vehicles/cybercab-meshy-traffic.glb','assets/vehicles/previews/cycle.webp','assets/vehicles/previews/auto.webp','assets/vehicles/previews/helicopter.webp','assets/vehicles/previews/cybertruck.webp','assets/vehicles/previews/cybercab.webp','assets/vehicles/previews/kitt.webp','boost-meter.js','vehicle-boost.js','vehicle-tuning.js','traffic-simulation.js','blender-vehicle.js','driving-data.js','vidhana-road-network.json','street-patch.js','street-furniture.js','assets/streets/furniture.json','assets/streets/vidhana-streets.glb','assets/streets/vidhana-streets.json','assets/streets/vidhana-footprint.geojson','assets/vehicles/cybertruck.glb','assets/vehicles/kitt.glb','vidhana-streets.js','vidhana-street-data.json','npc-traffic.js','supercar-model.js','auto-asset.js','assets/auto/auto-rickshaw.glb','vehicle-models.js','voice-chat.js','voice-chat.css','social-entry.js','social-controls.js','social-controls.css','vehicle-colors.js','player-cloud.js','player-stats.js','player-stats-ui.js','supabase-config.json','mobile-drive.js','mobile-drive.css','mobile-menu.js','mobile-menu.css','multiplayer-client.js','multiplayer-client.css','multiplayer-render.js','multiplayer-config.json','resume-overlay.js','resume-overlay.css','controller-monitor.js','controller-monitor.css','performance-panel.js','performance-panel.css','index.html','app.js','styles.css','flight.js','flight.css','flight-physics.js','helicopter.js','auto-mode.js','auto-model.js','auto-physics.js','auto-roads.js','auto-world.js','auto.css','district.js','district-data.json','building-context.js','landmarks.js','landmark-data.json','cbd-boundary.js','cbd-dome.js','cockpit.css','mobile-controls.css','tilt-controls.js','gamepad-controls.js','vehicle-shell.js','vehicle-shell.css','focus-pointer.js','focus-pointer.css','mobile-dashboard.js','mobile-dashboard.css'];
files.push('street-detail.js','street-surface-coverage.js','assets/streets/vidhana-coverage.png');
files.push('npc-detail-state.js','npc-detailed-batches.js');
files.push('landmark-focus.js','stair-collision.js','vidhana-driving-world.js','vidhana-building-passage.js','vehicle-footprint.js');
const allowed=new Set(files.map(f=>new URL(f,root).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll([...allowed]))));
// Old tabs retain their old worker until closed, so releases cannot mix assets.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('opencity-assets-')&&k!==cacheName).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);if(url.origin!==root.origin||!allowed.has(url.href))return;
 event.respondWith(caches.open(cacheName).then(async cache=>{const stored=await cache.match(event.request);if(stored&&!url.pathname.endsWith('-config.json'))return stored;try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch(error){if(stored)return stored;throw error;}}));
});









self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_RELEASE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));


