// One cached soft contact footprint. No extra shadow-map render pass.
let texture;
export function addVehicleContactShadow(T,group){
 if(group.userData.contactShadow)return group.userData.contactShadow;
 if(!texture){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const c=canvas.getContext('2d'),gradient=c.createRadialGradient(64,64,9,64,64,64);
  gradient.addColorStop(0,'rgba(0,0,0,.36)');gradient.addColorStop(.58,'rgba(0,0,0,.29)');gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;c.fillRect(0,0,128,128);
  texture=new T.CanvasTexture(canvas);
 }
 group.updateWorldMatrix(true,true);
 const bounds=new T.Box3(),inverse=group.matrixWorld.clone().invert();
 group.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));});
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 group.userData.visualHeight=bounds.max.z;
 const geometry=new T.PlaneGeometry(Math.max(.5,size.x*1.15),Math.max(.9,size.y*1.04));
 const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,toneMapped:false});
 const shadow=new T.Mesh(geometry,material);shadow.name='Vehicle contact shadow';shadow.position.set(center.x,center.y,.008);shadow.renderOrder=-1;group.add(shadow);group.userData.contactShadow=shadow;
 return shadow;
}
export function disposeVehicleContactShadow(group){
 const shadow=group.userData.contactShadow;if(!shadow)return;
 shadow.removeFromParent();shadow.geometry.dispose();shadow.material.dispose();delete group.userData.contactShadow;
}
