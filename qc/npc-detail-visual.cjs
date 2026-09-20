const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const commit=execFileSync('git',['rev-parse','9e500bb'],{encoding:'utf8'}).trim(),read=p=>execFileSync('git',['show',commit+':'+p],{maxBuffer:40*1024*1024}),sw=read('sw.js').toString(),files=new Set([...sw.match(/const files=\[(.*?)\];/s)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));
for(const m of sw.matchAll(/files\.push\(([^;]*)\);/g))for(const f of m[1].matchAll(/'([^']+)'/g))files.add(f[1]);for(const f of ['sw.js','local-cache.js','release.json','cycle-model.js','drone-model.js','street-detail.js'])files.add(f);
const assets=new Map([...files].map(p=>[p,read(p)])),mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'},runs=[],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const overrides={'npc-traffic.js':'qc/npc-detail-candidate.js','npc-detail-state.js':'qc/npc-detail-state.mjs','npc-detailed-batches.js':'qc/npc-detailed-batches.js'},mobile=process.env.NPC_QC_MOBILE==='1',prefix=mobile?'npc-detail-mobile':'npc-detail';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
for(const mode of mobile?['candidate']:['baseline','candidate','fallback']){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1100,height:760},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'}),errors=[],missing=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__npcReviewFreeze=true;});
 await page.route('http://127.0.0.1:4173/**',route=>{const file=decodeURIComponent(new URL(route.request().url()).pathname).slice(1)||'index.html';if(['local-cache.js','multiplayer-client.js'].includes(file))return route.fulfill({contentType:'text/javascript',body:''});
  if(mode==='fallback'&&file==='assets/vehicles/cybercab-rigged.glb')return route.fulfill({status:503,body:'Deliberate optional near-model failure'});
  let bytes=mode!=='baseline'&&overrides[file]?fs.readFileSync(overrides[file]):assets.get(file);if(!bytes){if(file!=='favicon.ico')missing.push(file);return route.fulfill({status:404,body:'Missing immutable asset'});}
  if(file==='npc-traffic.js'){let code=bytes.toString();assert(code.includes('const count=cars.length;'));code=code.replace('const count=cars.length;','const count=cars.length;window.__npcReviewCars=cars;').replace('if(accumulator>=.05){','if(!window.__npcReviewFreeze&&accumulator>=.05){');bytes=Buffer.from(code);}
  return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:bytes});});
 await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>window.npcTrafficState?.().vehicles>0&&window.districtState?.().loaded);
 if(mode==='candidate')await page.waitForFunction(()=>npcTrafficState().detailReady||npcTrafficState().detailError);if(mode==='fallback')await page.waitForFunction(()=>npcTrafficState().detailError);
 await page.addStyleTag({content:'body > :not(#map){visibility:hidden!important}'});
 await page.evaluate(()=>{const car=window.__npcReviewCars[0],h=car.heading*Math.PI/180,origin=[77.5945,12.9755],ll=(x,y)=>[origin[0]+x/(111320*Math.cos(origin[1]*Math.PI/180)),origin[1]+y/111320];map.setMaxZoom(24);map.setMaxPitch(85);map.setCenterClampedToGround(false);map.jumpTo(map.calculateCameraOptionsFromTo(ll(car.x-Math.sin(h)*9+Math.cos(h)*5,car.y-Math.cos(h)*9-Math.sin(h)*5),3.2,ll(car.x,car.y),.7));});
 await page.waitForFunction(()=>map.areTilesLoaded());await page.waitForTimeout(1800);
 const close=await page.evaluate(()=>npcTrafficState());if(mode==='candidate'){assert.equal(close.detailError,null);assert(close.nearVisible>=1);assert(close.nearVisible<=(mobile?1:2));assert.equal(close.nearVisible+close.farVisible,close.visible);if(mobile){assert(close.mobile);assert.equal(close.vehicles,8);}}
 if(mode==='fallback'){assert.equal(close.nearVisible,0);assert.equal(close.farVisible,close.visible);assert(close.detailError);}
 await page.screenshot({path:`qc/${prefix}-${mode}-close.png`});
 if(mode==='candidate'){
  await page.evaluate(()=>{for(const car of window.__npcReviewCars){car.totalMoved=(car.totalMoved||0)+.365*Math.PI/2;car.heading+=10;}map.triggerRepaint();});await page.waitForTimeout(500);
  const moved=await page.evaluate(()=>npcTrafficState());assert(moved.cars.every(c=>Math.abs(c.wheelPose.angle-Math.PI/2)<1e-6));await page.screenshot({path:`qc/${prefix}-candidate-turned.png`});
  await page.evaluate(()=>{map.jumpTo(map.calculateCameraOptionsFromTo([77.5942,12.9738],320,[77.5915,12.9782],0));});await page.waitForTimeout(900);assert.equal((await page.evaluate(()=>npcTrafficState())).nearVisible,0,'Aerial fallback uses lightweight geometry');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);runs.push({mode,close,errors,missing});console.log(JSON.stringify({mode,near:close.nearVisible,far:close.farVisible,drawCalls:close.drawCalls}));await page.close();
}
}finally{await browser.close();fs.writeFileSync(`qc/${prefix}-visual.json`,JSON.stringify({commit,mobileEmulation:mobile,passed:runs.length===(mobile?1:3),hashes:Object.fromEntries(Object.entries(overrides).map(([k,v])=>[k,sha(fs.readFileSync(v))])),runs,scope:'Isolated immutable runtime with deterministic frozen traffic for matched views. Near/far partition, quarter-turn phase and aerial fallback checked; desktop additionally tests optional-model failure. No performance or physical-phone claim.'},null,2));}})().catch(e=>{console.error(e);process.exitCode=1});
