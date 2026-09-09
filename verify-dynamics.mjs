import assert from 'node:assert/strict';
import {createDynamics,advanceDynamics,createSpring,advanceSpring} from './flight-physics.js';
const neutral={forward:0,turn:0,strafe:0,vertical:0,brake:false};
function run(state,seconds,controls,dt=1/60){let distance=0;for(let t=0;t<seconds-1e-8;t+=dt){const p=advanceDynamics(state,{...neutral,...controls},Math.min(dt,seconds-t));distance+=Math.hypot(p.dx,p.dy);}return distance;}
const moving=createDynamics();run(moving,8,{forward:1});assert(moving.vy>25);assert(moving.pitch<-.45);
const coasting=structuredClone(moving),braking=structuredClone(moving);
const coastDistance=run(coasting,2,{}),brakeDistance=run(braking,2,{brake:true});assert(coasting.vy>moving.vy*.7,'Release retains momentum');assert(brakeDistance<coastDistance*.8,'Brake shortens stopping distance');
const turning=structuredClone(moving);advanceDynamics(turning,{...neutral,turn:1},1/60);assert(Math.abs(turning.heading)<1,'Yaw does not jump');assert(Math.abs(turning.vx)<1,'Velocity does not rotate instantly');run(turning,1,{turn:1});assert(turning.roll>.1,'Forward turn banks');assert(turning.yawRate>10);
const high=createDynamics(),low=createDynamics();run(high,10,{forward:1,turn:.5},1/120);run(low,10,{forward:1,turn:.5},1/20);assert(Math.abs(high.vx-low.vx)<.001);assert(Math.abs(high.vy-low.vy)<.001);
const spring=createSpring(0,0,0),target={x:10,y:20,z:30};advanceSpring(spring,target,.016);assert(spring.x>0&&spring.x<1,'Camera follows without teleporting');for(let i=0;i<120;i++)advanceSpring(spring,target,.05);assert(Math.abs(spring.x-10)<.01);assert(Object.values(spring).every(Number.isFinite));
console.log(JSON.stringify({passed:['gradual acceleration','nose-down pitch','coasting inertia','stronger braking','yaw inertia','world velocity continuity','coordinated banking','20/120 Hz consistency','spring lag and convergence'],coastDistance,brakeDistance}));
