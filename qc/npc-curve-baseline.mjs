import {bearing,angleGap,toLocal} from '../auto-roads.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const headingVector=h=>[Math.sin(h*Math.PI/180),Math.cos(h*Math.PI/180)];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function retainTrafficLoops(graph){
 // A 4 m two-way service strip cannot safely pass two full-width cabs.
 // Pedestrian classes are already excluded by buildRoadGraph.
 const nodes=graph.nodes.map(n=>({...n,edges:n.edges.filter(id=>{const e=graph.edges[id];return !e.width||e.width>=(e.allowedFrom===undefined?4.8:3);})})),queue=nodes.map((n,i)=>n.edges.length<2?i:-1).filter(i=>i>=0);
 for(let i=0;i<queue.length;i++){const id=queue[i];for(const e of nodes[id].edges){const edge=graph.edges[e],other=edge.a===id?edge.b:edge.a;nodes[other].edges=nodes[other].edges.filter(j=>j!==e);if(nodes[other].edges.length===1)queue.push(other);}nodes[id].edges=[];}
 // Keep only directed cycles of legal forward turns, not merely an undirected
 // loop that can end against a one-way sign after narrow roads are removed.
 const states=new Map(),reverse=new Map();
 graph.edges.forEach((e,id)=>{if(!nodes[e.a].edges.includes(id))return;for(const from of [e.a,e.b])if(e.allowedFrom===undefined||e.allowedFrom===from){const to=from===e.a?e.b:e.a,key=id+':'+from;states.set(key,{edge:id,from,to,next:[]});reverse.set(key,[]);}});
 for(const [key,s] of states){const h=bearing(nodes[s.from].p,nodes[s.to].p);for(const id of nodes[s.to].edges){const t=states.get(id+':'+s.to);if(!t||id===s.edge||Math.abs(angleGap(bearing(nodes[t.from].p,nodes[t.to].p),h))>=135)continue;s.next.push(id+':'+s.to);reverse.get(id+':'+s.to).push(key);}}
 const seen=new Set(),order=[];function visit(key){if(seen.has(key))return;seen.add(key);for(const next of states.get(key).next)visit(next);order.push(key);}for(const key of states.keys())visit(key);
 seen.clear();const trafficDirections=new Set();function collect(key,list){if(seen.has(key))return;seen.add(key);list.push(key);for(const next of reverse.get(key))collect(next,list);}for(const key of order.reverse()){if(seen.has(key))continue;const list=[];collect(key,list);if(list.length>=3)for(const k of list)trafficDirections.add(k);}
 nodes.forEach(n=>{n.edges=n.edges.filter(id=>{const e=graph.edges[id];return trafficDirections.has(id+':'+e.a)||trafficDirections.has(id+':'+e.b);});});
 return {...graph,nodes,trafficDirections,connected:new Set([...graph.connected].filter(i=>nodes[i].edges.length>1))};
}
export function applyTrafficDirections(graph,data){
 const key=p=>p.map(v=>Math.round(v/1.5)).join(','),nodes=new Map(graph.nodes.map((n,i)=>[key(n.p),i])),directions=new Map();
 for(const f of data.features){const raw=f.properties?.oneway;if(!['yes','1','true','-1'].includes(String(raw)))continue;
  const points=f.geometry.coordinates.map(toLocal);for(let i=1;i<points.length;i++){const a=nodes.get(key(points[i-1])),b=nodes.get(key(points[i]));if(a===undefined||b===undefined)continue;directions.set([a,b].sort((a,b)=>a-b).join(':'),raw==='-1'?b:a);}
 }
 return {...graph,edges:graph.edges.map(e=>({...e,allowedFrom:directions.get([e.a,e.b].sort((a,b)=>a-b).join(':'))}))};
}
function lanePoint(graph,path,progress){
 const a=graph.nodes[path.from].p,b=graph.nodes[path.to].p,e=graph.edges[path.edge];
 const dx=(b[0]-a[0])/e.length,dy=(b[1]-a[1])/e.length,offset=e.allowedFrom!==undefined&&e.width<=4?0:Math.min(1.45,(e.width||7)/4);
 return [a[0]+dx*progress-dy*offset,a[1]+dy*progress+dx*offset];
}
function selectNext(graph,path){
 const h=bearing(graph.nodes[path.from].p,graph.nodes[path.to].p);
 return graph.nodes[path.to].edges.filter(id=>id!==path.edge&&(graph.edges[id].allowedFrom===undefined||graph.edges[id].allowedFrom===path.to)&&(!graph.trafficDirections||graph.trafficDirections.has(id+':'+path.to))).map(id=>{
  const e=graph.edges[id],to=e.a===path.to?e.b:e.a;
  return {edge:id,from:path.to,to,progress:0,delta:angleGap(bearing(graph.nodes[path.to].p,graph.nodes[to].p),h)};
 }).filter(p=>Math.abs(p.delta)<135&&graph.nodes[p.to].edges.length>1)
 .sort((a,b)=>(path.visits?.[a.edge]||0)-(path.visits?.[b.edge]||0)||Math.abs(a.delta)-Math.abs(b.delta)||a.edge-b.edge)[0];
}
function curvePoint(c,t){const u=1-t;return [u*u*c.a[0]+2*u*t*c.b[0]+t*t*c.c[0],u*u*c.a[1]+2*u*t*c.b[1]+t*t*c.c[1]];}
function makeTurn(graph,path,next,trim){
 const a=lanePoint(graph,path,graph.edges[path.edge].length-trim),c=lanePoint(graph,next,Math.min(trim,graph.edges[next.edge].length*.3));
 const v=headingVector(bearing(graph.nodes[path.from].p,graph.nodes[path.to].p)),w=headingVector(bearing(graph.nodes[next.from].p,graph.nodes[next.to].p));
 const cross=v[0]*w[1]-v[1]*w[0];let b;
 if(Math.abs(cross)>.1){const t=((c[0]-a[0])*w[1]-(c[1]-a[1])*w[0])/cross;b=[a[0]+v[0]*t,a[1]+v[1]*t];}
 else b=[(a[0]+c[0])/2,(a[1]+c[1])/2];
 const curve={a,b,c,next:{...next,progress:Math.min(trim,graph.edges[next.edge].length*.3)},at:0,samples:[0],length:0};
 let prev=a;for(let i=1;i<=24;i++){const p=curvePoint(curve,i/24);curve.length+=distance(prev,p);curve.samples.push(curve.length);prev=p;}return curve;
}
export function routeState(graph,path){
 if(path.turn){const c=path.turn,at=clamp(c.at,0,c.length);let i=1;while(i<24&&c.samples[i]<at)i++;const t=((i-1)+(at-c.samples[i-1])/(c.samples[i]-c.samples[i-1]||1))/24;
  const p=curvePoint(c,t),d=[2*(1-t)*(c.b[0]-c.a[0])+2*t*(c.c[0]-c.b[0]),2*(1-t)*(c.b[1]-c.a[1])+2*t*(c.c[1]-c.b[1])];return {point:p,heading:bearing([0,0],d)};
 }
 return {point:lanePoint(graph,path,path.progress),heading:bearing(graph.nodes[path.from].p,graph.nodes[path.to].p)};
}
export function advanceTrafficRoute(graph,path,metres){
 let left=Math.max(0,metres),moved=0;
 for(let k=0;k<100&&left>1e-6&&!path.ended;k++){
  if(path.turn){const c=path.turn,d=Math.min(left,c.length-c.at);c.at+=d;left-=d;moved+=d;if(c.at>=c.length-1e-6){const visits=path.visits||{};visits[path.edge]=(visits[path.edge]||0)+1;Object.assign(path,c.next,{visits,turn:null,next:null});}continue;}
  const edge=graph.edges[path.edge];path.next??=selectNext(graph,path)||false;
  const trim=path.next?Math.min(7,edge.length*.3,graph.edges[path.next.edge].length*.3):Math.min(3,edge.length*.25),end=edge.length-trim;
  const d=Math.min(left,Math.max(0,end-path.progress));path.progress+=d;left-=d;moved+=d;
  if(path.progress>=end-1e-6){if(!path.next){path.ended=true;break;}path.turn=makeTurn(graph,path,path.next,trim);}
 }
 return {...routeState(graph,path),moved,ended:!!path.ended};
}
export function clonePath(path){return {...path,visits:{...path.visits},next:path.next&&{...path.next},turn:path.turn&&{...path.turn,next:{...path.turn.next}}};}
// Oriented rectangles cover the body, rather than a single centre-point collider.
export function vehicleContact(a,b,padding=0){
 const af=headingVector(a.heading),bf=headingVector(b.heading),ar=[af[1],-af[0]],br=[bf[1],-bf[0]],delta=[a.x-b.x,a.y-b.y];let depth=Infinity,normal;
 for(const axis of [af,ar,bf,br]){const dot=(v,w)=>v[0]*w[0]+v[1]*w[1];
  const ra=Math.abs(dot(af,axis))*(a.length||4.5)/2+Math.abs(dot(ar,axis))*(a.width||1.85)/2;
  const rb=Math.abs(dot(bf,axis))*(b.length||4.5)/2+Math.abs(dot(br,axis))*(b.width||1.85)/2;
  const separation=dot(delta,axis),overlap=ra+rb+padding-Math.abs(separation);if(overlap<=0)return null;
  if(overlap<depth){depth=overlap;const sign=separation>=0?1:-1;normal={x:axis[0]*sign,y:axis[1]*sign};}
 }return normal;
}
// These are game phases at mapped signal locations, not a live municipal feed.
export function signalPhase(control,timeSeconds){
 const group=Math.abs(Math.cos((control.heading||0)*Math.PI/180))>=.707?0:1;
 const t=((timeSeconds%48)+48)%48,start=group*24;
 const phase=(t-start+48)%48;return phase<19?'green':phase<22?'amber':'red';
}
export function mappedControls(items){return items.filter(i=>i.kind==='signal'||i.kind==='stop'||i.tags?.highway==='stop').map(i=>({...i,point:toLocal(i.coordinates)}));}
function obstacleGap(graph,car,others,player,max){
 others=others.filter(o=>o!==car&&Math.hypot(o.x-car.x,o.y-car.y)<max+7);if(player&&Math.hypot(player.x-car.x,player.y-car.y)>max+7)player=null;
 if(!others.length&&!player)return max;
 const path=clonePath(car.path);let gap=0;for(;gap<=max;gap+=.65){const p=routeState(graph,path),body={x:p.point[0],y:p.point[1],heading:p.heading};
  if(others.some(o=>o!==car&&vehicleContact(body,o,.55))||(player&&vehicleContact(body,player,.6)))return gap;
  if(advanceTrafficRoute(graph,path,.65).ended)return gap;
 }return max;
}
function controlGap(graph,car,controls,now,max,dt){
 controls=controls.filter(c=>Math.hypot(car.x-c.point[0],car.y-c.point[1])<max+6);
 if(!controls.length){car.passed=null;return max;}
 const path=clonePath(car.path);let gap=0,nearest;
 for(;gap<=max;gap+=.65){const p=routeState(graph,path);nearest=controls.find(c=>{const delta=Math.abs(angleGap(p.heading,c.heading??p.heading));return distance(p.point,c.point)<4.5&&Math.min(delta,180-delta)<65&&car.passed!==c.id;});if(nearest)break;if(advanceTrafficRoute(graph,path,.65).ended)break;}
 if(!nearest){if(car.passed&&controls.every(c=>c.id!==car.passed||Math.hypot(car.x-c.point[0],car.y-c.point[1])>12))car.passed=null;return max;}
 if(nearest.kind==='stop'||nearest.tags?.highway==='stop'){
  if(gap<1&&car.speed<.1){car.stopWait=(car.stopWait||0)+dt;if(car.stopWait>=1.5){car.passed=nearest.id;car.stopWait=0;return max;}}
  return gap;
 }
 const phase=signalPhase(nearest,now);if(phase==='green'){if(gap<1)car.passed=nearest.id;return max;}
 return gap;
}
const junctionControllers=new WeakMap();
function junctionController(graph){
 if(junctionControllers.has(graph))return junctionControllers.get(graph);
 const points=graph.nodes.filter(n=>{
  if(n.edges.length>=3)return true;if(n.edges.length!==2)return false;
  const headings=n.edges.map(id=>{const e=graph.edges[id],other=graph.nodes[e.a].p===n.p?e.b:e.a;return bearing(n.p,graph.nodes[other].p);});
  return Math.abs(angleGap(headings[0],headings[1]))<120;
 }).map(n=>n.p),groups=[];
 for(const p of points){const matches=groups.filter(g=>g.points.some(q=>distance(p,q)<25));if(!matches.length)groups.push({points:[p]});else {const first=matches[0];first.points.push(p);for(const other of matches.slice(1)){first.points.push(...other.points);groups.splice(groups.indexOf(other),1);}}}
 groups.forEach((g,i)=>{g.id=i;g.owner=null;g.entered=false;g.requests=new Map();g.minX=Math.min(...g.points.map(p=>p[0]))-13;g.maxX=Math.max(...g.points.map(p=>p[0]))+13;g.minY=Math.min(...g.points.map(p=>p[1]))-13;g.maxY=Math.max(...g.points.map(p=>p[1]))+13;});
 const state={zones:groups,time:0};junctionControllers.set(graph,state);return state;
}
function inJunction(zone,p,margin=0){return p[0]>=zone.minX-margin&&p[0]<=zone.maxX+margin&&p[1]>=zone.minY-margin&&p[1]<=zone.maxY+margin&&zone.points.some(q=>distance(p,q)<12+margin);}
export function trafficSpawnSafe(graph,body){return !junctionController(graph).zones.some(z=>inJunction(z,[body.x,body.y],3));}
function approachJunction(graph,car,zones){
 const path=clonePath(car.path);let found=null,entry=0,exit=0;
 for(let d=0;d<=90;d+=1){const p=routeState(graph,path);
  if(!found){found=zones.find(z=>inJunction(z,p.point));if(found)entry=d;else if(d>=42)break;}
  else if(!inJunction(found,p.point,1)){exit=d;return {zone:found,entry,exit,path:clonePath(car.path)};}
  if(advanceTrafficRoute(graph,path,1).ended)break;
 }return found?{zone:found,entry,exit:exit||90,path:clonePath(car.path)}:null;
}
function approachControls(zone,car,controls){return controls.filter(c=>{const delta=Math.abs(angleGap(car.heading,c.heading??car.heading));return Math.min(delta,180-delta)<55&&inJunction(zone,c.point,5)&&car.passed!==c.id;}).sort((a,b)=>distance([car.x,car.y],a.point)-distance([car.x,car.y],b.point)).slice(0,1);}
function junctionClear(graph,car,approach,cars,player){
 const path=clonePath(car.path);advanceTrafficRoute(graph,path,Math.max(0,approach.entry-1));
 for(let d=Math.max(0,approach.entry-1);d<=approach.exit+7;d+=1){const s=routeState(graph,path),body={x:s.point[0],y:s.point[1],heading:s.heading};
  const blocker=cars.find(c=>c!==car&&Math.hypot(c.x-body.x,c.y-body.y)<7&&vehicleContact(body,c,.6));if(blocker||(player&&vehicleContact(body,player,.8))){car.reservationBlocked=blocker?'vehicle '+blocker.id:'player';return false;}
  if(advanceTrafficRoute(graph,path,1).ended){car.reservationBlocked='route end';return false;}
 }return true;
}
function reserveJunctions(graph,cars,controls,dt,now,player){
 const state=junctionController(graph);state.time+=dt;const approaches=new Map(),gaps=new Map();
 for(const car of cars){const a=approachJunction(graph,car,state.zones);if(a)approaches.set(car,a);}
 for(const zone of state.zones){
  if(zone.owner){const inside=inJunction(zone,[zone.owner.x,zone.owner.y],1);zone.entered ||= inside;
   if(!cars.includes(zone.owner)||(zone.entered&&!inside)){zone.owner=null;zone.entered=false;}
   else if(!zone.entered&&((state.time-zone.granted>2&&zone.owner.speed<.1)||approachControls(zone,zone.owner,controls).some(c=>c.kind==='signal'&&signalPhase(c,now)!=='green'))){zone.owner.reservationRetry=state.time+.5;zone.owner=null;}
  }
  for(const [car] of zone.requests)if(approaches.get(car)?.zone!==zone)zone.requests.delete(car);
  for(const [car,a] of approaches)if(a.zone===zone&&!zone.requests.has(car))zone.requests.set(car,state.time);
  if(!zone.owner){
   const waiting=[...zone.requests].sort((a,b)=>a[1]-b[1]||(a[0].id||0)-(b[0].id||0));
   for(const [car] of waiting){const a=approaches.get(car);if(car.reservationRetry>state.time)continue;const controlled=approachControls(zone,car,controls);
    if(controlled.some(c=>c.kind==='signal'&&signalPhase(c,now)!=='green')){car.reservationBlocked='red';continue;}
    const stop=controlled.find(c=>c.kind==='stop'||c.tags?.highway==='stop');if(stop){if(a.entry>1.8||car.speed>.1)continue;car.stopWait=(car.stopWait||0)+dt;if(car.stopWait<1.5)continue;car.passed=stop.id;car.stopWait=0;}
    if(!junctionClear(graph,car,a,cars,player))continue;
    zone.owner=car;zone.entered=inJunction(zone,[car.x,car.y],1);zone.granted=state.time;break;
   }
  }
 }
 for(const [car,a] of approaches){const zone=a.zone;if(zone.owner!==car)gaps.set(car,Math.max(0,a.entry-1));else if(zone.entered){car.clearingJunction=true;for(const c of approachControls(zone,car,controls))if(c.kind==='signal')car.passed=c.id;}}
 return gaps;
}
export function tickTraffic(graph,cars,controls,dt,now,player){
 dt=clamp(dt,0,.1);for(const car of cars){const state=routeState(graph,car.path);car.x=state.point[0];car.y=state.point[1];car.heading=state.heading;car.clearingJunction=false;}
 const reservations=reserveJunctions(graph,cars,controls,dt,now,player);
 for(const car of cars){const look=Math.max(12,car.speed*car.speed/5+8),gap=Math.min(obstacleGap(graph,car,cars,player,look),car.clearingJunction?look:controlGap(graph,car,controls,now,look,dt),reservations.get(car)??Infinity);
  const target=car.path.ended?0:Math.min(car.cruise||6,Math.sqrt(Math.max(0,gap-.8)*5));
  car.speed=Math.max(0,car.speed+clamp(target-car.speed,-4*dt,1.8*dt));
  const path=clonePath(car.path),next=advanceTrafficRoute(graph,path,Math.min(car.speed*dt,Math.max(0,gap-.25))),body={x:next.point[0],y:next.point[1],heading:next.heading};
  if(cars.some(o=>o!==car&&vehicleContact(body,o,.08))||(player&&vehicleContact(body,player,.1))){car.speed=0;car.stopped='vehicle';car.waitTime=(car.waitTime||0)+dt;car.maxWait=Math.max(car.maxWait||0,car.waitTime);continue;}
  car.path=path;Object.assign(car,body);car.totalMoved=(car.totalMoved||0)+next.moved;car.waitTime=next.moved<.005?(car.waitTime||0)+dt:0;car.maxWait=Math.max(car.maxWait||0,car.waitTime);car.stopped=path.ended?'route end':target<.2?'queue or signal':null;
 }
}
