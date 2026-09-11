import assert from 'node:assert/strict';import fs from 'node:fs';
import {createStairCollision} from './vidhana-architecture-stair-collision.js';
import {buildRoadGraph} from '../auto-roads.js';
const a=JSON.parse(fs.readFileSync('qc/vidhana-architecture-scene-ground.json')).architecture,s=a.stairPlacement,block=createStairCollision(a,{halfLength:0}),standard=createStairCollision(a),xy=(u,v)=>[(s.centerAlong+u)*s.tangent[0]+v*s.outward[0],(s.centerAlong+u)*s.tangent[1]+v*s.outward[1]],heading=Math.atan2(-s.outward[0],-s.outward[1])*180/Math.PI;
const foot=xy(0,s.bottomV),front=block.collide(...xy(0,s.bottomV+.5),heading);assert(front);assert(front.x*s.outward[0]+front.y*s.outward[1]>.99);
assert.equal(block.collide(...xy(0,s.bottomV+1),heading),null);
for(const t of [.01,.25,.5,.75,.99]){const v=s.bottomV-(s.bottomV-s.topV)*t,half=(a.stairWidth+(s.topWidth-a.stairWidth)*t)/2;assert(block.collide(...xy(0,v),heading));assert.equal(block.collide(...xy(half+3,v),heading),null);assert.equal(block.collide(...xy(-half-3,v),heading),null);}
// A rectangular bounding box would incorrectly block these side paths.
assert.equal(block.collide(...xy(a.stairWidth/2-2,s.topV+1),heading),null);
assert.equal(block.collide(...xy(0,(s.topV+s.landingRearV)/2),heading),null);
for(const edge of block.footprint){const n=block.collide(...edge,heading);assert(n);assert(Number.isFinite(n.x)&&Number.isFinite(n.y));assert(Math.abs(Math.hypot(n.x,n.y)-1)<1e-8);}
// Ground traffic corridors are left unobstructed; sample only nearby road graph.
const graph=buildRoadGraph(JSON.parse(fs.readFileSync('vidhana-road-network.json')));let nearby=0,blocked=0;for(const e of graph.edges){const p=graph.nodes[e.a].p,q=graph.nodes[e.b].p;for(let t=0;t<=1;t+=.1){const x=p[0]+(q[0]-p[0])*t,y=p[1]+(q[1]-p[1])*t;if(Math.hypot(x-foot[0],y-foot[1])>120)continue;nearby++;if(standard.collide(x,y,Math.atan2(q[0]-p[0],q[1]-p[1])*180/Math.PI))blocked++;}}
assert.equal(blocked,0);assert(nearby>0);assert.equal(block.collide(NaN,0,0),null);assert.throws(()=>createStairCollision({...a,stairWidth:-1}));
const results={passed:true,footprintVertices:block.footprint.length,adjacentPathsClear:true,landingRoutePreserved:true,contactNormalsUnit:true,nearbyRoadSamples:nearby,blockedRoadSamples:blocked};fs.writeFileSync('qc/vidhana-architecture-stair-collision-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
