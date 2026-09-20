// REVIEW ONLY. Source snapshot way363475448 has tunnel=building_passage.
// Width4m is the existing generated estimate, not a surveyed clearance.
import {toLocal} from '../auto-roads.js';
import {vehicleFootprintCorners} from './vehicle-footprint-candidate.js';
const ends=[[77.5909934,12.9792403],[77.5911489,12.9794086]].map(toLocal);
export const VIDHANA_PASSAGE_SOURCE=Object.freeze({way:'way/363475448',tags:Object.freeze({highway:'service',tunnel:'building_passage'}),approaches:Object.freeze([{way:'way/38542545',access:'private'},{way:'way/363475450',access:'private'}]),widthEstimated:true,publicRouteEligible:false});
// Applies to automatic public traffic only. Manual driving data is unchanged.
export function publicTrafficFeature(feature){const p=feature.properties||{};return !['way/363475448','way/38542545','way/363475450'].includes(p.osm)&&![p.access,p.vehicle,p.motor_vehicle,p.motorcar].some(v=>v==='private'||v==='no');}
function inside(p,r){let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export function createVidhanaPassageOverride(data,{getVehicleFootprint}={}){
 const [a,b]=ends,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
 const matches=data.features.filter(f=>f.properties?._layer==='building'&&Number(f.properties.render_min_height)<=2.2&&f.geometry.type==='Polygon'&&inside(mid,f.geometry.coordinates[0].map(toLocal)));
 if(matches.length!==1)throw Error('Vidhana passage requires exactly one mapped containing building');
 const building=matches[0],radius=.78,halfWidth=2,endExtension=4;
 return{building,source:VIDHANA_PASSAGE_SOURCE,width:halfWidth*2,endExtension,allows(f,p,pose){if(f!==building)return false;const x=p[0]-a[0],y=p[1]-a[1],along=(x*dx+y*dy)/length,across=(x*dy-y*dx)/length;if(!(along> -endExtension+radius&&along<length+endExtension-radius))return false;const body=getVehicleFootprint?.();if(body){if(!pose)return false;return vehicleFootprintCorners(body,pose.x,pose.y,pose.heading).every(q=>Math.abs(((q[0]-a[0])*dy-(q[1]-a[1])*dx)/length)<halfWidth);}return Math.abs(across)<halfWidth-radius;}};
}
