// Preserve original KITT harness. Produce a bounded truck adaptation.
const fs=require('node:fs'),assert=require('node:assert/strict');
let src=fs.readFileSync('qc/kitt-runtime-inspection.cjs','utf8').replaceAll('kitt','cybertruck').replaceAll('KITT','Cybertruck');
src=src.replace("'assets/vehicles/cybertruck-review/cybertruck-reference.glb'","'assets/vehicles/cybertruck-review/revision2/cybertruck-reference.glb'")
 .replaceAll('2.5654','3.635').replaceAll('.324','.43925').replaceAll("'303b3e'","'e8ede7'")
 .replace('no stored choice: initial local/remote Cybertruck share legacy black palette before paint events','explicit stored white: initial local/remote Cybertruck paint matches before paint events');
src=src.replace("const context=await browser.newContext({viewport:{width:1100,height:800},serviceWorkers:'block'});contexts.push(context);", "const context=await browser.newContext({viewport:{width:1100,height:800},serviceWorkers:'block'});await context.addInitScript(()=>localStorage.setItem('opencity-vehicle-color','white'));contexts.push(context);");
src=src.replace("assert.notEqual(hash(assets.before),hash(assets.candidate)","assert.equal(hash(assets.candidate),'e6ad2ff4ffc3b4ee4de73600f28eb264e2fc3b3fac65f31ebb0d4f50cda4fc05');assert.notEqual(hash(assets.before),hash(assets.candidate)");
src=src.replace("assert(model(run.parkedRemote,'remote').scanners.every(s=>s.emissiveMap));", "for(const state of [run.parkedLocal,run.parkedRemote]){const lamps=state.models[0].lights;assert(lamps.every(l=>l.emissiveMap&&l.sample),'candidate lamp palette absent');const front=lamps.find(l=>/front/i.test(l.name)),tail=lamps.find(l=>/tail/i.test(l.name));assert(front.sample.slice(0,3).every(v=>v>180),'front light not white');assert(tail.sample[0]>tail.sample[1]*3&&tail.sample[0]>tail.sample[2]*3,'tail light not red');}");
src=src.replace("stage('local and remote scanner animation');","stage('record wheel rest poses');");
src=src.replace(/    await scannerChanged\(driver[\s\S]*?run.checks.push\('local and remote eight-segment scanner changes through actual app render loop'\);/,"    run.checks.push('candidate front white and rear red palette verified on loaded local and remote materials');");
src=src.replace('const quaternions=m=>m.wheels.map(w=>w.spin);','const quaternions=m=>m.wheels.map(w=>w.spin);');
src=src.replace("run.manualRemote=await snapshot(observer);run.checks.push('manual throttle/steering and actual remote wheel motion');",`run.manualRemote=await snapshot(observer);
    for(const role of ['local','remote']){const initial=role==='local'?localBefore:remoteBefore,current=model(role==='local'?run.manualLocal:run.manualRemote,role);assert(current.wheels.every((w,i)=>w.spin.some((v,k)=>Math.abs(v-initial.wheels[i].spin[k])>1e-4)),role+' did not animate all four wheels');assert(current.wheels.filter(w=>/_F[LR]$/.test(w.name)).every(w=>Math.abs(w.steering[1])>.001),role+' front wheels did not steer');}
    run.checks.push('manual throttle/steering and all four actual remote wheels advance');`);
src=src.replace("m.group.traverse(o=>{if(o.isMesh)for(const mat",`const lights=[];m.group.traverse(o=>{if(o.isMesh&&/^(Front|Tail)[ _]light[ _]bar/i.test(o.name)){let sample=null;const image=o.material.map?.image,uv=o.geometry.attributes.uv;if(image&&uv){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);sample=[...ctx.getImageData(Math.min(image.width-1,Math.max(0,Math.floor(uv.getX(0)*image.width))),0,1,1).data];}lights.push({name:o.name,map:!!o.material.map,emissiveMap:!!o.material.emissiveMap,sample});}});
  m.group.traverse(o=>{if(o.isMesh)for(const mat`);
src=src.replace("return{role:entry?'remote':'local',", "return{lights,role:entry?'remote':'local',");
src=src.replace("run.checks.push('candidate front white", "if(variant==='candidate')run.checks.push('candidate front white");
src=src.replace("const report={status:'RUNNING',", "const report={remoteSteeringKnownMismatch:{runtimeWheelbase:3.3,candidateWheelbase:3.635,tangentUnderestimatePercent:(1-3.3/3.635)*100},status:'RUNNING',");
fs.writeFileSync('qc/cybertruck-runtime-inspection.cjs',src);
// Wait for actual render-side pivots, not only the preceding physics tick.
src=src.replace("await driver.waitForFunction(()=>autoState().physics.steer>.08,null,{timeout:10000});", "await driver.waitForFunction(()=>autoState().physics.steer>.08,null,{timeout:10000});await driver.waitForFunction(()=>(window.__cybertruckRuntimeModels||[]).some(m=>m.id==='cybertruck'&&m.group.parent&&m.rig?.steering.filter(s=>s.tag[0]==='F').every(s=>Math.abs(s.pivot.quaternion.y)>.005)),null,{timeout:12000});");
src=src.replace("assert.deepEqual(trimAfter,trimBefore,'paint changed trim/glass/lamp base colors');", "assert.deepEqual(trimAfter,trimBefore,'paint changed trim/glass/lamp base colors');assert.deepEqual(model(run.paintedDriver,'local').lights,localBefore.lights,'paint changed lamp palette');");
fs.writeFileSync('qc/cybertruck-runtime-inspection.cjs',src);
// Keep the exact current runtime asset as the permanent comparison baseline.
const current=fs.readFileSync('assets/vehicles/cybertruck.glb');
if(!fs.existsSync('qc/cybertruck-runtime-before.glb'))fs.writeFileSync('qc/cybertruck-runtime-before.glb',current);
assert(fs.readFileSync('qc/cybertruck-runtime-before.glb').equals(current),'Runtime baseline changed');
src=src.replace("const preservedBaseline=path.join(ROOT,'assets/vehicles/cybertruck-review/runtime-before-promotion.glb');","const preservedBaseline=path.join(ROOT,'qc/cybertruck-runtime-before.glb');");
fs.writeFileSync('qc/cybertruck-runtime-inspection.cjs',src);
