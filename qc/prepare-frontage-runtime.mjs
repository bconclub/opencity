// Prepare review files only. Production promotion requires the selected model,
// browser collision/focus checks, and a matching preload/cache manifest.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {applyVehicleFootprint} from './frontage-footprint-adapter.mjs';
const output='qc/frontage-runtime-candidate';
const read=p=>fs.readFileSync(p,'utf8');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const replace=(source,before,after)=>{assert.equal(source.split(before).length,2,'Source anchor: '+before);return source.replace(before,after);};
let district=read('qc/landmark-focus-district-candidate.js');
district='let districtArchitecture;\nexport function getDistrictArchitecture(){if(!districtArchitecture)throw new Error("City landmarks are not ready for driving");return districtArchitecture;}\n'+district;
district=replace(district,'structure.add(landmarks.group);','districtArchitecture=landmarks.architecture;structure.add(landmarks.group);');
let auto=read('auto-mode.js');
auto="import {getDistrictArchitecture} from './district.js';\nimport {withVidhanaStairCollision} from './vidhana-driving-world.js';\nimport {createVidhanaPassageOverride} from './vidhana-building-passage.js';\n"+auto;
auto=replace(auto,'world=createDrivingWorld(data,graph)','world=withVidhanaStairCollision(createDrivingWorld(data,graph,{passage:createVidhanaPassageOverride(data)}),getDistrictArchitecture())');
let traffic=read('npc-traffic.js');
traffic="import {publicTrafficFeature} from './vidhana-building-passage.js';\n"+traffic;
traffic=replace(traffic,"features:data.features.filter(f=>f.geometry.type==='LineString'","features:data.features.filter(f=>publicTrafficFeature(f)&&f.geometry.type==='LineString'");
const files={
 'district.js':district,
 'auto-mode.js':auto,
 'npc-traffic.js':traffic,
 'auto-world.js':read('qc/vidhana-passage-auto-world.js').replace('../auto-roads.js','./auto-roads.js'),
 'auto-physics.js':read('qc/auto-physics-pose-candidate.js'),
 'landmark-focus.js':read('qc/landmark-focus-candidate.js'),
 'stair-collision.js':read('qc/vidhana-architecture-stair-collision.js'),
 'vidhana-driving-world.js':read('qc/vidhana-driving-world-candidate.js').replace('./vidhana-architecture-stair-collision.js','./stair-collision.js'),
 'vidhana-building-passage.js':read('qc/vidhana-building-passage-candidate.js').replace('../auto-roads.js','./auto-roads.js'),
};
applyVehicleFootprint(files);
fs.mkdirSync(output,{recursive:true});
for(const [name,source]of Object.entries(files))fs.writeFileSync(path.join(output,name),source);
const manifest={reviewOnly:true,files:Object.entries(files).map(([name,source])=>({path:name,bytes:Buffer.byteLength(source),sha256:sha(source)})),
 readiness:'city-loading.js waits for districtState.loaded before prepareAuto. getDistrictArchitecture returns the actual built model metadata; no copied QC JSON or global test promise.',
 geometry:'landmarks.js must be chosen after stair visual filtering acceptance; omitted from this candidate until then.',
 sourceBaselines:['district.js','auto-mode.js','npc-traffic.js','auto-world.js','auto-physics.js'].map(p=>({path:p,sha256:sha(read(p))})),
 remaining:['Selected landmark module','Browser test of production composition','Preload/cache dependency update','Final asset staging and release approval'],
};
fs.writeFileSync('qc/frontage-runtime-manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({prepared:Object.keys(files),runtimeChanged:false}));
