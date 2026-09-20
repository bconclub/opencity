import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createCar,advanceCar} from '../auto-physics.js';
import {vehicleProfile} from '../vehicle-tuning.js';

// Offline CPU test against the exact checked-in runtime and shipped GLB hierarchy.
// Textures use placeholders; this is not a substitute for browser visual checks.
const cache='D:/CodexTools/OSM2World/',threeURL='file:///D:/CodexTools/OSM2World/three.module.js';
const T=await import(threeURL),url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const utils=url(fs.readFileSync(cache+'BufferGeometryUtils.js','utf8').replace("from 'three'",`from '${threeURL}'`));
const loaderSource=fs.readFileSync(cache+'GLTFLoader.js','utf8').replace("from 'three'",`from '${threeURL}'`).replace('../utils/BufferGeometryUtils.js',utils);
const {GLTFLoader}=await import(url(loaderSource));
const runtime=fs.readFileSync('blender-vehicle.js','utf8');
const {bindVehicleWheelRig}=await import(url(runtime.slice(runtime.indexOf('export function bindVehicleWheelRig'),runtime.indexOf('export function loadVehicleAsset'))));
const loader=new GLTFLoader();
loader.register(()=>({name:'CPU_TEXTURE_PLACEHOLDER',loadTexture:()=>Promise.resolve(new T.Texture())}));
const close=(a,b,label)=>assert(Math.abs(a-b)<1e-6,`${label}: ${a} != ${b}`);
const axis=new T.Vector3(1,0,0),q=new T.Quaternion(),report=[];
for(const [id,file]of [['cybercab','assets/vehicles/cybercab-rigged.glb'],['cybertruck','assets/vehicles/cybertruck.glb'],['kitt','assets/vehicles/kitt.glb'],['auto','qc/auto-wheel-candidate/auto-rickshaw-rigged.glb']]){
 const bytes=fs.readFileSync(file),gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const group=new T.Group(),root=gltf.scene;root.rotation.x=Math.PI/2;group.add(root);
 const rig=bindVehicleWheelRig(T,root);assert.equal(rig.wheels.length,id==='auto'?3:4,`${id} independent wheels`);
 assert(rig.wheelRadius>.2&&rig.wheelRadius<.6,`${id} metre-scale tyre radius`);
 const centres=rig.wheels.map(w=>w.getWorldPosition(new T.Vector3()));
 for(const angle of [0,.4,2.7,-.4,-2.7]){
  rig.update(angle,0);root.updateWorldMatrix(true,true);
  for(const s of rig.steering){q.setFromAxisAngle(axis,-angle);close(s.wheel.quaternion.angleTo(s.rest.clone().multiply(q)),0,`${id} signed rolling`);}
 }
 for(const turn of [-.4,.4]){
  rig.update(1.25,turn);root.updateWorldMatrix(true,true);
  const steer=Object.fromEntries(rig.steering.map(s=>[s.tag,s.pivot.rotation.y]));
  if(id==='auto')close(steer.F,-turn,`${id} front wheel points along turn`);
  else{assert(Math.sign(steer.FL)===-Math.sign(turn)&&Math.sign(steer.FR)===-Math.sign(turn),`${id} front wheels point along turn`);
  assert(Math.abs(steer[turn>0?'FR':'FL'])>Math.abs(steer[turn>0?'FL':'FR']),`${id} inner tyre has tighter Ackermann angle`);}
  close(steer.RL,0,`${id} rear axle not steering`);close(steer.RR,0,`${id} rear axle not steering`);
 }
 rig.update(.3,.2,1.1);root.updateWorldMatrix(true,true);
 if(id==='auto'){
  const fender=root.getObjectByName('FrontFender'),lamp=root.getObjectByName('FrontLamp');assert.equal(fender.parent.name,'Steer_F');assert.equal(lamp.parent,fender.parent);
  const fixed=fender.matrixWorld.clone();rig.update(2,.2,2);root.updateWorldMatrix(true,true);
  for(let i=0;i<16;i++)close(fender.matrixWorld.elements[i],fixed.elements[i],'Auto mudguard steers but cannot spin with tyre');
  rig.update(.3,.2,1.1);root.updateWorldMatrix(true,true);
 }
 for(const s of rig.steering){q.setFromAxisAngle(axis,-(.3+(s.tag[0]==='R'?1.1:0)));close(s.wheel.quaternion.angleTo(s.rest.clone().multiply(q)),0,`${id} rear-only launch slip`);}
 const drift=Math.max(...rig.wheels.map((w,i)=>w.getWorldPosition(new T.Vector3()).distanceTo(centres[i])));assert(drift<1e-6,`${id} pivots fixed while rolling and steering`);
 rig.update(0,0);root.updateWorldMatrix(true,true);
 const contacts=rig.getWheelContacts(group);assert.equal(contacts.length,id==='auto'?3:4);
 assert(contacts.every(c=>[c.x,c.y,c.z,c.width].every(Number.isFinite)&&c.width>0&&Math.abs(c.z)<.08),`${id} tyre contact points near ground`);
 assert(contacts.find(c=>c.tag===(id==='auto'?'F':'FL')).y>contacts.find(c=>c.tag==='RL').y,`${id} contacts use game +Y forward`);
 group.position.set(100,200,9);group.rotation.z=1.2;
 const transformed=rig.getWheelContacts(group);for(let i=0;i<contacts.length;i++)for(const key of ['x','y','z'])close(transformed[i][key],contacts[i][key],`${id} contact remains model-local`);
 const profile=vehicleProfile(id);profile.wheelRadius=rig.wheelRadius;
 const car=createCar();car.profile=profile;
 for(let i=0;i<90;i++)advanceCar(car,{throttle:1,steer:0},1/60);
 assert(car.speed>0&&car.wheel>0,`${id} forward physics rolls forwards`);close(car.wheel,car.distance/rig.wheelRadius,`${id} no rolling slip on straight travel`);
 for(let i=0;i<180;i++)advanceCar(car,{brake:true},1/60);
 const stoppedWheel=car.wheel;for(let i=0;i<30;i++)advanceCar(car,{brake:true},1/60);close(car.wheel,stoppedWheel,`${id} stopped tyres stay stopped`);
 for(let i=0;i<180;i++)advanceCar(car,{reverse:1,steer:0},1/60);
 assert(car.speed<0&&car.wheel<stoppedWheel,`${id} reverse rolls backwards`);
 report.push({vehicle:id,wheelRadius:rig.wheelRadius,pivotDrift:drift,contacts,forwardReverseStop:true,frontAckermann:true,rearOnlySlip:true});
}
console.log(JSON.stringify({passed:true,assets:report,limitation:'CPU rig and physics checks only. New 2M-triangle D: source cars are not rigged by this test. Auto tests the isolated-wheel candidate.'},null,2));
