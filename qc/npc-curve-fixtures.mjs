import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildRoadGraph,toLocal,angleGap} from '../auto-roads.js';
import * as baseline from './npc-curve-baseline.mjs';
import * as candidate from '../traffic-simulation.js';
const root=new URL('../',import.meta.url);
globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL(path,root)))});
const {loadDrivingData}=await import('../driving-data.js'),merged=await loadDrivingData(),data={...merged,features:merged.features.filter(f=>f.properties?.osm)};
function actual(){return baseline.retainTrafficLoops(baseline.applyTrafficDirections(buildRoadGraph({...data,features:data.features.filter(f=>f.properties?.osm&&f.geometry.type==='LineString'&&f.geometry.coordinates.every(p=>{const q=toLocal(p);return(q[0]/900)**2+(q[1]/930)**2<1;}))}),data));}
function approach(api,dt){
 // Visiting285 earlier makes the actual route selector choose legal edge195.
 // This recreates the hard branch observed in the full production soak;
 // the unvisited straight branch is deliberately not used as the test bend.
 const graph=actual(),path={edge:391,from:291,to:387,progress:0,ended:false,visits:{285:10}},state=api.routeState(graph,path),car={id:1,path,x:state.point[0],y:state.point[1],heading:state.heading,speed:7,cruise:7};
 const result={dt,routeEdges:[],samples:[],maxHeadingRate:0,maxLateralEstimate:0,maxAcceleration:0,maxDeceleration:0};let previousEdge=-1;
 for(let i=0;i<20/dt;i++){
  const speed=car.speed,heading=car.heading,moved=car.totalMoved||0,before=JSON.stringify(car.path);
  if(api.npcCurveSpeed){const cap=api.npcCurveSpeed(graph,car);assert.equal(JSON.stringify(car.path),before,'Curve preview must not mutate real route');if(i===0)result.initialTarget=cap;}
  api.tickTraffic(graph,[car],[],dt,i*dt,null);
  const yaw=Math.abs(angleGap(car.heading,heading))*Math.PI/180/dt,acc=(car.speed-speed)/dt;
  result.maxAcceleration=Math.max(result.maxAcceleration,acc);result.maxDeceleration=Math.max(result.maxDeceleration,-acc);
  assert.ok(acc<=1.800001&&acc>=-4.000001,'Existing acceleration/deceleration preserved without speed snap');
  if(car.path.edge!==previousEdge){result.routeEdges.push(car.path.edge);previousEdge=car.path.edge;}
  if(car.path.edge===511&&car.path.turn){
   assert.equal(car.path.turn.next.edge,195,'Exercise the observed hard branch, not straight edge285');
   if(!result.bendEntry)result.bendEntry={time:i*dt,speed:car.speed,heading:car.heading};
   result.maxHeadingRate=Math.max(result.maxHeadingRate,yaw*180/Math.PI);result.maxLateralEstimate=Math.max(result.maxLateralEstimate,yaw*(car.speed+speed)/2);
  }
  result.samples.push({time:i*dt,edge:car.path.edge,turn:!!car.path.turn,speed:car.speed,moved:car.totalMoved||moved});
 }
 assert.ok(result.bendEntry,'Actual edge511 bend must be exercised');return result;
}
const report={baseline:[],candidate:[],checks:[]};
for(const dt of [.05,.1]){const b=approach(baseline,dt),c=approach(candidate,dt);report.baseline.push(b);report.candidate.push(c);assert.ok(c.bendEntry.speed<3&&b.bendEntry.speed>6.9,'Candidate brakes before offending bend');assert.ok(c.maxHeadingRate<b.maxHeadingRate*.4,'Strong heading-rate reduction');assert.ok(c.maxLateralEstimate<3,'Curvature preview keeps sampled lateral estimate near2.5 tuning');}
const straight={nodes:[{p:[0,0],edges:[0]},{p:[0,100],edges:[0]}],edges:[{a:0,b:1,length:100,width:7}],connected:new Set([0,1])};
assert.equal(candidate.npcCurveSpeed(straight,{path:{edge:0,from:0,to:1,progress:10},cruise:7,speed:7}),7,'Straight route cruise unchanged');
for(const zero of [false,true]){
 const c={a:[-1.45,20],b:[-1.45,zero?20:25],c:[-1.45,zero?20:30],at:0,length:zero?0:10,samples:Array.from({length:25},(_,i)=>zero?0:i*10/24),next:{edge:0,from:0,to:1,progress:zero?20:30}};
 const graph={...straight},car={path:{edge:0,from:0,to:1,progress:20,turn:c},cruise:7,speed:7};
 assert.equal(candidate.npcCurveSpeed(graph,car),7,'Collinear and zero-length degenerate curves give finite straight cruise');
}
{
 const graph=actual(),path={edge:511,from:387,to:202,progress:0,visits:{285:10}},car={path,cruise:7,speed:7};
 baseline.advanceTrafficRoute(graph,path,3.39);assert.ok(path.turn&&path.turn.next.edge===195);
 const snapshot=JSON.stringify(path),first=candidate.npcCurveSpeed(graph,car);
 assert.ok(first<2,'Hard curve has tight cap');car.cruise=1;assert.equal(candidate.npcCurveSpeed(graph,car),1,'Curve cache must not cache another vehicle cruise');
 car.cruise=7;assert.equal(candidate.npcCurveSpeed(graph,car),first,'Same fixed graph and directed edge pair reuses identical cap');
 assert.equal(candidate.npcCurveSpeed(actual(),car),first,'New graph with same geometry computes same cap independently');
 assert.equal(JSON.stringify(path),snapshot,'Cached and uncached previews preserve all path fields');
}
report.graphSource={loader:'loadDrivingData then verified OSM filter',mergedFeatures:merged.features.length,verifiedFeatures:data.features.length,offendingEdge:actual().edges[511]};
report.checks=['Merged production data loader and verified filter','Real edge391 approach to edge511','Brakes before tight bend','No speed snap','Route preview immutable','Straight cruise unchanged','Collinear and zero-length curve handling','Fixed-geometry cache independent of cruise','Six-scenario collision/queue suite separately passed'];report.passed=true;
fs.writeFileSync(new URL('npc-curve-integrated-fixtures.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,baseline:report.baseline.map(({dt,bendEntry,maxHeadingRate,maxLateralEstimate})=>({dt,bendEntry,maxHeadingRate,maxLateralEstimate})),candidate:report.candidate.map(({dt,initialTarget,bendEntry,maxHeadingRate,maxLateralEstimate,maxDeceleration})=>({dt,initialTarget,bendEntry,maxHeadingRate,maxLateralEstimate,maxDeceleration}))},null,2));
