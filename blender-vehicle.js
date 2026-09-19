import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {paintHex,selectedVehicleColor} from './vehicle-colors.js';
const templates=new Map();
const VEHICLE_ASSETS={
 cybercab:{
  file:lod=>lod?'cybercab-meshy-traffic':'cybercab-meshy-approved',
  rotation:{x:Math.PI/2,y:-Math.PI/2,z:0},
  wheelRadius:.35,
  assetSource:'User-selected Meshy reconstruction',
  originalReconstruction:false,
 },
 cybertruck:{
  file:()=>'cybertruck',
  rotation:{x:Math.PI/2,y:0,z:0},
  wheelRadius:.43,
  assetSource:'Original Blender reconstruction',
  originalReconstruction:true,
 },
 kitt:{
  file:()=>'kitt',
  rotation:{x:Math.PI/2,y:0,z:0},
  wheelRadius:.34,
  assetSource:'Original Blender reconstruction',
  originalReconstruction:true,
 },
};
export function loadVehicleAsset(id,lod=false){
 if(!VEHICLE_ASSETS[id])throw Error('Unknown vehicle asset');
 const file=VEHICLE_ASSETS[id].file(lod);
 if(!templates.has(file))templates.set(file,new GLTFLoader().loadAsync('./assets/vehicles/'+file+'.glb').then(g=>g.scene).catch(e=>{templates.delete(file);throw e;}));
 return templates.get(file);
}
export function createBlenderVehicle(T,id){
 const asset=VEHICLE_ASSETS[id];
 const group=new T.Group(),body=new T.Group(),wheels=[],front=new T.Group(),paint=[];body.add(front);group.add(body);
 let selected=selectedVehicleColor();
 const setPaint=color=>{if(id==='cybercab')return;const hex=paintHex(color);if(!hex)return;selected=color;paint.forEach(m=>m.color.set(hex));group.userData.paintColor=hex;};
 group.userData.originalReconstruction=asset.originalReconstruction;group.userData.vehicle=id;
 group.userData.sharedAssetResources=true;group.userData.assetSource=asset.assetSource;
 const ready=loadVehicleAsset(id).then(source=>{
  const root=source.clone(true),materials=new Map(),wheelPivots=[];
  const {x,y,z}=asset.rotation;root.rotation.set(x,y,z);body.add(root);
  root.traverse(o=>{
   if(/^Wheel_(FL|FR|RL|RR)$/.test(o.name))wheelPivots.push(o);
   if(!o.isMesh)return;
   const original=o.material;
   if(!materials.has(original)){const copy=original.clone();materials.set(original,copy);if(copy.name==='BodyPaint')paint.push(copy);}
   o.material=materials.get(original);
  });
  for(const pivot of wheelPivots){
   wheels.push(pivot);
   if(/_F[LR]$/.test(pivot.name))front.attach(pivot);
  }
  setPaint(selected);
 });
 return{group,body,front,wheels,wheelRadius:asset.wheelRadius,setPaint,ready};
}
