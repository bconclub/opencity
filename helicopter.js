// Original utility-helicopter model. Local coordinates: x right, y nose, z up.
export function createHelicopter(T){
 const group=new T.Group();group.name='Helicopter heading';
 const body=new T.Group();body.name='Airframe attitude';group.add(body);
 const paint=new T.MeshStandardMaterial({color:0xe8ede7,roughness:.35,metalness:.32});
 const red=new T.MeshStandardMaterial({color:0xc84629,roughness:.36,metalness:.25});
 const glass=new T.MeshStandardMaterial({color:0x173e4a,roughness:.12,metalness:.72});
 const carbon=new T.MeshStandardMaterial({color:0x24302e,roughness:.62,metalness:.18});
 const steel=new T.MeshStandardMaterial({color:0x859792,roughness:.25,metalness:.8});
 const tip=new T.MeshStandardMaterial({color:0xf4c962,roughness:.5});
 function mesh(geo,mat,x=0,y=0,z=0,parent=body){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
 function tube(a,b,r,mat,parent=body,r2=r){const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);const m=mesh(new T.CylinderGeometry(r2,r,delta.length(),12),mat,0,0,0,parent);m.position.copy(from.add(to).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
 function panel(points,mat,parent=body){const vertices=[];for(let i=1;i<points.length-1;i++)vertices.push(...points[0],...points[i],...points[i+1]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const material=mat.clone();material.side=T.DoubleSide;return mesh(geo,material,0,0,0,parent);}
 // A shaped fuselage instead of a uniformly scaled sphere.
 const sections=[[-2.8,.25,.48],[-2.2,.82,.95],[-1.2,1.2,1.17],[.1,1.34,1.22],[1.35,1.25,1.08],[2.35,.93,.77],[2.9,.45,.42],[3.08,.04,.08]];
 const vertices=[],indices=[],segments=32;
 for(const [y,rx,rz]of sections)for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2;vertices.push(Math.cos(a)*rx,y,2.12+Math.sin(a)*rz);}
 for(let j=0;j<sections.length-1;j++)for(let i=0;i<segments;i++){const a=j*segments+i,b=j*segments+(i+1)%segments,c=a+segments,d=b+segments;indices.push(a,c,b,b,c,d);}
 const hull=new T.BufferGeometry();hull.setAttribute('position',new T.Float32BufferAttribute(vertices,3));hull.setIndex(indices);hull.computeVertexNormals();mesh(hull,paint);
 // Front bubble and dark cabin glazing, with structural posts outside the glass.
 mesh(new T.SphereGeometry(1,32,20),glass,0,1.7,2.52).scale.set(1.21,1.12,.81);
 tube([0,2.7,2],[0,2.05,3.24],.045,paint);
 for(const sign of [-1,1]){
  panel([[sign*1.285,-1.2,1.8],[sign*1.32,.55,1.8],[sign*1.12,.7,2.98],[sign*1.06,-1.15,3.0]],glass);
  tube([sign*1.31,-.45,1.82],[sign*1.15,-.45,3.04],.04,paint);
  tube([sign*1.29,-1.24,1.6],[sign*1.29,.6,1.6],.04,red);
  tube([sign*1.35,-.85,1.63],[sign*1.35,-.55,1.63],.035,carbon);
  tube([sign*1.5,-2,.32],[sign*1.5,1.95,.32],.09,steel);
  tube([sign*1.5,1.95,.32],[sign*1.5,2.35,.63],.09,steel);
  for(const y of [-1.25,1.1])tube([sign*.82,y,1.35],[sign*1.5,y,.35],.075,steel);
 }
 mesh(new T.SphereGeometry(1,24,12),red,0,-.9,3.16).scale.set(.85,1.7,.55);
 for(const x of [-.67,.67]){tube([x,-1.55,3.12],[x,-2.4,3.3],.22,steel);mesh(new T.SphereGeometry(.2,12,8),carbon,x,-2.45,3.3);}
 tube([0,-2.15,2.2],[0,-8.1,3.25],.52,red,body,.13);
 panel([[-.1,-8.3,3],[-.1,-8.1,5.2],[-.1,-7.5,5.4],[-.1,-7.2,3.1]],red);
 panel([[-.11,-8.1,4.3],[-.11,-8.1,5.2],[-.11,-7.5,5.4],[-.11,-7.35,4.4]],paint);
 panel([[-2.0,-6.5,2.96],[2.0,-6.5,2.96],[1.75,-7.15,3.0],[-1.75,-7.15,3.0]],paint);
 tube([0,-.3,3.3],[0,-.3,4.18],.13,steel);
 const rotor=new T.Group();rotor.name='Main rotor';rotor.position.set(0,-.3,4.16);body.add(rotor);
 mesh(new T.SphereGeometry(.29,12,10),steel,0,0,0,rotor);
 for(let i=0;i<5;i++){
  const blade=new T.Group();blade.rotation.z=i*Math.PI*2/5;rotor.add(blade);
  panel([[.25,-.13,0],[6.4,-.18,.06],[6.14,.16,.06],[.6,.24,0]],carbon,blade);
  panel([[5.87,-.17,.065],[6.4,-.18,.065],[6.14,.16,.065],[5.86,.16,.065]],tip,blade);
  tube([.2,0,-.05],[.9,0,-.05],.045,steel,blade);
 }
 const blurMaterial=new T.MeshBasicMaterial({color:0x8b9c93,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false});
 const rotorDisc=mesh(new T.RingGeometry(.6,6.4,64),blurMaterial,0,-.3,4.18);
 const tailRotor=new T.Group();tailRotor.name='Tail rotor';tailRotor.position.set(.29,-7.94,3.45);body.add(tailRotor);
 for(let i=0;i<4;i++){const blade=new T.Group();blade.rotation.x=i*Math.PI/2;tailRotor.add(blade);mesh(new T.BoxGeometry(.08,1.02,.14),carbon,0,.5,0,blade);mesh(new T.BoxGeometry(.09,.16,.15),tip,0,.91,0,blade);}
 tube([-.16,-7.94,3.45],[.38,-7.94,3.45],.12,steel);
 tube([0,-1.6,3.55],[0,-1.85,4.0],.025,carbon);
 mesh(new T.SphereGeometry(.10,10,8),new T.MeshBasicMaterial({color:0xc42f23}),-1.43,-.3,2.2);
 mesh(new T.SphereGeometry(.10,10,8),new T.MeshBasicMaterial({color:0x389c68}),1.43,-.3,2.2);
 group.scale.setScalar(1.45);
 return{group,body,rotor,tailRotor,rotorDisc};
}
