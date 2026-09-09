import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCar,advanceCar} from './auto-physics.js';
import {buildRoadGraph,spawnRoad,roadPosition,bearing} from './auto-roads.js';
import {createDrivingWorld} from './auto-world.js';
function run(s,input,seconds,dt=1/60,world){for(let t=0;t<seconds-1e-7;t+=dt)advanceCar(s,input,dt,world);return s;}
const s=run(createCar(),{throttle:true},4);assert(s.speed>8);const before=s.y;run(s,{},.5);assert(s.y>before&&s.speed>0);
run(s,{steer:1,throttle:true},1);assert(s.heading>10&&Math.abs(s.roll)>.005);
run(s,{brake:true},3);assert(Math.abs(s.speed)<.01);run(s,{reverse:true},2);assert(s.speed< -1);
const idle=createCar();run(idle,{steer:1},1);assert.equal(idle.heading,0);
const a=run(createCar(),{throttle:true,steer:.4},3,1/60),b=run(createCar(),{throttle:true,steer:.4},3,1/30);assert(Math.hypot(a.x-b.x,a.y-b.y)<.03);
const wall={collide:(x,y)=>y>5?{x:0,y:-1}:null};const hit=run(createCar(),{throttle:true},5,1/60,wall);assert(hit.y<=5&&hit.impacts>0);
const data=JSON.parse(fs.readFileSync('district-data.json')),graph=buildRoadGraph(data),path=spawnRoad(graph),p=roadPosition(graph,path),heading=bearing(graph.nodes[path.from].p,graph.nodes[path.to].p),world=createDrivingWorld(data,graph);assert.equal(world.collide(...p,heading),null);assert(world.onRoad(...p));
console.log('PASS: acceleration, coasting, steering/lean, Space stop, reverse, no stationary rotation, timestep consistency, collision barrier, mapped spawn.');
