export const CBD_DOME={lng:77.5945,lat:12.9755,x:1000,y:1030,z:800};
const M=111320,C=Math.cos(CBD_DOME.lat*Math.PI/180);
export function domeLimit(lng,lat,alt){const d=CBD_DOME,z=Math.max(62,Math.min(782,alt));let x=(lng-d.lng)*M*C,y=(lat-d.lat)*M;const horizontal=x*x/(d.x*d.x)+y*y/(d.y*d.y),allowed=Math.max(.01,.975-(z/d.z)**2);let hit=z!==alt;if(horizontal>allowed){const scale=Math.sqrt(allowed/horizontal);x*=scale;y*=scale;hit=true;}const normal=[x/(d.x*d.x),y/(d.y*d.y),z/(d.z*d.z)],n=Math.hypot(...normal);return{lng:d.lng+x/(M*C),lat:d.lat+y/M,alt:z,hit,normal:normal.map(v=>v/n)};}
