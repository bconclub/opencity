// Original photographic reconstruction. Z-up, metres, base exactly at z=0.
// Estimated dimensions, not surveyed hardware. No placement inference occurs here.
export const FRONTAGE_LAMP_REFERENCE = Object.freeze({
  title:'Dr Ambedkar Veedhi, Bengaluru (01)',author:'Moheen Reeyad',date:'2019-06-22',
  url:'https://commons.wikimedia.org/wiki/File:Dr_Ambedkar_Veedhi,_Bengaluru_(01).jpg',
  referenceLicense:'CC BY-SA 4.0',heightMetres:4.6,headWidthMetres:1.04,
  accuracy:'Original visual reconstruction; dimensions estimated; no surveyed pole bases',
});

export function createFrontageLampGeometry(T){
  const positions=[],normals=[],colors=[],parts=[];
  const WHITE=0xd6d6ce,TRIM=0xc5c7c0,DARK=0x303a3b,DIFFUSER=0xc8cac2;
  function add(geometry,color,name){
    const flat=geometry.index?geometry.toNonIndexed():geometry,c=new T.Color(color),start=positions.length/3;
    positions.push(...flat.attributes.position.array);normals.push(...flat.attributes.normal.array);
    for(let i=0;i<flat.attributes.position.count;i++)colors.push(c.r,c.g,c.b);
    parts.push({name,start,count:flat.attributes.position.count});if(flat!==geometry)flat.dispose();geometry.dispose();
  }
  function lathe(profile,color,name,segments=24){
    const g=new T.LatheGeometry(profile.map(([r,z])=>new T.Vector2(r,z)),segments);
    g.rotateX(Math.PI/2);add(g,color,name);
  }
  function rod(a,b,r,color,name){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
    const g=new T.CylinderGeometry(r,r,delta.length(),6);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));
    g.translate(...start.add(end).multiplyScalar(.5).toArray());add(g,color,name);
  }
  // Rounded stepped foot and bell-shaped shaft transition are visible in the reference.
  lathe([[0,0],[.255,0],[.255,.07],[.225,.10],[.225,.16],[.19,.19],[.16,.22],[.125,.32],[.10,.46],[.09,.52]],TRIM,'stepped-foot');
  lathe([[.105,.43],[.115,.47],[.115,.51],[.097,.55],[.084,.62]],WHITE,'lower-collar');
  // Twelve restrained ribs model the white fluted shaft without extra objects.
  const p=[],indices=[],segments=48,rings=[[.080,.51],[.076,.65],[.066,1.2],[.061,2.5],[.057,3.82]];
  for(const [radius,z] of rings)for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2,r=radius+.0045*Math.cos(a*12);p.push(Math.cos(a)*r,Math.sin(a)*r,z);
  }
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
    const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);
  }
  const shaft=new T.BufferGeometry();shaft.setAttribute('position',new T.Float32BufferAttribute(p,3));shaft.setIndex(indices);shaft.computeVertexNormals();add(shaft,WHITE,'fluted-shaft');
  lathe([[.057,3.75],[.077,3.77],[.077,3.84],[.064,3.88],[.064,3.94]],TRIM,'upper-collar');
  lathe([[.058,3.87],[.093,3.93],[.106,4.00],[.106,4.04]],DARK,'dark-neck',12);
  // Faceted translucent-looking panels remain opaque for cheap daylight instancing.
  // Broad top, narrow bottom: the previous game's pointed lantern silhouette was wrong.
  lathe([[.106,4.00],[.492,4.48]],DIFFUSER,'six-diffuser-panels',6);
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2;rod([Math.sin(a)*.11,-Math.cos(a)*.11,4.00],[Math.sin(a)*.496,-Math.cos(a)*.496,4.48],.014,DARK,'head-rib-'+i);
  }
  lathe([[.10,3.99],[.12,4.00],[.12,4.035],[.105,4.05]],DARK,'bottom-frame',12);
  lathe([[.49,4.46],[.52,4.485],[.52,4.51],[.49,4.53],[.34,4.58],[0,4.60]],DARK,'broad-shallow-cap',24);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData={reference:FRONTAGE_LAMP_REFERENCE,parts,triangles:positions.length/9};return geometry;
}

// Input positions are caller-owned Cartesian scene coordinates; copied without offsets.
// No OSM nodes are fetched, modified or assigned this fixture automatically.
export function createFrontageLampBatch(T,placements){
  for(const p of placements)if(![p.x,p.y,p.z,p.heading??0].every(Number.isFinite))throw new TypeError('Finite x, y, z and optional heading radians required');
  const geometry=createFrontageLampGeometry(T),material=new T.MeshLambertMaterial({vertexColors:true});
  const mesh=new T.InstancedMesh(geometry,material,placements.length),dummy=new T.Object3D();
  placements.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,0,p.heading??0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();
  mesh.userData={reference:FRONTAGE_LAMP_REFERENCE,placementsAreUnmodified:true};
  return {mesh,dispose(){mesh.dispose();geometry.dispose();material.dispose();},state:()=>({instances:placements.length,trianglesPerFixture:geometry.userData.triangles,materials:1,textures:0,drawCalls:placements.length?1:0,reference:FRONTAGE_LAMP_REFERENCE})};
}
