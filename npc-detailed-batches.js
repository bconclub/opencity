// Animate the supplied GLB hierarchy in shared instance batches.
import {bindVehicleWheelRig} from './blender-vehicle.js';
export function createDetailedTraffic(T,source,maxNear){
 if(!Number.isInteger(maxNear)||maxNear<1||maxNear>2)throw Error('Detailed traffic capacity must be 1 or 2');
 const slots=Array.from({length:maxNear},()=>{
  const root=source.clone(true);root.rotation.x=Math.PI/2;const rig=bindVehicleWheelRig(T,root);
  if(rig.wheels.length!==4)throw Error('Detailed source must contain four wheel pivots');
  const parts=[];root.traverse(o=>{if(o.isMesh)parts.push(o)});root.updateMatrixWorld(true);return{root,rig,parts};
 });
 const materials=new Map();const copy=m=>{if(!materials.has(m))materials.set(m,m.clone());return materials.get(m)};
 const meshes=slots[0].parts.map(part=>{const material=Array.isArray(part.material)?part.material.map(copy):copy(part.material);const mesh=new T.InstancedMesh(part.geometry,material,maxNear);mesh.name='Traffic_'+part.name;mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);return mesh});
 const trianglesPerVehicle=meshes.reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0);
 if(trianglesPerVehicle>25000)throw Error('Detailed traffic exceeds the 25000 triangle budget');
 const matrix=new T.Matrix4();let disposed=false;
 function update(rows){
  if(disposed)throw Error('Detailed traffic has been disposed');if(rows.length>maxNear)throw Error('Detailed traffic capacity exceeded');
  rows.forEach((row,i)=>{const slot=slots[i];slot.rig.update(row.angle,row.steer);slot.root.updateMatrixWorld(true);slot.parts.forEach((part,j)=>{matrix.multiplyMatrices(row.matrix,part.matrixWorld);meshes[j].setMatrixAt(i,matrix)})});
  meshes.forEach(mesh=>{mesh.count=rows.length;mesh.instanceMatrix.needsUpdate=true});
 }
 function dispose(){if(disposed)return;disposed=true;for(const mesh of meshes){mesh.removeFromParent();mesh.dispose()}for(const material of materials.values())material.dispose()}
 return{meshes,trianglesPerVehicle,update,dispose};
}
