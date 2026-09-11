const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
const base=process.env.CITY_URL||'https://www.opencity.world/';
const tag=process.env.QC_TAG||'baseline';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const runs=[];
 try{for(const viewport of [{width:1100,height:760},{width:390,height:844}])for(let repeat=1;repeat<=2;repeat++){
  const page=await browser.newPage({viewport,serviceWorkers:'block',hasTouch:viewport.width<500,isMobile:viewport.width<500});
  page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/local-cache.js*',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await page.route('**/multiplayer-client.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  const started=Date.now();await page.goto(base);await page.waitForFunction(()=>window.cityBootReady&&window.vidhanaStreetState?.().loaded);
  const readyMs=Date.now()-started;
  if(!await page.locator('[data-ride=auto]').isVisible()){await page.locator('#mobile-menu-toggle').click();await page.locator('[data-tool=rides]').click();}
  await page.locator('[data-ride=auto]').click();await page.getByRole('button',{name:/Vidhana Soudha area/}).click();await page.waitForFunction(()=>window.autoState?.().active);await page.waitForTimeout(4000);
  const timing=await page.evaluate(()=>{
   const original=window.recordCityRender,layerSamples={};
   window.recordCityRender=(name,renderer,elapsed)=>{original(name,renderer,elapsed);const r=renderer.info.render;layerSamples[name]={calls:r.calls,triangles:r.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};};
   return new Promise(resolve=>{const samples=[];let last=performance.now();function tick(now){samples.push(now-last);last=now;if(samples.length<120)requestAnimationFrame(tick);else{samples.sort((a,b)=>a-b);const traffic=window.npcTrafficState();delete traffic.cars;const gl=document.querySelector('#map canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');resolve({meanMs:samples.reduce((a,b)=>a+b)/samples.length,medianMs:samples[60],p95Ms:samples[114],layers:layerSamples,customDrawCalls:Object.values(layerSamples).reduce((n,r)=>n+r.calls,0),customTriangles:Object.values(layerSamples).reduce((n,r)=>n+r.triangles,0),traffic,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',canvas:[gl.canvas.width,gl.canvas.height],auto:window.autoState()});}}requestAnimationFrame(tick);});
  });
  const frame=await page.locator('#map canvas').boundingBox();
  const ui=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth,visibleButtons:[...document.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(b).visibility!=='hidden'}).map(b=>({text:b.textContent.trim(),rect:{x:b.getBoundingClientRect().x,y:b.getBoundingClientRect().y,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}})),telemetry:document.querySelector('#performance-panel dl')?.innerText}));
  await page.screenshot({path:`qc/release-fidelity-${tag}-${viewport.width}-${repeat}.png`});
  const run={viewport,repeat,readyMs,...timing,frame,ui,errors};runs.push(run);console.log(JSON.stringify({viewport,repeat,readyMs,meanMs:run.meanMs,medianMs:run.medianMs,p95Ms:run.p95Ms,customDrawCalls:run.customDrawCalls,customTriangles:run.customTriangles,errors}));await page.close();
 }}finally{await browser.close();fs.writeFileSync(`qc/release-fidelity-${tag}.json`,JSON.stringify({base,tag,date:new Date().toISOString(),notes:'Cold browser contexts, no cache worker or multiplayer, auto parked at Vidhana Soudha; MapLibre draw calls excluded. Hardware GPU/mobile device performance NOT measured.',runs},null,2));}
})().catch(e=>{console.error(e);process.exit(1)});
