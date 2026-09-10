import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {paintHex,selectedVehicleColor} from './vehicle-colors.js';
const templates=new Map();
// glTF is Y-up here. Keep steering above the wheel's independent spin pivot.
export function bindVehicleWheelRig(T,root){
 const wheels=[],steering=[],axis=new T.Vector3(1,0,0),spin=new T.Quaternion();
 root.traverse(o=>{if(/^Wheel_(FL|FR|RL|RR)$/.test(o.name))wheels.push(o);});
 for(const wheel of wheels){
  const tag=wheel.name.slice(-2);let pivot=wheel.parent;
  if(pivot.name!=='Steer_'+tag){
   const parent=wheel.parent;pivot=new T.Group();pivot.name='Steer_'+tag;pivot.position.copy(wheel.position);parent.add(pivot);pivot.add(wheel);wheel.position.set(0,0,0);
  }
  steering.push({tag,pivot,wheel,rest:wheel.quaternion.clone(),steerRest:pivot.quaternion.clone()});
 }
 root.updateWorldMatrix(true,true);
 const positions=Object.fromEntries(steering.map(s=>[s.tag,s.pivot.getWorldPosition(new T.Vector3())]));
 const wheelbase=positions.FL&&positions.RL?positions.FL.distanceTo(positions.RL):2.57;
 const track=positions.FL&&positions.FR?positions.FL.distanceTo(positions.FR):1.52;
 const wheelBounds=new T.Box3();
 if(wheels.length){
  const wheel=wheels[0],inverse=wheel.matrixWorld.clone().invert();
  wheel.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();wheelBounds.union(o.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));});
 }
 const wheelSize=wheelBounds.getSize(new T.Vector3()),wheelRadius=Math.max(wheelSize.y,wheelSize.z)/2;
 const yawAxis=new T.Vector3(0,1,0),yaw=new T.Quaternion();
 function update(angle,steer=0){
  const turn=Math.max(-.65,Math.min(.65,Number(steer)||0)),radius=Math.abs(turn)>.0001?wheelbase/Math.tan(Math.abs(turn)):Infinity;
  spin.setFromAxisAngle(axis,-(Number(angle)||0));
  for(const s of steering){
   s.wheel.quaternion.copy(s.rest).multiply(spin);
   const inner=turn>0?s.tag==='FR':s.tag==='FL';
   const delta=s.tag[0]==='F'?Math.sign(turn)*Math.atan(wheelbase/Math.max(.1,radius+(inner?-track/2:track/2))):0;
   yaw.setFromAxisAngle(yawAxis,-delta);s.pivot.quaternion.copy(s.steerRest).multiply(yaw);
  }
 }
 return {wheels,steering,wheelbase,track,wheelRadius,update};
}
export function loadVehicleAsset(id,lod=false){
 if(!['cybertruck','cybercab','kitt'].includes(id))throw Error('Unknown vehicle asset');
 // User chose the original Meshy appearance after the three-way comparison.
 const file=id==='cybercab'?(lod?'cybercab-meshy-traffic':'cybercab-meshy-approved'):id;
 if(!templates.has(file))templates.set(file,new GLTFLoader().loadAsync('./assets/vehicles/'+file+'.glb').then(g=>g.scene).catch(e=>{templates.delete(file);throw e;}));
 return templates.get(file);
}
export function createBlenderVehicle(T,id){
 const group=new T.Group(),body=new T.Group(),wheels=[],front=new T.Group(),paint=[],scanners=[];body.add(front);group.add(body);let rig;
 let selected=selectedVehicleColor();
 const setPaint=color=>{if(id==='cybercab')return;const hex=paintHex(color);if(!hex)return;selected=color;paint.forEach(m=>m.color.set(hex));group.userData.paintColor=hex;};
 group.userData.originalReconstruction=id!=='cybercab';group.userData.vehicle=id;
 group.userData.sharedAssetResources=true;
 group.userData.assetSource=id==='cybercab'?'User-selected Meshy reconstruction':'Original Blender reconstruction';
 const ready=loadVehicleAsset(id).then(source=>{const root=source.clone(true),materials=new Map();root.rotation.x=Math.PI/2;body.add(root);root.traverse(o=>{if(!o.isMesh)return;const original=o.material;if(!materials.has(original)){const copy=original.clone();materials.set(original,copy);if(copy.name==='BodyPaint')paint.push(copy);}o.material=materials.get(original);if(/^Scanner_\d+$/.test(o.name)){o.material=o.material.clone();scanners.push(o);}});rig=bindVehicleWheelRig(T,root);wheels.push(...rig.wheels);setPaint(selected);});
 const updateDrive=(angle,steer=0,time=0)=>{rig?.update(angle,steer);const at=(Math.sin(time*3.4)+1)*3.5;scanners.forEach(o=>{o.material.emissiveIntensity=.08+2.8*Math.exp(-Math.pow((Number(o.name.split('_')[1])-at)/.9,2));});};
 return{group,body,front,wheels,get wheelRadius(){return rig?.wheelRadius||(id==='cybertruck'?.43:id==='kitt'?.34:.35);},setPaint,ready,updateDrive};
}
