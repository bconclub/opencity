// Review only. Model-local X is right, Y is forward, Z is up.
export function validVehicleFootprint(b){return b&&['minX','maxX','minY','maxY'].every(k=>Number.isFinite(b[k]))&&b.maxX>b.minX&&b.maxY>b.minY;}
export function measureVehicleFootprint(T,group,{margin=.08,maxPitch=0,maxRoll=0}={}){
 if(group.userData.drivingFootprint)return group.userData.drivingFootprint;
 if(![margin,maxPitch,maxRoll].every(Number.isFinite)||margin<0||maxPitch<0||maxRoll<0||maxPitch>Math.PI/2||maxRoll>Math.PI/2)throw Error('Invalid vehicle clearance margin or angular envelope');
 group.updateWorldMatrix(true,true);const bounds=new T.Box3(),inverse=group.matrixWorld.clone().invert();
 group.traverse(o=>{if(!o.isMesh||o===group.userData.contactShadow||o.name==='Vehicle contact shadow')return;for(let n=o;n&&n!==group;n=n.parent)if(!n.visible)return;o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));});
 const extentX=Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x)),extentY=Math.max(Math.abs(bounds.min.y),Math.abs(bounds.max.y)),extentZ=Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z));
 // Conservative XYZ body rotation envelope. Covers pitch/lean between extrema,
 // without traversing meshes inside the120Hz physics loop. Wheels are overbound.
 const paddingX=extentX*(1-Math.cos(maxRoll))+extentZ*Math.sin(maxRoll),paddingY=extentX*Math.sin(maxRoll)*Math.sin(maxPitch)+extentY*(1-Math.cos(maxPitch))+extentZ*Math.sin(maxPitch);
 const result={minX:bounds.min.x-margin-paddingX,maxX:bounds.max.x+margin+paddingX,minY:bounds.min.y-margin-paddingY,maxY:bounds.max.y+margin+paddingY,margin,paddingX,paddingY,maxPitch,maxRoll,neutralBounds:{minX:bounds.min.x,maxX:bounds.max.x,minY:bounds.min.y,maxY:bounds.max.y,minZ:bounds.min.z,maxZ:bounds.max.z}};
 if(!validVehicleFootprint(result))throw Error('Vehicle mesh has no finite driving footprint');
 group.userData.drivingFootprint=Object.freeze(result);return group.userData.drivingFootprint;
}
export function vehicleFootprintCorners(b,x,y,heading){
 if(!validVehicleFootprint(b)||![x,y,heading].every(Number.isFinite))throw Error('Finite vehicle footprint and pose required');
 const a=heading*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 return[[b.minX,b.minY],[b.maxX,b.minY],[b.maxX,b.maxY],[b.minX,b.maxY]].map(([right,forward])=>[x+right*c+forward*s,y-right*s+forward*c]);
}
export function convexFootprintContact(vehicle,obstacle){
 let least=Infinity,normal=null;const center=polygon=>polygon.reduce((p,q)=>[p[0]+q[0]/polygon.length,p[1]+q[1]/polygon.length],[0,0]),v= center(vehicle),o=center(obstacle);
 for(const polygon of [vehicle,obstacle])for(let i=0;i<polygon.length;i++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);if(length<1e-9)continue;
  const nx=dy/length,ny=-dx/length,project=points=>points.map(p=>p[0]*nx+p[1]*ny),a=project(vehicle),b=project(obstacle),loA=Math.min(...a),hiA=Math.max(...a),loB=Math.min(...b),hiB=Math.max(...b);
  if(hiA<=loB||hiB<=loA)return null;
  const overlap=Math.min(hiA-loB,hiB-loA);if(overlap<least){least=overlap;const sign=(v[0]-o[0])*nx+(v[1]-o[1])*ny>=0?1:-1;normal={x:nx*sign,y:ny*sign};}
 }
 return normal;
}
