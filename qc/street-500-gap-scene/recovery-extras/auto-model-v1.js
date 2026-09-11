export function createAuto(T){
 const group=new T.Group(),body=new T.Group();group.add(body);
 const green=new T.MeshStandardMaterial({color:0x238658,roughness:.5,metalness:.2}),yellow=new T.MeshStandardMaterial({color:0xe9c13d,roughness:.6}),black=new T.MeshStandardMaterial({color:0x202b28,roughness:.8}),glass=new T.MeshStandardMaterial({color:0x284953,roughness:.18,metalness:.6}),metal=new T.MeshStandardMaterial({color:0xb9c2b9,roughness:.3,metalness:.7}),seat=new T.MeshStandardMaterial({color:0x553c28,roughness:1});
 function mesh(g,m,x,y,z,parent=body){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 const box=(x,y,z,w,d,h,m,parent)=>mesh(new T.BoxGeometry(w,d,h),m,x,y,z,parent);
 box(0,-.15,.56,1.48,2.55,.22,green);box(0,-1.18,1.03,1.5,.18,.75,green);
 for(const x of [-.72,.72]){box(x,-.63,.91,.12,1.2,.63,green);}
 // Keep passenger openings open; only the narrow corner posts carry the canopy.
 for(const x of [-.7,.7]){const opening=body.children.find(o=>o.position.x===x&&o.position.z===1.42);if(opening){body.remove(opening);opening.geometry.dispose();}for(const y of [-1.08,.68])box(x,y,1.45,.05,.05,1.15,black);}
 box(0,-.24,2.02,1.55,2.2,.16,yellow);mesh(new T.SphereGeometry(1,24,12),yellow,0,-.26,2.06).scale.set(.77,1.05,.16);
 box(0,1,.96,1.2,.62,.68,green);box(0,1.22,1.49,1.16,.055,.69,glass);box(0,1.26,1.13,1.28,.08,.12,yellow);
 for(const x of [-.61,.61]){box(x,1.19,1.49,.055,.08,.75,yellow);box(x,1.4,.87,.18,.07,.17,new T.MeshStandardMaterial({color:0xfff1c2,emissive:0x493b13}));box(x,-1.29,.95,.16,.04,.15,new T.MeshStandardMaterial({color:0xc63821}));}
 box(0,1.22,1.86,1.27,.07,.08,yellow);box(0,1.45,.56,1.24,.1,.12,black);box(0,-.83,.84,1.2,.53,.16,seat);box(0,-1.01,1.13,1.2,.12,.51,seat);box(0,.4,.87,.56,.5,.13,black);
 // Driver silhouette and handlebar, visible through the open cabin.
 box(0,.35,1.18,.4,.28,.48,new T.MeshStandardMaterial({color:0x516878}));mesh(new T.SphereGeometry(.15,12,8),new T.MeshStandardMaterial({color:0x9e7151}),0,.39,1.58);box(0,.76,1.15,.62,.055,.055,metal);
 for(const x of [-.78,.78]){box(x,1.13,1.45,.22,.04,.035,black);box(x*1.14,1.13,1.51,.16,.05,.21,black);}
 const wheels=[],front=new T.Group();front.position.set(0,1.12,.31);body.add(front);
 function wheel(x,y,parent){const holder=new T.Group();holder.position.set(x,y,parent===body ? .31 : 0);parent.add(holder);const tire=mesh(new T.TorusGeometry(.235,.078,8,16),black,0,0,0,holder);tire.rotation.y=Math.PI/2;const rim=mesh(new T.CylinderGeometry(.18,.18,.10,12),metal,0,0,0,holder);rim.rotation.z=Math.PI/2;box(0,0,0,.11,.04,.32,black,holder);wheels.push(holder);}
 wheel(-.73,-.84,body);wheel(.73,-.84,body);wheel(0,0,front);
 const plateCanvas=document.createElement('canvas');plateCanvas.width=128;plateCanvas.height=48;const c=plateCanvas.getContext('2d');c.fillStyle='#edc447';c.fillRect(0,0,128,48);c.fillStyle='#1f2c25';c.font='bold 28px sans-serif';c.textAlign='center';c.fillText('KA 01',64,34);const tex=new T.CanvasTexture(plateCanvas);tex.colorSpace=T.SRGBColorSpace;const plate=mesh(new T.PlaneGeometry(.45,.17),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}),0,-1.282,.8);plate.rotation.x=Math.PI/2;
 return{group,body,wheels,front};
}
