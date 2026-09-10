const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {execFileSync}=require('node:child_process'),fs=require('node:fs');
const changed=['auto-mode.js','auto-physics.js','flight.js','flight-physics.js','npc-traffic.js','street-furniture.js','blender-vehicle.js','vidhana-road-network.json'];
const baseline=Object.fromEntries(changed.map(f=>[f,execFileSync('git',['show','HEAD:'+f],{encoding:'utf8'})]));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const results=[];
 try{for(const mode of ['baseline','candidate','candidate','baseline']){
  const page=await browser.newPage({viewport:{width:1100,height:760},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/local-cache.js*',r=>r.fulfill({contentType:'text/javascript',body:''}));await page.route('**/multiplayer-client.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  if(mode==='baseline')for(const f of changed)await page.route('**/'+f,r=>r.fulfill({contentType:f.endsWith('json')?'application/json':'text/javascript',body:baseline[f]}));
  await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>window.npcTrafficState&&window.vidhanaStreetState?.().loaded,null,{timeout:90000});
  await page.locator('[data-ride=auto]').click();await page.getByRole('button',{name:/Vidhana Soudha area/}).click();await page.waitForFunction(()=>window.autoState?.().active);await page.waitForTimeout(4000);
  const timing=await page.evaluate(()=>new Promise(resolve=>{const frames=[];let last=performance.now();function tick(now){frames.push(now-last);last=now;if(frames.length<180)requestAnimationFrame(tick);else{frames.sort((a,b)=>a-b);resolve({median:frames[90],p95:frames[171],mean:frames.reduce((a,b)=>a+b)/frames.length,traffic:window.npcTrafficState()});}}requestAnimationFrame(tick);}));
  delete timing.traffic.cars;results.push({mode,...timing,errors});console.log(JSON.stringify(results.at(-1)));await page.close();
 }}finally{await browser.close();}
 fs.writeFileSync('qc/release-28-performance.json',JSON.stringify({device:'Same Windows host, Edge headless SwiftShader software renderer',viewport:[1100,760],results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
