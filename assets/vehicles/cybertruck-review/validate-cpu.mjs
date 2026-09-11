import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const T=await import('file:///D:/CodexTools/OSM2World/three.module.js'),url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const base='D:/CodexTools/OSM2World/',threeURL='file:///D:/CodexTools/OSM2World/three.module.js';
const utils=url(fs.readFileSync(base+'BufferGeometryUtils.js','utf8').replace("from 'three'",`from '${threeURL}'`));
const {GLTFLoader}=await import(url(fs.readFileSync(base+'GLTFLoader.js','utf8').replace("from 'three'",`from '${threeURL}'`).replace('../utils/BufferGeometryUtils.js',utils)));
const source=fs.readFileSync('blender-vehicle.js','utf8');
const {bindVehicleWheelRig}=await import(url(source.slice(source.indexOf('export function bindVehicleWheelRig'),source.indexOf('export function loadVehicleAsset'))));
const path=process.env.CYBERTRUCK_REVIEW_DIR||'assets/vehicles/cybertruck-review/',bytes=fs.readFileSync(path+'cybertruck-reference.glb'),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
const loader=new GLTFLoader();loader.register(()=>({name:'CPU_TEXTURE_PLACEHOLDER',loadTexture:()=>Promise.resolve(new T.Texture())}));
const {scene:root}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');root.rotation.x=Math.PI/2;root.updateWorldMatrix(true,true);
const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3()).toArray();
[2.4133,5.6829,1.7938].forEach((v,i)=>assert(Math.abs(size[i]-v)<1e-5));
const rig=bindVehicleWheelRig(T,root),centres=rig.wheels.map(w=>w.getWorldPosition(new T.Vector3()));
assert.equal(rig.wheels.length,4);assert(Math.abs(rig.wheelbase-3.635)<2e-6);assert(Math.abs(rig.track-1.777)<1e-6);assert(Math.abs(rig.wheelRadius-.43925)<1e-6);
const front=rig.wheels.filter(w=>w.name.includes('_F')),rear=rig.wheels.filter(w=>w.name.includes('_R'));assert(Math.abs(rear[0].getWorldPosition(new T.Vector3()).distanceTo(rear[1].getWorldPosition(new T.Vector3()))-1.772)<1e-6);
const wheelRadii=[];for(const w of rig.wheels){w.geometry.computeBoundingBox();const s=w.geometry.boundingBox.getSize(new T.Vector3());assert(Math.abs(s.y-s.z)<1e-6,'Tire circular section deformed');assert(Math.abs(s.y/2-.43925)<1e-6);wheelRadii.push(s.y/2);}
rig.update(Math.PI/2,.35);root.updateWorldMatrix(true,true);const drift=Math.max(...rig.wheels.map((w,i)=>w.getWorldPosition(new T.Vector3()).distanceTo(centres[i])));assert(drift<1e-6);
const angles=Object.fromEntries(rig.steering.map(s=>[s.tag,s.pivot.rotation.y]));assert(angles.FR<angles.FL&&angles.FL<0);assert.equal(angles.RL,0);assert.equal(angles.RR,0);
rig.update(0,0);root.updateWorldMatrix(true,true);const reset=Math.max(...rig.wheels.map(w=>w.quaternion.angleTo(new T.Quaternion())));assert(reset<1e-6);
const body=root.getObjectByName('Stainless_wedge_body');assert(body);assert.equal(body.material.name,'BodyPaint');assert.equal(root.getObjectByName('Angular_armored_canopy').material.name,'Glass');assert(rig.wheels.every(w=>w.material.name==='RubberTrim'));
body.material.side=T.DoubleSide;const ray=new T.Raycaster(),hits=[];
// Actual triangle intersections through the shell at each tire's circular edge.
// This detects arches deformed into tires without rendering or a Blender job.
for(const tag of ['FL','RL']){const w=rig.wheels.find(w=>w.name==='Wheel_'+tag),c=w.getWorldPosition(new T.Vector3());for(let i=0;i<72;i++){const a=i*Math.PI/36,y=c.y+Math.sin(a)*.438,z=c.z+Math.cos(a)*.438;ray.set(new T.Vector3(-2,y,z),new T.Vector3(1,0,0));if(ray.intersectObject(body,false).some(h=>Math.abs(h.point.x)>.7))hits.push({tag,angle:a,y,z});}}
assert.equal(hits.length,0,'Body intersects tire envelope');
const lamp=json.materials.find(m=>m.name==='Lamps');assert(lamp.emissiveTexture);assert(lamp.pbrMetallicRoughness.baseColorTexture);assert.equal(json.materials.length,4);
let regressionChecks;
if(path.includes('revision2')){
 const covers=[];for(const w of rig.wheels){const tag=w.name.slice(-2),sign=tag[1]==='L'?-1:1,c=w.getWorldPosition(new T.Vector3()),cover=root.getObjectByName('AeroCover_'+tag);assert(cover);const box=new T.Box3().setFromObject(cover),tireBox=new T.Box3().setFromObject(w,false);w.geometry.computeBoundingBox();const tire=w.geometry.boundingBox.clone().applyMatrix4(w.matrixWorld);const outside=sign>0?box.max.x-tire.max.x:tire.min.x-box.min.x;assert(outside>.005,'Cover hidden inside tire sidewall');covers.push({tag,outsideSidewall:outside});}
 const bed=new T.Box3().setFromObject(root.getObjectByName('Bed_liner')),clearance=bed.min.z-.8785;assert(clearance>.02,'Bed floor intersects rear tire');assert(Math.abs(bed.max.z-bed.min.z-.045)<1e-5,'Bed floor no longer flat');regressionChecks={covers,bedTireVerticalClearance:clearance,bedThickness:bed.max.z-bed.min.z};
}
const triangles=json.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+json.accessors[p.indices].count/3,0);
const report={status:'PASS_CPU_ONLY',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),triangles,materials:json.materials.length,size,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},wheelbaseMeasuredLeftCenters:rig.wheelbase,wheelbaseLongitudinal:centres[0].y-centres[2].y,frontTrack:rig.track,rearTrack:1.772,wheelRadii,pivotDrift:drift,resetError:reset,steerAngles:angles,archRaySamples:144,archTireIntersections:hits,paintGlassRubberIsolation:true,lampEmissiveTexture:true,limitation:'CPU texture placeholders; no visual lamp-color/material acceptance. Left center distance includes 2.5mm front/rear lateral offset, longitudinal wheelbase is3.635m.'};
if(regressionChecks)report.visualRegressionCPUChecks=regressionChecks;
fs.writeFileSync(path+'cpu-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
