// Review only. Dedicated main drum/crown treatment; missing emblem stays explicit.
import {buildLandmarks as buildArchitecture,ARCHITECTURE_DIMENSIONS} from './vidhana-architecture-candidate.js';
export {ARCHITECTURE_DIMENSIONS};
export const DOME_ESTIMATES=Object.freeze({drumBase:19.3548,lowerCourseTop:21.65,galleryTop:25.6,corniceTop:28.1,crownSpringline:31.4,crownTop:38,collarTop:39.8,publishedOverallTop:45.72,publishedDiameter:18.288,intermediateHeightsEstimated:true,missingTop:'Upper pedestal and lion emblem not reconstructed; do not equate collar summit with published overall height'});
const IDS=new Set(['way/363474998','way/371511885','way/371511883']);
export function buildLandmarks(T,data,xy){
 const model=buildArchitecture(T,{...data,features:data.features.filter(f=>!IDS.has(f.properties.osm_id))},xy);
 const drum=data.features.find(f=>f.properties.osm_id==='way/363474998'),dome=data.features.find(f=>f.properties.osm_id==='way/371511885');
 if(!drum||!dome)return model;
 const D=DOME_ESTIMATES,ring=drum.geometry.coordinates[0].slice(0,-1).map(xy),c=ring.reduce((s,p)=>[s[0]+p[0]/ring.length,s[1]+p[1]/ring.length],[0,0]);
 if(ring.reduce((s,a,i)=>{const b=ring[(i+1)%ring.length];return s+a[0]*b[1]-b[0]*a[1];},0)<0)ring.reverse();
 const mapped=dome.geometry.coordinates[0].slice(0,-1).map(xy),xs=mapped.map(p=>p[0]),ys=mapped.map(p=>p[1]),rx=(Math.max(...xs)-Math.min(...xs))/2,ry=(Math.max(...ys)-Math.min(...ys))/2,dc=[(Math.max(...xs)+Math.min(...xs))/2,(Math.max(...ys)+Math.min(...ys))/2];
 const batches=new Map();
 const batch=key=>{if(!batches.has(key))batches.set(key,{p:[],n:[]});return batches.get(key);};
 const stone=batch('d2ccbf'),recess=batch('253b39');
 function quad(b,a,c,d,e){const n=new T.Vector3().subVectors(new T.Vector3(...c),new T.Vector3(...a)).cross(new T.Vector3().subVectors(new T.Vector3(...d),new T.Vector3(...a))).normalize();for(const p of [a,c,d,a,d,e]){b.p.push(...p);b.n.push(...n.toArray());}}
 function triangle(b,a,c,d){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a,...c,...d],3));g.computeVertexNormals();append(g,b);}
 function append(g,b,matrix=new T.Matrix4()){const v=g.index?g.toNonIndexed():g;v.applyMatrix4(matrix);const p=v.attributes.position,n=v.attributes.normal;for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),e=new T.Vector3().fromBufferAttribute(p,i+1),f=new T.Vector3().fromBufferAttribute(p,i+2);if(e.sub(a).cross(f.sub(a)).length()<1e-8)continue;for(let j=0;j<3;j++){b.p.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));b.n.push(n.getX(i+j),n.getY(i+j),n.getZ(i+j));}}if(v!==g)v.dispose();g.dispose();}
 const point=(p,z,s=1)=>[c[0]+(p[0]-c[0])*s,c[1]+(p[1]-c[1])*s,z];
 function polygonBand(profile){for(let j=1;j<profile.length;j++)for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],[s0,z0]=profile[j-1],[s1,z1]=profile[j];quad(stone,point(a,z0,s0),point(b,z0,s0),point(b,z1,s1),point(a,z1,s1));}}
 polygonBand([[1,D.drumBase],[1,21.25],[1.025,21.25],[1.025,21.48],[1,21.48],[1,D.lowerCourseTop]]);
 let bays=0,brackets=0;
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),u=[dx/length,dy/length],n=[u[1],-u[0]],at=(s,z,depth=0)=>[a[0]+s*u[0]+depth*n[0],a[1]+s*u[1]+depth*n[1],z];
  for(let j=0;j<3;j++){
   const left=j*length/3,right=(j+1)*length/3,mid=(left+right)/2,w=(right-left)*.44,l=mid-w/2,r=mid+w/2,z0=24.18,z1=D.galleryTop-.20;
   const panel=(start,end,bottom,top)=>quad(stone,at(start,bottom),at(end,bottom),at(end,top),at(start,top));
   panel(left,l,D.lowerCourseTop,D.galleryTop);panel(r,right,D.lowerCourseTop,D.galleryTop);panel(l,r,D.lowerCourseTop,z0);panel(l,r,z1,D.galleryTop);
   quad(recess,at(l,z0,-.24),at(r,z0,-.24),at(r,z1,-.24),at(l,z1,-.24));
   quad(stone,at(l,z0),at(l,z1),at(l,z1,-.24),at(l,z0,-.24));quad(stone,at(r,z0,-.24),at(r,z1,-.24),at(r,z1),at(r,z0));
   quad(stone,at(l,z0,-.24),at(r,z0,-.24),at(r,z0),at(l,z0));quad(stone,at(l,z1),at(r,z1),at(r,z1,-.24),at(l,z1,-.24));bays++;
   // Solid lower pilaster rhythm, with shadow openings confined to the gallery.
   const pilaster=at(left+(right-left)*.12,22.93,.10),rotation=new T.Matrix4().makeRotationZ(Math.atan2(u[1],u[0]));rotation.setPosition(...pilaster);append(new T.BoxGeometry(.27,.20,2.56),stone,rotation);
   const capital=at(left+(right-left)*.12,24.16,.14),capMatrix=new T.Matrix4().makeRotationZ(Math.atan2(u[1],u[0]));capMatrix.setPosition(...capital);append(new T.BoxGeometry(.43,.28,.22),stone,capMatrix);
   // Tapered deep corbel: facade-attached base and outward upper shoulder.
   const w0=.15,w1=.24,p=[at(mid-w0,24.48,.01),at(mid+w0,24.48,.01),at(mid-w1,25.82,.68),at(mid+w1,25.82,.68),at(mid-w1,25.82,.01),at(mid+w1,25.82,.01)];
   quad(stone,p[0],p[1],p[3],p[2]);triangle(stone,p[0],p[2],p[4]);triangle(stone,p[1],p[5],p[3]);quad(stone,p[2],p[3],p[5],p[4]);brackets++;
  }
 }
 polygonBand([[1,25.6],[1,26.1],[1.035,26.1],[1.035,26.35],[1.06,26.35],[1.06,27.35],[1.10,27.65],[1.10,27.9],[1.115,27.9],[1.115,D.corniceTop]]);
 const outer=ring.map(p=>point(p,D.corniceTop,1.115));for(let i=1;i<outer.length-1;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...outer[0],...outer[i],...outer[i+1]],3));g.computeVertexNormals();append(g,stone);}
 function lathe(profile,segments=64){const g=new T.LatheGeometry(profile.map(([r,z])=>new T.Vector2(r,z)),segments);g.rotateX(Math.PI/2);append(g,stone,new T.Matrix4().makeScale(rx,ry,1).setPosition(dc[0],dc[1],0));}
 lathe([[.92,28.1],[.92,28.3],[.97,28.3],[.97,28.52],[.91,28.52],[.91,29.8],[.965,29.8],[.965,30.03],[.93,30.03],[.93,30.9],[.99,30.9],[.99,31.16],[.955,31.16],[.955,31.4]]);
 // Small repeated vertical frieze reliefs and lower walk railing, estimates.
 for(let i=0;i<48;i++){const a=i*Math.PI*2/48,x=dc[0]+Math.cos(a)*rx*.948,y=dc[1]+Math.sin(a)*ry*.948;const g=new T.BoxGeometry(.18,.18,.72);append(g,stone,new T.Matrix4().makeTranslation(x,y,30.45));}
 for(let i=0;i<32;i++){const a=i*Math.PI*2/32,x=dc[0]+Math.cos(a)*rx*1.04,y=dc[1]+Math.sin(a)*ry*1.04;append(new T.BoxGeometry(.18,.18,.95),stone,new T.Matrix4().makeTranslation(x,y,28.675));}
 lathe([[1.03,29],[1.05,29],[1.05,29.16],[1.03,29.16],[1.03,29]]);
 lathe([[.955,31.4],[1,31.8],[1,32.4],[.99,33],[.93,34.5],[.80,35.9],[.59,37],[.32,37.8],[.22,38]]);
 lathe([[.22,38],[.22,38.18],[.18,38.18],[.18,39.5],[.21,39.5],[.21,39.8],[0,39.8]]);
 let added=0;
 for(const [color,b] of batches){if(!b.p.length)continue;added+=b.p.length/9;let mesh=model.group.children.find(m=>m.material.color.getHexString()===color&&!m.material.transparent);if(!mesh){mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshStandardMaterial({color:'#'+color,roughness:.86,side:T.DoubleSide}));model.group.add(mesh);}const previous=mesh.geometry,newGeometry=new T.BufferGeometry();for(const [name,values] of [['position',b.p],['normal',b.n]]){const old=previous.attributes[name]?.array||new Float32Array(),all=new Float32Array(old.length+values.length);all.set(old);all.set(values,old.length);newGeometry.setAttribute(name,new T.BufferAttribute(all,3));}newGeometry.computeBoundingSphere();mesh.geometry=newGeometry;previous.dispose();mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;}
 model.domes++;model.parts=data.features.filter(f=>f.properties.site==='Vidhana Soudha').length;
 model.architecture={...model.architecture,domeUpdate:{...D,mappedCenter:dc,mappedDiameter:[rx*2,ry*2],drumCorners:ring.length,bays,brackets,addedTriangles:added,revision:2,galleryOpeningHeight:1.22,lowerPilasters:24,railingBalusters:32,otherSixDomesUnchanged:true,coreRemoved:true,reviewOnly:true}};
 return model;
}
