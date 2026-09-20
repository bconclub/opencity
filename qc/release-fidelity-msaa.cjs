// Run only with Blender and other browser jobs idle. No production/source edits.
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),crypto=require('node:crypto');
const base=process.env.CITY_URL||'https://www.opencity.world/';
(async()=>{
 const source=await fetch(new URL('app.js',base)).then(r=>{if(!r.ok)throw Error('app.js '+r.status);return r.text()});
 const marker="map=new maplibregl.Map({container:'map',";
 if(source.split(marker).length!==2)throw Error('Map constructor marker changed; inspect before benchmarking.');
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const runs=[];
 try{for(const [index,enabled]of [false,true,true,false].entries()){
  const p=await browser.newPage({viewport:{width:1100,height:760},serviceWorkers:'block'});p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/local-cache.js*',r=>r.fulfill({contentType:'text/javascript',body:''}));await p.route('**/multiplayer-client.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await p.route('**/app.js',r=>r.fulfill({contentType:'text/javascript',body:source.replace(marker,marker+`canvasContextAttributes:{antialias:${enabled}},`)}));
  await p.goto(base);await p.waitForFunction(()=>window.cityBootReady&&window.vidhanaStreetState?.().loaded);
  await p.locator('[data-ride=auto]').click();await p.getByRole('button',{name:/Vidhana Soudha area/}).click();await p.waitForFunction(()=>window.autoState?.().active);await p.waitForTimeout(3000);
  const result=await p.evaluate(()=>new Promise(resolve=>{const frames=[],layers={};let last=performance.now();const original=recordCityRender;window.recordCityRender=(name,r,ms)=>{original(name,r,ms);layers[name]={calls:r.info.render.calls,triangles:r.info.render.triangles};};function step(t){frames.push(t-last);last=t;if(frames.length<60)requestAnimationFrame(step);else{frames.sort((a,b)=>a-b);const gl=document.querySelector('#map canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');resolve({meanMs:frames.reduce((a,b)=>a+b)/frames.length,medianMs:frames[30],p95Ms:frames[57],context:gl.getContextAttributes(),samples:gl.getParameter(gl.SAMPLES),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',layers});}}requestAnimationFrame(step);}));
  await p.screenshot({path:`qc/release-fidelity-msaa-${index}-${enabled?'on':'off'}.png`});runs.push({index,requestedAntialias:enabled,...result,errors});console.log(JSON.stringify(runs.at(-1)));await p.close();
 }}finally{await browser.close();fs.writeFileSync('qc/release-fidelity-msaa.json',JSON.stringify({base,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),viewport:[1100,760],date:new Date().toISOString(),notes:'ABBA single-page sequential SwiftShader; no other renderer jobs allowed. Changes only intercepted map context creation. Custom draw counts exclude basemap.',runs},null,2));}
})().catch(e=>{console.error(e);process.exit(1)});
