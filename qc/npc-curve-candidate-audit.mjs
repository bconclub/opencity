import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {buildRoadGraph,toLocal,angleGap} from '../auto-roads.js';
import {retainTrafficLoops,applyTrafficDirections,routeState,advanceTrafficRoute,clonePath,tickTraffic,mappedControls,trafficSpawnSafe,vehicleContact} from './npc-curve-candidate.mjs';
const root=new URL('../',import.meta.url), read=p=>fs.readFileSync(new URL(p,root));
globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(read(path))});
const {loadDrivingData}=await import('../driving-data.js'),source=await loadDrivingData();
const data={...source,features:source.features.filter(f=>f.properties?.osm)};
const controls=mappedControls(JSON.parse(read('assets/streets/furniture.json')).items);
function setup(limit){
 const graph=retainTrafficLoops(applyTrafficDirections(buildRoadGraph({...data,features:data.features.filter(f=>f.geometry.type==='LineString'&&f.geometry.coordinates.every(p=>{const q=toLocal(p);return(q[0]/900)**2+(q[1]/930)**2<1;}))}),data));
 const edges=graph.edges.map((e,i)=>({e,i})).filter(({e,i})=>graph.connected.has(e.a)&&graph.nodes[e.a].edges.includes(i)&&e.length>30),cars=[];
 for(let i=0;i<edges.length*8&&cars.length<limit;i++){
  const {e,i:edge}=edges[(i*37)%edges.length],from=graph.trafficDirections.has(edge+':'+e.a)?e.a:e.b,to=from===e.a?e.b:e.a,path={edge,from,to,progress:e.length*(.1+(i%8)*.1),ended:false},p=routeState(graph,path),car={id:i,path,x:p.point[0],y:p.point[1],heading:p.heading,speed:0,cruise:4+i%4};
  if(trafficSpawnSafe(graph,car)&&!cars.some(other=>vehicleContact(car,other,5)))cars.push(car);
 }
 return {graph,cars};
}
function run(limit,blocked,phase=0,dt=.05){
 const {graph,cars}=setup(limit),seconds=600,result={limit,blocked,phase,dt,spawned:cars.length,seconds,overlapFrames:0,playerOverlapFrames:0,illegalDirections:0,endedFrames:0,maxHeadingStep:0,maxEdge511HeadingStep:0,edge511MaxSpeed:0,headingJumps:[],windows:[],blocker:null};
 let player=null,target=null,targetAtRelease=0,lastWindow=cars.map(()=>0);
 for(let i=0;i<seconds/dt;i++){
  const time=i*dt;
  if(blocked&&i===Math.round(30/dt)){
   for(const c of cars){const path=clonePath(c.path);advanceTrafficRoute(graph,path,15);const p=routeState(graph,path),candidate={x:p.point[0],y:p.point[1],heading:p.heading+90,length:5.7,width:2.1};
    if(trafficSpawnSafe(graph,candidate)&&cars.every(o=>!vehicleContact(candidate,o,.8))){player=candidate;target=c;result.blocker={...player,targetId:c.id,start:time,release:90,targetMovedAtStart:c.totalMoved};break;}
   }
  }
  if(blocked&&i===Math.round(90/dt)){if(target)targetAtRelease=target.totalMoved;player=null;}
  const headings=cars.map(c=>c.heading);tickTraffic(graph,cars,controls,dt,time+phase,player);
  if(target&&time>=90&&target.totalMoved-targetAtRelease>.05&&result.blocker.resumeDelay===undefined)result.blocker.resumeDelay=time-90;
  if(blocked&&time>=30&&time<90&&target&&target.speed<.1)result.blocker.stoppedFrames=(result.blocker.stoppedFrames||0)+1;
  for(let a=0;a<cars.length;a++){
   const c=cars[a],gap=Math.abs(angleGap(c.heading,headings[a]));if(gap>result.maxHeadingStep){result.maxHeadingStep=gap;result.maxHeadingDetail={time,id:c.id,speed:c.speed,edge:c.path.edge,turn:!!c.path.turn,x:c.x,y:c.y};}
   if(gap>25&&result.headingJumps.length<30)result.headingJumps.push({time,id:c.id,gap,speed:c.speed,edge:c.path.edge,x:c.x,y:c.y});
   if(c.path.edge===511&&c.path.turn){result.maxEdge511HeadingStep=Math.max(result.maxEdge511HeadingStep,gap);result.edge511MaxSpeed=Math.max(result.edge511MaxSpeed,c.speed);}
   const e=graph.edges[c.path.edge];if(e.allowedFrom!==undefined&&e.allowedFrom!==c.path.from)result.illegalDirections++;
   if(c.path.ended)result.endedFrames++;if(player&&vehicleContact(c,player))result.playerOverlapFrames++;
   for(let b=a+1;b<cars.length;b++)if(vehicleContact(c,cars[b]))result.overlapFrames++;
  }
  if(i%Math.round(60/dt)===Math.round(60/dt)-1){result.windows.push({end:time+dt,progress:cars.map((c,j)=>{const delta=c.totalMoved-lastWindow[j];lastWindow[j]=c.totalMoved;return {id:c.id,metres:delta};})});}
 }
 result.cars=cars.map(c=>({id:c.id,totalMoved:c.totalMoved,maxWait:c.maxWait,waitTime:c.waitTime,speed:c.speed,ended:c.path.ended,stopped:c.stopped,blocked:c.reservationBlocked,edge:c.path.edge,x:c.x,y:c.y}));
 if(target)result.blocker.targetMovementAfterRelease=target.totalMoved-targetAtRelease;
 return result;
}
const report={created:new Date().toISOString(),sourceHashes:Object.fromEntries(['qc/npc-curve-candidate.mjs','qc/npc-curve-baseline.mjs','npc-traffic.js','auto-roads.js','driving-data.js','district-data.json','vidhana-road-network.json','assets/streets/furniture.json'].map(p=>[p,crypto.createHash('sha256').update(read(p)).digest('hex')])),sourceFeatureCount:source.features.length,verifiedFeatureCount:data.features.length,scenarios:[]};
for(const [limit,blocked,phase,dt] of [[20,false,0,.05],[8,false,0,.05],[20,true,0,.05],[8,true,0,.05],[20,true,23,.1],[8,true,23,.1]]){
 const result=run(limit,blocked,phase,dt);report.scenarios.push(result);fs.writeFileSync(new URL('qc/npc-curve-candidate-audit.json',root),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({limit,blocked,overlaps:result.overlapFrames,playerOverlaps:result.playerOverlapFrames,maxHeadingStep:result.maxHeadingStep,maxWait:Math.max(...result.cars.map(c=>c.maxWait)),minMovement:Math.min(...result.cars.map(c=>c.totalMoved)),stuck:result.cars.filter(c=>c.waitTime>90),blocker:result.blocker}));
}
for(const s of report.scenarios){
 assert.equal(s.spawned,s.limit);assert.equal(s.overlapFrames,0);assert.equal(s.playerOverlapFrames,0);assert.equal(s.illegalDirections,0);assert.equal(s.endedFrames,0);
 assert.ok(s.maxHeadingStep<45,'No near-instant reversal');assert.ok(s.cars.every(c=>c.totalMoved>300&&c.maxWait<90),'Every NPC progresses without starvation');
 if(s.blocked){assert.ok(s.blocker?.stoppedFrames>10,'Player obstruction exercised');assert.ok(s.blocker.resumeDelay<30,'Queue resumes after player leaves');assert.ok(s.blocker.targetMovementAfterRelease>300);}
}
report.passed=true;fs.writeFileSync(new URL('qc/npc-curve-candidate-audit.json',root),JSON.stringify(report,null,2)+'\n');
