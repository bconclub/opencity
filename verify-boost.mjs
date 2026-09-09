import assert from 'node:assert/strict';
import {createCar,advanceCar} from './auto-physics.js';
import {createDynamics,advanceDynamics} from './flight-physics.js';
const car=boost=>{const s=createCar();for(let i=0;i<600;i++)advanceCar(s,{throttle:1,steer:0,boost},1/60);return s;};
const normal=car(false),fast=car(true);assert(fast.distance>normal.distance*1.4);assert(fast.speed<=32.01);
const fly=boost=>{const s=createDynamics();for(let i=0;i<600;i++)advanceDynamics(s,{forward:1,turn:0,strafe:0,vertical:0,boost},1/60);return s;};
const slow=fly(false),quick=fly(true);assert(Math.hypot(quick.vx,quick.vy)>Math.hypot(slow.vx,slow.vy)*1.4);
const before=Math.hypot(quick.vx,quick.vy);for(let i=0;i<240;i++)advanceDynamics(quick,{forward:0,turn:0,strafe:0,vertical:0,boost:true,brake:true},1/60);assert(Math.hypot(quick.vx,quick.vy)<before*.15);
console.log('PASS: boosted vehicles accelerate faster; auto speed bound and helicopter brake priority hold.');
