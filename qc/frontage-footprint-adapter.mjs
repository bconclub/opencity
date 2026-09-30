// Apply to the review-only file map assembled by prepare-frontage-runtime.mjs.
import fs from'node:fs';import assert from'node:assert/strict';
export function applyVehicleFootprint(files){
 const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'Footprint adapter anchor: '+a);return s.replace(a,b);};
 files['vehicle-footprint.js']=fs.readFileSync('qc/vehicle-footprint-candidate.js','utf8');
 for(const name of ['stair-collision.js','vidhana-building-passage.js'])files[name]=replace(files[name],"'./vehicle-footprint-candidate.js'","'./vehicle-footprint.js'");
 let auto=files['auto-mode.js'];
 auto="import {measureVehicleFootprint} from './vehicle-footprint.js';\n"+auto;
 auto=replace(auto,'async function setup(map){','async function setup(map){\n let selectedFootprint;const getVehicleFootprint=()=>selectedFootprint;');
 auto=replace(auto,'createVidhanaPassageOverride(data)','createVidhanaPassageOverride(data,{getVehicleFootprint})');
 auto=replace(auto,'getDistrictArchitecture())','getDistrictArchitecture(),{getVehicleFootprint})');
 auto=replace(auto,'await models[type].ready;addVehicleContactShadow','await models[type].ready;selectedFootprint=measureVehicleFootprint(T,models[type].group,{maxPitch:.08,maxRoll:vehicleProfile(type).maxLean});addVehicleContactShadow');
 auto=replace(auto,"if(!spawn)throw new Error('Departure lane is occupied. Choose another departure or retry shortly.');","if(!spawn||world.collide(...spawn.point,spawn.heading)){message('Departure has insufficient vehicle clearance. Choose another departure.');return false;}");
 auto=replace(auto,"message('↑ Accelerate · ↓ Brake / reverse · ← → Steer · Space Stop');map.triggerRepaint();}","message('↑ Accelerate · ↓ Brake / reverse · ← → Steer · Space Stop');map.triggerRepaint();return true;}");
 auto=replace(auto,'hud.hidden=controls.hidden=false;reset();last=0;','hud.hidden=controls.hidden=false;if(!reset()){exit();throw Error("Departure has insufficient vehicle clearance. Choose another departure.");}last=0;');
 files['auto-mode.js']=auto;return files;
}
