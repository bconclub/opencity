import {clonePath,routeState,advanceTrafficRoute} from './traffic-simulation.js';
import {angleGap,bearing} from './auto-roads.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function legalRoamEntry(graph,path,heading){
 const next=clonePath(path),edge=graph.edges[next.edge];
 const reverse=()=>{const from=next.from;next.from=next.to;next.to=from;next.progress=edge.length-next.progress;next.turn=null;next.next=null;};
 if(edge.allowedFrom!==undefined&&next.from!==edge.allowedFrom)reverse();
 if(heading!==undefined){
  let gap=angleGap(bearing(graph.nodes[next.from].p,graph.nodes[next.to].p),heading);
  if(Math.abs(gap)>90&&edge.allowedFrom===undefined){reverse();gap=angleGap(bearing(graph.nodes[next.from].p,graph.nodes[next.to].p),heading);}
  // Driver must align manually instead of the assist snapping through a U-turn.
  if(Math.abs(gap)>60)return null;
 }
 return next;
}
export function clearRoadSpawn(graph,path,collide=()=>false){
 const legal=legalRoamEntry(graph,path),edge=graph.edges[legal.edge];
 for(const offset of [0,8,-8,16,-16,24,-24,32,-32,48,-48]){
  const candidate={...legal,progress:clamp(legal.progress+offset,Math.min(4,edge.length*.1),Math.max(edge.length-4,edge.length*.9))},pose=routeState(graph,candidate);
  if(!collide(pose.point[0],pose.point[1],pose.heading))return {path:candidate,...pose};
 }
 return null;
}
// Arcade autopilot: boosted straight-line pace, preview braking and swept contact.
// Reserve belongs to manual control and is deliberately untouched here.
export function planAutoRoute(graph,path,speed,profile,collide=()=>false){
 const brake=Math.max(3,profile.brake||10),peak=profile.boostSpeed||26;
 const horizon=Math.min(300,Math.max(35,speed*speed/(2*brake)+speed*.3+20));
 const preview=clonePath(path);let previous=routeState(graph,preview),target=peak,gap=Infinity,curveLimit=peak;
 for(let distance=0;distance<=horizon;distance+=1){
  const point=routeState(graph,preview);
  if(collide(point.point[0],point.point[1],point.heading)){gap=distance;target=Math.min(target,Math.sqrt(2*brake*Math.max(0,distance-1.5)));break;}
  const curvature=Math.abs(angleGap(point.heading,previous.heading))*Math.PI/180;
  if(curvature>.001){const limit=Math.sqrt((profile.grip||7.5)*.75/curvature);curveLimit=Math.min(curveLimit,limit);target=Math.min(target,Math.sqrt(limit*limit+2*brake*Math.max(0,distance-2)));}
  previous=point;const next=advanceTrafficRoute(graph,preview,1);
  if(next.ended){gap=Math.min(gap,distance+next.moved);target=Math.min(target,Math.sqrt(2*brake*Math.max(0,gap-1)));break;}
 }
 return {target:Math.min(peak,target),gap,curveLimit};
}
export function advanceAutoRoam(graph,path,car,dt,collide=()=>false){
 if(!Number.isFinite(dt)||dt<=0)return {path,moved:0,stopped:false};
 dt=Math.min(dt,.2);const profile=car.profile,plan=planAutoRoute(graph,path,Math.max(0,car.speed),profile,collide);
 const old=Math.max(0,car.speed),nextSpeed=Math.max(0,old+clamp(plan.target-old,-(profile.brake||10)*dt,(profile.boostAccel||7)*dt));
 let left=Math.min((old+nextSpeed)*.5*dt,Math.max(0,plan.gap-.8)),moved=0,stopped=false,current=path;
 const initial=routeState(graph,current);
 // Ease any small off-centre entry into the lane, never snap onto its centre.
 car.roamJoin??={x:car.x-initial.point[0],y:car.y-initial.point[1],distance:0};
 while(left>1e-7){const next=clonePath(current),d=Math.min(.4,left),point=advanceTrafficRoute(graph,next,d),join=car.roamJoin;
  const joinAt=Math.min(12,join.distance+point.moved),blend=(1-joinAt/12)**2,x=point.point[0]+join.x*blend,y=point.point[1]+join.y*blend;
  if(collide(x,y,point.heading)){stopped=true;break;}
  current=next;join.distance=joinAt;car.x=x;car.y=y;car.heading=point.heading;left-=d;moved+=point.moved;if(point.ended){stopped=true;break;}
 }
 car.speed=stopped||plan.gap<=.8?0:nextSpeed;car.vx=Math.sin(car.heading*Math.PI/180)*car.speed;car.vy=Math.cos(car.heading*Math.PI/180)*car.speed;
 car.distance+=moved;car.wheel+=moved/(profile.wheelRadius||.31);
 return {path:current,moved,stopped:stopped||plan.gap<=.8,target:plan.target,curveLimit:plan.curveLimit};
}
