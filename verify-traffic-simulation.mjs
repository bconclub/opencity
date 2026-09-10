import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRoadGraph,toLocal} from './auto-roads.js';
import {advanceTrafficRoute,routeState,tickTraffic,vehicleContact,signalPhase,retainTrafficLoops,mappedControls,applyTrafficDirections,trafficSpawnSafe} from './traffic-simulation.js';
import {advanceCar,createCar} from './auto-physics.js';
function graph(points,pairs){const nodes=points.map(p=>({p,edges:[]})),edges=pairs.map(([a,b],i)=>{nodes[a].edges.push(i);nodes[b].edges.push(i);return {a,b,length:Math.hypot(points[a][0]-points[b][0],points[a][1]-points[b][1]),width:7};});return {nodes,edges,connected:new Set(nodes.map((_,i)=>i))};}
const square=graph([[0,0],[0,100],[100,100],[100,0]],[[0,1],[1,2],[2,3],[3,0]]);
const path=progress=>({edge:0,from:0,to:1,progress,ended:false});
let p=path(0),last=routeState(square,p),turnSamples=0;
for(let i=0;i<4500;i++){const next=advanceTrafficRoute(square,p,.1),dh=Math.abs(((next.heading-last.heading+540)%360)-180);assert.ok(dh<4,'No abrupt turning or U-turn');assert.ok(Math.hypot(next.point[0]-last.point[0],next.point[1]-last.point[1])<.13,'No position jump at turn seam');if(dh>.01)turnSamples++;last=next;}
assert.ok(turnSamples>100,'Curves must actually turn');assert.equal(p.ended,false,'Loop keeps circulating');
const dead=graph([[0,0],[0,30]],[[0,1]]),terminal=path(0);advanceTrafficRoute(dead,terminal,100);assert.equal(terminal.ended,true);assert.equal(terminal.from,0);assert.equal(terminal.to,1);assert.equal(terminal.progress,27,'Stops before dead end, never reverses instantly');
const car=progress=>{const p=path(progress),state=routeState(square,p);return {path:p,x:state.point[0],y:state.point[1],heading:state.heading,speed:0,cruise:7};};
const signal={id:'mapped-test',kind:'signal',point:[-1.45,50],heading:0};assert.equal(signalPhase(signal,25),'red');assert.equal(signalPhase(signal,1),'green');assert.equal(signalPhase({...signal,heading:90},1),'red');
const queue=[car(8),car(23)];for(let i=0;i<500;i++){tickTraffic(square,queue,[signal],.05,25,null);assert.equal(vehicleContact(queue[0],queue[1]),null,'Queued cabs must not overlap');}
assert.ok(queue[1].y<46&&queue[1].speed<.1,'Lead cab waits behind red');assert.ok(queue[0].y<queue[1].y-4.5,'Follower queues');
for(let i=0;i<350;i++)tickTraffic(square,queue,[signal],.05,1,null);assert.ok(queue[1].y>60,'Cab proceeds on green');
const approach=[car(5)],player={x:-1.45,y:40,heading:0,length:4.6,width:1.9};for(let i=0;i<400;i++)tickTraffic(square,approach,[],.05,0,player);assert.ok(approach[0].y<35&&approach[0].speed<.1,'NPC stops for player');
const moving=createCar(-1.45,5,0);moving.vy=40;const world={collide:(x,y,heading)=>vehicleContact({x,y,heading,length:4.6,width:1.9},player,.12)};
for(let i=0;i<100;i++)advanceCar(moving,{throttle:1,boost:true},.05,world);assert.ok(moving.y<36,'Player cannot ghost through cab');assert.ok(moving.impacts>0,'Player collision recorded');
const stop={id:'mapped-stop-test',kind:'stop',point:[-1.45,50],heading:0},atStop=[car(38)];let waited=false,passed=false;
for(let i=0;i<600;i++){tickTraffic(square,atStop,[stop],.05,i*.05,null);if(atStop[0].speed<.1&&atStop[0].y>43)waited=true;if(atStop[0].y>58){passed=true;break;}}assert.ok(waited&&passed,'Mapped stop requires wait then releases traffic');
console.log(JSON.stringify({passed:true,checks:['smooth loop','dead-end stop','red-green phases','queue separation','NPC yields to player','player collision','stop wait/release'],turnSamples}));
const cross=graph([[0,0],[0,100],[100,0],[0,-100],[-100,0],[100,100],[100,-100],[-100,-100],[-100,100]],[[1,0],[2,0],[3,0],[4,0],[1,5],[5,2],[2,6],[6,3],[3,7],[7,4],[4,8],[8,1]]);
const contenders=Array.from({length:4},(_,id)=>{const path={edge:id,from:id+1,to:0,progress:48,ended:false},s=routeState(cross,path);return {id,path,x:s.point[0],y:s.point[1],heading:s.heading,speed:6,cruise:6};});
for(let i=0;i<1000;i++){tickTraffic(cross,contenders,[],.05,i*.05,null);for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)assert.equal(vehicleContact(contenders[a],contenders[b]),null,'Four-way reservation must prevent overlap');}
assert.ok(contenders.every(c=>c.totalMoved>90),'Every equal-time junction approach must get a turn');assert.ok(contenders.every(c=>c.maxWait<30),'No four-way starvation');
console.log(JSON.stringify({fourWay:true,moved:contenders.map(c=>c.totalMoved),maxWait:contenders.map(c=>c.maxWait)}));
const controlledCross=graph([[0,0],[0,100],[100,0],[0,-100],[-100,0],[100,100],[100,-100],[-100,-100],[-100,100]],[[1,0],[2,0],[3,0],[4,0],[1,5],[5,2],[2,6],[6,3],[3,7],[7,4],[4,8],[8,1]]),lightCars=[0,1].map(id=>{const path={edge:id,from:id+1,to:0,progress:48,ended:false},s=routeState(controlledCross,path);return {id,path,x:s.point[0],y:s.point[1],heading:s.heading,speed:6,cruise:6};});
const junctionLights=[{id:'north-red',kind:'signal',point:[0,10],heading:180},{id:'east-green',kind:'signal',point:[10,0],heading:270}];
for(let i=0;i<400;i++)tickTraffic(controlledCross,lightCars,junctionLights,.05,25,null);
assert.ok(lightCars[0].totalMoved<45,'Red approach must wait outside junction');assert.ok(lightCars[1].totalMoved>70,'Waiting red approach must not reserve and block green');
for(let i=0;i<400;i++)tickTraffic(controlledCross,lightCars,junctionLights,.05,1,null);assert.ok(lightCars[0].totalMoved>70,'Reservation must release for next green approach');
console.log(JSON.stringify({redDoesNotBlockGreen:true,releasesOnGreen:true}));
// Exercise the runtime's verified, CBD-clipped OSM graph for ten simulated minutes.
const source=JSON.parse(fs.readFileSync(new URL('./vidhana-road-network.json',import.meta.url))),data={...source,features:source.features.filter(f=>f.properties?.osm)},actual=retainTrafficLoops(applyTrafficDirections(buildRoadGraph({...data,features:data.features.filter(f=>f.geometry.type==='LineString'&&f.geometry.coordinates.every(p=>{const q=toLocal(p);return(q[0]/900)**2+(q[1]/930)**2<1;}))}),data));
const controls= mappedControls(JSON.parse(fs.readFileSync(new URL('./assets/streets/furniture.json',import.meta.url))).items);
const edges=actual.edges.map((e,i)=>({e,i})).filter(({e,i})=>actual.connected.has(e.a)&&actual.nodes[e.a].edges.includes(i)&&e.length>30),fleet=[];
for(let i=0;i<edges.length*8&&fleet.length<20;i++){const {e,i:edge}=edges[(i*37)%edges.length],from=actual.trafficDirections.has(edge+':'+e.a)?e.a:e.b,to=from===e.a?e.b:e.a,path={edge,from,to,progress:e.length*(.1+(i%8)*.1),ended:false},state=routeState(actual,path),candidate={id:i,path,x:state.point[0],y:state.point[1],heading:state.heading,speed:0,cruise:4+i%4};if(trafficSpawnSafe(actual,candidate)&&!fleet.some(other=>vehicleContact(candidate,other,5)))fleet.push(candidate);}
assert.equal(fleet.length,20);const timings=[];
for(let i=0;i<12000;i++){const start=performance.now();tickTraffic(actual,fleet,controls,.05,i*.05,null);timings.push(performance.now()-start);for(const c of fleet){const edge=actual.edges[c.path.edge];assert.ok(edge.allowedFrom===undefined||c.path.from===edge.allowedFrom,'Mapped one-way respected');}for(let a=0;a<fleet.length;a++)for(let b=a+1;b<fleet.length;b++)assert.equal(vehicleContact(fleet[a],fleet[b]),null,'No overlaps on real road routes');}
console.log(JSON.stringify({progress:fleet.map(c=>({id:c.id,moved:c.totalMoved,maxWait:c.maxWait,ended:c.path.ended,reason:c.stopped,blocked:c.reservationBlocked,x:c.x,y:c.y,edge:c.path.edge}))}));
assert.equal(fleet.filter(c=>c.path.ended).length,0,'Only circulating verified routes are seeded');assert.ok(fleet.every(c=>c.totalMoved>300&&c.maxWait<90),'Every cab must continue making progress without starvation');timings.sort((a,b)=>a-b);
console.log(JSON.stringify({realRoads:true,vehicles:fleet.length,seconds:600,overlaps:0,moving:fleet.filter(c=>c.speed>.1).length,medianSimulationMs:timings[6000],p95SimulationMs:timings[11400]}));
