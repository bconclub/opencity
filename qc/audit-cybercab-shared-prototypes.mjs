import fs from 'node:fs';
import assert from 'node:assert/strict';
const base='D:/CodexTools/OSM2World/',threeURL='file:///D:/CodexTools/OSM2World/three.module.js';
const T=await import(threeURL),url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const utils=url(fs.readFileSync(base+'BufferGeometryUtils.js','utf8').replace("from 'three'",`from '${threeURL}'`));
const loaderSource=fs.readFileSync(base+'GLTFLoader.js','utf8').replace("from 'three'",`from '${threeURL}'`).replace('../utils/BufferGeometryUtils.js',utils);
const {GLTFLoader}=await import(url(loaderSource));
const runtime=fs.readFileSync('blender-vehicle.js','utf8'),start=runtime.indexOf('export function bindVehicleWheelRig'),end=runtime.indexOf('export function loadVehicleAsset');
const {bindVehicleWheelRig}=await import(url(runtime.slice(start,end)));
const loader=new GLTFLoader();
loader.register(()=>({name:'CPU_TEXTURE_PLACEHOLDER',loadTexture:()=>Promise.resolve(new T.Texture())}));
const bytes=fs.readFileSync('assets/vehicles/cybercab-rigged.glb');
const {scene}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
const wheels=Object.fromEntries(['FL','FR','RL','RR'].map(tag=>[tag,scene.getObjectByName('Wheel_'+tag)]));
const all=[];scene.traverse(o=>{if(o.isMesh)all.push(o)});
console.log(all.map(o=>({name:o.name,material:o.material.name,triangles:(o.geometry.index?.count??o.geometry.attributes.position.count)/3})));
const parts={};
for(const [tag,wheel] of Object.entries(wheels)){
 const centre=wheel.getWorldPosition(new T.Vector3());
 parts[tag]={tyre:wheel,rim:wheel.children.find(o=>o.isMesh),liner:all.find(o=>o.name==='FixedLiner_Wheel_'+tag),centre};
}
const key=v=>v.map(x=>Math.round(x*1e5)).join(',');
function triangleSoup(obj,centre,rotation){
 const geometry=obj.geometry,positions=geometry.attributes.position,normals=geometry.attributes.normal;
 const world=new T.Matrix4().makeRotationY(rotation).multiply(new T.Matrix4().makeTranslation(-centre.x,-centre.y,-centre.z)).multiply(obj.matrixWorld);
 const normal=new T.Matrix3().getNormalMatrix(world),p=new T.Vector3(),n=new T.Vector3();
 const ids=geometry.index?Array.from(geometry.index.array):Array.from({length:positions.count},(_,i)=>i);
 const faces=[];
 for(let i=0;i<ids.length;i+=3){
  const f=[];
  for(const j of ids.slice(i,i+3)){
   p.fromBufferAttribute(positions,j).applyMatrix4(world);n.fromBufferAttribute(normals,j).applyMatrix3(normal).normalize();
   f.push({p:p.toArray(),n:n.toArray()});
  }
  faces.push(f);
 }
 return faces;
}
const cyclic=f=>[f,[f[1],f[2],f[0]],[f[2],f[0],f[1]]].map(x=>x.join('|')).sort()[0];
const multiset=(faces,mode)=>{
 const result=new Map();
 for(const face of faces){let v=face.map(x=>key(x.p)+(mode==='attributes'?'@'+key(x.n):''));
 const k=mode==='positions'?v.sort().join('|'):cyclic(v);result.set(k,(result.get(k)??0)+1);}
 return result;
};
const missing=(a,b)=>[...a].reduce((n,[k,v])=>n+Math.max(0,v-(b.get(k)??0)),0);
const result=[];
for(const role of ['tyre','rim','liner']){
 const ref=triangleSoup(parts.FR[role],parts.FR.centre,0);
 for(const tag of ['FL','RL','RR']){
  const f=triangleSoup(parts[tag][role],parts[tag].centre,tag.endsWith('L')?Math.PI:0);
  const row={role,reference:'FR',target:tag,rotationAboutLocalY:tag.endsWith('L')?Math.PI:0,triangles:ref.length,materialSame:parts.FR[role].material===parts[tag][role].material};
  for(const mode of ['positions','winding','attributes'])row[mode+'UnmatchedTriangles']=missing(multiset(ref,mode),multiset(f,mode));
  // Compare normal direction independent of triangulation diagonal/order.
  const byPosition=new Map();for(const face of ref)for(const v of face){const k=key(v.p);if(!byPosition.has(k))byPosition.set(k,[]);byPosition.get(k).push(v.n)}
  const refPositions=new Map();for(const face of ref)for(const v of face)refPositions.set(key(v.p),v.p);
  let minDot=1,maxError=0,unmatchedVertices=0,maxPositionError=0;
  for(const face of f)for(const v of face){const others=byPosition.get(key(v.p));if(!others){unmatchedVertices++;continue;}const best=Math.max(...others.map(n=>n.reduce((s,x,i)=>s+x*v.n[i],0)));minDot=Math.min(minDot,best);maxError=Math.max(maxError,Math.sqrt(Math.max(0,2-2*best)));}
  for(const face of f)for(const v of face){const p=refPositions.get(key(v.p));if(p)maxPositionError=Math.max(maxPositionError,Math.hypot(...p.map((x,i)=>x-v.p[i])));}
  Object.assign(row,{minimumBestNormalDot:minDot,maximumNormalVectorError:maxError,maximumMatchedPositionErrorMetres:maxPositionError,unmatchedPositionVertices:unmatchedVertices});result.push(row);
 }
}
const sameSide=[];
for(const role of ['tyre','rim','liner'])for(const [front,rear]of [['FL','RL'],['FR','RR']]){
 const a=parts[front][role].geometry,b=parts[rear][role].geometry;
 const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
 sameSide.push({role,front,rear,indicesEqual:equal(a.index.array,b.index.array),attributesEqual:Object.fromEntries(Object.keys(a.attributes).map(k=>[k,equal(a.attributes[k].array,b.attributes[k].array)]))});
}
const report={source:'assets/vehicles/cybercab-rigged.glb',coordinateSystem:'GLB Y-up, forward -Z, wheel axle X',positionQuantizationMetres:1e-5,normalQuantization:1e-5,comparisons:result,sameSideRawArrays:sameSide,pivots:Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,v.centre.toArray()])),materials:all.map(o=>({node:o.name,name:o.material.name,side:o.material.side,transparent:o.material.transparent}))};
fs.writeFileSync('qc/cybercab-shared-prototype-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

