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
const helperSource=fs.readFileSync('npc-detailed-batches.js','utf8').replace("'./blender-vehicle.js'",JSON.stringify(url(runtime.slice(start,end)))).replace("'three/addons/utils/BufferGeometryUtils.js'",JSON.stringify(utils));
const {createDetailedTraffic}=await import(url(helperSource));
const bytes=fs.readFileSync('assets/vehicles/cybercab-meshy-traffic.glb');
const {scene:source}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
let sourceDisposals=0;const seen=new Set();source.traverse(o=>{if(o.isMesh)for(const resource of [o.geometry,o.material,...Object.values(o.material).filter(v=>v?.isTexture)])if(!seen.has(resource)){seen.add(resource);resource.addEventListener('dispose',()=>sourceDisposals++);}});
const helper=createDetailedTraffic(T,source,2);assert(helper.trianglesPerVehicle<=25000);assert(helper.meshes.length<=16);
const pose=(x,y,yaw)=>new T.Matrix4().makeTranslation(x,y,.12).multiply(new T.Matrix4().makeRotationZ(yaw));
const states=[[],[{matrix:pose(0,0,0),angle:0,steer:0}],[{matrix:pose(21,-17,.41),angle:Math.PI/2,steer:.35},{matrix:pose(-8,12,-.73),angle:1.13,steer:-.28}],[]];
let maxMatrixError=0;
for(const rows of states){
 helper.update(rows);assert(helper.meshes.every(m=>m.count===rows.length));
 rows.forEach((row,i)=>{
  const root=source.clone(true);root.rotation.x=Math.PI/2;const rig=bindVehicleWheelRig(T,root);rig.update(row.angle,row.steer);root.updateMatrixWorld(true);
  const parts=[];root.traverse(o=>{if(o.isMesh)parts.push(o)});assert.equal(parts.length,helper.meshes.length);
  parts.forEach((part,j)=>{const expected=row.matrix.clone().multiply(part.matrixWorld),actual=new T.Matrix4();helper.meshes[j].getMatrixAt(i,actual);const error=Math.max(...actual.elements.map((v,k)=>Math.abs(v-expected.elements[k])));maxMatrixError=Math.max(maxMatrixError,error);assert(error<2e-6);assert(actual.determinant()>0);assert.equal(helper.meshes[j].geometry,part.geometry)});
 });
}
helper.dispose();helper.dispose();assert.equal(sourceDisposals,0);
const mobile=createDetailedTraffic(T,source,1);mobile.update(states[1]);assert.throws(()=>mobile.update(states[2]));mobile.dispose();assert.equal(sourceDisposals,0);
const report={status:'PASS_CPU_HELPER',batches:helper.meshes.length,trianglesPerVehicle:helper.trianglesPerVehicle,desktopCapacity:2,mobileCapacity:1,maxInstanceMatrixError:maxMatrixError,positiveDeterminants:true,sourceResourceDisposals:sourceDisposals,limitation:'CPU matrix/geometry/disposal checks, no WebGL frame or performance claim.'};
fs.writeFileSync('qc/npc-detailed-batches-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
