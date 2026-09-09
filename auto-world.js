import {toLocal} from './auto-roads.js';
export function createDrivingWorld(data,graph){
 const cells=new Map(),roads=new Map(),size=30;
 function insert(grid,b,item){for(let x=Math.floor(b[0]/size);x<=Math.floor(b[2]/size);x++)for(let y=Math.floor(b[1]/size);y<=Math.floor(b[3]/size);y++){const k=x+','+y;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(item);}}
 const inside=(p,r)=>{let v=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;};
 function nearest(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return[a[0]+dx*t,a[1]+dy*t];}
 for(const f of data.features){if(f.properties._layer!=='building'||Number(f.properties.render_min_height)>2.2)continue;const r=f.geometry.coordinates.map(r=>r.map(toLocal));const b=[Math.min(...r[0].map(p=>p[0]))-2,Math.min(...r[0].map(p=>p[1]))-2,Math.max(...r[0].map(p=>p[0]))+2,Math.max(...r[0].map(p=>p[1]))+2];insert(cells,b,r);}
 for(const e of graph.edges){const a=graph.nodes[e.a].p,b=graph.nodes[e.b].p,w={service:2.5,minor:3.5,tertiary:5,secondary:6,primary:7,trunk:8}[e.kind]||3.5;insert(roads,[Math.min(a[0],b[0])-w,Math.min(a[1],b[1])-w,Math.max(a[0],b[0])+w,Math.max(a[1],b[1])+w],{a,b,w});}
 const lo=toLocal([77.5851,12.9661]),hi=toLocal([77.6039,12.9849]),at=(grid,x,y)=>grid.get(Math.floor(x/size)+','+Math.floor(y/size))||[];
 return{onRoad(x,y){return at(roads,x,y).some(r=>{const q=nearest([x,y],r.a,r.b);return Math.hypot(x-q[0],y-q[1])<r.w;});},collide(x,y,heading){if(x<lo[0]+2)return{x:1,y:0};if(x>hi[0]-2)return{x:-1,y:0};if(y<lo[1]+2)return{x:0,y:1};if(y>hi[1]-2)return{x:0,y:-1};const a=heading*Math.PI/180;
  for(const offset of [-.7,.7]){const p=[x+Math.sin(a)*offset,y+Math.cos(a)*offset];for(const rings of at(cells,...p)){const within=inside(p,rings[0])&&!rings.slice(1).some(r=>inside(p,r));let best=Infinity,q;for(const r of rings)for(let i=1;i<r.length;i++){const n=nearest(p,r[i-1],r[i]),d=Math.hypot(p[0]-n[0],p[1]-n[1]);if(d<best){best=d;q=n;}}if(within||best<.78){const sign=within?-1:1;return{x:sign*(p[0]-q[0])/(best||1),y:sign*(p[1]-q[1])/(best||1)};}}}return null;
 }};
}
