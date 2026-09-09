const ORIGIN=[77.5945,12.9755],M=111320,C=Math.cos(ORIGIN[1]*Math.PI/180);
export const toLocal=p=>[(p[0]-ORIGIN[0])*M*C,(p[1]-ORIGIN[1])*M];
export const toLngLat=p=>[ORIGIN[0]+p[0]/(M*C),ORIGIN[1]+p[1]/M];
export const bearing=(a,b)=>(Math.atan2(b[0]-a[0],b[1]-a[1])*180/Math.PI+360)%360;
export const angleGap=(a,b)=>(a-b+540)%360-180;
export function buildRoadGraph(data){
 const segments=[],seen=new Set(),grid=new Map(),classes=new Set(['primary','secondary','tertiary','minor','service','trunk']);
 for(const f of data.features){if(f.properties._layer!=='transportation'||f.geometry.type!=='LineString'||!classes.has(f.properties.class)||['bridge','tunnel'].includes(f.properties.brunnel)||Number(f.properties.layer||0)!==0)continue;
  const points=f.geometry.coordinates.map(toLocal);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(Math.hypot(b[0]-a[0],b[1]-a[1])<1)continue;const key=[a.map(v=>v.toFixed(1)).join(','),b.map(v=>v.toFixed(1)).join(',')].sort().join('|');if(seen.has(key))continue;seen.add(key);const s={a,b,cuts:[0,1],kind:f.properties.class};const id=segments.length;segments.push(s);for(let x=Math.floor(Math.min(a[0],b[0])/40);x<=Math.floor(Math.max(a[0],b[0])/40);x++)for(let y=Math.floor(Math.min(a[1],b[1])/40);y<=Math.floor(Math.max(a[1],b[1])/40);y++){const k=x+','+y;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(id);}}
 }
 const pairs=new Set();for(const ids of grid.values())for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const key=ids[i]+':'+ids[j];if(pairs.has(key))continue;pairs.add(key);const s=segments[ids[i]],t=segments[ids[j]],rx=s.b[0]-s.a[0],ry=s.b[1]-s.a[1],sx=t.b[0]-t.a[0],sy=t.b[1]-t.a[1],cross=rx*sy-ry*sx;if(Math.abs(cross)<.00001)continue;const qx=t.a[0]-s.a[0],qy=t.a[1]-s.a[1],u=(qx*sy-qy*sx)/cross,v=(qx*ry-qy*rx)/cross;if(u>=0&&u<=1&&v>=0&&v<=1){s.cuts.push(u);t.cuts.push(v);}}
 const nodes=[],lookup=new Map(),edges=[],edgeKeys=new Set();
 function node(p){const key=p.map(v=>Math.round(v/1.5)).join(',');if(!lookup.has(key)){lookup.set(key,nodes.length);nodes.push({p,edges:[]});}return lookup.get(key);}
 for(const s of segments){const cuts=[...new Set(s.cuts)].sort((a,b)=>a-b);for(let i=1;i<cuts.length;i++){const at=t=>[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];const a=node(at(cuts[i-1])),b=node(at(cuts[i]));if(a===b)continue;const key=[a,b].sort((a,b)=>a-b).join(':');if(edgeKeys.has(key))continue;edgeKeys.add(key);const length=Math.hypot(nodes[a].p[0]-nodes[b].p[0],nodes[a].p[1]-nodes[b].p[1]);if(length<.5)continue;const id=edges.length;edges.push({a,b,length,kind:s.kind});nodes[a].edges.push(id);nodes[b].edges.push(id);}}
 const visited=new Set();let largest=[];for(let i=0;i<nodes.length;i++){if(visited.has(i))continue;const component=[],queue=[i];visited.add(i);for(let n=0;n<queue.length;n++){const id=queue[n];component.push(id);for(const e of nodes[id].edges){const edge=edges[e],other=edge.a===id?edge.b:edge.a;if(!visited.has(other)){visited.add(other);queue.push(other);}}}if(component.length>largest.length)largest=component;}
 return{nodes,edges,connected:new Set(largest)};
}
export function spawnRoad(graph,target=toLocal([77.5935,12.974])){
 let best=null,distance=Infinity;graph.edges.forEach((e,id)=>{if(!graph.connected.has(e.a))return;const a=graph.nodes[e.a].p,b=graph.nodes[e.b].p,d=Math.hypot((a[0]+b[0])/2-target[0],(a[1]+b[1])/2-target[1])+(e.length<80?500:0)+(graph.nodes[e.a].edges.length<2||graph.nodes[e.b].edges.length<2?1000:0);if(d<distance){distance=d;best={edge:id,from:e.a,to:e.b,progress:e.length/2,ended:false};}});if(!best)throw new Error('No connected roads found');return best;
}
export function roadPosition(graph,state){const a=graph.nodes[state.from].p,b=graph.nodes[state.to].p,t=state.progress/graph.edges[state.edge].length;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
export function advanceRoad(graph,state,distance,choice='straight'){
 let usedChoice=false,moved=0;for(let n=0;distance>0&&n<100;n++){const edge=graph.edges[state.edge],remaining=edge.length-state.progress,travel=Math.min(distance,remaining);state.progress+=travel;distance-=travel;moved+=travel;if(state.progress<edge.length-.0001)break;
  const current=state.to,heading=bearing(graph.nodes[state.from].p,graph.nodes[current].p),options=graph.nodes[current].edges.filter(id=>id!==state.edge).map(id=>{const e=graph.edges[id],to=e.a===current?e.b:e.a;return{id,to,delta:angleGap(bearing(graph.nodes[current].p,graph.nodes[to].p),heading)};});
  if(!options.length){state.ended=true;break;}let candidates=options;
  if(options.length>1&&choice!=='straight'){const side=options.filter(o=>choice==='left'?o.delta< -18:o.delta>18);if(side.length)candidates=side;usedChoice=true;}
  const target=choice==='left'&&candidates!==options?-90:choice==='right'&&candidates!==options?90:0;candidates.sort((a,b)=>Math.abs(a.delta-target)-Math.abs(b.delta-target));const next=candidates[0];state.edge=next.id;state.from=current;state.to=next.to;state.progress=0;state.ended=false;if(usedChoice)choice='straight';
 }return{moved,usedChoice};
}
export function reverseRoad(graph,state){const old=state.from;state.from=state.to;state.to=old;state.progress=graph.edges[state.edge].length-state.progress;state.ended=false;}
