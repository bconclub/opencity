import {createCycle} from './cycle-model.js';
import {bindVehiclePaint} from './vehicle-colors.js';

// Original fallback assets, inspired by Bengaluru vehicle types, without brand logos.
export function createTwoWheeler(T,{variant='yulu',remote=false}={}){
 if(!['yulu','bike','delivery','cycle'].includes(variant))throw Error('Unsupported two-wheeler.');
 if(variant==='cycle'){
  const model=createCycle(T);model.group.traverse(o=>{if(o.material?.color?.getHex()===0xdb5939)o.material.userData.vehiclePaint=true;});
  return{...model,...bindVehiclePaint(model.group,remote)};
 }
 const electric=variant==='yulu',delivery=variant==='delivery';
 const group=new T.Group(),body=new T.Group(),front=new T.Group();group.name=variant+' original vehicle';body.name='Body and rider';group.add(body);
 const paint=new T.MeshStandardMaterial({color:electric?0x21a9bc:0x314b71,metalness:.3,roughness:.4});paint.userData.vehiclePaint=true;
 const rubber=new T.MeshStandardMaterial({color:0x192226,roughness:.92}),steel=new T.MeshStandardMaterial({color:0x9cafb1,metalness:.7,roughness:.27});
 const trim=new T.MeshStandardMaterial({color:0x384345,roughness:.6}),glass=new T.MeshStandardMaterial({color:0x284a57,metalness:.4,roughness:.18});
 const cloth=new T.MeshStandardMaterial({color:delivery?0xdc6d28:0xa6a849,roughness:.92}),trousers=new T.MeshStandardMaterial({color:0x28384d,roughness:.95});
 const skin=new T.MeshStandardMaterial({color:0x926644,roughness:.85}),white=new T.MeshStandardMaterial({color:0xe7e7d8,roughness:.52});
 function mesh(g,m,p,parent=body,name=''){const o=new T.Mesh(g,m);o.position.set(...p);o.name=name;parent.add(o);return o;}
 function box(w,d,h,p,m=paint,parent=body,name=''){return mesh(new T.BoxGeometry(w,d,h),m,p,parent,name);}
 function tube(a,b,r,m=paint,parent=body){const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);const o=mesh(new T.CylinderGeometry(r,r,delta.length(),10),m,from.add(to).multiplyScalar(.5).toArray(),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
 function oval(p,scale,m,parent=body){const o=mesh(new T.SphereGeometry(1,16,10),m,p,parent);o.scale.set(...scale);return o;}
 const wheelRadius=electric?.255:.30,halfWheelbase=electric?.57:.66,wheels=[];
 function wheel(y,parent=body){const holder=new T.Group();holder.name=parent===front?'Front wheel':'Rear wheel';holder.position.set(0,y,wheelRadius);parent.add(holder);wheels.push(holder);
  const tire=mesh(new T.TorusGeometry(wheelRadius-.045,.045,10,32),rubber,[0,0,0],holder);tire.rotation.y=Math.PI/2;
  const rim=mesh(new T.TorusGeometry(wheelRadius-.095,.023,8,24),steel,[0,0,0],holder);rim.rotation.y=Math.PI/2;
  tube([-.055,0,0],[.055,0,0],.06,trim,holder);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;tube([0,0,0],[0,Math.sin(a)*(wheelRadius-.1),Math.cos(a)*(wheelRadius-.1)],.008,steel,holder);}
  return holder;
 }
 wheel(-halfWheelbase);front.name='Front steering';body.add(front);front.position.y=halfWheelbase;wheel(0,front);
 for(const s of [-1,1]){tube([s*.055,0,wheelRadius],[s*.06,-.1,.84],.025,steel,front);tube([s*.075,-halfWheelbase,wheelRadius],[s*.1,-.05,.4],.028,trim);}
 tube([0,-.1,.82],[0,-.13,1.07],.027,steel,front);tube([-.29,-.13,1.07],[.29,-.13,1.07],.021,steel,front);
 for(const s of [-1,1]){tube([s*.22,-.13,1.07],[s*.32,-.13,1.07],.03,rubber,front);tube([s*.22,-.1,1.07],[s*.28,-.04,1.30],.008,steel,front);oval([s*.28,-.04,1.32],[.06,.025,.045],glass,front);}
 box(.13,.12,.045,[0,-.12,1.085],rubber,front,'Dashboard');box(.095,.075,.008,[0,-.12,1.112],glass,front);
 oval([0,.005,.88],[.115,.075,.08],trim,front);oval([0,.065,.885],[.084,.026,.054],white,front);
 if(electric){
  tube([0,-halfWheelbase,.3],[0,-.31,.66],.047);tube([0,-.31,.66],[0,-.3,.85],.035);
  tube([0,-.31,.4],[0,.25,.35],.044);tube([0,.25,.35],[0,.45,.80],.044);
  box(.16,.23,.35,[0,-.22,.55],trim,body,'Removable battery');box(.17,.07,.35,[0,-.31,.55],paint);
  box(.43,.27,.045,[0,.02,.32],rubber,body,'Foot board');
  box(.36,.25,.21,[0,.68,.95],trim,body,'Front basket');box(.29,.20,.15,[0,.68,1.00],rubber);
 }else{
  tube([0,-halfWheelbase,.35],[0,.31,.55],.045,trim);tube([0,-.3,.77],[0,.46,.78],.038,trim);
  oval([0,.17,.78],[.21,.32,.16],paint);box(.29,.28,.27,[0,.05,.46],trim,body,'Engine');
  for(let i=0;i<5;i++)box(.31,.25,.014,[0,.05,.37+i*.045],steel);
  tube([.21,-.42,.31],[.21,.32,.35],.05,steel);box(.48,.12,.03,[0,.1,.33],rubber);
 }
 oval([0,-.30,.86],[electric?.16:.20,electric?.19:.34,.06],rubber);
 oval([0,-halfWheelbase,.55],[.09,.31,.08],paint);
 box(.09,.045,.055,[0,-halfWheelbase-.18,.58],new T.MeshStandardMaterial({color:0xb83329,emissive:0x230400}));
 // A seated, helmeted rider makes the ride readable from the chase camera.
 const rider=new T.Group();rider.name='Helmeted rider';body.add(rider);
 oval([0,-.24,1.03],[.18,.14,.16],trousers,rider);oval([0,-.16,1.34],[.225,.145,.28],cloth,rider);
 tube([0,-.13,1.53],[0,-.10,1.65],.065,skin,rider);
 oval([0,-.08,1.75],[.16,.16,.19],rubber,rider);oval([0,.055,1.75],[.135,.055,.105],glass,rider);
 box(.04,.28,.014,[0,-.08,1.935],delivery?white:cloth,rider);
 for(const s of [-1,1]){
  tube([s*.14,-.21,1.05],[s*.2,.1,.70],.075,trousers,rider);tube([s*.2,.1,.70],[s*.19,.05,.36],.055,trousers,rider);oval([s*.19,.12,.33],[.07,.15,.05],rubber,rider);
  tube([s*.18,-.14,1.48],[s*.23,.17,1.2],.068,cloth,rider);tube([s*.23,.17,1.2],[s*.27,halfWheelbase-.13,1.08],.045,skin,rider);oval([s*.27,halfWheelbase-.13,1.075],[.05,.06,.04],skin,rider);
 }
 if(delivery){const orange=new T.MeshStandardMaterial({color:0xe67524,roughness:.78});box(.56,.43,.50,[0,-.72,1.15],orange,body,'Unbranded insulated delivery box');box(.58,.45,.045,[0,-.72,1.425],orange);box(.47,.012,.07,[0,-.942,1.12],white);for(const s of [-1,1])box(.012,.35,.07,[s*.287,-.72,1.12],white);}
 group.userData={vehicle:variant,wheelRadius,originalAsset:true};
 return{group,body,front,wheels,wheelRadius,...bindVehiclePaint(group,remote)};
}
