const fs = require('node:fs'), assert = require('node:assert/strict');
const base = fs.readFileSync('npc-traffic.js', 'utf8');
fs.writeFileSync('qc/npc-detail-baseline.js', base);
let source = base;
function replace(before, after) { assert.equal(source.split(before).length, 2, 'Unique patch anchor'); source = source.replace(before, after); }
replace("import {setMapSceneCamera}", "import {chooseDetailedCars,npcWheelPose} from './npc-detail-state.js';\nimport {createDetailedTraffic} from './npc-detailed-batches.js';\nimport {setMapSceneCamera}");
replace(' function playerBody()', ` let detail=null,detailError=null,removed=false,nearIds=new Set(),farVisible=0,nearVisible=0;const poses=new Map(),clipPoint=new T.Vector4();
 loadVehicleAsset('cybercab').then(source=>{if(removed)return;detail=createDetailedTraffic(T,source,mobile?1:2);scene.add(...detail.meshes);map.triggerRepaint();}).catch(error=>{detailError=String(error.message||error);});
 function playerBody()`);
const begin = 'const centre=toLocal(map.getCenter().toArray());visible=0;';
const end = 'renderer.resetState();const start=performance.now();renderer.render(scene,camera);';
assert.equal(source.split(begin).length, 2); assert.equal(source.split(end).length, 2);
const first = source.indexOf(begin), last = source.indexOf(end, first);
source = source.slice(0, first) + `camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(transform);const eyeValid=setMapSceneCamera(T,camera,camera.projectionMatrix);
 const centre=toLocal(map.getCenter().toArray()),shown=[];for(const car of cars){if(Math.hypot(car.x-centre[0],car.y-centre[1])>(mobile?350:650))continue;shown.push({...car,z:(window.vidhanaStreetPatch?.heightAt(...toLngLat([car.x,car.y]))??0)+.03});}
 const onScreen=shown.filter(car=>{clipPoint.set(car.x,car.y,car.z+1,1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);return clipPoint.w>0&&Math.abs(clipPoint.x)<clipPoint.w*1.2&&Math.abs(clipPoint.y)<clipPoint.w*1.2;});
 nearIds=detail&&eyeValid?chooseDetailedCars(onScreen,camera.position,nearIds,mobile):new Set();const rows=[];farVisible=0;visible=shown.length;
 for(const car of cars)poses.set(car.id,npcWheelPose(car,poses.get(car.id)));
 for(const car of shown){dummy.position.set(car.x,car.y,car.z);dummy.rotation.z=-car.heading*Math.PI/180;dummy.updateMatrix();if(nearIds.has(car.id)){const pose=poses.get(car.id);rows.push({matrix:dummy.matrix.clone(),angle:pose.angle,steer:pose.steer});}else{for(const mesh of meshes)mesh.setMatrixAt(farVisible,dummy.matrix);farVisible++;}}
 for(const mesh of meshes){mesh.count=farVisible;mesh.instanceMatrix.needsUpdate=true;}nearVisible=rows.length;detail?.update(rows);
 ` + source.slice(last);
replace('onRemove(){clearInterval(timer);', 'onRemove(){removed=true;detail?.dispose();clearInterval(timer);');
replace('drawCalls:visible?meshes.length:0,trianglesPerVehicle,', 'drawCalls:(farVisible?meshes.length:0)+(nearVisible?detail.meshes.length:0),trianglesPerVehicle,farVisible,nearVisible,nearIds:[...nearIds],detailReady:!!detail,detailError,submittedTriangles:farVisible*trianglesPerVehicle+nearVisible*(detail?.trianglesPerVehicle||0),');
replace('cars:cars.map(c=>({x:c.x,', 'cars:cars.map(c=>({id:c.id,wheelPose:poses.get(c.id),x:c.x,');
fs.writeFileSync('qc/npc-detail-candidate.js', source);
console.log('Prepared isolated NPC detail candidate; runtime unchanged');
