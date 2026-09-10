// Original OpenCity quadcopter. Metres: X right, Y forward, Z up.
export function createDrone(T) {
  const group = new T.Group(), body = new T.Group();
  group.name = 'OpenCity survey drone'; group.add(body);
  const shell = new T.MeshStandardMaterial({color:0xe3e8e5,metalness:.3,roughness:.33});
  const carbon = new T.MeshStandardMaterial({color:0x202c31,metalness:.35,roughness:.55});
  const accent = new T.MeshStandardMaterial({color:0xeb7739,metalness:.15,roughness:.4});
  const lens = new T.MeshStandardMaterial({color:0x134352,metalness:.8,roughness:.12});
  const green = new T.MeshStandardMaterial({color:0x46d7a4,emissive:0x178757,emissiveIntensity:1.3});
  const red = new T.MeshStandardMaterial({color:0xe85648,emissive:0x7b170e,emissiveIntensity:1.3});
  function mesh(geometry, material, position, parent=body) {
    const m = new T.Mesh(geometry,material); m.position.set(...position); parent.add(m); return m;
  }
  function box(size,material,position,parent=body) {return mesh(new T.BoxGeometry(...size),material,position,parent);}
  function tube(a,b,r,material,parent=body) {
    const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
    const m=mesh(new T.CylinderGeometry(r,r,delta.length(),10),material,start.add(end).multiplyScalar(.5).toArray(),parent);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
  }
  const hull=mesh(new T.SphereGeometry(1,24,12),shell,[0,0,.31]);hull.scale.set(.24,.34,.115);
  box([.17,.25,.025],carbon,[0,-.025,.424]);box([.03,.2,.01],accent,[0,-.04,.442]);
  for(const side of [-1,1])for(let i=0;i<4;i++)box([.014,.11,.007],carbon,[side*(.135+i*.015),-.06,.402-i*.006]);
  const rotors=[],rotorDiscs=[],rotorDirections=[];
  for(const [i,[x,y]] of [[-.49,.44],[.49,.44],[.49,-.44],[-.49,-.44]].entries()) {
    tube([Math.sign(x)*.13,Math.sign(y)*.15,.31],[x,y,.35],.036,carbon);
    tube([x,y,.31],[x,y,.41],.052,shell);
    const rotor=new T.Group();rotor.name=`Propeller ${i+1}`;rotor.position.set(x,y,.425);body.add(rotor);
    for(const angle of [0,Math.PI]) {
      const shape=new T.Shape();shape.moveTo(.025,-.013);shape.lineTo(.19,-.033);shape.quadraticCurveTo(.27,-.03,.275,.0);shape.lineTo(.17,.027);shape.lineTo(.025,.015);shape.closePath();
      const blade=mesh(new T.ExtrudeGeometry(shape,{depth:.006,bevelEnabled:false}),carbon,[0,0,0],rotor);blade.rotation.z=angle;
    }
    const hub=mesh(new T.SphereGeometry(.03,12,8),accent,[0,0,.01],rotor);hub.scale.z=.5;
    const disc=mesh(new T.RingGeometry(.035,.275,32),new T.MeshBasicMaterial({color:0x93a5ac,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),[x,y,.424]);
    rotors.push(rotor);rotorDiscs.push(disc);rotorDirections.push(i%2?1:-1);
    mesh(new T.SphereGeometry(.019,10,6),y>0?green:red,[x,y,.295]);
  }
  for(const side of [-1,1]) {
    for(const y of [-.18,.18])tube([side*.13,y,.28],[side*.22,y,.045],.016,carbon);
    tube([side*.22,-.29,.035],[side*.22,.29,.035],.018,carbon);
  }
  tube([0,.16,.24],[0,.16,.17],.025,carbon);
  const gimbal=new T.Group();gimbal.name='Camera gimbal';gimbal.position.set(0,.17,.145);body.add(gimbal);
  box([.12,.11,.1],carbon,[0,0,0],gimbal);
  const cameraLens=mesh(new T.CylinderGeometry(.035,.035,.03,20),lens,[0,.07,0],gimbal);
  tube([-.09,.17,.2],[-.09,.17,.13],.012,shell);tube([.09,.17,.2],[.09,.17,.13],.012,shell);
  group.userData.asset={author:'OpenCity',units:'metres',forward:'+Y',up:'+Z'};
  return {group,body,rotors,rotorDiscs,rotorDirections,gimbal,cameraLens};
}

