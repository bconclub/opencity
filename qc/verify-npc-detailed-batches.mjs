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
const helperSource=fs.readFileSync('qc/npc-detailed-batches.js','utf8').replace("'./blender-vehicle.js'",JSON.stringify(url(runtime.slice(start,end)))).replace("'three/addons/utils/BufferGeometryUtils.js'",JSON.stringify(utils));
const {createDetailedTraffic}=await import(url(helperSource));
const bytes=fs.readFileSync('assets/vehicles/cybercab-rigged.glb');
const {scene:source}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
let sourceDisposals=0;const seen=new Set();source.traverse(o=>{if(o.isMesh)for(const resource of [o.geometry,o.material,...Object.values(o.material).filter(v=>v?.isTexture)])if(!seen.has(resource)){seen.add(resource);resource.addEventListener('dispose',()=>sourceDisposals++);}});
const helper=createDetailedTraffic(T,source,2);assert.equal(helper.trianglesPerVehicle,24667);assert.equal(helper.meshes.length,5);
assert.equal(new Set(helper.meshes.map(m=>m.material)).size,3);
assert.deepEqual(Array.from(helper.meshes[2].geometry.attributes.position.array),Array.from(source.getObjectByName('Wheel_FL').geometry.attributes.position.array));
assert.deepEqual(Array.from(helper.meshes[3].geometry.attributes.normal.array),Array.from(source.getObjectByName('Wheel_FR').geometry.attributes.normal.array));
const pose=(x,y,yaw)=>new T.Matrix4().makeTranslation(x,y,.12).multiply(new T.Matrix4().makeRotationZ(yaw));
const states=[[],[{matrix:pose(0,0,0),angle:0,steer:0}],[{matrix:pose(21,-17,.41),angle:Math.PI/2,steer:.35},{matrix:pose(-8,12,-.73),angle:1.13,steer:-.28}],[]];
let maxMatrixError=0;
for(const rows of states){
 helper.update(rows);assert.deepEqual(helper.meshes.map(m=>m.count),[rows.length,rows.length,2*rows.length,2*rows.length,4*rows.length]);
 for(let i=0;i<rows.length;i++){
  const carrier=new T.Group();carrier.rotation.x=Math.PI/2;carrier.add(source.clone(true));carrier.updateMatrixWorld(true);
  const rig=bindVehicleWheelRig(T,carrier);rig.update(rows[i].angle,rows[i].steer);carrier.updateMatrixWorld(true);
  const compare=(batch,slot,expected)=>{const actual=new T.Matrix4();helper.meshes[batch].getMatrixAt(slot,actual);const error=Math.max(...actual.elements.map((v,k)=>Math.abs(v-expected.elements[k])));maxMatrixError=Math.max(maxMatrixError,error);assert(error<2e-6);assert(actual.determinant()>0);};
  const fixed=rows[i].matrix.clone().multiply(new T.Matrix4().makeRotationX(Math.PI/2));compare(0,i,fixed);compare(1,i,fixed);
  for(const [j,tag]of ['FL','FR','RL','RR'].entries()){
   const expected=rows[i].matrix.clone().multiply(carrier.getObjectByName('Wheel_'+tag).matrixWorld);
   compare(tag[1]==='L'?2:3,i*2+(tag[0]==='F'?0:1),expected);
   if(tag[1]==='L')expected.multiply(new T.Matrix4().makeRotationY(Math.PI));compare(4,i*4+j,expected);
  }
 }
}
helper.dispose();helper.dispose();assert.equal(sourceDisposals,0);
const mobile=createDetailedTraffic(T,source,1);mobile.update(states[1]);assert.throws(()=>mobile.update(states[2]));mobile.dispose();assert.equal(sourceDisposals,0);
const report={status:'PASS_CPU_HELPER',batches:5,materials:3,trianglesPerVehicle:24667,desktopCapacity:2,mobileCapacity:1,statesTested:['empty','rest','two independently posed/steered/spinning cars','empty reset'],maxInstanceMatrixError:maxMatrixError,positiveDeterminants:true,sourceResourceDisposals:sourceDisposals,sourceTyreAttributesUnchanged:true,limitation:'CPU matrix/geometry/disposal checks, no WebGL frame or performance claim.'};
fs.writeFileSync('qc/npc-detailed-batches-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

