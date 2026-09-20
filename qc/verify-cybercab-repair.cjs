const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/kitt-workshop.html');
  await page.waitForFunction(()=>window.kittWorkshop,{timeout:90000});
  const report=await page.evaluate(async()=>{
   const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
   const {bindVehicleWheelRig}=await import('./blender-vehicle.js');
   const {T,models}=kittWorkshop,old=models.candidate;
   const {scene:root}=await new GLTFLoader().loadAsync('./assets/vehicles/cybercab-rigged.glb');
   root.rotation.x=Math.PI/2;const group=new T.Group();group.add(root);old.group.parent.add(group);old.group.visible=false;
   const rig=bindVehicleWheelRig(T,root);models.candidate={group,root,rig,scanners:[]};
   document.querySelector('h1').textContent='Cybercab wheel repair review';
   document.querySelector('header p').textContent='Original Meshy body. Rebuilt independent wheels. Validation scene; production release tracked separately.';
   group.updateWorldMatrix(true,true);const centres=rig.wheels.map(w=>w.getWorldPosition(new T.Vector3()));
   rig.update(Math.PI/2,.35);group.updateWorldMatrix(true,true);
   const drift=Math.max(...rig.wheels.map((w,i)=>w.getWorldPosition(new T.Vector3()).distanceTo(centres[i])));
   const spins=rig.wheels.map(w=>w.rotation.x),steering=Object.fromEntries(rig.steering.map(s=>[s.tag,s.pivot.rotation.y]));
   rig.update(0,0);kittWorkshop.render();
   return {wheels:rig.wheels.length,wheelbase:rig.wheelbase,wheelRadius:rig.wheelRadius,drift,spins,steering};
  });
  assert.equal(report.wheels,4);assert(report.drift<1e-5);assert(Math.abs(report.wheelbase-2.772)<.001);
  assert(Math.abs(report.wheelRadius-.365)<.003);assert(report.spins.every(v=>Math.abs(v+Math.PI/2)<1e-5));
  assert(report.steering.FR<report.steering.FL&&report.steering.FL<0);assert.equal(report.steering.RL,0);assert.equal(report.steering.RR,0);
  await page.screenshot({path:'qc/cybercab-repair-browser.png'});
  await page.getByRole('button',{name:'Run wheel test'}).click();await page.getByRole('button',{name:'Turn wheels'}).click();
  await page.waitForTimeout(500);await page.screenshot({path:'qc/cybercab-repair-turning.png'});assert.deepEqual(errors,[]);
  fs.writeFileSync('qc/cybercab-repair-rig.json',JSON.stringify({...report,errors},null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
