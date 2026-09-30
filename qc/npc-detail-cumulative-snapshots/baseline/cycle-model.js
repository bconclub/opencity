// Original OpenCity pedal cycle. Metres, X right, Y forward, Z up.
export function createCycle(T) {
 const group=new T.Group(),body=new T.Group();group.name='Pedal cycle';group.add(body);
 const paint=new T.MeshStandardMaterial({color:0xdb5939,metalness:.35,roughness:.38});
 const dark=new T.MeshStandardMaterial({color:0x172128,roughness:.85});
 const steel=new T.MeshStandardMaterial({color:0xa8bec7,metalness:.8,roughness:.27});
 const silver=new T.MeshStandardMaterial({color:0x526673,metalness:.65,roughness:.45});
 function mesh(g,m,p,parent=body){const o=new T.Mesh(g,m);o.position.set(...p);parent.add(o);return o;}
 function tube(a,b,r,m=paint,parent=body){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=mesh(new T.CylinderGeometry(r,r,d.length(),8),m,av.add(bv).multiplyScalar(.5).toArray(),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 function box(w,d,h,p,m=dark,parent=body){return mesh(new T.BoxGeometry(w,d,h),m,p,parent);}
 const rear=[0,-.55,.34],frontAxle=[0,.55,.34],crank=[0,-.10,.30],seat=[0,-.23,.85],head=[0,.40,.89];
 for(const [a,b,r]of [[crank,seat,.022],[seat,head,.019],[crank,[0,.44,.74],.027],[head,[0,.44,.74],.025]])tube(a,b,r);
 for(const s of [-1,1]){tube([s*.055,...rear.slice(1)],crank,.013);tube([s*.055,...rear.slice(1)],seat,.014);}
 tube(seat,[0,-.26,.99],.014,steel);const saddle=mesh(new T.SphereGeometry(1,16,8),dark,[0,-.29,1.015]);saddle.scale.set(.105,.18,.038);
 const steering=new T.Group();steering.name='Steering';steering.position.set(0,.42,.82);body.add(steering);
 // Entire fork, front wheel and handlebar turn together around the steering pivot.
 for(const s of [-1,1])tube([s*.045,0,0],[s*.055,.13,-.48],.015,silver,steering);
 tube([0,0,-.06],[0,-.045,.23],.019,steel,steering);tube([0,-.045,.23],[0,.02,.27],.019,steel,steering);
 tube([-.32,.02,.27],[.32,.02,.27],.014,steel,steering);
 for(const s of [-1,1]){tube([s*.22,.02,.27],[s*.33,.02,.27],.022,dark,steering);tube([s*.20,.03,.25],[s*.28,.10,.245],.007,silver,steering);}
 const wheels=[];
 function wheel(p,parent){const w=new T.Group();w.position.set(...p);parent.add(w);wheels.push(w);
  for(const [r,t,m]of [[.311,.029,dark],[.282,.009,steel]]){const o=mesh(new T.TorusGeometry(r,t,8,48),m,[0,0,0],w);o.rotation.y=Math.PI/2;}
  tube([-.05,0,0],[.05,0,0],.027,silver,w);
  const verts=[];for(let k=0;k<24;k++){const a=k*Math.PI/12;verts.push(k%2?.026:-.026,0,0,0,Math.sin(a)*.28,Math.cos(a)*.28);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));w.add(new T.LineSegments(g,new T.LineBasicMaterial({color:0xb6c7ca})));
  const disc=mesh(new T.TorusGeometry(.067,.009,4,20),silver,[-.045,0,0],w);disc.rotation.y=Math.PI/2;
  return w;
 }
 const rearWheel=wheel(rear,body),frontWheel=wheel([0,.13,-.48],steering);
 const pedals=new T.Group();pedals.name='Crank';pedals.position.set(...crank);body.add(pedals);
 tube([-.13,0,0],[.13,0,0],.02,steel,pedals);
 for(const s of [-1,1]){tube([s*.10,0,0],[s*.10,s*.15,0],.012,silver,pedals);box(.105,.07,.025,[s*.15,s*.15,0],dark,pedals);}
 const chainring=mesh(new T.TorusGeometry(.095,.009,6,32),silver,[.08,-.10,.30]);chainring.rotation.y=Math.PI/2;
 tube([.085,-.55,.38],[.085,-.10,.395],.005,dark);tube([.085,-.55,.30],[.085,-.10,.205],.005,dark);
 tube([-.065,-.08,.31],[-.14,-.24,.07],.008,silver);
 // Brake cable curve, rear reflector and front lamp.
 const cable=new T.CatmullRomCurve3([[.2,.45,1.065],[.17,.62,.96],[.08,.55,.65]].map(p=>new T.Vector3(...p)));
 mesh(new T.TubeGeometry(cable,12,.003,4,false),dark,[0,0,0]);
 box(.055,.025,.045,[0,-.32,.94],new T.MeshStandardMaterial({color:0xb82925}));
 box(.065,.06,.045,[0,.47,1.05],new T.MeshStandardMaterial({color:0xebf4da,emissive:0x353d25}));

 const shirt=new T.MeshStandardMaterial({color:0x428ca1,roughness:.9}),skin=new T.MeshStandardMaterial({color:0x986846,roughness:.85});
 const rider=new T.Group();rider.name='Helmeted cyclist';body.add(rider);
 function oval(p,scale,material){const o=mesh(new T.SphereGeometry(1,12,8),material,p,rider);o.scale.set(...scale);return o;}
 oval([0,-.24,1.13],[.15,.12,.14],dark);oval([0,-.08,1.40],[.19,.12,.25],shirt);
 tube([0,.015,1.56],[0,.07,1.64],.055,skin,rider);oval([0,.10,1.73],[.125,.14,.16],skin);oval([0,.075,1.82],[.145,.17,.095],dark);
 for(const side of [-1,1]){tube([side*.15,-.03,1.51],[side*.22,.21,1.27],.055,shirt,rider);tube([side*.22,.21,1.27],[side*.27,.44,1.10],.037,skin,rider);oval([side*.27,.44,1.10],[.045,.055,.035],skin);}
 const legs=[-1,1].map(side=>({side,upper:tube([0,0,0],[0,1,0],.062,dark,rider),lower:tube([0,0,0],[0,1,0],.042,dark,rider),shoe:oval([0,0,0],[.06,.12,.045],dark)}));
 function limb(o,a,b){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.sub(av);o.position.copy(av.addScaledVector(d,.5));o.scale.y=d.length();o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());}
 function updateRider(angle){for(const leg of legs){const s=leg.side,foot=[s*.15,-.10+s*.15*Math.cos(angle),.34+s*.15*Math.sin(angle)],hip=[s*.105,-.24,1.13],knee=[s*.15,.12,.74+(foot[2]-.34)*.45];limb(leg.upper,hip,knee);limb(leg.lower,knee,foot);leg.shoe.position.set(...foot);}}
 updateRider(0);
 group.userData={vehicle:'cycle',wheelRadius:.34,originalAsset:true};
 return {group,body,updateRider,wheels,front:steering,steering,frontWheel,rearWheel,pedals,wheelRadius:.34};
}
