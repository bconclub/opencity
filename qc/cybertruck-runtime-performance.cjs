// Full-scene ABBA gate, one browser and one page at a time. No runtime edits.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const crypto=require('node:crypto'),oldAsset='qc/cybertruck-runtime-before.glb';
const source={baseline:fs.readFileSync(process.env.Cybertruck_BASELINE_ASSET||(fs.existsSync(oldAsset)?oldAsset:'assets/vehicles/cybertruck.glb')),candidate:fs.readFileSync('assets/vehicles/cybertruck-review/revision2/cybertruck-reference.glb')},runs=[];
const hashes=Object.fromEntries(Object.entries(source).map(([key,bytes])=>[key,crypto.createHash('sha256').update(bytes).digest('hex')]));
assert.equal(hashes.candidate,'e6ad2ff4ffc3b4ee4de73600f28eb264e2fc3b3fac65f31ebb0d4f50cda4fc05');assert.notEqual(hashes.baseline,hashes.candidate,'Performance comparison needs distinct baseline and candidate assets.');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
for(const [index,mode] of ['baseline','candidate','candidate','baseline'].entries()){
 console.log('Cybertruck frame gate '+index+' '+mode);
 const page=await browser.newPage({viewport:{width:1100,height:800},serviceWorkers:'block'}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('opencity-vehicle-color','white'));
 await page.route('**/local-cache.js*',r=>r.fulfill({contentType:'text/javascript',body:''}));await page.route('**/multiplayer-client.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
 await page.route('**/assets/vehicles/cybertruck.glb',r=>r.fulfill({contentType:'model/gltf-binary',body:source[mode]}));
 const baselineTuning=fs.readFileSync('qc/cybertruck-runtime-before-tuning.js','utf8');
 const selectedTuning=mode==='baseline'?baselineTuning:baselineTuning.replace(/cybertruck:\{([^}]+)\}/,(_,body)=>'cybertruck:{'+body.replace(/wheelbase:[\d.]+/,'wheelbase:3.635').replace(/wheelRadius:[\d.]+/,'wheelRadius:.43925')+'}');
 await page.route('**/vehicle-tuning.js',r=>r.fulfill({contentType:'text/javascript',body:selectedTuning}));
 await page.goto('http://127.0.0.1:4173/');await page.locator('[data-ride=cybertruck]').click();await page.locator('.departure-options button').first().click();await page.waitForFunction(()=>window.autoState?.().active&&autoState().vehicleType==='cybertruck');
 // Static vehicle keeps identical camera/geometry framing; scanner and city
 // render loops still run. Programmatic pause is a measurement setup, not UI QC.
 await page.evaluate(()=>{if(!autoState().paused)document.getElementById('pause-auto').click();});
 await page.addStyleTag({content:'body > :not(#map){visibility:hidden!important}'});
 await page.waitForTimeout(2500);
 const sample=await page.evaluate(()=>new Promise(resolve=>{const layers={},frames=[],original=window.recordCityRender;window.recordCityRender=(name,r,ms)=>{original?.(name,r,ms);layers[name]={calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures};};let last;function frame(t){if(last!==undefined)frames.push(t-last);last=t;if(frames.length<60){map.triggerRepaint();requestAnimationFrame(frame);}else{window.recordCityRender=original;const sorted=[...frames].sort((a,b)=>a-b);resolve({meanMs:frames.reduce((a,b)=>a+b)/frames.length,medianMs:sorted[30],p95Ms:sorted[57],layers,calls:Object.values(layers).reduce((n,v)=>n+v.calls,0),triangles:Object.values(layers).reduce((n,v)=>n+v.triangles,0),camera:{center:map.getCenter().toArray(),zoom:map.getZoom(),pitch:map.getPitch(),bearing:map.getBearing()},vehicle:autoState().vehicleType});}}map.triggerRepaint();requestAnimationFrame(frame);}));
 await page.screenshot({path:`qc/cybertruck-runtime-performance-${index}-${mode}.png`});assert.deepEqual(errors,[]);assert(sample.layers.Auto?.calls>0);runs.push({index,mode,...sample,assetBytes:source[mode].length,errors});console.log(JSON.stringify({mode,meanMs:sample.meanMs,calls:sample.calls,triangles:sample.triangles}));await page.close();
}
}finally{await browser.close();const mean=mode=>{const values=runs.filter(r=>r.mode===mode);return values.reduce((n,r)=>n+r.meanMs,0)/values.length;},regression=(mean('candidate')/mean('baseline')-1)*100;const report={assetHashes:hashes,scope:'Full city static Cybertruck chase view,1100x800,Edge SwiftShader,60frames/run,ABBA. Relative single-device gate, not physical phone FPS or multiplayer cost.',runs,baselineMeanMs:mean('baseline'),candidateMeanMs:mean('candidate'),regressionPercent:regression,passed:runs.length===4&&regression<=10};fs.writeFileSync('qc/cybertruck-runtime-performance.json',JSON.stringify(report,null,2)+'\n');if(runs.length===4)assert(regression<=10,'Cybertruck full-scene frame time regressed more than10%');}})().catch(e=>{console.error(e);process.exitCode=1});
