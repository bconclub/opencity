// Original geometry guided by the user's reference photos. No stock-photo textures.
export function createAuto(T){
 const group=new T.Group(),body=new T.Group();group.add(body);
 const paint=new T.MeshStandardMaterial({color:0x087448,roughness:.38,metalness:.28});
 const yellow=new T.MeshStandardMaterial({color:0xf1c928,roughness:.72});
 const rubber=new T.MeshStandardMaterial({color:0x19221d,roughness:.95});
 const trim=new T.MeshStandardMaterial({color:0x303831,roughness:.55,metalness:.2});
 const glass=new T.MeshStandardMaterial({color:0x3b6468,roughness:.16,metalness:.5});
 const steel=new T.MeshStandardMaterial({color:0xa9aca4,roughness:.33,metalness:.7});
 const red=new T.MeshStandardMaterial({color:0xa91c16,roughness:.25,emissive:0x260400});
 const white=new T.MeshStandardMaterial({color:0xd9d8c4,roughness:.28});
 function mesh(g,m,x=0,y=0,z=0,parent=body){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 function roundedShape(x,y,w,h,r){const s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
 function slab(w,h,d,r,m,x,y,z,parent=body){const g=new T.ExtrudeGeometry(roundedShape(-w/2,-h/2,w,h,r),{depth:d,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,steps:1,curveSegments:6});g.translate(0,0,-d/2);g.rotateX(Math.PI/2);return mesh(g,m,x,y,z,parent);}
 function box(w,d,h,m,x,y,z,parent=body){return mesh(new T.BoxGeometry(w,d,h),m,x,y,z,parent);}
 function pipe(points,r,m,parent=body){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(8,points.length*5),r,6,false),m,0,0,0,parent);}
 box(1.42,2.46,.12,trim,0,-.02,.42);box(1.36,1.92,.1,rubber,0,-.1,.55);
 // Closed rear engine hatch and raised ventilation ribs.
 slab(1.47,.78,.075,.10,paint,0,-1.23,.88);
 slab(1.03,.56,.045,.055,paint,0,-1.289,.88);
 for(let row=0;row<5;row++)for(const side of [-1,1]){slab(.35,.033,.015,.014,trim,side*.24,-1.32,.69+row*.087);slab(.35,.016,.02,.008,paint,side*.24,-1.338,.706+row*.087);}
 for(const x of [-.49,.49])for(const z of [.7,1.08])slab(.045,.075,.023,.009,steel,x,-1.33,z);
 for(const x of [-.62,.62]){slab(.16,.31,.048,.023,trim,x,-1.29,.9);slab(.125,.105,.018,.014,red,x,-1.326,1.0);slab(.125,.09,.018,.012,white,x,-1.326,.895);slab(.125,.085,.018,.012,red,x,-1.326,.803);}
 slab(1.52,.13,.12,.04,yellow,0,-1.3,.48);slab(1.51,.048,.13,.017,trim,0,-1.3,.40);
 pipe([[-.64,-1.1,.29],[-.2,-1.24,.24],[.48,-1.24,.24]],.055,trim);
 // The rear canopy is a solid fabric shell with a small genuine opening.
 const rear=roundedShape(-.795,1.23,1.59,.88,.19),opening=roundedShape(-.36,1.42,.72,.37,.095);rear.holes.push(new T.Path(opening.getPoints(24)));
 const rearGeo=new T.ExtrudeGeometry(rear,{depth:.035,bevelEnabled:false,curveSegments:16});rearGeo.rotateX(Math.PI/2);mesh(rearGeo,yellow,0,-1.23,0);
 const rearPane=slab(.69,.34,.016,.08,glass,0,-1.24,1.605);
 const gasketPoints=opening.getPoints(40).map(p=>[p.x,-1.273,p.y]);gasketPoints.push(gasketPoints[0]);pipe(gasketPoints,.012,trim);
 pipe([[-.75,-1.272,1.25],[-.38,-1.277,1.235],[0,-1.277,1.24],[.38,-1.277,1.235],[.75,-1.272,1.25]],.024,trim);
 const positions=[],uv=[],indices=[],nx=24,ny=12;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const x=(i/nx-.5)*1.59,y=-1.23+j/ny*2.15,z=1.98+.135*Math.sqrt(Math.max(0,1-(x/.8)**2))-.055*(j/ny)**8;positions.push(x,y,z);uv.push(i/nx,j/ny);if(i<nx&&j<ny){const a=j*(nx+1)+i;indices.push(a,a+1,a+nx+2,a,a+nx+2,a+nx+1);}}
 const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(positions,3));roof.setAttribute('uv',new T.Float32BufferAttribute(uv,2));roof.setIndex(indices);roof.computeVertexNormals();const fabric=yellow.clone();fabric.side=T.DoubleSide;mesh(roof,fabric);
 for(const side of [-1,1]){
  // Rear quarter curtain leaves the passenger entry fully open.
  const curtain=box(.035,.58,.69,yellow,side*.767,-.95,1.62);
  pipe([[side*.785,-1.18,1.31],[side*.793,-1.18,1.96],[side*.793,.83,1.94]],.019,yellow);
  pipe([[side*.68,.68,.58],[side*.73,.68,1.32],[side*.7,.72,1.91]],.025,trim);
  pipe([[side*.7,-.55,.54],[side*.7,-.55,1.32]],.022,trim);
  box(.09,1.0,.055,trim,side*.7,.02,.47);
  // Rear side body with open wheel arch, shaped in the Y/Z plane.
  const panel=new T.Shape();panel.moveTo(-1.24,.48);panel.lineTo(-1.24,1.23);panel.lineTo(-.40,1.23);panel.lineTo(-.40,.48);panel.lineTo(-.47,.48);for(let k=0;k<=24;k++){const a=k/24*Math.PI;panel.lineTo(-.84+.37*Math.cos(a),.32+.37*Math.sin(a));}panel.lineTo(-1.24,.48);
  const g=new T.ExtrudeGeometry(panel,{depth:.055,bevelEnabled:false,curveSegments:8});const m=mesh(g,paint,side*.72,0,0);m.rotation.set(Math.PI/2,0,Math.PI/2); // local x -> world y, local y -> world z
  const arch=[];for(let k=0;k<=24;k++){const a=k/24*Math.PI;arch.push([side*.78,-.84+.385*Math.cos(a),.32+.385*Math.sin(a)]);}pipe(arch,.023,paint);
 }
 // Passenger bench and driver position.
 box(1.2,.43,.14,rubber,0,-.76,.82);box(1.2,.12,.44,rubber,0,-1.0,1.05);box(.52,.42,.13,rubber,0,.31,.78);box(.48,.1,.43,rubber,0,.12,1.02);
 // Sloped nose and framed windscreen.
 const nose=slab(1.2,.63,.29,.17,paint,0,1.02,.94);nose.rotation.x+=.12;
 const wind=slab(1.16,.64,.035,.09,glass,0,.97,1.57);wind.rotation.x=-.16;
 for(const side of [-1,1])pipe([[side*.58,1.02,1.25],[side*.59,.91,1.91],[side*.48,.82,1.97]],.029,yellow);
 pipe([[-.59,1.035,1.23],[0,1.065,1.2],[.59,1.035,1.23]],.035,yellow);
 pipe([[-.57,.91,1.9],[0,.9,1.93],[.57,.91,1.9]],.028,yellow);
 pipe([[.1,1.00,1.28],[-.18,.99,1.56]],.009,trim);
 for(const x of [-.45,.45]){slab(.2,.18,.035,.06,white,x,1.198,.98);slab(.11,.06,.03,.012,yellow,x,1.205,1.11);pipe([[Math.sign(x)*.55,.9,1.49],[Math.sign(x)*.82,.96,1.58]],.014,steel);slab(.16,.20,.04,.045,trim,Math.sign(x)*.84,.96,1.62);}
 pipe([[-.24,.62,1.04],[0,.73,1.06],[.24,.62,1.04]],.024,trim);
 const wheels=[],front=new T.Group();front.position.set(0,1.12,.31);body.add(front);
 function wheel(x,y,parent){const holder=new T.Group();holder.position.set(x,y,parent===body?.31:0);parent.add(holder);const tire=mesh(new T.TorusGeometry(.235,.077,10,24),rubber,0,0,0,holder);tire.rotation.y=Math.PI/2;const rim=mesh(new T.CylinderGeometry(.17,.17,.13,24),steel,0,0,0,holder);rim.rotation.z=Math.PI/2;for(const side of [-1,1]){const hub=mesh(new T.CylinderGeometry(.071,.071,.018,12),trim,side*.08,0,0,holder);hub.rotation.z=Math.PI/2;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const bolt=mesh(new T.SphereGeometry(.013,6,4),trim,side*.074,Math.sin(a)*.115,Math.cos(a)*.115,holder);}}wheels.push(holder);}
 wheel(-.73,-.84,body);wheel(.73,-.84,body);wheel(0,0,front);
 const fender=new T.CylinderGeometry(.385,.385,.24,24,1,true,0,Math.PI);fender.rotateZ(Math.PI/2);fender.rotateX(Math.PI/2);mesh(fender,paint,0,0,0,front);
 // Fictional registration plate, not copied from the supplied photograph.
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#e7bf20';c.fillRect(0,0,256,128);c.fillStyle='#182b20';c.textAlign='center';c.font='bold 42px sans-serif';c.fillText('KA 01',128,50);c.font='bold 35px sans-serif';c.fillText('EX 0001',128,98);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const plate=mesh(new T.PlaneGeometry(.30,.15),new T.MeshStandardMaterial({map:tex,roughness:.6}),.52,-1.368,.615);plate.rotation.x=Math.PI/2;
 // Batch static parts by material, leaving wheels and steering independently animated.
 function batch(parent,skip){const bins=new Map();for(const o of [...parent.children]){if(skip.has(o)||!o.isMesh)continue;o.updateMatrix();const key=o.material;let bin=bins.get(key);if(!bin){bin=[];bins.set(key,bin);}const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);bin.push(g);parent.remove(o);o.geometry.dispose();}for(const [material,gs]of bins){const geo=new T.BufferGeometry();for(const name of ['position','normal','uv']){const values=[];for(const g of gs){const a=g.getAttribute(name);if(a)values.push(...a.array);}if(values.length)geo.setAttribute(name,new T.Float32BufferAttribute(values,name==='uv'?2:3));}geo.computeBoundingSphere();parent.add(new T.Mesh(geo,material));gs.forEach(g=>g.dispose());}}
 batch(body,new Set([...wheels,front]));for(const w of wheels)batch(w,new Set());batch(front,new Set(wheels));
 return{group,body,wheels,front};
}
