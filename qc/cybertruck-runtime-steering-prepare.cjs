const fs=require('node:fs'),assert=require('node:assert/strict');
let src=fs.readFileSync('qc/cybertruck-runtime-inspection.cjs','utf8');
src=src.replace("'cybertruck-runtime-inspection-results.json'","'cybertruck-runtime-steering.json'")
 .replace("for(const variant of defaultPaintOnly?['candidate']:['before','candidate'])","for(const variant of ['candidate'])")
 .replace('const remote=instrument(','let remote=instrument(');
src=src.replace("const tuning=fs.readFileSync",`remote=remote.replace('m.updateDrive(e.angle,steer,now/1000);',"if(e.vehicle==='cybertruck'&&Math.abs(p.speed)>.5&&dt>0){(window.__truckRemoteSteerSamples??=[]).push({steer,headingDelta,dt,speed:p.speed,wheelbase:m.wheelbase});if(window.__truckRemoteSteerSamples.length>100)window.__truckRemoteSteerSamples.shift();}m.updateDrive(e.angle,steer,now/1000);");
const tuning=fs.readFileSync`);
const needle="run.checks.push('manual throttle/steering and all four actual remote wheels advance');";
assert(src.includes(needle));src=src.replace(needle,needle+`
    run.steeringFormula=await observer.evaluate(()=>window.__truckRemoteSteerSamples||[]);
    assert(run.steeringFormula.length>0,'No real remote steer frames observed');
    for(const f of run.steeringFormula){assert(Math.abs(f.wheelbase-3.635)<1e-5,'Remote model geometry wheelbase absent');assert(Math.abs(f.steer-Math.atan(f.headingDelta*Math.PI/180/f.dt*f.wheelbase/f.speed))<1e-10,'Actual remote angle does not use model wheelbase');}
    run.status='PASS';run.checks.push('actual remote rendered angle uses measured3.635m wheelbase');stage('geometry-derived remote steering verified');continue;
`);
src=src.replace('remoteSteeringKnownMismatch:{runtimeWheelbase:3.3,candidateWheelbase:3.635,tangentUnderestimatePercent:(1-3.3/3.635)*100},','remoteSteeringCorrection:{source:"geometry-derived model.wheelbase with preload fallback",expected:3.635},');
fs.writeFileSync('qc/cybertruck-runtime-steering.cjs',src);
