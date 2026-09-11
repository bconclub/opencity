import {createBoost,useBoost,earnBoost} from './vehicle-boost.js';
import {vehicleProfile} from './vehicle-tuning.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createCar(x=0,y=0,heading=0){return{x,y,heading,vx:0,vy:0,steer:0,yaw:0,pitch:0,roll:0,pitchRate:0,rollRate:0,speed:0,distance:0,wheel:0,reverseWait:0,impacts:0,surface:'road',profile:vehicleProfile('auto'),boost:createBoost()};}
export function advanceCar(s,input,dt,world={}){
 if(!Number.isFinite(dt)||dt<=0)return s;
 const p=s.profile||{};
 const steps=Math.max(1,Math.ceil(Math.min(dt,.2)*120)),h=Math.min(dt,.2)/steps;
 for(let i=0;i<steps;i++){
  let a=s.heading*Math.PI/180,fx=Math.sin(a),fy=Math.cos(a),rx=Math.cos(a),ry=-Math.sin(a);
  let forward=s.vx*fx+s.vy*fy,lateral=s.vx*rx+s.vy*ry;
  const onRoad=world.onRoad?.(s.x,s.y)??true;s.surface=onRoad?'road':'grass';
  const targetSteer=clamp(input.steer||0,-1,1)*((p.steering??.56)/(1+Math.abs(forward)*.045));s.steer+=(targetSteer-s.steer)*(1-Math.exp(-h*(p.steeringResponse??7)));
  const brake=input.brake||(input.reverse&&forward>.15)||(input.throttle&&forward<-.15);
  s.reverseWait=input.reverse&&Math.abs(forward)<.2?s.reverseWait+h:Math.abs(forward)>=.2?s.reverseWait:0;
  const boost=useBoost(s.boost,!!input.boost,(!!input.throttle||forward>.5)&&!input.reverse&&!brake,h,p);
  let accel=(input.throttle||boost)&&!brake?((p.accel??4.2)+boost*((p.boostAccel??8.4)-(p.accel??4.2)))*clamp(Math.max(Number(input.throttle)||0,boost>0?1:0),0,1):input.reverse&&!brake&&(s.reverseWait>.35||forward<-.2)?-(p.reverseAccel??2.4)*clamp(Number(input.reverse),0,1):0;
  const drag=(onRoad?(p.rollingDrag??.08):.9)+Math.abs(forward)*(p.aeroDrag??.003);
  const oldForward=forward;forward+=accel*h-forward*drag*h;
  if(brake)forward=Math.sign(forward)*Math.max(0,Math.abs(forward)-(input.brake?(p.brake??10):(p.brake??10)*.8)*h);
  if(!input.throttle&&!input.reverse&&Math.abs(forward)<.035)forward=0;
  // Releasing boost sheds excess speed through drag, without teleporting velocity.
  const speedLimit=(p.maxSpeed??19)+boost*((p.boostSpeed??32)-(p.maxSpeed??19));
  forward=clamp(forward,-(p.reverseSpeed??4),Math.max(speedLimit,oldForward-drag*Math.max(0,oldForward)*h));
  const targetYaw=forward*Math.tan(s.steer)/(p.wheelbase??1.96);
  // Grip limits lateral acceleration; momentum lags body rotation at speed.
  const limit=(onRoad?(p.grip??7.5):3.8)/Math.max(1,Math.abs(forward));
  s.yaw+=(clamp(targetYaw,-limit,limit)-s.yaw)*(1-Math.exp(-h*(p.yawResponse??5)));
  lateral*=Math.exp(-h*(onRoad?8:3.5));
  s.vx=fx*forward+rx*lateral;s.vy=fy*forward+ry*lateral;
  const priorHeading=s.heading;
  s.heading=(s.heading+s.yaw*h*180/Math.PI+360)%360;
  const nx=s.x+s.vx*h,ny=s.y+s.vy*h,hit=world.collide?.(nx,ny,s.heading);
  if(hit){s.heading=priorHeading;const vn=s.vx*hit.x+s.vy*hit.y;if(vn<0){s.vx-=vn*1.05*hit.x;s.vy-=vn*1.05*hit.y;}s.yaw*=.6;s.impacts++;}
  else{const moved=Math.hypot(nx-s.x,ny-s.y);s.distance+=moved;earnBoost(s.boost,moved,p);s.wheel+=Math.sign(forward)*moved/(p.wheelRadius??.31);s.x=nx;s.y=ny;}
  const pitchTarget=clamp((forward-oldForward)/Math.max(h,.0001)*.007,-.08,.08),rollTarget=clamp(-forward*s.yaw*(p.rollGain??.018),-(p.maxLean??.14),p.maxLean??.14);
  s.pitchRate+=(65*(pitchTarget-s.pitch)-12*s.pitchRate)*h;s.pitch+=s.pitchRate*h;
  s.rollRate+=(60*(rollTarget-s.roll)-11*s.rollRate)*h;s.roll+=s.rollRate*h;
  a=s.heading*Math.PI/180;s.speed=s.vx*Math.sin(a)+s.vy*Math.cos(a);
 }
 return s;
}
