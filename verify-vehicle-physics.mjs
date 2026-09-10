import assert from 'node:assert/strict';
import {createBoost,useBoost,earnBoost} from './vehicle-boost.js';
import {vehicleProfile,HELICOPTER_PROFILE} from './vehicle-tuning.js';
import {createCar,advanceCar} from './auto-physics.js';
import {createDynamics,advanceDynamics} from './flight-physics.js';

const approx=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const charge=createBoost();assert.equal(charge.reserve,0);
assert.equal(useBoost(charge,true,true,1),0);
earnBoost(charge,0);earnBoost(charge,NaN);earnBoost(charge,-10);assert.equal(charge.reserve,0);
earnBoost(charge,100);approx(charge.reserve,24);
assert.equal(useBoost(charge,true,true,1),0,'Depleted held button must not pulse boost');
useBoost(charge,false,true,.01);
assert.equal(useBoost(charge,true,true,1),1);approx(charge.reserve,4);
earnBoost(charge,100);assert.equal(charge.reserve,4,'Boosted distance cannot recharge');
approx(useBoost(charge,true,true,1),.2);approx(charge.reserve,0);
useBoost(charge,false,true,.01);earnBoost(charge,1e6);approx(charge.reserve,100);
useBoost(charge,true,false,1);assert.equal(charge.reserve,100,'Brake/ineligible input does not burn fuel');
assert.equal(useBoost(charge,true,true,NaN),0);assert.equal(charge.reserve,100);

function carRun(id,dt=1/60,seconds=60){const car=createCar();car.profile=vehicleProfile(id);for(let t=0;t<seconds-dt/2;t+=dt)advanceCar(car,{throttle:1},dt);return car;}
const speeds={};for(const id of ['cycle','auto','cybercab','cybertruck','kitt']){
 const car=carRun(id);speeds[id]=Number((car.speed*3.6).toFixed(1));
 approx(car.speed,vehicleProfile(id).maxSpeed,.02);assert.equal(car.boost.reserve,100);
}
assert.equal(new Set(Object.values(speeds)).size,5,'Selectable road vehicles must have distinct speeds');
assert.ok(speeds.cycle<speeds.auto&&speeds.auto<speeds.cybercab&&speeds.cybercab<speeds.cybertruck&&speeds.cybertruck<speeds.kitt);
const fine=carRun('auto',1/120,12),coarse=carRun('auto',1/30,12);approx(fine.distance,coarse.distance,.00001);approx(fine.boost.reserve,coarse.boost.reserve,.00001);
const resting=createCar();for(let n=0;n<600;n++)advanceCar(resting,{boost:true},1/60);assert.equal(resting.boost.reserve,0);assert.equal(resting.distance,0);
const blocked=createCar();for(let n=0;n<600;n++)advanceCar(blocked,{throttle:1},1/60,{collide:()=>({x:0,y:-1})});assert.equal(blocked.distance,0);assert.equal(blocked.boost.reserve,0);
const sprint=carRun('kitt',1/60,60);const start=sprint.speed;for(let n=0;n<240;n++)advanceCar(sprint,{throttle:1,boost:true},1/60);assert.ok(sprint.speed>start);approx(sprint.boost.reserve,20,1e-6);
for(let n=0;n<180;n++)advanceCar(sprint,{throttle:1,boost:true},1/60);assert.equal(sprint.boost.active,false);assert.equal(sprint.boost.locked,true);assert.ok(sprint.boost.reserve>0,'Continuing to drive earns charge after depletion');
const before=sprint.speed;advanceCar(sprint,{throttle:1},1/60);assert.ok(before-sprint.speed<.5,'Boost release must not instantaneously clamp speed');
const unchanged=JSON.stringify(resting);advanceCar(resting,{throttle:1},-1);advanceCar(resting,{throttle:1},NaN);assert.equal(JSON.stringify(resting),unchanged);

const flightInput={forward:1,strafe:0,turn:0,vertical:0,brake:false};
function flightRun(dt){const s=createDynamics();for(let t=0;t<12-dt/2;t+=dt){const d=advanceDynamics(s,flightInput,dt);earnBoost(s.boost,Math.hypot(d.dx,d.dy),HELICOPTER_PROFILE,d.boosted);}return s;}
const hf=flightRun(1/120),hc=flightRun(1/30);approx(hf.vy,hc.vy,.00001);approx(hf.boost.reserve,hc.boost.reserve,.00001);
const helicopter=createDynamics();assert.equal(helicopter.boost.reserve,0);helicopter.boost.reserve=100;
for(let n=0;n<240;n++)advanceDynamics(helicopter,{...flightInput,boost:true},1/60);approx(helicopter.boost.reserve,28,1e-6);
for(let n=0;n<180;n++)advanceDynamics(helicopter,{...flightInput,boost:true},1/60);assert.equal(helicopter.boost.reserve,0);assert.equal(helicopter.boost.active,false);
console.log(JSON.stringify({ok:true,speedsKmh:speeds,helicopterSpeedCapKmh:HELICOPTER_PROFILE.maxSpeed*3.6,checks:['empty and capped reserves','distance-only charge','no charge while boosting','held-empty lock','frame-rate independence','blocked motion cannot charge','distinct terminal speeds','coasting boost release','helicopter depletion']},null,2));
