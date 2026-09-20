const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const args=process.argv.slice(2),replay=args.length===1&&args[0]==='--replay-accepted';
assert(replay||(args.length===3&&args[1]==='--output-prefix'&&!args[0].startsWith('--')),'Usage: --replay-accepted OR <landmark-source> --output-prefix <new-qc-prefix>');
const outputPrefix=replay?'qc/frontage-runtime-browser':args[2];
if(!replay){assert(!fs.existsSync(outputPrefix+'-snapshot.json'),'Refusing to overwrite an existing snapshot receipt');assert(path.resolve(outputPrefix).startsWith(path.resolve('qc')+path.sep),'Output prefix must be inside qc/');}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),base=JSON.parse(fs.readFileSync('qc/vidhana-passage-browser-v2-snapshot.json'));
const accepted=replay?JSON.parse(fs.readFileSync('qc/frontage-runtime-browser-results.json')):null;
if(replay){assert.equal(accepted.passed,true);assert.deepEqual(JSON.parse(fs.readFileSync(outputPrefix+'-snapshot.json')),accepted.snapshot);assert.equal(base.commit,accepted.snapshot.baselineCommit);}
const selected=replay?accepted.snapshot.selectedLandmarks:args[0];
// The accepted receipt is the sole replay allowlist. Later promotion manifests may contain additional files.
const productionEntries=replay?accepted.snapshot.productionFiles:JSON.parse(fs.readFileSync('qc/frontage-runtime-manifest.json')).files;
const source={};for(const e of base.entries){if(e.override)continue;source[e.path]=execFileSync('git',['show',base.commit+':'+e.path],{maxBuffer:40*1024*1024});assert.equal(sha(source[e.path]),e.sha256);}
const production={};for(const e of productionEntries){assert(!Object.hasOwn(production,e.path),'Duplicate production path');const b=fs.readFileSync(e.path==='landmarks.js'?selected:path.join('qc/frontage-runtime-candidate',e.path));assert.equal(sha(b),e.sha256,'Production bytes changed: '+e.path);production[e.path]=b;}
if(!replay)production['landmarks.js']=fs.readFileSync(selected);
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,a);return s.replace(a,b);};
const testHooks={};
let auto=production['auto-mode.js'].toString();
auto=replace(auto,'window.autoState=()=>','window.__passagePlace=(point,h)=>{if(staticCollision(...point,h))throw Error("Test start intersects static geometry");roaming=false;car=createCar(point[0],point[1],h);car.profile=vehicleProfile(vehicleType);if(model.wheelRadius)car.profile.wheelRadius=model.wheelRadius;speed=distance=wheelAngle=0;heading=h;cameraRig=lookRig=null;pause(false);updateCamera();map.triggerRepaint();};window.__passageGraphs=()=>({manual:graph,tour:tourGraph,footprint:model.group.userData.drivingFootprint});window.autoState=()=>');testHooks['auto-mode.js']=auto;
let flight=source['flight.js'].toString();
flight=replace(flight,'window.flightState=()=>','window.__frontageHover=(p,h,z)=>{release();roaming=false;lng=p[0];lat=p[1];alt=z;heading=h;speed=side=travel=0;phase="flying";dynamics=physics.createDynamics();dynamics.heading=h;rotorPower=1;cameraMode="chase";cameraOrbitYaw=cameraOrbitLift=0;cameraRig=lookRig=null;setPaused(false);camera(1,true);map.triggerRepaint();};window.flightState=()=>');testHooks['flight.js']=flight;
const entries=[],root=outputPrefix+'-snapshot',files=Object.entries({...source,...production,...testHooks}).map(([name,b])=>[name,Buffer.from(b)]);
for(const [name,bytes]of files)entries.push({path:name,bytes:bytes.length,sha256:sha(bytes),productionOverride:Object.hasOwn(production,name),testHook:Object.hasOwn(testHooks,name)});
// Validate every final hooked byte before writing any fixture file. Frozen JSON is never rewritten on replay.
if(replay)assert.deepEqual(entries,accepted.snapshot.entries,'Rebuilt fixture differs from accepted browser receipt');
for(const [name,bytes]of files){const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
if(!replay)fs.writeFileSync(outputPrefix+'-snapshot.json',JSON.stringify({baselineCommit:base.commit,selectedLandmarks:selected,productionFiles:Object.entries(production).map(([name,b])=>({path:name,sha256:sha(b)})),entries,notes:['Explicit candidate composition plus selected landmark source','No architecture global or readiness promise injected; real district export consumed during existing preload','Test hooks establish initial vehicle position and expose actual graphs only. Keyboard and flight dynamics remain unchanged','Local HTTP and WebSocket servers; no production changes']},null,2));
console.log(JSON.stringify({replay,files:entries.length,selected,root,productionFiles:Object.keys(production),testHooks:Object.keys(testHooks)}));
