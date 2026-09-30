import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {buildRoadGraph,toLocal,toLngLat} from '../auto-roads.js';
import {createDrivingWorld} from '../auto-world.js';
import {createStairCollision} from './vidhana-architecture-stair-collision.js';
import {withVidhanaStairCollision} from './vidhana-driving-world-candidate.js';
const inputFile=process.argv[2]||'qc/vidhana-architecture-scene-ground.json',input=JSON.parse(fs.readFileSync(inputFile)),a=input.architecture||input,s=a.stairPlacement;
const district=JSON.parse(fs.readFileSync('district-data.json')),roads=JSON.parse(fs.readFileSync('vidhana-road-network.json')),graph=buildRoadGraph(roads),base=createDrivingWorld(district,graph),combined=withVidhanaStairCollision(base,a),stairs=createStairCollision(a),landing=createStairCollision(a,{includeLanding:true});
const point=(u,v)=>[(s.centerAlong+u)*s.tangent[0]+v*s.outward[0],(s.centerAlong+u)*s.tangent[1]+v*s.outward[1]],foot=point(0,s.bottomV),heading=Math.atan2(-s.outward[0],-s.outward[1])*180/Math.PI;
assert.equal(combined.onRoad,base.onRoad);assert.deepEqual(toLocal([77.5945,12.9755]),[0,0]);for(const p of stairs.footprint){const q=toLocal(toLngLat(p));assert(Math.hypot(q[0]-p[0],q[1]-p[1])<1e-7);}
let samples=0,nearby=0,runBlocks=0,landingBlocks=0,baseBlocks=0,newBlocks=0;const blockedLandingEdges=new Set();
for(const [id,e]of graph.edges.entries()){
 const p=graph.nodes[e.a].p,q=graph.nodes[e.b].p,steps=Math.max(1,Math.ceil(e.length/.5)),h=Math.atan2(q[0]-p[0],q[1]-p[1])*180/Math.PI;
 for(let n=0;n<=steps;n++){const t=n/steps,x=p[0]+(q[0]-p[0])*t,y=p[1]+(q[1]-p[1])*t;samples++;if(Math.hypot(x-foot[0],y-foot[1])<=120)nearby++;const b=base.collide(x,y,h),c=combined.collide(x,y,h);if(b){baseBlocks++;assert.deepEqual(c,b);}if(!b&&c)newBlocks++;if(stairs.collide(x,y,h))runBlocks++;if(landing.collide(x,y,h)){landingBlocks++;blockedLandingEdges.add(id);}}
}
assert.equal(runBlocks,0);assert.equal(newBlocks,0);assert(landingBlocks>0);
const normals=[];for(const u of [-a.stairWidth*.2,0,a.stairWidth*.2]){const p=point(u,s.bottomV+.2),hit=stairs.collide(...p,heading);assert(hit);assert(Math.abs(Math.hypot(hit.x,hit.y)-1)<1e-7);normals.push(hit);}
const landingPoint=point(0,(s.topV+s.landingRearV)/2);assert.equal(stairs.collide(...landingPoint,heading),null);
// Existing boundary/building contacts take precedence verbatim. A new stair
// collider must not replace or filter any established world obstacle.
let delegated=0;const sentinel={x:0,y:1},mock={onRoad:()=>true,collide(){delegated++;return sentinel;}},wrapped=withVidhanaStairCollision(mock,a);assert.equal(wrapped.collide(...foot,heading),sentinel);assert.equal(delegated,1);assert.equal(wrapped.onRoad,mock.onRoad);
const output={passed:true,scope:'CPU centreline samples at <=0.5m; no road-width/visual/GPU claim',origin:[77.5945,12.9755],metresPerDegree:111320,longitudeScale:Math.cos(12.9755*Math.PI/180),metadataFile:inputFile,metadataSha256:crypto.createHash('sha256').update(fs.readFileSync(inputFile)).digest('hex'),architectureSourceSha256:crypto.createHash('sha256').update(fs.readFileSync('qc/vidhana-architecture-candidate.js')).digest('hex'),roadFeatures:roads.features.length,graphEdges:graph.edges.length,centrelineSamples:samples,nearbySamples:nearby,stairRunBlockedSamples:runBlocks,existingWorldBlockedSamples:baseBlocks,newlyBlockedSamples:newBlocks,fullLandingBlockedSamples:landingBlocks,fullLandingBlockedEdges:[...blockedLandingEdges],stairFootLngLat:toLngLat(foot),landingPointLngLat:toLngLat(landingPoint),normalSamples:normals,landingNotAddedAsCollider:true,existingCollisionPrecedencePreserved:true};fs.writeFileSync('qc/vidhana-driving-world-results.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output));
