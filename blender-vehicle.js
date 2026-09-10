import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {paintHex,selectedVehicleColor} from './vehicle-colors.js';
const templates=new Map();
export function loadVehicleAsset(id){if(!['cybertruck','cybercab','kitt'].includes(id))throw Error('Unknown authored vehicle');if(!templates.has(id))templates.set(id,new GLTFLoader().loadAsync('./assets/vehicles/'+id+'.glb').then(g=>g.scene).catch(e=>{templates.delete(id);throw e;}));return templates.get(id);}
export function createBlenderVehicle(T,id){
 const group=new T.Group(),body=new T.Group(),wheels=[],front=new T.Group(),paint=[];body.add(front);group.add(body);
 let selected=selectedVehicleColor();
 const setPaint=color=>{if(id==='cybercab')return;const hex=paintHex(color);if(!hex)return;selected=color;paint.forEach(m=>m.color.set(hex));group.userData.paintColor=hex;};
 group.userData.originalReconstruction=true;group.userData.vehicle=id;
 const ready=loadVehicleAsset(id).then(source=>{const root=source.clone(true);root.rotation.x=Math.PI/2;body.add(root);root.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();if(o.material.name==='BodyPaint')paint.push(o.material);if(/^Wheel_/.test(o.name))wheels.push(o);});setPaint(selected);});
 return{group,body,front,wheels,wheelRadius:id==='cybertruck'?.43:.35,setPaint,ready};
}
