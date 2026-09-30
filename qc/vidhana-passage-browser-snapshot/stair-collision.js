// REVIEW ONLY. Compatible with auto-world.js collide(x,y,headingDegrees).
// Input must use the same local metre origin as the driving world.
export function createStairCollision(architecture,{radius=.78,halfLength=.7,includeLanding=false}={}){
 const s=architecture?.stairPlacement,a=architecture;
 if(!Array.isArray(s?.tangent)||s.tangent.length!==2||!Array.isArray(s?.outward)||s.outward.length!==2)throw Error('Stair basis required');
 if(!s||![a.stairWidth,s.topWidth,s.topV,s.bottomV,s.landingRearV,s.centerAlong,radius,halfLength,...s.tangent,...s.outward].every(Number.isFinite))throw Error('Finite stair footprint required');
 if(Math.abs(Math.hypot(...s.tangent)-1)>1e-5||Math.abs(Math.hypot(...s.outward)-1)>1e-5||Math.abs(s.tangent[0]*s.outward[0]+s.tangent[1]*s.outward[1])>1e-5)throw Error('Orthogonal unit stair basis required');
 if(a.stairWidth<=0||s.topWidth<=0||s.bottomV<=s.topV||s.topV<=s.landingRearV||radius<=0||halfLength<0)throw Error('Invalid stair dimensions');
 const point=(u,v)=>[(s.centerAlong+u)*s.tangent[0]+v*s.outward[0],(s.centerAlong+u)*s.tangent[1]+v*s.outward[1]],w=a.stairWidth/2,t=s.topWidth/2;
 // Default covers the stair run only. Including the landing currently blocks
 // a mapped service route and must await a separate route/entrance review.
 const footprint=[point(-w,s.bottomV),point(w,s.bottomV),point(t,s.topV),...(includeLanding?[point(t,s.landingRearV),point(-t,s.landingRearV)]:[]),point(-t,s.topV)];
 const area=footprint.reduce((sum,p,i)=>{const q=footprint[(i+1)%footprint.length];return sum+p[0]*q[1]-q[0]*p[1];},0);if(area<0)footprint.reverse();
 function contains(x,y){let hit=false;for(let i=0,j=footprint.length-1;i<footprint.length;j=i++){const a=footprint[i],b=footprint[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
 function probe(x,y){let best=Infinity,normal;
  for(let i=0;i<footprint.length;i++){const a=footprint[i],b=footprint[(i+1)%footprint.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(length*length))),qx=a[0]+dx*t,qy=a[1]+dy*t,d=Math.hypot(x-qx,y-qy);if(d<best){best=d;normal=d>1e-9?{x:(x-qx)/d,y:(y-qy)/d}:{x:dy/length,y:-dx/length};}}
  const within=contains(x,y);if(!within&&best>=radius)return null;if(within&&best>1e-9){normal.x*=-1;normal.y*=-1;}return normal;
 }
 return{footprint:footprint.map(p=>Object.freeze(p)),contains,collide(x,y,headingDegrees){if(![x,y,headingDegrees].every(Number.isFinite))return null;const angle=headingDegrees*Math.PI/180;for(const d of [-halfLength,halfLength]){const contact=probe(x+Math.sin(angle)*d,y+Math.cos(angle)*d);if(contact)return contact;}return null;}};
}
