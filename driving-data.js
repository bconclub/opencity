// Rendered Vidhana carriageways and driving routes use the same OSM centre lines.
import {toLocal,toLngLat} from './auto-roads.js';
let pending;
export function loadDrivingData(){return pending??=Promise.all(['district-data.json','vidhana-road-network.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('Road data unavailable');return r.json();}))).then(([district,roads])=>{
 const centre=toLocal([77.5908,12.9798]),radius=488,features=[];
 for(const f of district.features){
  if(f.properties?._layer!=='transportation'||f.geometry.type!=='LineString'){features.push(f);continue;}
  const pts=f.geometry.coordinates.map(toLocal);
  for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],x=a[0]-centre[0],y=a[1]-centre[1],A=dx*dx+dy*dy;if(!A)continue;
   const B=2*(x*dx+y*dy),C=x*x+y*y-radius*radius,D=B*B-4*A*C,cuts=[0,1];
   if(D>=0)for(const t of [(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)])if(t>0&&t<1)cuts.push(t);
   cuts.sort((a,b)=>a-b);
   for(let j=1;j<cuts.length;j++){const lo=cuts[j-1],hi=cuts[j],m=(lo+hi)/2;if((x+dx*m)**2+(y+dy*m)**2<radius*radius)continue;features.push({...f,geometry:{type:'LineString',coordinates:[lo,hi].map(t=>toLngLat([a[0]+dx*t,a[1]+dy*t]))}});}
  }
 }
 return {...district,features:[...features,...roads.features]};
}).catch(error=>{pending=null;throw error;});}
