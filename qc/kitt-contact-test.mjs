import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {vehicleContact} from '../traffic-simulation.js';
import {advanceCar,createCar} from '../auto-physics.js';
import {vehicleProfile} from '../vehicle-tuning.js';

// Load the actual runtime size helper without importing the browser renderer.
const source=fs.readFileSync(new URL('../npc-traffic.js',import.meta.url),'utf8');
const helper=source.match(/^function vehicleSize\(type\)\{[^\n]+\}/m);
assert(helper,'Runtime collision helper changed; update inspection explicitly.');
const size=vm.runInNewContext(helper[0]+';vehicleSize');
const model=JSON.parse(fs.readFileSync(new URL('../assets/vehicles/asset-validation.json',import.meta.url),'utf8')).kitt;
const length=model.bounds_max[1]-model.bounds_min[1];
assert(size('kitt').length>=length&&size('kitt').length-length<.02);
assert.equal(size('kitt').width,1.9,'Body clearance excludes mirrors, retaining existing side proxy.');
const stopped={x:0,y:40,heading:0,length:4.6,width:1.9};
const touching={x:0,y:40-(length+4.6)/2+.01,heading:0};
assert.equal(vehicleContact({...touching,length:4.6,width:1.9},stopped),null,'Old proxy misses this actual bumper overlap.');
assert(vehicleContact({...touching,...size('kitt')},stopped),'New proxy must catch that bumper overlap.');
const runs=[];
for(const heading of [0,90,180,270]){
 const angle=heading*Math.PI/180,axis={x:Math.sin(angle),y:Math.cos(angle)};
 const obstacle={...stopped,x:axis.x*40,y:axis.y*40,heading};
 const car=createCar(axis.x*5,axis.y*5,heading);car.profile=vehicleProfile('kitt');
 car.vx=axis.x*35;car.vy=axis.y*35;
 const world={collide:(x,y,h)=>vehicleContact({x,y,heading:h,...size('kitt')},obstacle,.12)};
 for(let i=0;i<120;i++)advanceCar(car,{throttle:1,boost:true},.05,world);
 assert(car.impacts>0,'Boosted approach must collide');
 assert.equal(vehicleContact({x:car.x,y:car.y,heading:car.heading,...size('kitt')},obstacle),null,'Final bodies must not overlap');
 const progress=car.x*axis.x+car.y*axis.y;
 assert(progress<40-(length+4.6)/2,'Actual KITT nose must stop before cab bumper');
 runs.push({heading,progress,impacts:car.impacts});
}
const report={passed:true,measuredLength:length,collisionLength:size('kitt').length,widthPolicy:'1.9m body proxy, mirrors excluded',runs};
fs.writeFileSync(new URL('./kitt-contact-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
