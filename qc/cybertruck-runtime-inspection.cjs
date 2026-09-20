// Full-app release inspection. Deliberately NOT run by ordinary CPU checks.
// Requires existing local app server and explicit reservation of the GPU slot.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),base=process.env.CITY_URL||'http://127.0.0.1:4173/';
const defaultPaintOnly=process.argv.includes('--default-paint-only'),reportName=defaultPaintOnly?'cybertruck-runtime-default-paint-browser.json':'cybertruck-runtime-inspection-results.json';
if(!process.argv.includes('--run-gpu')){console.log('Prepared only. After GPU slot release: node qc/cybertruck-runtime-inspection.cjs --run-gpu');process.exit(0);}
if(new URL(base).hostname!=='127.0.0.1')throw Error('Use local 127.0.0.1 CITY_URL; inspection connects only to a temporary local room server.');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const preservedBaseline=path.join(ROOT,'qc/cybertruck-runtime-before.glb');
const assets={before:fs.readFileSync(process.env.Cybertruck_BASELINE_ASSET||(fs.existsSync(preservedBaseline)?preservedBaseline:path.join(ROOT,'assets/vehicles/cybertruck.glb'))),candidate:fs.readFileSync(process.env.Cybertruck_CANDIDATE_ASSET||path.join(ROOT,'assets/vehicles/cybertruck-review/revision2/cybertruck-reference.glb'))};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
if(!defaultPaintOnly)assert.equal(hash(assets.candidate),'e6ad2ff4ffc3b4ee4de73600f28eb264e2fc3b3fac65f31ebb0d4f50cda4fc05');assert.notEqual(hash(assets.before),hash(assets.candidate),'Before/candidate bytes identical: specify an actual baseline GLB through Cybertruck_BASELINE_ASSET.');
function instrument(source,needle,addition){assert.equal(source.split(needle).length,2,'Instrumentation anchor changed: '+needle);return source.replace(needle,addition+needle);}
const blender=instrument(fs.readFileSync(path.join(ROOT,'blender-vehicle.js'),'utf8'),' return{group,body,front,wheels,get wheelRadius',` (window.__cybertruckRuntimeModels??=[]).push({id,group,body,wheels,ready,setPaint,get rig(){return rig;},get scanners(){return scanners;}});\n`);
const remote=instrument(fs.readFileSync(path.join(ROOT,'multiplayer-render.js'),'utf8'),' const origin=maplibregl.MercatorCoordinate.fromLngLat',` window.__cybertruckRuntimeRemoteEntries=entries;\n`);
const tuning=fs.readFileSync(path.join(ROOT,'vehicle-tuning.js'),'utf8').replace(/cybertruck:\{([^}]+)\}/,(_,body)=>'cybertruck:{'+body.replace(/wheelbase:[\d.]+/,'wheelbase:3.635').replace(/wheelRadius:[\d.]+/,'wheelRadius:.43925')+'}');
assert(tuning.includes('wheelbase:3.635'),'Cybertruck tuning interception failed');
const report={remoteSteeringKnownMismatch:{runtimeWheelbase:3.3,candidateWheelbase:3.635,tangentUnderestimatePercent:(1-3.3/3.635)*100},status:'RUNNING',base,started:new Date().toISOString(),candidatePhysicsOverride:{wheelbase:3.635,wheelRadius:.43925},variants:[],errors:[],note:'Full app with local actual room server. Only GLB response/tuning and read-only inspection hooks are intercepted; production files remain untouched. GPU visuals require human review.'};
report.mode=defaultPaintOnly?'candidate-default-paint-only':'full';
const saveReport=()=>fs.writeFileSync(path.join(__dirname,reportName),JSON.stringify(report,null,2)+'\n');
let activeRun;
function stage(name){activeRun.stage=name;activeRun.stageStarted=Date.now();(activeRun.stages??=[]).push({name,time:new Date().toISOString()});console.log(`[${activeRun.variant}] ${name}`);saveReport();}
function action(control,method,uiTested){(activeRun.controlActions??=[]).push({control,method,uiTested,time:new Date().toISOString()});console.log(`[${activeRun.variant}] ${control}: ${method}`);saveReport();}

async function snapshot(page){return page.evaluate(()=>{
 const models=(window.__cybertruckRuntimeModels||[]).filter(m=>m.id==='cybertruck'&&m.group.parent).map(m=>{
  const entry=[...(window.__cybertruckRuntimeRemoteEntries||new Map())].find(([,e])=>e.model?.group===m.group),materials=new Map();
  const lights=[];m.group.traverse(o=>{if(o.isMesh&&/^(Front|Tail)[ _]light[ _]bar/i.test(o.name)){let sample=null;const image=o.material.map?.image,uv=o.geometry.attributes.uv;if(image&&uv){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);sample=[...ctx.getImageData(Math.min(image.width-1,Math.max(0,Math.floor(uv.getX(0)*image.width))),0,1,1).data];}lights.push({name:o.name,map:!!o.material.map,emissiveMap:!!o.material.emissiveMap,sample});}});
  m.group.traverse(o=>{if(o.isMesh)for(const mat of Array.isArray(o.material)?o.material:[o.material])materials.set(mat.uuid,{name:mat.name,uuid:mat.uuid,color:mat.color?.getHexString(),emissiveMap:!!mat.emissiveMap});});
  return{lights,role:entry?'remote':'local',remotePlayerId:entry?.[0]??null,paint:[...materials.values()].filter(m=>m.name==='BodyPaint'),nonPaint:[...materials.values()].filter(m=>m.name!=='BodyPaint'),wheelbase:m.rig?.wheelbase,radius:m.rig?.wheelRadius,wheels:m.wheels.map(w=>({name:w.name,spin:w.quaternion.toArray(),steering:w.parent.quaternion.toArray()})),scanners:m.scanners.map(s=>({name:s.name,intensity:s.material.emissiveIntensity,emissiveMap:!!s.material.emissiveMap,material:s.material.uuid})),visualHeight:m.group.userData.visualHeight};
 });return{auto:window.autoState?.(),network:window.multiplayerState?.(),remote:window.multiplayerRenderState?.(),models};
});}
const model=(s,role)=>s.models.find(m=>m.role===role);
const quaternions=m=>m.wheels.map(w=>w.spin);
const changed=(a,b)=>a.some((v,i)=>v.some((x,k)=>Math.abs(x-b[i][k])>1e-4));
async function scannerChanged(page,role,before){await page.waitForFunction(({role,before})=>(window.__cybertruckRuntimeModels||[]).some(m=>{const remote=[...(window.__cybertruckRuntimeRemoteEntries||new Map()).values()].some(e=>e.model?.group===m.group);return m.id==='cybertruck'&&m.group.parent&&(remote?'remote':'local')===role&&m.scanners.some((s,i)=>Math.abs(s.material.emissiveIntensity-before[i])>.02);}),{role,before},{timeout:12000});}
async function openCenter(page){const button=page.locator('#mobile-menu-toggle');if(await button.getAttribute('aria-expanded')!=='true')await button.click({timeout:8000});}
async function closeCenter(page){const close=page.locator('#mobile-menu-close');if(await close.isVisible())await close.click({timeout:8000});else{const toggle=page.locator('#mobile-menu-toggle');if(await toggle.getAttribute('aria-expanded')==='true')await toggle.click({timeout:8000});}}
async function pause(page){if(await page.evaluate(()=>autoState().active&&!autoState().paused)){await openCenter(page);await page.locator('[data-tool=settings]').click({timeout:8000});await page.waitForFunction(()=>autoState().paused,null,{timeout:8000});await closeCenter(page);action('pause','visible control center > Settings (app auto-pauses on opening)',true);}}
async function resume(page){if(await page.evaluate(()=>autoState().paused)){await page.bringToFront();await closeCenter(page);await page.locator('#resume-ride').click({timeout:8000});await page.waitForFunction(()=>!autoState().paused,null,{timeout:8000});action('resume','visible Resume ride overlay',true);}}
async function resetHandler(page){action('reset','programmatic existing #reset-auto.click(); no visible reset is exposed by current control center',false);await page.evaluate(()=>{const button=document.getElementById('reset-auto');if(!button||button.disabled)throw Error('Existing reset handler unavailable');button.click();});await page.waitForFunction(()=>autoState().active&&autoState().distance===0,null,{timeout:8000});}
async function setRoaming(page,value){if(await page.evaluate(()=>autoState().roaming)===value)return;await openCenter(page);await page.locator('#auto-roam-toggle').click({timeout:8000});await page.waitForFunction(value=>autoState().roaming===value,value,{timeout:8000});await closeCenter(page);action(value?'start auto-roam':'stop auto-roam','visible control center Auto-roam toggle',true);}
async function startKitt(page,index=0){await page.locator('[data-ride=cybertruck]').click();const departures=page.locator('.departure-options button');await departures.first().waitFor();await departures.nth(Math.min(index,(await departures.count())-1)).click();await page.waitForFunction(()=>window.autoState?.().active&&autoState().vehicleType==='cybertruck');}
async function paint(page,color){action('paint '+color,'programmatic existing vehicle-color-change event (color-picker UI not tested)',false);await page.evaluate(color=>{localStorage.setItem('opencity-vehicle-color',color);dispatchEvent(new CustomEvent('vehicle-color-change',{detail:{color}}));},color);}
async function waitPaint(page,role,hex){await page.waitForFunction(({role,hex})=>(window.__cybertruckRuntimeModels||[]).some(m=>{const remote=[...(window.__cybertruckRuntimeRemoteEntries||new Map()).values()].some(e=>e.model?.group===m.group);if(m.id!=='cybertruck'||!m.group.parent||(remote?'remote':'local')!==role)return false;let found=false,ok=true;m.group.traverse(o=>{if(o.isMesh&&o.material.name==='BodyPaint'){found=true;ok&&=o.material.color.getHexString()===hex;}});return found&&ok;}),{role,hex},{timeout:15000});}
async function frameObserver(observer,driver){const pose=await driver.evaluate(()=>multiplayerState().pose);await observer.evaluate(p=>{map.jumpTo({center:[p.lng,p.lat],zoom:19.3,pitch:62,bearing:-25});map.triggerRepaint();},pose);await observer.waitForFunction(()=>multiplayerRenderState().players.some(p=>p.vehicle==='cybertruck'&&p.labelVisible));return pose;}

(async()=>{
 const {createRoomServer}=await import('../multiplayer-server/server.mjs'),rooms=createRoomServer({allowedOrigins:new URL(base).origin});
 await new Promise(resolve=>rooms.server.listen(0,'127.0.0.1',resolve));const roomURL='ws://127.0.0.1:'+rooms.server.address().port+'/ws';let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
  for(const variant of defaultPaintOnly?['candidate']:['before','candidate']){
   const contexts=[],pages=[],run={variant,assetSHA256:hash(assets[variant]),assetBytes:assets[variant].length,requests:[],checks:[],screenshots:[]};report.variants.push(run);activeRun=run;stage('prepare two fresh clients');
   const heartbeat=setInterval(()=>{console.log(`[${variant}] waiting: ${run.stage}, ${Math.round((Date.now()-run.stageStarted)/1000)}s`);saveReport();},15000);
   try{
    for(const who of ['driver','observer']){
     const context=await browser.newContext({viewport:{width:1100,height:800},serviceWorkers:'block'});await context.addInitScript(()=>localStorage.setItem('opencity-vehicle-color','white'));contexts.push(context);const p=await context.newPage();pages.push(p);p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(90000);
     p.on('pageerror',e=>report.errors.push({variant,who,message:e.message}));p.on('requestfailed',r=>run.requests.push({who,url:r.url(),failure:r.failure()?.errorText}));
     await p.route('**/multiplayer-config.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({url:roomURL})}));
     await p.route('**/assets/vehicles/cybertruck.glb',r=>{run.requests.push({who,assetSHA256:hash(assets[variant]),url:r.request().url()});return r.fulfill({contentType:'model/gltf-binary',body:assets[variant]});});
     await p.route('**/blender-vehicle.js',r=>r.fulfill({contentType:'text/javascript',body:blender}));
     await p.route('**/multiplayer-render.js',r=>r.fulfill({contentType:'text/javascript',body:remote}));
     if(variant==='candidate')await p.route('**/vehicle-tuning.js',r=>r.fulfill({contentType:'text/javascript',body:tuning}));
    }
    const [driver,observer]=pages;
    stage('driver city loading and room creation');await driver.goto(base);const entry=driver.locator('.multiplayer-name-dialog');await entry.waitFor({state:'visible',timeout:90000});await entry.getByLabel('Player name',{exact:true}).fill('Cybertruck Driver');await entry.getByRole('button',{name:'Create room',exact:true}).click();await driver.waitForFunction(()=>multiplayerState().connected);const room=await driver.evaluate(()=>multiplayerState().room);
    stage('observer city loading and room join');await observer.goto(base);const join=observer.locator('.multiplayer-name-dialog');await join.waitFor({state:'visible',timeout:90000});await join.getByLabel('Player name',{exact:true}).fill('Cybertruck Observer');await join.getByRole('button',{name:'Join room',exact:true}).click();await join.locator('.multiplayer-entry-room input').fill(room);await join.getByRole('button',{name:'Join and start',exact:true}).click();await observer.waitForFunction(()=>multiplayerState().connected&&multiplayerState().players.length===2);
    stage('Cybertruck departure and parked comparison');
    await driver.bringToFront();await startKitt(driver);await observer.waitForFunction(()=>(window.__cybertruckRuntimeModels||[]).some(m=>m.id==='cybertruck'&&m.rig&&m.group.parent));await resume(driver);
    await waitPaint(driver,'local','e8ede7');await waitPaint(observer,'remote','e8ede7');
    run.parkedLocal=await snapshot(driver);run.parkedRemote=await snapshot(observer);assert.equal(model(run.parkedLocal,'local').wheels.length,4);assert.equal(model(run.parkedRemote,'remote').wheels.length,4);
    assert.deepEqual(model(run.parkedLocal,'local').paint.map(m=>m.color),model(run.parkedRemote,'remote').paint.map(m=>m.color),'initial local and remote Cybertruck paint differs');run.checks.push('explicit stored white: initial local/remote Cybertruck paint matches before paint events');
    if(defaultPaintOnly){
     stage('default paint functional evidence');
     for(const p of pages)assert.equal(await p.evaluate(()=>localStorage.getItem('opencity-vehicle-color')),null,'fresh client unexpectedly stored paint');
     for(const who of ['driver','observer'])assert(run.requests.some(r=>r.who===who&&r.assetSHA256===run.assetSHA256),'candidate asset interception not observed for '+who);
     assert.equal(report.errors.filter(e=>e.variant===variant).length,0,'app page errors');
     run.visualSetup={observerZoom:21.5,uiHiddenAfterFunctionalChecks:true,method:'screenshot-only CSS hides body siblings of #map and MapLibre controls/markers'};
     stage('close observer frame and unobscured paint screenshots');
     run.parkedPose=await driver.evaluate(()=>multiplayerState().pose);
     await observer.evaluate(p=>{map.jumpTo({center:[p.lng,p.lat],zoom:21.5,pitch:62,bearing:-25});map.triggerRepaint();},run.parkedPose);
     for(const [who,p] of [['driver',driver],['observer',observer]]){
      await p.addStyleTag({content:'body > :not(#map) { visibility: hidden !important; } .maplibregl-control-container, .maplibregl-marker, .maplibregl-popup { visibility: hidden !important; }'});
      await p.evaluate(()=>new Promise(resolve=>{map.once('render',resolve);map.triggerRepaint();}));
      const file=`qc/cybertruck-runtime-default-paint-${who}.png`;await p.screenshot({path:path.join(ROOT,file),timeout:15000});run.screenshots.push(file);
     }
     run.status='PASS';stage('default paint check complete; full controls intentionally skipped');continue;
    }
    if(variant==='candidate'){assert(Math.abs(model(run.parkedLocal,'local').wheelbase-3.635)<1e-5);for(const state of [run.parkedLocal,run.parkedRemote]){const lamps=state.models[0].lights;assert(lamps.every(l=>l.emissiveMap&&l.sample),'candidate lamp palette absent');const front=lamps.find(l=>/front/i.test(l.name)),tail=lamps.find(l=>/tail/i.test(l.name));assert(front.sample.slice(0,3).every(v=>v>180),'front light not white');assert(tail.sample[0]>tail.sample[1]*3&&tail.sample[0]>tail.sample[2]*3,'tail light not red');}}
    run.parkedPose=await frameObserver(observer,driver);
    for(const [who,p] of [['driver',driver],['observer',observer]]){const file=`qc/cybertruck-runtime-${variant}-parked-${who}.png`;await p.screenshot({path:path.join(ROOT,file)});run.screenshots.push(file);}
    stage('record wheel rest poses');
    const localBefore=model(await snapshot(driver),'local'),remoteBefore=model(await snapshot(observer),'remote');
    if(variant==='candidate')run.checks.push('candidate front white and rear red palette verified on loaded local and remote materials');
    stage('manual throttle and local/remote steering');
    await driver.bringToFront();await resume(driver);await driver.keyboard.down('ArrowUp');
    try{await driver.waitForFunction(()=>autoState().speed>2,null,{timeout:15000});await driver.keyboard.down('ArrowRight');try{await driver.waitForFunction(()=>autoState().physics.steer>.08,null,{timeout:10000});await driver.waitForFunction(()=>(window.__cybertruckRuntimeModels||[]).some(m=>m.id==='cybertruck'&&m.group.parent&&m.rig?.steering.filter(s=>s.tag[0]==='F').every(s=>Math.abs(s.pivot.quaternion.y)>.005)),null,{timeout:12000});await observer.waitForFunction(()=>(window.__cybertruckRuntimeModels||[]).some(m=>m.id==='cybertruck'&&m.rig&&m.rig.steering.some(s=>s.tag[0]==='F'&&Math.abs(s.pivot.quaternion.y)>.005)),null,{timeout:5000});run.manualLocal=await snapshot(driver);run.manualRemote=await snapshot(observer);}finally{await driver.keyboard.up('ArrowRight');}}finally{await driver.keyboard.up('ArrowUp');}
    assert(changed(quaternions(localBefore),quaternions(model(run.manualLocal,'local'))),'local wheels did not advance during manual driving');
    await observer.waitForFunction(before=>(window.__cybertruckRuntimeModels||[]).some(m=>m.id==='cybertruck'&&m.rig&&m.wheels.some((w,i)=>w.quaternion.toArray().some((v,k)=>Math.abs(v-before[i][k])>1e-4))),quaternions(remoteBefore),{timeout:12000});
    run.manualRemote=await snapshot(observer);
    for(const role of ['local','remote']){const initial=role==='local'?localBefore:remoteBefore,current=model(role==='local'?run.manualLocal:run.manualRemote,role);assert(current.wheels.every((w,i)=>w.spin.some((v,k)=>Math.abs(v-initial.wheels[i].spin[k])>1e-4)),role+' did not animate all four wheels');assert(current.wheels.filter(w=>/_F[LR]$/.test(w.name)).every(w=>Math.abs(w.steering[1])>.001),role+' front wheels did not steer');}
    run.checks.push('manual throttle/steering and all four actual remote wheels advance');
    stage('brake and reverse network pose');
    await driver.keyboard.down('Space');try{await driver.waitForFunction(()=>Math.abs(autoState().speed)<.15,null,{timeout:15000});}finally{await driver.keyboard.up('Space');}
    await driver.keyboard.down('ArrowDown');try{await driver.waitForFunction(()=>autoState().speed<-.5,null,{timeout:12000});await observer.waitForFunction(()=>multiplayerState().players.some(p=>p.name==='Cybertruck Driver'&&p.pose.speed<-.2),null,{timeout:8000});run.reverse=await snapshot(driver);}finally{await driver.keyboard.up('ArrowDown');}run.checks.push('reverse speed reaches actual remote snapshot');
    stage('programmatic existing reset handler (not reset UI)');await resetHandler(driver);await resume(driver);
    stage('visible Auto-roam control and route movement');await setRoaming(driver,true);await driver.waitForFunction(()=>autoState().roaming&&autoState().distance>3,null,{timeout:15000});run.roaming=await snapshot(driver);assert(Number.isFinite(run.roaming.auto.groundHeight));await setRoaming(driver,false);await pause(driver);run.checks.push('visible Auto-roam toggle drives candidate, finite ground height; reset via existing hidden handler');
    stage('driver paint event and remote paint replication');
    await paint(driver,'blue');await waitPaint(driver,'local','397cce');await waitPaint(observer,'remote','397cce');run.paintedDriver=await snapshot(driver);run.paintedRemote=await snapshot(observer);
    const trimBefore=localBefore.nonPaint.map(m=>[m.name,m.color]),trimAfter=model(run.paintedDriver,'local').nonPaint.map(m=>[m.name,m.color]);assert.deepEqual(trimAfter,trimBefore,'paint changed trim/glass/lamp base colors');assert.deepEqual(model(run.paintedDriver,'local').lights,localBefore.lights,'paint changed lamp palette');
    stage('second Cybertruck client and independent paint');await observer.bringToFront();await startKitt(observer,1);await paint(observer,'red');await waitPaint(observer,'local','cf493a');await waitPaint(observer,'remote','397cce');await waitPaint(driver,'remote','cf493a');await pause(observer);
    run.twoKittDriver=await snapshot(driver);run.twoKittObserver=await snapshot(observer);assert.equal(run.twoKittObserver.models.length,2);assert(run.twoKittObserver.network.players.every(p=>p.pose.vehicle==='cybertruck'));run.checks.push('two actual clients use unchanged cybertruck ID, same selected bytes, independent blue/red local and remote paint');
    await frameObserver(observer,driver);const file=`qc/cybertruck-runtime-${variant}-two-client-painted.png`;await observer.screenshot({path:path.join(ROOT,file)});run.screenshots.push(file);
    for(const who of ['driver','observer'])assert(run.requests.some(r=>r.who===who&&r.assetSHA256===run.assetSHA256),'asset interception not observed for '+who);
    assert.equal(report.errors.filter(e=>e.variant===variant).length,0,'app page errors');run.status='PASS';stage('variant complete');
   }catch(error){run.status='FAIL';run.failure=error.stack;console.error(`[${variant}] FAIL at ${run.stage}: ${error.message}`);saveReport();
    for(let i=0;i<pages.length;i++){const p=pages[i],who=i?'observer':'driver',file=`qc/cybertruck-runtime-${defaultPaintOnly?'default-paint':variant}-error-${who}.png`;try{await p.screenshot({path:path.join(ROOT,file),timeout:8000});run.screenshots.push(file);}catch(e){(run.diagnosticErrors??=[]).push({who,error:String(e)});}}
    saveReport();throw error;
   }finally{clearInterval(heartbeat);for(const context of contexts)await context.close();}
  }
  report.status='PASS_REQUIRES_SCREENSHOT_REVIEW';
 }catch(error){report.status='FAIL';report.failure=error.stack;throw error;}
 finally{await browser?.close();await rooms.close();report.finished=new Date().toISOString();saveReport();}
})().catch(error=>{console.error(error);process.exitCode=1;});
