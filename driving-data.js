// Rendered Vidhana carriageways and driving routes use the same OSM centre lines.
import {toLocal,toLngLat} from './auto-roads.js';
let pending;
async function gunzipText(stream){
 return new Response(stream.pipeThrough(new DecompressionStream('gzip'))).text();
}
async function fetchGzJson(url){
 const gz=await fetch(url+'.gz');
 if(gz.ok){try{return JSON.parse(await gunzipText(gz.body));}catch{}}
 const b64=await fetch(url+'.gz.b64');
 if(!b64.ok)throw Error('Road data unavailable');
 const raw=atob(await b64.text());
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 return JSON.parse(await gunzipText(new Blob([bytes]).stream()));
}
function isRoadNetworkStub(data){
 const routes=(data.features||[]).filter(f=>f.properties?.osm&&f.geometry?.type==='LineString');
 return routes.length<50;
}
async function fetchJson(url){
 const r=await fetch(url);
 if(r.ok){
  const data=await r.json();
  if(url.endsWith('vidhana-road-network.json')&&isRoadNetworkStub(data))return fetchGzJson(url);
  return data;
 }
 if(!url.endsWith('.json'))throw Error('Road data unavailable');
 return fetchGzJson(url);
}
export function loadDrivingData(){return pending??=Promise.all(['district-data.json','vidhana-road-network.json'].map(fetchJson)).then(([district,roads])=>{
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
