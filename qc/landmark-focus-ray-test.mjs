import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {buildLandmarks} from './vidhana-architecture-integration-candidate.js';
import {buildFocusTargets,findFocusTarget} from './landmark-focus-candidate.js';
const T=await import('data:text/javascript;base64,'+fs.readFileSync('D:/CodexTools/OSM2World/three.module.js').toString('base64'));
const data=JSON.parse(fs.readFileSync('district-data.json')),landmarks=JSON.parse(fs.readFileSync('landmark-data.json'));
const xy=p=>[(p[0]-77.5945)*111320*Math.cos(12.9755*Math.PI/180),(p[1]-12.9755)*111320];
const inside=(p,ring)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const inPoly=(p,rings)=>inside(p,rings[0])&&!rings.slice(1).some(r=>inside(p,r));
const area=ring=>Math.abs(ring.reduce((sum,a,i)=>{const b=ring[(i+1)%ring.length];return sum+a[0]*b[1]-b[0]*a[1];},0)/2);
const features=[...data.features.filter(f=>f.properties._layer==='building'),...landmarks.features];
const landmarkRings=landmarks.features.map(f=>f.geometry.coordinates[0].map(xy));
const visible=new Set(features.filter(f=>{if(landmarks.features.includes(f))return true;const r=f.geometry.coordinates[0].map(xy),xs=r.map(p=>p[0]),ys=r.map(p=>p[1]);return !landmarkRings.some(ring=>inside([(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],ring));}));
const model=buildLandmarks(T,landmarks,xy),targets=buildFocusTargets(features,xy,model,visible);
model.group.updateMatrixWorld(true);
const center=model.architecture.domeUpdate.mappedCenter,s=model.architecture.stairPlacement;
const stairAt=(fraction,z)=>new T.Vector3(s.centerAlong*s.tangent[0]+(s.topV+(s.bottomV-s.topV)*fraction)*s.outward[0],s.centerAlong*s.tangent[1]+(s.topV+(s.bottomV-s.topV)*fraction)*s.outward[1],z);
const cases=[{name:'crown-top',origin:new T.Vector3(...center,70),direction:new T.Vector3(0,0,-1),expected:'way/371511885'},
 {name:'crown-side',origin:new T.Vector3(center[0]+s.outward[0]*50,center[1]+s.outward[1]*50,34),direction:new T.Vector3(-s.outward[0],-s.outward[1],0),expected:'way/371511885'},
 ...[.2,.5,.8].map(f=>({name:'stairs-'+f,origin:stairAt(f,25),direction:new T.Vector3(0,0,-1),expected:'vidhana-front-stairs'}))];
const results=[];
for(const test of cases){const hits=new T.Raycaster(test.origin,test.direction).intersectObject(model.group,true);assert(hits.length,test.name+' hits real geometry');const hit=hits[0],target=findFocusTarget(targets,[hit.point.x,hit.point.y],hit.point.z,inPoly,area);assert(target,test.name+' resolves displayed target');assert.equal(target.properties?.osm_id||target.id,test.expected,test.name);results.push({name:test.name,hit:hit.point.toArray(),faceIndex:hit.faceIndex,target:target.id,sourceId:target.properties?.osm_id,displayHeight:target.height});}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.writeFileSync('qc/landmark-focus-ray-results.json',JSON.stringify({passed:true,scope:'CPU Three.js raycaster against actual emitted landmark triangles; browser camera and dwell not covered',modelSha256:hash('qc/vidhana-architecture-integration-candidate.js'),helperSha256:hash('qc/landmark-focus-candidate.js'),results},null,2));
console.log(JSON.stringify({passed:true,results}));
