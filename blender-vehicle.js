import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {paintHex,selectedVehicleColor} from './vehicle-colors.js';
const templates=new Map();
export function loadVehicleAsset(id,lod=false){
 if(!['cybertruck','cybercab','kitt'].includes(id))throw Error('Unknown vehicle asset');
 // User chose the original Meshy appearance after the three-way comparison.
 const file=id==='cybercab'?(lod?'cybercab-meshy-traffic':'cybercab-meshy-approved'):id;
 if(!templates.has(file))templates.set(file,new GLTFLoader().loadAsync('./assets/vehicles/'+file+'.glb').then(g=>g.scene).catch(e=>{templates.delete(file);throw e;}));
 return templates.get(file);
}
export function createBlenderVehicle(T,id){
 const group=new T.Group(),body=new T.Group(),wheels=[],front=new T.Group(),paint=[];body.add(front);group.add(body);
 let selected=selectedVehicleColor();
 const setPaint=color=>{if(id==='cybercab')return;const hex=paintHex(color);if(!hex)return;selected=color;paint.forEach(m=>m.color.set(hex));group.userData.paintColor=hex;};
 group.userData.originalReconstruction=id!=='cybercab';group.userData.vehicle=id;
 group.userData.sharedAssetResources=true;
 group.userData.assetSource=id==='cybercab'?'User-selected Meshy reconstruction':'Original Blender reconstruction';
 const ready=loadVehicleAsset(id).then(source=>{const root=source.clone(true),materials=new Map();root.rotation.x=Math.PI/2;body.add(root);root.traverse(o=>{if(!o.isMesh)return;const original=o.material;if(!materials.has(original)){const copy=original.clone();materials.set(original,copy);if(copy.name==='BodyPaint')paint.push(copy);}o.material=materials.get(original);if(/^Wheel_/.test(o.name))wheels.push(o);});setPaint(selected);});
 return{group,body,front,wheels,wheelRadius:id==='cybertruck'?.43:.35,setPaint,ready};
}
