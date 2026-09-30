import {bindVehiclePaint} from './vehicle-colors.js';

// Original compact sports coupe, not a licensed or downloaded manufacturer model.
export function createSupercar(T,{remote=false}={}){
 const group=new T.Group(),body=new T.Group(),front=new T.Group(),wheels=[];group.name='OpenCity sports coupe';group.add(body);front.position.y=1.33;body.add(front);
 const paint=new T.MeshStandardMaterial({color:0xd14d35,metalness:.42,roughness:.28});paint.userData.vehiclePaint=true;
 const glass=new T.MeshStandardMaterial({color:0x193b4a,metalness:.6,roughness:.14}),dark=new T.MeshStandardMaterial({color:0x182126,roughness:.85});
 const alloy=new T.MeshStandardMaterial({color:0xb8c3c5,metalness:.85,roughness:.22}),carbon=new T.MeshStandardMaterial({color:0x303d40,metalness:.3,roughness:.48});
 const lamp=new T.MeshStandardMaterial({color:0xf4f6e4,emissive:0x8f9c90,emissiveIntensity:.3}),red=new T.MeshStandardMaterial({color:0xcb292d,emissive:0x771010});
 function mesh(g,m,p,parent=body){const o=new T.Mesh(g,m);o.position.set(...p);parent.add(o);return o;}
 const box=(w,d,h,p,m=paint,parent=body)=>mesh(new T.BoxGeometry(w,d,h),m,p,parent);
 function hull(stations,m){const positions=[],indices=[];for(const [y,w,bottom,top]of stations)positions.push(-w,y,bottom,w,y,bottom,-w,y,top,w,y,top);for(let i=0;i<stations.length-1;i++){const a=i*4,b=a+4;indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);}const n=(stations.length-1)*4;indices.push(0,1,2,1,3,2,n,n+2,n+1,n+1,n+2,n+3);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,m,[0,0,0]);}
 hull([[-2.08,.88,.24,.68],[-1.30,.98,.25,.74],[.60,.96,.24,.67],[1.60,.91,.24,.48],[2.12,.84,.28,.40]],paint);
 hull([[-1.14,.78,.66,.70],[-.65,.65,.71,1.10],[.43,.62,.68,1.09],[1.06,.74,.61,.67]],glass);
 box(1.31,1.06,.045,[0,-.09,1.12],paint);
 box(1.8,.12,.07,[0,2.11,.23],carbon);box(1.78,.14,.07,[0,-2.1,.24],carbon);
 for(const side of [-1,1]){
  box(.05,2.50,.13,[side*.92,-.12,.32],carbon);
  const sill=box(.035,1.78,.035,[side*.81,-.05,.72],paint);sill.rotation.z=side*.05;
  box(.07,.50,.055,[side*.63,1.85,.45],lamp);
  box(.56,.05,.067,[side*.47,-2.107,.59],red);
  box(.21,.27,.11,[side*.97,.44,.83],paint);
  box(.34,.05,.12,[side*.49,2.13,.30],dark);
  box(.09,.18,.26,[side*.66,-1.78,.83],carbon);
  const exhaust=mesh(new T.CylinderGeometry(.07,.07,.17,12),alloy,[side*.55,-2.14,.30]);exhaust.rotation.x=Math.PI/2;
 }
 box(1.78,.26,.065,[0,-1.78,.99],carbon);
 for(let i=0;i<5;i++)box(.08,.61,.018,[(i-2)*.18,-1.46,.76],dark);
 function wheel(x,y,parent){const holder=new T.Group();holder.position.set(x,y,.34);parent.add(holder);wheels.push(holder);
  const tire=mesh(new T.TorusGeometry(.275,.065,10,32),dark,[0,0,0],holder);tire.rotation.y=Math.PI/2;
  const rim=mesh(new T.CylinderGeometry(.215,.215,.13,24),alloy,[0,0,0],holder);rim.rotation.z=Math.PI/2;
  const cap=mesh(new T.CylinderGeometry(.14,.14,.145,16),carbon,[0,0,0],holder);cap.rotation.z=Math.PI/2;
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const spoke=box(.16,.035,.37,[0,0,0],alloy,holder);spoke.rotation.x=a;}
 }
 for(const side of [-1,1]){wheel(side*.93,-1.35,body);wheel(side*.93,0,front);}
 group.userData={vehicle:'supercar',originalAsset:true,wheelRadius:.34};
 return{group,body,front,wheels,wheelRadius:.34,...bindVehiclePaint(group,remote)};
}
