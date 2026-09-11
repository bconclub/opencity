const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');const{chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const args=process.argv.slice(2);assert(args.length===2&&args[0]==='--output-dir','Pass --output-dir <new-directory> to preserve accepted evidence');
const outputDir=path.resolve(args[1]);assert(!fs.existsSync(outputDir),'Use a fresh output directory');fs.mkdirSync(outputDir,{recursive:true});
const artifact=name=>path.join(outputDir,path.basename(name));
const manifest=JSON.parse(fs.readFileSync('qc/frontage-rotation-browser-snapshot.json')),root=path.resolve('qc/frontage-rotation-browser-snapshot'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),assets=new Map(manifest.entries.map(e=>{const body=fs.readFileSync(path.join(root,e.path));assert.equal(sha(body),e.sha256);return[e.path,body];}));
const checks=[],errors=[],misses=[],samples=[];let browser,rooms,driver,observer,fixture;const transport=[];let origin,endpoint;
const mark=s=>{checks.push(s);console.log('PASS '+s);};
(async()=>{const{createRoomServer}=await import('../multiplayer-server/server.mjs');fixture=require('node:http').createServer((req,res)=>{
const url=new URL(req.url,origin),file=decodeURIComponent(url.pathname.slice(1))||'index.html';
if(file==='favicon.ico'){res.writeHead(204).end();return;}
let body=assets.get(file),type=({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream';
if(file==='multiplayer-config.json'){body=Buffer.from(JSON.stringify({url:endpoint}));type='application/json';}
if(file==='local-cache.js')body=Buffer.from('');
if(!body){misses.push(file);res.writeHead(404).end('Not in immutable fixture');return;}
res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);});
await new Promise(r=>fixture.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+fixture.address().port;
rooms=createRoomServer({allowedOrigins:origin});rooms.server.on('upgrade',req=>transport.push({event:'upgrade',url:req.url,origin:req.headers.origin}));
await new Promise(r=>rooms.server.listen(0,'127.0.0.1',r));endpoint='ws://127.0.0.1:'+rooms.server.address().port+'/ws';
browser=await chromium.launch({channel:'msedge',headless:true});
async function page(){const p=await browser.newPage({viewport:{width:1100,height:760},serviceWorkers:'block'});p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.stack||e.message));p.on('websocket',ws=>{transport.push({event:'websocket',url:ws.url()});ws.on('socketerror',error=>transport.push({event:'socketerror',error}));});return p;}
driver=await page();await driver.goto(origin+'/');const d=driver.locator('.multiplayer-name-dialog');await d.waitFor({state:'visible'});await d.getByLabel('Player name',{exact:true}).fill('Passage Driver');await d.getByRole('button',{name:'Create room',exact:true}).click();await driver.waitForFunction(()=>multiplayerState().connected&&window.districtState?.().loaded);const room=await driver.evaluate(()=>multiplayerState().room);
await driver.bringToFront();await driver.locator('[data-ride=cybertruck]').click();await driver.locator('.departure-options button').first().click();await driver.waitForFunction(()=>autoState()?.active&&window.__passagePlace);mark('Immutable candidate boots with actual architecture and one local room client');
const coordinates=await driver.evaluate(async()=>{const{toLocal}=await import('./auto-roads.js'),p=toLocal([77.5909934,12.9792403]),q=toLocal([77.5911489,12.9794086]),length=Math.hypot(q[0]-p[0],q[1]-p[1]);return{p,q,length,u:[(q[0]-p[0])/length,(q[1]-p[1])/length],architecture:(await import("./district.js")).getDistrictArchitecture()};});

const a=coordinates.architecture,s=a.stairPlacement,p=(u,v)=>[(s.centerAlong+u)*s.tangent[0]+v*s.outward[0],(s.centerAlong+u)*s.tangent[1]+v*s.outward[1]],h=Math.atan2(-s.outward[0],-s.outward[1])*180/Math.PI;
for(const direction of ['ArrowRight','ArrowLeft']){
 await driver.evaluate(({point,h})=>__passagePlace(point,h),{point:p(0,s.bottomV+6),h});
 await driver.keyboard.down('ArrowUp');await driver.waitForFunction(()=>autoState().physics.impacts>0);
 await driver.evaluate(()=>{window.__rotationSamples=[];window.__rotationRecording=true;function sample(){if(!window.__rotationRecording)return;window.__rotationSamples.push(autoState());requestAnimationFrame(sample);}sample();});
 await driver.keyboard.down(direction);await driver.waitForTimeout(5000);await driver.keyboard.up(direction);await driver.keyboard.up('ArrowUp');
 const row=await driver.evaluate(()=>{window.__rotationRecording=false;return{states:window.__rotationSamples,footprint:__passageGraphs().footprint};});
 assert(row.states.length>30);assert(row.states.at(-1).physics.impacts>row.states[0].physics.impacts);samples.push({case:'held steering '+direction,...row});
 await driver.screenshot({path:artifact('qc/frontage-rotation-'+direction+'.png')});mark('Held '+direction+' near stair captured with active contact');
}
assert.deepEqual(errors,[]);assert.deepEqual(misses,[]);fs.writeFileSync(artifact('qc/frontage-rotation-browser-results.json'),JSON.stringify({passed:true,checks,samples,errors,misses,transport,snapshot:manifest,scope:'Bounded held-steering browser evidence. Independent projected-body overlap audit must pass separately. Other previously verified functions unchanged.'},null,2));
})().catch(async error=>{if(driver){await driver.screenshot({path:artifact('qc/frontage-rotation-browser-failure.png')}).catch(()=>{});fs.writeFileSync(artifact('qc/frontage-rotation-browser-failure.json'),JSON.stringify({error:String(error),checks,errors,misses,samples,transport,state:await driver.evaluate(()=>({auto:window.autoState?.(),architecture:window.__passageArchitecture,multiplayer:window.multiplayerState?.(),body:document.body.className})).catch(()=>null)},null,2));}console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();if(rooms)await rooms.close();if(fixture)await new Promise(r=>fixture.close(r));});
