import fs from'node:fs';import assert from'node:assert/strict';import{pathToFileURL}from'node:url';
import{measureVehicleFootprint,vehicleFootprintCorners}from'./vehicle-footprint-candidate.js';
import{createStairCollision}from'./vidhana-architecture-stair-collision.js';
import{createVidhanaPassageOverride}from'./vidhana-building-passage-candidate.js';
import{createDrivingWorld}from'./vidhana-passage-auto-world.js';
import{withVidhanaStairCollision}from'./vidhana-driving-world-candidate.js';
import{toLocal,buildRoadGraph}from'../auto-roads.js';import{createCar,advanceCar}from'../auto-physics.js';import{vehicleProfile}from'../vehicle-tuning.js';import{createCycle}from'../cycle-model.js';
const T=await import(pathToFileURL('D:/CodexTools/OSM2World/three.module.js').href),a=JSON.parse(fs.readFileSync('qc/vidhana-architecture-scene-ground.json')).architecture,s=a.stairPlacement;
function glbBoundsGroup(file){const bytes=fs.readFileSync(file),j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()),group=new T.Group();group.rotation.x=Math.PI/2;
 function node(id){const n=j.nodes[id],o=new T.Group();if(n.matrix){o.matrix.fromArray(n.matrix);o.matrixAutoUpdate=false;}else{o.position.fromArray(n.translation||[0,0,0]);o.quaternion.fromArray(n.rotation||[0,0,0,1]);o.scale.fromArray(n.scale||[1,1,1]);}
  if(n.mesh!==undefined)for(const p of j.meshes[n.mesh].primitives){const b=j.accessors[p.attributes.POSITION];assert(b.min&&b.max);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...b.min,...b.max],3));o.add(new T.Mesh(g,new T.MeshBasicMaterial()));}for(const c of n.children||[])o.add(node(c));return o;}
 for(const id of j.scenes[j.scene||0].nodes)group.add(node(id));const outer=new T.Group();outer.add(group);return outer;
}
const models=['cybertruck','cybercab','kitt','auto'].map(id=>({id,group:glbBoundsGroup(id==='auto'?'assets/auto/auto-rickshaw.glb':'assets/vehicles/'+(id==='cybercab'?'cybercab-rigged':id)+'.glb')}));models.push({id:'cycle',group:createCycle(T).group});
// Independent Sutherland-Hodgman intersection, rather than SAT's own answer.
function area(poly){return Math.abs(poly.reduce((v,p,i)=>{const q=poly[(i+1)%poly.length];return v+p[0]*q[1]-q[0]*p[1];},0))/2;}
function overlap(subject,clip){let out=subject;for(let i=0;i<clip.length;i++){const p=clip[i],q=clip[(i+1)%clip.length],side=v=>(q[0]-p[0])*(v[1]-p[1])-(q[1]-p[1])*(v[0]-p[0]),input=out;out=[];if(!input.length)break;for(let j=0;j<input.length;j++){const b=input[j],a=input[(j+input.length-1)%input.length],sa=side(a),sb=side(b);if((sa>=0)!==(sb>=0)){const t=sa/(sa-sb);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}if(sb>=0)out.push(b);}}return out.length>2?area(out):0;}
const data=JSON.parse(fs.readFileSync('district-data.json')),graph=buildRoadGraph(JSON.parse(fs.readFileSync('vidhana-road-network.json'))),p=toLocal([77.5909934,12.9792403]),q=toLocal([77.5911489,12.9794086]),length=Math.hypot(q[0]-p[0],q[1]-p[1]),u=[(q[0]-p[0])/length,(q[1]-p[1])/length],cross=[u[1],-u[0]],heading=Math.atan2(u[0],u[1])*180/Math.PI,results=[];
for(const {id,group}of models){const b=measureVehicleFootprint(T,group,{maxPitch:.08,maxRoll:vehicleProfile(id).maxLean}),raw=b.neutralBounds,getVehicleFootprint=()=>b,stairs=createStairCollision(a,{getVehicleFootprint}),passage=createVidhanaPassageOverride(data,{getVehicleFootprint}),world=withVidhanaStairCollision(createDrivingWorld(data,graph,{passage}),a,{getVehicleFootprint});
 for(let pitch=-.08;pitch<=.08001;pitch+=.01)for(let roll=-b.maxRoll;roll<=b.maxRoll+.00001;roll+=b.maxRoll/8)for(const x of [raw.minX,raw.maxX])for(const y of [raw.minY,raw.maxY])for(const z of [raw.minZ,raw.maxZ]){const p=new T.Vector3(x,y,z).applyEuler(new T.Euler(pitch,roll,0));assert(p.x>=b.minX&&p.x<=b.maxX&&p.y>=b.minY&&p.y<=b.maxY,'animated bounds must remain inside footprint');}
 let approaches=0,maxOverlap=0;
 for(let i=0;i<stairs.footprint.length;i++){const p=stairs.footprint[i],q=stairs.footprint[(i+1)%stairs.footprint.length],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy),normal=[dy/l,-dx/l],mid=[(p[0]+q[0])/2,(p[1]+q[1])/2];
  for(const turn of [-80,-45,0,45,80,180]){const h=Math.atan2(-normal[0],-normal[1])*180/Math.PI+turn;let previous;
   for(let d=10;d>=-4;d-=.02){const point=[mid[0]+normal[0]*d,mid[1]+normal[1]*d];if(stairs.collide(...point,h)){assert(previous);const penetration=overlap(vehicleFootprintCorners(raw,...previous,h),stairs.footprint);maxOverlap=Math.max(maxOverlap,penetration);assert(penetration<1e-7,`${id} edge${i} turn${turn} overlaps ${penetration}`);approaches++;break;}previous=point;}
  }
 }
 assert.equal(approaches,24);
 let passageSamples=0;for(const sign of [-1,1])for(let d=-2;d<length+2;d+=.1){const point=[p[0]+u[0]*d,p[1]+u[1]*d];assert.equal(world.collide(...point,heading+(sign<0?180:0)),null,`${id} passage ${d}`);passageSamples++;}
 const mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],shift=2-(raw.maxX-raw.minX)/2+.04;
 for(const side of [-1,1])assert(world.collide(mid[0]+cross[0]*shift*side,mid[1]+cross[1]*shift*side,heading),`${id} body crossing passage wall must stop`);
 if((b.maxY-b.minY)>4)assert(world.collide(...mid,heading+90),`${id} sideways body wider than passage`);
 const h=Math.atan2(-s.outward[0],-s.outward[1])*180/Math.PI,position=[s.centerAlong*s.tangent[0]+(s.bottomV+10)*s.outward[0],s.centerAlong*s.tangent[1]+(s.bottomV+10)*s.outward[1]],car=createCar(...position,h);car.profile=vehicleProfile(id);
 for(let frame=0;frame<600;frame++)advanceCar(car,{throttle:1},1/60,{onRoad:()=>true,collide:stairs.collide});
 assert(car.impacts>0);const stoppedOverlap=overlap(vehicleFootprintCorners(raw,car.x,car.y,car.heading),stairs.footprint);assert(stoppedOverlap<1e-7);
 results.push({id,footprint:b,approaches,maxOverlap,passageSamples,frontStop:{distance:car.distance,impacts:car.impacts,x:car.x,y:car.y,overlap:stoppedOverlap}});
}
// Hidden fallback and shadow geometry must not enlarge the chosen visual body.
const test=new T.Group(),visible=new T.Mesh(new T.BoxGeometry(2,4,1),new T.MeshBasicMaterial());visible.position.set(.2,.3,.5);test.add(visible);const hidden=new T.Group();hidden.visible=false;hidden.add(new T.Mesh(new T.BoxGeometry(99,99,99),new T.MeshBasicMaterial()));test.add(hidden);const shadow=new T.Mesh(new T.PlaneGeometry(90,90),new T.MeshBasicMaterial());shadow.name='Vehicle contact shadow';test.add(shadow);const measured=measureVehicleFootprint(T,test);assert(Math.abs(measured.minX-(-.88))<1e-6);assert(Math.abs(measured.maxY-2.38)<1e-6);visible.rotation.z=.4;assert.equal(measureVehicleFootprint(T,test),measured,'neutral footprint cached across animated/reselected model');assert.throws(()=>measureVehicleFootprint(T,new T.Group()));
const output={passed:true,results,coverage:'Four GLB source node/accessor bounds plus actual procedural cycle geometry.24 edge/angle approaches per model; independent clipped-area overlap test; real ground physics frontal stop; passage both directions and body-wall/sideways rejection.8cm body margin. General existing building/NPC colliders remain unchanged.'};fs.writeFileSync('qc/vehicle-footprint-results.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output));
