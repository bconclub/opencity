import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {paintHex,selectedVehicleColor} from './vehicle-colors.js';
const templates=new Map();
// glTF is Y-up here. Keep steering above the wheel's independent spin pivot.
export function bindVehicleWheelRig(T,root){
 const wheels=[],steering=[],axis=new T.Vector3(1,0,0),spin=new T.Quaternion();
 root.traverse(o=>{if(/^Wheel_(F|FL|FR|RL|RR)$/.test(o.name))wheels.push(o);});
 for(const wheel of wheels){
  const tag=wheel.name.slice(6);let pivot=wheel.parent;
  if(pivot.name!=='Steer_'+tag){
   const parent=wheel.parent;pivot=new T.Group();pivot.name='Steer_'+tag;pivot.position.copy(wheel.position);parent.add(pivot);pivot.add(wheel);wheel.position.set(0,0,0);
  }
  steering.push({tag,pivot,wheel,rest:wheel.quaternion.clone(),steerRest:pivot.quaternion.clone()});
 }
 root.updateWorldMatrix(true,true);
 const positions=Object.fromEntries(steering.map(s=>[s.tag,s.pivot.getWorldPosition(new T.Vector3())]));
 const rearCentre=positions.RL&&positions.RR?positions.RL.clone().add(positions.RR).multiplyScalar(.5):null;
 const wheelbase=positions.F&&rearCentre?positions.F.distanceTo(rearCentre):positions.FL&&positions.RL?positions.FL.distanceTo(positions.RL):2.57;
 const track=positions.FL&&positions.FR?positions.FL.distanceTo(positions.FR):positions.RL&&positions.RR?positions.RL.distanceTo(positions.RR):1.52;
 const wheelBounds=new T.Box3();
 if(wheels.length){
  const wheel=wheels[0],inverse=wheel.matrixWorld.clone().invert();
  wheel.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();wheelBounds.union(o.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));});
 }
 const wheelSize=wheelBounds.getSize(new T.Vector3()),wheelRadius=Math.max(wheelSize.y,wheelSize.z)/2;
 const yawAxis=new T.Vector3(0,1,0),yaw=new T.Quaternion();
 function update(angle,steer=0){
  const turn=Math.max(-.65,Math.min(.65,Number(steer)||0)),radius=Math.abs(turn)>.0001?wheelbase/Math.tan(Math.abs(turn)):Infinity;
  const rolling=Number.isFinite(Number(angle))?Number(angle):0;
  for(const s of steering){
   spin.setFromAxisAngle(axis,-rolling);
   s.wheel.quaternion.copy(s.rest).multiply(spin);
   const inner=turn>0?s.tag==='FR':s.tag==='FL';
   const delta=s.tag==='F'?turn:s.tag[0]==='F'?Math.sign(turn)*Math.atan(wheelbase/Math.max(.1,radius+(inner?-track/2:track/2))):0;
   yaw.setFromAxisAngle(yawAxis,-delta);s.pivot.quaternion.copy(s.steerRest).multiply(yaw);
  }
 }
 return {wheels,steering,wheelbase,track,wheelRadius,update};
}
function alignAuthoredVehicle(T,root,id){
 // Authored Blender exports: Y-up, -Z forward. X=PI/2 maps to game Z-up,+Y forward.
 root.rotation.x=Math.PI/2;
 root.updateWorldMatrix(true,true);
 let box=new T.Box3().setFromObject(root);
 const height=box.max.y-box.min.y;
 const target=id==='cybertruck'?5.683:id==='cybercab'?4.45:4.6;
 if(height>0)root.scale.multiplyScalar(target/height);
 root.updateWorldMatrix(true,true);
 box=new T.Box3().setFromObject(root);
 root.position.add(new T.Vector3(-(box.min.x+box.max.x)/2,-(box.min.y+box.max.y)/2,-box.min.z));
 root.updateWorldMatrix(true,true);
 return new T.Box3().setFromObject(root).max.z;
}
function alignMeshyCybercab(T,root){
 // Meshy export faces +X; rotate to game +Y forward without wheel splitting.
 root.rotation.x=Math.PI/2;
 root.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2));
 root.updateWorldMatrix(true,true);
 let box=new T.Box3().setFromObject(root);
 const height=box.max.y-box.min.y;
 if(height>0)root.scale.multiplyScalar(4.45/height);
 root.updateWorldMatrix(true,true);
 box=new T.Box3().setFromObject(root);
 root.position.add(new T.Vector3(-(box.min.x+box.max.x)/2,-(box.min.y+box.max.y)/2,-box.min.z));
 root.updateWorldMatrix(true,true);
 return new T.Box3().setFromObject(root).max.z;
}
function attachCybercabAuthoredDetails(T,root,{wheels,lampMeshes}){
 // Meshy body stays fused; add proxy spinners + tail bar so drive QC can see motion/lamps.
 // Counter-scale a detail group so authored sizes stay in world metres after alignMeshyCybercab().
 root.updateWorldMatrix(true,true);
 const scale=root.scale.x||1,inv=1/scale;
 const details=new T.Group();details.scale.set(inv,inv,inv);root.add(details);
 const box=new T.Box3().setFromObject(root);
 const size=box.getSize(new T.Vector3());
 const length=Math.max(size.x,size.z),width=Math.min(size.x,size.z);
 const lengthOnX=size.x>=size.z;
 const wheelRadius=.38,tireWidth=.24,halfTrack=width*.44,inset=length*.12;
 const rubber=new T.MeshStandardMaterial({color:0x1a1a1a,roughness:.96,metalness:0,name:'RubberTrim'});
 const wheelGeo=new T.CylinderGeometry(wheelRadius,wheelRadius,tireWidth,20);
 wheelGeo.rotateX(Math.PI/2);
 const groundY=box.min.y+wheelRadius;
 const axle=[];
 for(const side of [-1,1]){
  for(const along of [-1,1]){
   const lateral=side*halfTrack;
   const longitudinal=along>0?(lengthOnX?box.max.x:box.max.z)-inset:(lengthOnX?box.min.x:box.min.z)+inset;
   axle.push(lengthOnX?[longitudinal,groundY,lateral]:[lateral,groundY,longitudinal]);
  }
 }
 for(const [x,y,z] of axle){
  const wheel=new T.Mesh(wheelGeo,rubber.clone());
  wheel.name='Cybercab_proxy_wheel';
  wheel.position.set(x,y,z);
  details.add(wheel);
  wheels.push(wheel);
 }
 const lampMat=new T.MeshStandardMaterial({name:'Lamps',color:0xff2a18,emissive:0xff2a18,emissiveIntensity:2.5,toneMapped:false});
 const tail=new T.Mesh(new T.BoxGeometry(lengthOnX?length*.72:.12,.08,lengthOnX?.12:width*.72),lampMat);
 tail.name='Tail light bar';
 tail.position.set(lengthOnX?box.min.x+length*.06:0,box.min.y+size.y*.18,lengthOnX?0:box.min.z+width*.06);
 details.add(tail);
 lampMeshes.push(tail);
 const front=lengthOnX?axle[2][0]:axle[2][2],rear=lengthOnX?axle[0][0]:axle[0][2];
 return {wheelRadius,wheelbase:Math.abs(front-rear),track:halfTrack*2};
}
export function loadVehicleAsset(id,lod=false){
 if(!['cybertruck','cybercab','kitt'].includes(id))throw Error('Unknown vehicle asset');
 const file=id==='cybercab'?(lod?'cybercab-meshy-traffic':'cybercab-meshy-approved'):id;
 if(!templates.has(file))templates.set(file,new GLTFLoader().loadAsync('./assets/vehicles/'+file+'.glb').then(g=>g.scene).catch(e=>{templates.delete(file);throw e;}));
 return templates.get(file);
}
export function createBlenderVehicle(T,id){
 const group=new T.Group(),body=new T.Group(),wheels=[],front=new T.Group(),paint=[],scanners=[],lampMeshes=[];body.add(front);group.add(body);let rig,cybercabMetrics;
 let selected=selectedVehicleColor()||(id==='kitt'?'black':null);
 const setPaint=color=>{if(id==='cybercab')return;const hex=paintHex(color);if(!hex)return;selected=color;paint.forEach(m=>m.color.set(hex));group.userData.paintColor=hex;};
 group.userData.originalReconstruction=id!=='cybercab';group.userData.vehicle=id;
 group.userData.sharedAssetResources=true;
 group.userData.assetSource=id==='cybercab'?'Meshy reconstruction + authored proxy wheels/tail lamps (not split mesh)':'Original Blender reconstruction';
 const ready=loadVehicleAsset(id).then(source=>{
  const root=source.clone(true),materials=new Map();
  body.add(root);
  root.traverse(o=>{
   if(!o.isMesh)return;
   const original=o.material;
   if(!materials.has(original)){const copy=original.clone();materials.set(original,copy);if(copy.name==='BodyPaint')paint.push(copy);if(copy.name==='Lamps'){copy.emissiveIntensity=Math.max(copy.emissiveIntensity||0,2.5);copy.toneMapped=false;lampMeshes.push(o);}}
   o.material=materials.get(original);
   if(/^Scanner_\d+$/.test(o.name)){o.material=o.material.clone();scanners.push(o);}
  });
  if(id==='cybercab'){
   group.userData.visualHeight=alignMeshyCybercab(T,root);
   cybercabMetrics=attachCybercabAuthoredDetails(T,root,{wheels,lampMeshes});
   group.userData.wheelAnimation='Authored proxy cylinders on fused Meshy body';
  }else{
   group.userData.visualHeight=alignAuthoredVehicle(T,root,id);
   rig=bindVehicleWheelRig(T,root);
   wheels.push(...rig.wheels);
  }
  setPaint(selected);
 });
 const updateDrive=(angle,steer=0,time=0)=>{
  if(id==='cybercab')wheels.forEach(w=>{w.rotation.z=-Number(angle)||0;});
  else rig?.update(angle,steer);
  const at=(Math.sin(time*3.4)+1)*3.5;
  scanners.forEach(o=>{o.material.emissiveIntensity=.08+2.8*Math.exp(-Math.pow((Number(o.name.split('_')[1])-at)/.9,2));});
 };
 return{group,body,front,wheels,get wheelRadius(){return rig?.wheelRadius||cybercabMetrics?.wheelRadius||(id==='cybertruck'?.43:id==='kitt'?.324:.35);},get wheelbase(){return rig?.wheelbase||cybercabMetrics?.wheelbase;},setPaint,ready,updateDrive};
}
