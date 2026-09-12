import assert from 'node:assert/strict';
import * as T from 'file:///D:/CodexTools/OSM2World/three.module.js';
import {tyreSlip,createTyreEffects} from '../tyre-effects.js';
import {createCar,advanceCar} from '../auto-physics.js';
import {vehicleProfile} from '../vehicle-tuning.js';
const car=()=>Object.assign(createCar(),{profile:vehicleProfile('kitt')});
const s=car();s.speed=4;s.vy=4;
assert(tyreSlip(s,{throttle:1},3.2,.1,'kitt').launch>0);
assert.equal(tyreSlip(s,{throttle:.4},3.2,.1,'kitt').launch,0);
assert.equal(tyreSlip(s,{throttle:1},3.2,.1,'cycle').launch,0);
assert(tyreSlip(s,{brake:true},5.3,.1,'kitt').brake>0);
assert.equal(tyreSlip(s,{},5.3,.1,'kitt').brake,0,'Coasting must not leave brake stripes');
s.steer=.5;s.speed=s.vy=18;assert(tyreSlip(s,{},18,.1,'kitt').corner>0);
s.surface='grass';assert.deepEqual(tyreSlip(s,{brake:true},20,.1,'kitt'),{launch:0,brake:0,corner:0});
const group=new T.Group(),wheels=[];
for(const x of [-.8,.8])for(const y of [-1.3,1.3]){const w=new T.Group();w.position.set(x,y,.34);group.add(w);wheels.push(w);}
let road=true,step=false;
const fx=createTyreEffects(T,{capacity:32,onRoad:()=>road,heightAt:(x,y)=>step&&y>0?.2:0});
fx.setVehicle({group,wheels},'kitt');assert.equal(fx.state().contacts,4);
let c=car();
for(let i=0;i<150;i++){advanceCar(c,{throttle:1},1/60);fx.update(c,{throttle:1},1/60);}
assert(fx.state().totalSegments>0,'Real physics hard launch leaves rear tyre traces');
assert(fx.slipAngle>0,'Driven wheels spin above road speed on hard launch');
const total=fx.state().totalSegments;
for(let i=0;i<20;i++){advanceCar(c,{},1/60);fx.update(c,{},1/60);}
assert.equal(fx.state().totalSegments,total,'Straight coasting leaves no traces');
for(let i=0;i<30;i++){advanceCar(c,{brake:true},1/60);fx.update(c,{brake:true},1/60);}
assert(fx.state().totalSegments>total);assert(fx.state().segments<=32);assert.equal(fx.mesh.geometry.drawRange.count,32*6);
const pos=fx.mesh.geometry.attributes.position.array;assert([...pos].every(Number.isFinite));
for(let i=2;i<pos.length;i+=3)assert(Math.abs(pos[i]-.025)<1e-6,'Tracks sit on road with depth offset');
const beforeTeleport=fx.state().totalSegments;
fx.breakTrail();c.x+=200;fx.update(c,{brake:true},1/60);const teleported=fx.state().totalSegments;
assert.equal(beforeTeleport,teleported,'Pause or respawn must break the previous strip');
road=false;for(let i=0;i<30;i++){c.speed=12-i*.2;c.y+=.2;fx.update(c,{brake:true},1/60);}
assert.equal(fx.state().totalSegments,teleported,'No lines across off-road area');
fx.reset();assert.equal(fx.state().segments,0);assert.equal(fx.slipAngle,0);assert.equal(fx.mesh.geometry.drawRange.count,0);
road=true;c=car();c.speed=5;c.vy=5;
for(let i=0;i<30;i++)fx.update(c,{throttle:1},1/60);
assert.equal(fx.state().totalSegments,0,'Stationary pose cannot draw disconnected marks');
// Both rear contacts cross a 20 cm step. A braking strip must not bridge it.
step=true;c=car();c.speed=c.vy=8;c.y=1.2;fx.reset();fx.update(c,{},.1);
c.speed=c.vy=6;c.y=1.4;fx.update(c,{brake:true},.1);
assert.equal(fx.state().totalSegments,2,'Only front contacts remain on one continuous surface');
const reverse=car();reverse.speed=-4;reverse.vy=-4;
assert(tyreSlip(reverse,{throttle:1},-5.3,.1,'kitt').brake>0,'Opposite pedal brakes reverse movement');
fx.dispose();console.log('PASS tyre effects: launch, steering slip, brake/coast distinction, surface guard, cap, reset, stationary pose, contact heights');
