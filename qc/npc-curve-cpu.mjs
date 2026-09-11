import fs from 'node:fs';
import {buildRoadGraph,toLocal} from '../auto-roads.js';
import * as baseline from './npc-curve-baseline.mjs';
import * as candidate from '../traffic-simulation.js';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root))),data=read('vidhana-road-network.json'),controls=baseline.mappedControls(read('assets/streets/furniture.json').items);
function setup(){
 const graph=baseline.retainTrafficLoops(baseline.applyTrafficDirections(buildRoadGraph({...data,features:data.features.filter(f=>f.properties?.osm&&f.geometry.type==='LineString'&&f.geometry.coordinates.every(p=>{const q=toLocal(p);return(q[0]/900)**2+(q[1]/930)**2<1;}))}),data));
 const edges=graph.edges.map((e,i)=>({e,i})).filter(({e,i})=>graph.connected.has(e.a)&&graph.nodes[e.a].edges.includes(i)&&e.length>30),cars=[];
 for(let i=0;i<edges.length*8&&cars.length<20;i++){const {e,i:edge}=edges[(i*37)%edges.length],from=graph.trafficDirections.has(edge+':'+e.a)?e.a:e.b,to=from===e.a?e.b:e.a,path={edge,from,to,progress:e.length*(.1+(i%8)*.1),ended:false},p=baseline.routeState(graph,path),c={id:i,path,x:p.point[0],y:p.point[1],heading:p.heading,speed:0,cruise:4+i%4};if(baseline.trafficSpawnSafe(graph,c)&&!cars.some(o=>baseline.vehicleContact(c,o,5)))cars.push(c);}
 return {graph,cars};
}
function sample(name){const api=name==='baseline'?baseline:candidate,{graph,cars}=setup(),times=[];
 for(let i=0;i<1600;i++){const start=performance.now();api.tickTraffic(graph,cars,controls,.05,i*.05,null);if(i>=200)times.push(performance.now()-start);}
 times.sort((a,b)=>a-b);return {name,ticks:times.length,meanMs:times.reduce((a,b)=>a+b,0)/times.length,medianMs:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)]};
}
const runs=[];for(const name of ['baseline','candidate','candidate','baseline','baseline','candidate']){runs.push(sample(name));console.log(JSON.stringify(runs.at(-1)));}
const group=name=>{const r=runs.filter(x=>x.name===name);return {meanMs:r.reduce((n,x)=>n+x.meanMs,0)/r.length,meanMedianMs:r.reduce((n,x)=>n+x.medianMs,0)/r.length,meanP95Ms:r.reduce((n,x)=>n+x.p95Ms,0)/r.length};};
const b=group('baseline'),c=group('candidate'),report={created:new Date().toISOString(),description:'Alternating CPU-only runs,20 NPCs,200 warmup ticks then1400 measured ticks. Actual baseline/candidate motion differs after curve braking. Not a GPU frame-time benchmark.',runs,baseline:b,candidate:c,meanDeltaMs:c.meanMs-b.meanMs,meanDeltaPercent:(c.meanMs/b.meanMs-1)*100};
fs.writeFileSync(new URL('npc-curve-cpu.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
