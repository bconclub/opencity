// Review candidate served at /npc-detailed-batches.js by the test harness.
import {bindVehicleWheelRig} from './blender-vehicle.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function createDetailedTraffic(T,source,maxNear){
 if(!Number.isInteger(maxNear)||maxNear<1||maxNear>2)throw Error('Detailed traffic capacity must be 1 or 2');
 const template=source.clone(true);template.updateMatrixWorld(true);
 const find=name=>{const o=template.getObjectByName(name);if(!o?.isMesh)throw Error('Missing detailed Cybercab mesh '+name);return o;};
 const body=find('Body_FixedFenders'),left=find('Wheel_FL'),right=find('Wheel_FR');
 const liners=['FL','FR','RL','RR'].map(tag=>find('FixedLiner_Wheel_'+tag));
 const rim=find('Rim_Wheel_FR'),rubber=left.material;
 if(right.material!==rubber||liners.some(o=>o.material!==rubber))throw Error('Detailed rubber material identities differ');
 const ownedGeometries=new Set(),ownedMaterials=new Map();
 const ownGeometry=g=>(ownedGeometries.add(g),g);
 const material=m=>{if(!ownedMaterials.has(m))ownedMaterials.set(m,m.clone());return ownedMaterials.get(m);};
 const triangles=g=>(g.index?.count??g.attributes.position.count)/3;
 const bodyGeometry=ownGeometry(body.geometry.clone().applyMatrix4(body.matrixWorld));
 const linerParts=liners.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld).toNonIndexed());
 const linerGeometry=mergeGeometries(linerParts);linerParts.forEach(g=>g.dispose());
 if(!linerGeometry)throw Error('Detailed liner attributes cannot merge');
 ownGeometry(linerGeometry);
 const leftGeometry=ownGeometry(left.geometry.clone()),rightGeometry=ownGeometry(right.geometry.clone());
 const rimRelative=new T.Matrix4().copy(right.matrixWorld).invert().multiply(rim.matrixWorld);
 const rimGeometry=ownGeometry(rim.geometry.clone().applyMatrix4(rimRelative));
 const geometries=[bodyGeometry,linerGeometry,leftGeometry,rightGeometry,rimGeometry];
 const materials=[body.material,rubber,rubber,rubber,rim.material];
 const perCar=[1,1,2,2,4];
 const meshes=geometries.map((g,i)=>{
  const mesh=new T.InstancedMesh(g,material(materials[i]),maxNear*perCar[i]);
  mesh.name=['DetailedBody','DetailedFixedLiners','DetailedLeftTyres','DetailedRightTyres','DetailedRims'][i];
  mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);return mesh;
 });
 const trianglesPerVehicle=geometries.reduce((total,g,i)=>total+triangles(g)*perCar[i],0);
 if(trianglesPerVehicle!==24667)throw Error('Detailed source geometry differs from audited 24667 triangles');
 const slots=Array.from({length:maxNear},()=>{
  const carrier=new T.Group();carrier.rotation.x=Math.PI/2;carrier.add(source.clone(true));
  carrier.updateMatrixWorld(true);const rig=bindVehicleWheelRig(T,carrier);
  if(rig.wheels.length!==4)throw Error('Detailed source must contain four wheel pivots');
  return {carrier,rig,wheels:Object.fromEntries(rig.wheels.map(w=>[w.name.slice(-2),w]))};
 });
 const conversion=new T.Matrix4().makeRotationX(Math.PI/2),flipRim=new T.Matrix4().makeRotationY(Math.PI);
 const matrix=new T.Matrix4();let disposed=false;
 function update(rows){
  if(disposed)throw Error('Detailed traffic has been disposed');
  if(rows.length>maxNear)throw Error('Detailed traffic capacity exceeded');
  for(let i=0;i<rows.length;i++){
   const row=rows[i],slot=slots[i];slot.rig.update(row.angle,row.steer);slot.carrier.updateMatrixWorld(true);
   matrix.multiplyMatrices(row.matrix,conversion);meshes[0].setMatrixAt(i,matrix);meshes[1].setMatrixAt(i,matrix);
   for(const [j,tag]of ['FL','FR','RL','RR'].entries()){
    matrix.multiplyMatrices(row.matrix,slot.wheels[tag].matrixWorld);
    meshes[tag[1]==='L'?2:3].setMatrixAt(i*2+(tag[0]==='F'?0:1),matrix);
    if(tag[1]==='L')matrix.multiply(flipRim);
    meshes[4].setMatrixAt(i*4+j,matrix);
   }
  }
  for(let i=0;i<meshes.length;i++){meshes[i].count=rows.length*perCar[i];meshes[i].instanceMatrix.needsUpdate=true;}
 }
 function dispose(){
  if(disposed)return;disposed=true;
  for(const mesh of meshes){mesh.removeFromParent();mesh.dispose();}
  for(const geometry of ownedGeometries)geometry.dispose();
  // Cloned materials still reference source textures; never dispose those textures.
  for(const m of ownedMaterials.values())m.dispose();
 }
 return {meshes,trianglesPerVehicle,update,dispose};
}
