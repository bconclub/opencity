const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),baseline=cp.execFileSync('git',['show','HEAD:street-patch.js'],{cwd:root,encoding:'utf8'});
const modules={'/vendor/three.module.js':'three.module.js','/vendor/loaders/GLTFLoader.js':'GLTFLoader.js','/vendor/utils/BufferGeometryUtils.js':'BufferGeometryUtils.js'};
const server=http.createServer((req,res)=>{const url=req.url.split('?')[0],file=url==='/vendor/maplibre.js'?path.join(process.env.TEMP,'street-patch-maplibre.js'):modules[url]?path.join('D:/CodexTools/OSM2World',modules[url]):path.join(root,url==='/'?'verify-street-patch.html':decodeURIComponent(url.slice(1)));try{res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.json')||file.endsWith('.geojson')?'application/json':'application/octet-stream');let data=fs.readFileSync(file);if(file.endsWith('.html'))data=data.toString().replace('https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js','/vendor/maplibre.js');res.end(data);}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(4197,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const runs=[];
 for(const [i,variant] of ['before','after','after','before'].entries()){
  const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(variant==='before')await page.route('**/street-patch.js',r=>r.fulfill({contentType:'text/javascript',body:baseline}));
  await page.goto('http://127.0.0.1:4197');await page.waitForFunction(()=>window.patch?.state().frames>0||window.testError);assert(!await page.evaluate(()=>window.testError));
  await page.evaluate(()=>{document.querySelector('aside').hidden=true;testMap.jumpTo({center:[77.59135,12.978334],zoom:22,pitch:68,bearing:-44});});await page.waitForTimeout(400);
  if(i<2)await page.screenshot({path:path.join(__dirname,'street-surfaces-'+variant+'.png')});
  const timing=await page.evaluate(()=>new Promise(resolve=>{let previous=performance.now(),n=0;const samples=[];function tick(now){if(n++>20)samples.push(now-previous);previous=now;testMap.triggerRepaint();if(n<121)requestAnimationFrame(tick);else{samples.sort((a,b)=>a-b);resolve({meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,medianMs:samples[Math.floor(samples.length/2)],p95Ms:samples[Math.floor(samples.length*.95)],frames:samples.length,state:patch.state()});}}requestAnimationFrame(tick);}));
  assert.equal(timing.state.drawCalls,4);assert.equal(timing.state.renderedTriangles,2130);assert.deepEqual(errors,[]);runs.push({variant,...timing,errors});await page.close();
 }
 const mean=variant=>runs.filter(r=>r.variant===variant).reduce((n,r)=>n+r.meanMs,0)/2;
 const regression=(mean('after')/mean('before')-1)*100;
 const report={scope:'Isolated street patch, 1100x760 Edge SwiftShader, ABBA, 100 samples per run. Not full-city hardware GPU performance.',runs,meanFrameRegressionPercent:regression,additionalDrawCalls:0,additionalTriangles:0,textureBytesUncompressed:2*256*256*4,downloadBytes:fs.statSync(path.join(root,'street-surface-materials.js')).size};
 fs.writeFileSync(path.join(__dirname,'street-surfaces-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));assert(regression<=10,'Street surface frame time regressed over 10%');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
