// Bounded promotion of the reviewed revision, preserving original runtime bytes.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const oldHash='0c7a5c0c48b0e5aa2df89029a6ca889b4e3dc0e1f540843affab3bd79b5b556b';
const newHash='e6ad2ff4ffc3b4ee4de73600f28eb264e2fc3b3fac65f31ebb0d4f50cda4fc05';
const runtime='assets/vehicles/cybertruck.glb',backup='assets/vehicles/cybertruck-review/runtime-before-promotion.glb';
const candidate=fs.readFileSync('assets/vehicles/cybertruck-review/revision2/cybertruck-reference.glb');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(hash(candidate),newHash);const current=fs.readFileSync(runtime);
if(fs.existsSync(backup))assert.equal(hash(fs.readFileSync(backup)),oldHash);
else{assert.equal(hash(current),oldHash);fs.writeFileSync(backup,current);}
assert([oldHash,newHash].includes(hash(current)),'Unexpected runtime edit; stop');
const report=JSON.parse(fs.readFileSync('assets/vehicles/cybertruck-review/revision2/cpu-validation.json'));
assert.equal(report.sha256,newHash);
fs.writeFileSync(runtime,candidate);
let tuning=fs.readFileSync('vehicle-tuning.js','utf8');
tuning=tuning.replace(/cybertruck:\{([^}]+)\}/,(_,body)=>'cybertruck:{'+body.replace(/wheelbase:[\d.]+/,'wheelbase:3.635').replace(/wheelRadius:[\d.]+/,'wheelRadius:.43925')+'}');
fs.writeFileSync('vehicle-tuning.js',tuning);
let loader=fs.readFileSync('blender-vehicle.js','utf8');
assert(loader.includes("id==='cybertruck'?.43:")||loader.includes("id==='cybertruck'?.43925:"));
loader=loader.replace("id==='cybertruck'?.43:","id==='cybertruck'?.43925:");fs.writeFileSync('blender-vehicle.js',loader);
const validation=JSON.parse(fs.readFileSync('assets/vehicles/asset-validation.json'));
validation.cybertruck={...validation.cybertruck,triangles:report.triangles,materials:report.materials,bounds_min:report.bounds.min,bounds_max:report.bounds.max,textures:2,embeddedImages:1,bytes:candidate.length,sha256:newHash,wheelbase_m:3.635,wheel_radius_m:.43925,front_track_m:report.frontTrack,rear_track_m:report.rearTrack,bounds_frame:'Source Z-up, +Y forward, matching runtime after GLB rotation',status:'Original reconstruction, revision2 promoted after matched views, full-app two-client checks and relative performance gate. Simplified details remain.',previous_runtime:'cybertruck-review/runtime-before-promotion.glb',previous_runtime_sha256:oldHash};
fs.writeFileSync('assets/vehicles/asset-validation.json',JSON.stringify(validation,null,2)+'\n');
assert.equal(hash(fs.readFileSync(runtime)),newHash);assert.equal(hash(fs.readFileSync(backup)),oldHash);
console.log(JSON.stringify({runtimeSHA256:newHash,backupSHA256:oldHash,bytes:candidate.length}));
