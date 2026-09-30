// Split only selected original triangles. Position, normal and UV buffers stay
// shared with the supplied GLB; no replacement wheel mesh or texture is made.
const partitions=new Map();
export function bindOriginalWheelRig(T,root,body,config){
 const wheels=[],entries=config.wheels.map(w=>{const pivot=new T.Group(),spin=new T.Group();pivot.name='Steer_'+w.tag;spin.name='Wheel_'+w.tag;pivot.position.fromArray(w.center);pivot.add(spin);body.add(pivot);wheels.push(spin);return{...w,pivot,spin};});
 root.updateWorldMatrix(true,true);body.updateWorldMatrix(true,true);
 const inverse=new T.Matrix4().copy(body.matrixWorld).invert(),meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
 for(const mesh of meshes){
  const source=mesh.geometry,key=source.uuid+JSON.stringify(config);let chunks=partitions.get(key);
  if(!chunks){
   const matrix=new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),p=source.attributes.position,flags=new Uint8Array(p.count),v=new T.Vector3();
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);for(let j=0;j<entries.length;j++){const w=entries[j],x=v.x-w.center[0],y=v.y-w.center[1],z=v.z-w.center[2];if(Math.abs(x)<=w.width/2&&y*y+z*z<=w.radius*w.radius)flags[i]|=1<<j;}}
   const bins=Array.from({length:entries.length+1},()=>[]),index=source.index,count=index?index.count:p.count;
   for(let i=0;i<count;i+=3){const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2,mask=flags[a]&flags[b]&flags[c];let bin=0;
    for(let j=0;j<entries.length;j++)if(mask&(1<<j)){bin=j+1;break;}
    bins[bin].push(a,b,c);
   }
   chunks=bins.map(ids=>{if(!ids.length)return null;const g=new T.BufferGeometry();for(const[name,a]of Object.entries(source.attributes))g.setAttribute(name,a);g.setIndex(ids);g.boundingBox=new T.Box3();for(const n of ids)g.boundingBox.expandByPoint(v.fromBufferAttribute(p,n));g.boundingSphere=g.boundingBox.getBoundingSphere(new T.Sphere());return g;});
   partitions.set(key,chunks);
  }
  const originalMatrix=mesh.matrixWorld.clone();mesh.geometry=chunks[0];mesh.visible=!!chunks[0];
  for(let j=0;j<entries.length;j++){if(!chunks[j+1])continue;const piece=new T.Mesh(chunks[j+1],mesh.material);entries[j].spin.updateWorldMatrix(true,true);piece.matrix.multiplyMatrices(entries[j].spin.matrixWorld.clone().invert(),originalMatrix);piece.matrix.decompose(piece.position,piece.quaternion,piece.scale);piece.name=entries[j].tag+'_OriginalSurface';entries[j].spin.add(piece);}
 }
 const fronts=entries.filter(w=>w.tag.startsWith('F')),rears=entries.filter(w=>w.tag.startsWith('R'));
 const mean=(xs,k)=>xs.reduce((s,w)=>s+w.center[k],0)/xs.length,wheelbase=mean(fronts,1)-mean(rears,1),track=fronts.length===2?Math.abs(fronts[0].center[0]-fronts[1].center[0]):0;
 const wheelRadius=entries.reduce((s,w)=>s+w.radius,0)/entries.length;
 function update(angle,steer=0,slip=0){const turn=Math.max(-.65,Math.min(.65,steer||0)),radius=Math.abs(turn)>.0001?wheelbase/Math.tan(Math.abs(turn)):Infinity;
  for(const w of entries){w.spin.rotation.x=-(angle+(w.tag.startsWith('R')?slip:0));const inner=turn>0?w.center[0]>0:w.center[0]<0;w.pivot.rotation.z=w.tag.startsWith('F')?-(fronts.length===1?turn:Math.sign(turn)*Math.atan(wheelbase/Math.max(.1,radius+(inner?-track/2:track/2)))):0;}
 }
 return{wheels,entries,wheelRadius,wheelbase,update,getWheelContacts:()=>entries.map(w=>({tag:w.tag,x:w.center[0],y:w.center[1],z:w.center[2]-w.radius,width:w.width}))};
}
