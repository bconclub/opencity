import assert from 'node:assert/strict';
import {advanceAutoRoam,planAutoRoute,legalRoamEntry,clearRoadSpawn} from './auto-roam-physics.js';
import {routeState,vehicleContact} from './traffic-simulation.js';
import {createCar} from './auto-physics.js';
import {vehicleProfile} from './vehicle-tuning.js';
import {createDynamics,advanceDynamics} from './flight-physics.js';
function square(size){const points=[[0,0],[0,size],[size,size],[size,0]],edges=points.map((_,i)=>({a:i,b:(i+1)%4,length:size,width:8}));return {edges,nodes:points.map((p,i)=>({p,edges:[i,(i+3)%4]}))};}
const graph=square(1000);
const oneWay={...graph,edges:graph.edges.map((e,i)=>({...e,...(i===0?{allowedFrom:1}:{})}))},wrongPath={edge:0,from:0,to:1,progress:10};
const legal=legalRoamEntry(oneWay,wrongPath);assert.equal(legal.from,1);assert.equal(legal.to,0);assert.equal(legal.progress,990);
assert.equal(legalRoamEntry(oneWay,wrongPath,0),null,'Wrong-way assist entry must not instantaneously U-turn');
assert.equal(legalRoamEntry(oneWay,wrongPath,180).from,1);
assert.equal(legalRoamEntry(graph,wrongPath,180).from,1,'Bidirectional road may retain driver heading');
assert.equal(legalRoamEntry(graph,wrongPath,90),null,'Perpendicular entry needs manual alignment');
const laneSpawn=clearRoadSpawn(oneWay,wrongPath);assert.equal(laneSpawn.heading,180);assert(laneSpawn.point[0]>0,'Southbound start belongs to left-hand lane');
const freeSpawn=clearRoadSpawn(oneWay,wrongPath,(x,y)=>Math.abs(y-10)<5);assert(freeSpawn);assert(Math.abs(freeSpawn.point[1]-10)>=5,'Do not spawn inside stopped traffic');
assert.equal(clearRoadSpawn(oneWay,wrongPath,()=>true),null,'Fully occupied lane cannot spawn overlapping player');
function initial(){const path={edge:0,from:0,to:1,progress:0},p=routeState(graph,path),car=createCar(...p.point,p.heading);car.profile=vehicleProfile('kitt');car.boost.reserve=43;return {path,car};}
const straight=initial();for(let n=0;n<360;n++){const x=straight.car.x,y=straight.car.y,old=straight.car.speed,result=advanceAutoRoam(graph,straight.path,straight.car,1/60);straight.path=result.path;assert.ok(straight.car.speed-old<=straight.car.profile.boostAccel/60+1e-8);assert.ok(Math.hypot(straight.car.x-x,straight.car.y-y)<=1.01,'Must advance continuously along route');}
assert.equal(straight.car.speed,60);assert.equal(straight.car.boost.reserve,43,'Automatic cruising cannot drain or fill manual boost');
const corner=initial();corner.path.progress=800;Object.assign(corner.car,{x:-1.45,y:800,speed:60});assert.ok(planAutoRoute(graph,{...corner.path,progress:900},60,corner.car.profile).target<60,'Brake before a sharp corner');let seenTurn=false,maxTurnSpeed=0;
for(let n=0;n<900;n++){const state=advanceAutoRoam(graph,corner.path,corner.car,1/60);corner.path=state.path;if(corner.path.turn){seenTurn=true;maxTurnSpeed=Math.max(maxTurnSpeed,corner.car.speed);}if(corner.path.edge===1&&corner.path.progress>40)break;}
assert(seenTurn);assert(maxTurnSpeed<13,`Unsafe corner speed ${maxTurnSpeed}`);assert.equal(corner.path.edge,1);
const queue=initial(),other={x:-1.45,y:90,heading:0,length:4.5,width:1.85};queue.car.speed=45;
const collide=(x,y,heading)=>vehicleContact({x,y,heading,length:4.8,width:1.9},other,.4);
for(let n=0;n<600;n++){const state=advanceAutoRoam(graph,queue.path,queue.car,1/30,collide);queue.path=state.path;assert(!collide(queue.car.x,queue.car.y,queue.car.heading),'Swept route step must stop before contact');}
assert(queue.car.speed<.05);assert(queue.car.y<85);const stoppedAt=queue.car.y;
for(let n=0;n<60;n++)queue.path=advanceAutoRoam(graph,queue.path,queue.car,1/60).path;
assert(queue.car.y>stoppedAt+2,'Resume when queue clears');
const join=initial();join.car.x+=3;const oldX=join.car.x;join.path=advanceAutoRoam(graph,join.path,join.car,1/60).path;assert(Math.abs(join.car.x-oldX)<.01,'No lane-entry teleport');
const helicopter=createDynamics();helicopter.boost.reserve=37;const input={forward:1,turn:0,strafe:0,vertical:0,cruiseSpeed:85};for(let n=0;n<900;n++)advanceDynamics(helicopter,input,1/60,{automatic:true});assert(helicopter.vy>84);assert.equal(helicopter.boost.reserve,37);
for(let n=0;n<240;n++)advanceDynamics(helicopter,{...input,cruiseSpeed:18,turn:.6},1/60,{automatic:true});assert(Math.hypot(helicopter.vx,helicopter.vy)<25);assert(Math.abs(helicopter.roll)<=.56);assert.equal(helicopter.boost.reserve,37);
console.log(JSON.stringify({ok:true,straightPeak:straight.car.speed,maxTurnSpeed,stoppedAt,checks:['boosted cruise','smooth acceleration','curve anticipation','swept queue collision','resume after queue','continuous lane join','manual reserve preserved','helicopter full-speed and eased turns']},null,2));


