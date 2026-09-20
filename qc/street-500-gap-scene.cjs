// CPU --prepare freezes authoritative worktree. --run-gpu requires root's slot.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'street-500-gap-scene'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifestPath=path.join(dir,'manifest.json');
if(process.argv.includes('--prepare')){
 assert(!fs.existsSync(manifestPath),'Original manifest already exists. Use street-500-gap-scene-restore.cjs --restore; do not re-freeze mutable worktree bytes.');
 const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'release-cumulative-snapshots.json'))).snapshots.candidate.files;
 const paths=new Set(prior.map(f=>f.path));
 // Root-level modules can gain imports since the older cumulative manifest.
 for(const p of fs.readdirSync(root))if(/\.(js|css|html|json)$/.test(p)&&fs.statSync(path.join(root,p)).isFile())paths.add(p);
 const common=[];for(const p of paths){const source=path.join(root,p);if(!fs.existsSync(source))throw Error('Missing immutable source '+p);const b=fs.readFileSync(source),dest=path.join(dir,'snapshot',p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);common.push({path:p,bytes:b.length,sha256:sha(b)});}
 const variants={};for(const mode of ['baseline','candidate']){
  const asset=mode==='baseline'?path.join(root,'experiments/osm2world/coverage-500-classified/asset'):path.join(__dirname,'street-500-gap-export/asset');const entries=[];
  for(const name of ['vidhana-streets.glb','vidhana-streets.json','vidhana-ground.json','vidhana-footprint.geojson']){const b=fs.readFileSync(path.join(asset,name)),p='assets/streets/'+name,dest=path.join(dir,mode,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);entries.push({path:p,bytes:b.length,sha256:sha(b)});}
  const b=fs.readFileSync(path.join(dir,mode+'-surfaces.json'));fs.writeFileSync(path.join(dir,mode,'vidhana-street-data.json'),b);entries.push({path:'vidhana-street-data.json',bytes:b.length,sha256:sha(b)});variants[mode]=entries;
 }
 const manifest={prepared:new Date().toISOString(),sourceHead:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),source:'Authoritative worktree bytes, including uncommitted edits, hash-frozen at preparation',common,variants,surfaceProvenance:JSON.parse(fs.readFileSync(path.join(dir,'surface-provenance.json')))};
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));console.log({prepared:true,commonFiles:common.length,manifestSHA256:sha(fs.readFileSync(manifestPath))});process.exit(0);
}
if(!process.argv.includes('--run-gpu')){console.log('CPU preparation only. Run --prepare; await root GPU release before --run-gpu.');process.exit(0);}
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const manifest=JSON.parse(fs.readFileSync(manifestPath)),origin='http://127.0.0.1:4173',probe=[77.59020226666667,12.975491600004656];
const views={road:{eye:[77.590278,12.975395],height:2.3,target:probe,targetHeight:.12},aerial:{eye:[77.59058,12.97514],height:70,target:probe,targetHeight:0}};
const mime={'.js':'text/javascript','.json':'application/json','.geojson':'application/geo+json','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const results=[];
(async()=>{let page;const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 for(const mode of ['baseline','candidate']){
  console.log('500m repaired scene '+mode);const table=new Map();for(const f of manifest.common)table.set(f.path,{...f,local:path.join(dir,'snapshot',f.path)});for(const f of manifest.variants[mode])table.set(f.path,{...f,local:path.join(dir,mode,f.path)});
  const frozen=new Map([...table].map(([p,f])=>{const body=fs.readFileSync(f.local);assert.equal(sha(body),f.sha256,'Frozen response changed '+p);return[p,{...f,body}]}));
  const errors=[],missing=[],requests=[];page=await browser.newPage({viewport:{width:1400,height:900},serviceWorkers:'block'});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/shader error|VALIDATE_STATUS|program not valid/i.test(m.text()))errors.push(m.text());});
  await page.route(origin+'/**',route=>{const p=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html';if(['local-cache.js','multiplayer-client.js'].includes(p))return route.fulfill({contentType:'text/javascript',body:''});const f=frozen.get(p);if(!f){if(p!=='favicon.ico')missing.push(p);return route.fulfill({status:404,body:'Not in immutable scene'});}requests.push({path:p,sha256:f.sha256});return route.fulfill({body:f.body,contentType:mime[path.extname(p)]||'application/octet-stream',headers:{'Cache-Control':'no-store'}});});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.goto(origin+'/');await page.waitForFunction(()=>window.cityBootReady&&window.districtState?.().loaded&&window.vidhanaStreetState?.().loaded&&window.vidhanaStreetPatch?.state().ready);
  await page.addStyleTag({content:'body > :not(#map){visibility:hidden!important}'});await page.evaluate(()=>window.setDomeOverview?.(false));
  const metadata=JSON.parse(frozen.get('assets/streets/vidhana-streets.json').body);for(const [view,pose]of Object.entries(views)){
   console.log(mode+' '+view);await page.evaluate(p=>{map.setMaxPitch(89);map.setMaxZoom(24);map.jumpTo(map.calculateCameraOptionsFromTo(p.eye,p.height,p.target,p.targetHeight));map.triggerRepaint();},pose);await page.waitForFunction(()=>map.areTilesLoaded());await page.waitForTimeout(1800);
   const telemetry=await page.evaluate(p=>({patch:vidhanaStreetPatch.state(),heightAtProbe:vidhanaStreetPatch.heightAt(...p),auto:window.autoState?.(),camera:{center:map.getCenter().toArray(),zoom:map.getZoom(),bearing:map.getBearing(),pitch:map.getPitch()},layers:map.getStyle().layers.filter(l=>l['source-layer']==='transportation'||l.id.startsWith('vidhana-')||l.id.startsWith('auto-road')).map(l=>({id:l.id,type:l.type,visibility:l.layout?.visibility??'visible'}))}),probe);
   assert.deepEqual(telemetry.patch.origin,metadata.origin);assert.equal(telemetry.patch.groundIndexSource,'sidecar');assert.equal(telemetry.patch.indexedTriangles,metadata.groundIndexTriangles);assert(!telemetry.auto?.active,'Auto surfaces must stay inactive');if(mode==='candidate')assert(Math.abs(telemetry.heightAtProbe)<1e-6);
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);const image='street-500-gap-scene-'+mode+'-'+view+'.png';await page.screenshot({path:path.join(__dirname,image)});results.push({mode,view,pose,image,...telemetry,errors:[...errors],missing:[...missing],requests:[...requests]});fs.writeFileSync(path.join(dir,'progress.json'),JSON.stringify(results,null,2));
  }await page.close();page=null;
 }
 for(const view of Object.keys(views)){const [a,b]=results.filter(r=>r.view===view);assert.deepEqual(a.camera,b.camera);}
 }catch(e){if(page)await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});throw e;}finally{await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({manifestSHA256:sha(fs.readFileSync(manifestPath)),views,results,completed:results.length===4,scope:'Classified500m before versus repaired500m after, source-generated flat roads clipped per footprint; base-map transportation and district shadow receiver remain shared; no auto-mode or route qualification'},null,2));}})().catch(e=>{console.error(e);process.exitCode=1});
