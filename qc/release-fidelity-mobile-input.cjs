const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const checks=[];
 try{const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  await p.setContent('<main id="map"><canvas width="390" height="844"></canvas></main>');
  await p.evaluate(()=>{window.testRide='auto';window.autoState=()=>({active:testRide==='auto'});window.flightState=()=>({active:testRide==='flight'});HTMLCanvasElement.prototype.setPointerCapture=()=>{};HTMLCanvasElement.prototype.releasePointerCapture=()=>{};});
  await p.addScriptTag({content:fs.readFileSync('mobile-drive.js','utf8')});await p.waitForTimeout(180);
  const point=async(type,x,y,id=1)=>p.evaluate(({type,x,y,id})=>document.querySelector('canvas').dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true,cancelable:true})),{type,x,y,id});
  const input=()=>p.evaluate(()=>mobileDriveInput());
  const neutral=async()=>assert.deepEqual(await input(),{throttle:0,reverse:0,steer:0});
  await neutral();await point('pointerdown',80,350);await point('pointermove',80,344);await neutral();checks.push('neutral and dead zone');
  await point('pointermove',80,329);const moderate=await input();assert(moderate.throttle>.35&&moderate.throttle<.45);assert.equal(moderate.reverse,0);
  await point('pointermove',80,308);const full=await input();assert.equal(full.throttle,1);assert(full.throttle>moderate.throttle);checks.push('moderate/full throttle differ');
  await point('pointermove',101,350);const moderateSteer=await input();assert(moderateSteer.steer>.35&&moderateSteer.steer<.45);
  await point('pointermove',122,350);assert.equal((await input()).steer,1);await point('pointermove',38,350);assert.equal((await input()).steer,-1);checks.push('proportional left/right steering');
  await point('pointermove',80,392);assert.equal((await input()).reverse,1);assert.equal((await input()).throttle,0);checks.push('reverse is independent');
  assert.deepEqual(await p.evaluate(()=>mobileDriveState().keys),[]);checks.push('ground movement does not synthesize binary arrows');
  await point('pointerup',80,392);await neutral();checks.push('release clears input');
  for(const type of ['pointercancel','lostpointercapture']){await point('pointerdown',80,350);await point('pointermove',80,308);await point(type,80,308);await neutral();}checks.push('cancel and lost capture clear input');
  await point('pointerdown',80,350);await point('pointermove',80,308);await p.evaluate(()=>dispatchEvent(new Event('blur')));await neutral();checks.push('blur clears input');
  await point('pointerdown',300,350);await point('pointermove',300,280);await neutral();await point('pointerup',300,280);checks.push('right touch policy unchanged');
  for(let i=0;i<2;i++){await point('pointerdown',80,350);await point('pointerup',80,350);}assert((await p.evaluate(()=>mobileDriveState().keys)).includes('Space'));checks.push('double tap stop/hover preserved');await p.evaluate(()=>dispatchEvent(new Event('blur')));
  for(let i=0;i<2;i++){await point('pointerdown',80,350);await point('pointermove',80,290);await point('pointerup',80,290);}assert((await p.evaluate(()=>mobileDriveState().keys)).includes('ShiftLeft'));await neutral();checks.push('double swipe boost preserved');await p.evaluate(()=>dispatchEvent(new Event('blur')));
  await p.evaluate(()=>testRide='flight');await p.waitForTimeout(180);await point('pointerdown',80,350);await point('pointermove',80,290);assert((await p.evaluate(()=>mobileDriveState().keys)).includes('ArrowUp'));await point('pointercancel',80,290);assert.deepEqual(await p.evaluate(()=>mobileDriveState().keys),[]);checks.push('flight controls remain compatible');
  const {createCar,advanceCar}=await import(pathToFileURL(path.resolve('auto-physics.js')));const a=createCar(),b=createCar();for(let i=0;i<120;i++){advanceCar(a,{...moderate,boost:false,brake:false},1/120);advanceCar(b,{...full,boost:false,brake:false},1/120);}assert(a.speed>0&&b.speed>a.speed*1.9);checks.push('existing car physics produces lower acceleration for moderate touch input');
  fs.writeFileSync('qc/release-fidelity-mobile-input.json',JSON.stringify({checks,moderate,full,speedAfterOneSecond:{moderate:a.speed,full:b.speed},note:'Synthetic pointer events in browser fixture, actual physics module. Does not claim physical-device feel or FPS.'},null,2));console.log(JSON.stringify({checks,moderate,full,speeds:[a.speed,b.speed]}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
