import * as T from 'three';
import {createAuto} from '../auto-model.js';
import {createBlenderVehicle} from '../blender-vehicle.js';
import {createCar,advanceCar} from '../auto-physics.js';
import {vehicleProfile} from '../vehicle-tuning.js';
import {createTyreEffects} from '../tyre-effects.js';
import {installVehicleEnvironment} from '../vehicle-environment.js';
const scene=new T.Scene();scene.background=new T.Color('#91b5c2');
const camera=new T.PerspectiveCamera(45,innerWidth/innerHeight,.1,500);camera.up.set(0,0,1);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));document.body.append(renderer.domElement);
installVehicleEnvironment(T,renderer,scene);scene.add(new T.HemisphereLight(0xe5f6ff,0x675943,2.4));
const sun=new T.DirectionalLight(0xffffff,3);sun.position.set(10,-12,24);scene.add(sun);
const road=new T.Mesh(new T.PlaneGeometry(400,400),new T.MeshStandardMaterial({color:0x6b7070,roughness:1}));scene.add(road);
for(let y=-100;y<150;y+=6)for(const x of [-6,6]){const dash=new T.Mesh(new T.PlaneGeometry(.1,2.5),new T.MeshBasicMaterial({color:0xd8d9cc}));dash.position.set(x,y,.005);scene.add(dash);}
const effects=createTyreEffects(T,{capacity:384});scene.add(effects.mesh);
let model,car,mode='',elapsed=0,last=0,ready=false,frame=0;
const $=id=>document.getElementById(id);
function reset(){car=createCar();car.profile=vehicleProfile($('vehicle').value);car.profile.wheelRadius=model.wheelRadius;model.group.position.set(0,0,0);model.group.rotation.set(0,0,0);model.body.rotation.set(0,0,0);model.updateDrive(0,0,0);effects.setVehicle(model,$('vehicle').value);mode='';elapsed=0;}
async function load(){ready=false;document.querySelectorAll('button').forEach(b=>b.disabled=true);$('stats').textContent='Loading model…';model?.group.removeFromParent();model=$('vehicle').value==='auto'?createAuto(T):createBlenderVehicle(T,$('vehicle').value);await model.ready;scene.add(model.group);reset();ready=true;document.querySelectorAll('button').forEach(b=>b.disabled=false);}
$('vehicle').onchange=load;$('reset').onclick=reset;$('marks').onclick=()=>effects.mesh.visible=!effects.mesh.visible;
for(const id of ['launch','turn','reverse'])$(id).onclick=()=>{reset();mode=id;};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
await load();
function tick(time){requestAnimationFrame(tick);const dt=Math.min(.04,last?(time-last)/1000:1/60);last=time;if(!ready)return;elapsed+=dt;let input={};
 if(mode==='launch')input=elapsed<2.6?{throttle:1,boost:true}:elapsed<5?{brake:true}:{};
 if(mode==='turn')input=elapsed<2.5?{throttle:1}:elapsed<5?{throttle:1,steer:1}:{brake:true};
 if(mode==='reverse')input=elapsed<2.5?{reverse:1}:elapsed<3.5?{throttle:1}:{};
 if(mode&&elapsed<(mode==='turn'?3.9:mode==='reverse'?2.4:5.5)){advanceCar(car,input,dt);effects.update(car,input,dt);}model.group.position.set(car.x,car.y,.02);model.group.rotation.z=-car.heading*Math.PI/180;model.body.rotation.set(car.pitch,car.roll,0);model.updateDrive(car.wheel,car.steer,time/1000,effects.slipAngle);
 camera.position.set(car.x+8,car.y-13,8);camera.lookAt(car.x,car.y-2,0);renderer.render(scene,camera);
 if(frame++%8===0)$('stats').textContent=JSON.stringify({vehicle:$('vehicle').value,speed:Math.round(car.speed*3.6),wheelAngle:car.wheel,steer:car.steer,mode,elapsed:+elapsed.toFixed(2),tyres:effects.state(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries},null,2);
}requestAnimationFrame(tick);
