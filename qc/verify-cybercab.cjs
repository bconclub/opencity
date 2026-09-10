const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:760},serviceWorkers:'block'}),errors=[],assets=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('cybercab-meshy-approved'))assets.push({url:r.url(),status:r.status()});});
  await page.route('**/local-cache.js*',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await page.route('**/multiplayer-client.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await page.goto(process.env.QC_URL||'http://127.0.0.1:4173/');
  await page.waitForFunction(()=>window.vidhanaStreetState?.().loaded,null,{timeout:90000});
  await page.locator('[data-ride=cybercab]').click();await page.locator('.departure-options button').first().click();
  await page.waitForFunction(()=>window.autoState?.().active,null,{timeout:30000});await page.waitForTimeout(1000);
  await page.screenshot({path:'qc/cybercab-live-preview.png'});
  const detail=await page.evaluate(async()=>{
   const T=await import('three'),{createBlenderVehicle,loadVehicleAsset}=await import('/blender-vehicle.js');
   const model=createBlenderVehicle(T,'cybercab');await model.ready;model.group.updateMatrixWorld(true);
   const box=new T.Box3().setFromObject(model.group),size=box.getSize(new T.Vector3());
   let triangles=0,materials=new Set();model.group.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;materials.add(o.material.uuid);}});
   return{size:size.toArray(),triangles,materials:materials.size,wheels:model.wheels.length,provenance:model.group.userData.assetSource,traffic:window.npcTrafficState?.()};
  });
  assert(detail.triangles<=25000);assert(detail.materials<=4);assert(detail.size[1]>4&&detail.size[1]<5);assert(detail.size[2]>1&&detail.size[2]<1.6);assert(detail.wheels===0);
  await page.evaluate(async()=>{
   const {loadVehicleAsset}=await import('/blender-vehicle.js');const source=await loadVehicleAsset('cybercab');window.qcDisposedResources=0;
   source.traverse(o=>{o.geometry?.addEventListener('dispose',()=>window.qcDisposedResources++);});
   const state=autoState(),pose={vehicle:'cybercab',lng:state.position[0]+.00005,lat:state.position[1],altitude:0,heading:state.heading,pitch:0,roll:0,speed:0};
   window.qcPeers=[{id:'qc-cab',name:'Cab QC',pose},{id:'qc-kitt',name:'KITT QC',pose:{...pose,vehicle:'kitt',lng:pose.lng+.00005}}];
   dispatchEvent(new CustomEvent('multiplayer-players',{detail:{id:'qc-own',players:window.qcPeers}}));
  });
  await page.waitForFunction(()=>window.multiplayerRenderState?.().remoteCount===2);await page.waitForTimeout(1500);
  await page.evaluate(()=>dispatchEvent(new CustomEvent('multiplayer-players',{detail:{id:'qc-own',players:window.qcPeers.slice(1)}})));
  assert.equal(await page.evaluate(()=>multiplayerRenderState().remoteCount),1);assert.equal(await page.evaluate(()=>window.qcDisposedResources),0);
  assert(assets.some(a=>a.url.endsWith('/cybercab-meshy-approved.glb')&&a.status===200));assert.equal(errors.length,0);
  console.log(JSON.stringify({detail,assets,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
