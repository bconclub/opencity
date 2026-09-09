// Lightweight assisted helicopter dynamics. World velocity is independent of yaw.
// These are game controls, not an aeronautical flight model.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const RAD=Math.PI/180;
export function createDynamics(){return{vx:0,vy:0,vz:0,heading:0,yawRate:0,pitch:0,roll:0,pitchRate:0,rollRate:0};}
export function advanceDynamics(s,input,dt){
 const result={dx:0,dy:0,dz:0};
 const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
 for(let i=0;i<steps;i++){
  let angle=s.heading*RAD;
  const forward=s.vx*Math.sin(angle)+s.vy*Math.cos(angle);
  const lateral=s.vx*Math.cos(angle)-s.vy*Math.sin(angle);
  const velocity=Math.hypot(s.vx,s.vy);
  const targetYaw=(input.brake?0:input.turn)*(70-Math.min(velocity*.3,24));
  s.yawRate+=(targetYaw-s.yawRate)*(1-Math.exp(-h*6));
  s.heading=(s.heading+s.yawRate*h+360)%360;
  const pitchTarget=input.brake?clamp(Math.atan2(forward*1.4,9.81),-.65,.65):-input.forward*.5;
  const coordinatedBank=Math.atan2(Math.max(0,forward)*s.yawRate*RAD,9.81)*.7;
  const rollTarget=input.brake?clamp(-Math.atan2(lateral*1.4,9.81),-.6,.6):clamp(input.strafe*.36+coordinatedBank,-.55,.55);
  s.pitchRate+=(72*(pitchTarget-s.pitch)-16*s.pitchRate)*h;
  s.rollRate+=(68*(rollTarget-s.roll)-15*s.rollRate)*h;
  s.pitch+=s.pitchRate*h;s.roll+=s.rollRate*h;
  angle=s.heading*RAD;
  const thrustForward=-9.81*Math.tan(s.pitch)*(input.boost&&!input.brake?2.2:1),thrustSide=9.81*Math.tan(s.roll);
  const drag=.025+.0018*velocity+(input.brake?.8:0);
  s.vx+=(Math.sin(angle)*thrustForward+Math.cos(angle)*thrustSide-s.vx*drag)*h;
  s.vy+=(Math.cos(angle)*thrustForward-Math.sin(angle)*thrustSide-s.vy*drag)*h;
  const v=Math.hypot(s.vx,s.vy);const maxSpeed=input.boost&&!input.brake?85:58;if(v>maxSpeed){s.vx*=maxSpeed/v;s.vy*=maxSpeed/v;}
  // Collective has a response time; steep banks cause a small, recoverable sink.
  const sink=(1-Math.cos(s.roll)*Math.cos(s.pitch))*2;
  s.vz+=(input.vertical*26-(input.vertical?sink:0)-s.vz)*(1-Math.exp(-h*3.5));
  result.dx+=s.vx*h;result.dy+=s.vy*h;result.dz+=s.vz*h;
 }
 return result;
}
export function createSpring(x,y,z){return{x,y,z,vx:0,vy:0,vz:0};}
export function advanceSpring(s,target,dt,frequency=3.2){
 const count=Math.max(1,Math.ceil(dt*120)),h=dt/count;
 for(let i=0;i<count;i++)for(const axis of ['x','y','z']){const v='v'+axis;s[v]+=(frequency*frequency*(target[axis]-s[axis])-2*frequency*.93*s[v])*h;s[axis]+=s[v]*h;}
 return s;
}
