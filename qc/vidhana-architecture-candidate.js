// REVIEW ONLY. This file is not imported by the game.
// Official column/stair dimensions: https://kla.kar.nic.in/council/vds.htm
// North-wing datum is provisionally shared across the flat review ground.
export const ARCHITECTURE_DIMENSIONS=Object.freeze({columnCount:12,columnHeight:12.192,steps:45,stairWidth:62.1792,stairDepth:21.336,landingZ:6.75,canopyBottom:18.942,canopyTop:20.742,wingRoofZ:19.3548,centralWingRoofZ:34.1376,centralDomeTopZ:45.72,northSouthGradeDifference:3.048,datum:'Estimated north-side ground datum shared across flat review ground; south cellar/terrain unresolved'});
export function buildLandmarks(T,data,xy){
 data={...data,features:data.features.filter(f=>f.properties.site==='Vidhana Soudha')};
 const D=ARCHITECTURE_DIMENSIONS,wingScale=D.wingRoofZ/30;
 const portico=data.features.find(f=>f.properties.osm_id==='relation/5519270')?.geometry.coordinates[0].map(xy)||[];
 function inPortico(x,y){let inside=false,near=false;for(let i=0,j=portico.length-1;i<portico.length;j=i++){const a=portico[i],b=portico[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)<.35)near=true;}return inside||near;}
 const group=new T.Group(),batches=new Map();let domes=0;
 function material(colour,glass=false){const key=colour+'|'+glass;if(!batches.has(key))batches.set(key,{material:new T.MeshStandardMaterial({color:colour,roughness:glass?.26:.86,metalness:glass?.3:0,side:T.DoubleSide}),p:[],preservedNormals:[]});return batches.get(key);}
 // Preserve primitive normals after the nonuniform transform. Computing normals
 // on the final unindexed batch otherwise facets every dome triangle.
 function append(geometry,batch,matrix){const g=geometry.index?geometry.toNonIndexed():geometry;g.applyMatrix4(matrix);const p=g.getAttribute('position'),start=batch.p.length;for(let i=0;i<p.count;i++)batch.p.push(p.getX(i),p.getY(i),p.getZ(i));const n=g.getAttribute('normal');if(n)batch.preservedNormals.push({start,values:new Float32Array(n.array)});if(g!==geometry)g.dispose();geometry.dispose();}
 function surface(points,batch){const contour=points[0].map(p=>new T.Vector2(...p)),holes=points.slice(1).map(r=>r.map(p=>new T.Vector2(...p))),all=[...contour,...holes.flat()];return{contour,holes,all,tri:T.ShapeUtils.triangulateShape(contour,holes)};}
 for(const f of data.features){const starts=new Map([...batches].map(([key,b])=>[key,b.p.length]));const p=f.properties;if(['relation/5518183','relation/5518184','relation/5519270'].includes(p.osm_id))continue;const rings=f.geometry.coordinates.map((r,index)=>{const points=r.slice(0,-1).map(xy),area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0);if((index===0&&area<0)||(index>0&&area>0))points.reverse();return points;});if(rings[0].length<3)continue;
  const h=Number(p.height)||8,base=Number(p.min_height)||0,shape=p['roof:shape']||'flat',curved=['onion','dome'].includes(shape),pyramid=shape==='pyramidal';
  const stone=p.site==='Vidhana Soudha'?'#d2ccbf':p['building:colour']||p['roof:colour']||'#c8c1ad';const wall=material(stone,p['building:material']==='glass'),roof=material(p.site==='Vidhana Soudha'?(p['roof:colour']==='red'?'#ac624d':p['roof:material']==='glass'?'#b4c9c4':stone):p['roof:colour']||stone,p['roof:material']==='glass');
  const roofHeight=curved?Math.min(Number(p['roof:height'])||h-base,h-base):pyramid?h-base:0,wallTop=h-roofHeight;
  for(const r of rings)for(let i=0;i<r.length;i++){const first=r[i],last=r[(i+1)%r.length],count=p.osm_id==='relation/5284317'?Math.ceil(Math.hypot(last[0]-first[0],last[1]-first[1])):1;for(let k=0;k<count;k++){const at=t=>[first[0]+(last[0]-first[0])*t,first[1]+(last[1]-first[1])*t],a=at(k/count),b=at((k+1)/count),bottom=p.osm_id==='relation/5284317'&&inPortico((a[0]+b[0])/2,(a[1]+b[1])/2)?D.canopyBottom/wingScale:base;wall.p.push(a[0],a[1],bottom,b[0],b[1],bottom,b[0],b[1],wallTop,a[0],a[1],bottom,b[0],b[1],wallTop,a[0],a[1],wallTop);}}
  if(p.osm_id==='relation/5284317'){
   const glazing=material('#253b39'),trim=material('#d8d1c3');
   // Reference-supported storey hierarchy, estimated dimensions on mapped walls.
   for(const r of rings)for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<14)continue;const ux=dx/len,uy=dy/len,nx=uy,ny=-ux,count=Math.floor(len/4.7);
    function opening(cx,cy,z,w,height,batch,offset,shape='rect'){
     let local;
     if(shape==='arch'){local=[[0,0],[w,0],[w,height-w/2]];for(let k=0;k<=12;k++){const angle=k/12*Math.PI;local.push([w/2+Math.cos(angle)*w/2,height-w/2+Math.sin(angle)*w/2]);}}
     else if(shape==='shouldered'){const t=w*.15;local=[[0,0],[w,0],[w,height-t*1.9],[w-t*.5,height-t*1.9],[w-t*.5,height-t],[w-t,height-t],[w-t,height],[t,height],[t,height-t],[t*.5,height-t],[t*.5,height-t*1.9],[0,height-t*1.9]];}
     else local=[[0,0],[w,0],[w,height],[0,height]];
     const poly=local.map(v=>new T.Vector2(...v));for(const tri of T.ShapeUtils.triangulateShape(poly,[]))for(const j of tri){const v=poly[j];batch.p.push(cx+ux*v.x+nx*offset,cy+uy*v.x+ny*offset,z+v.y);}
    }
    for(let n=0;n<count;n++){const x=a[0]+ux*((n+.5)*len/count-1.35),y=a[1]+uy*((n+.5)*len/count-1.35);if(inPortico(x+ux*1.35,y+uy*1.35))continue;
     const rows=[{z:2,h:3.9,shape:'arch'},{z:8.3,h:5.5,shape:'rect'},{z:15.4,h:5.1,shape:'shouldered'},{z:23,h:4.1,shape:'rect'}];
     for(const row of rows)for(const side of [-1,1]){
      opening(x,y,row.z,2.7,row.h,trim,side*.035,row.shape);
      opening(x+ux*.22,y+uy*.22,row.z+.22,2.26,row.h-.44,glazing,side*.075,row.shape);
      opening(x-ux*.14,y-uy*.14,row.z-.12,2.98,.20,trim,side*.10);
      if(row.shape==='rect')opening(x+ux*1.28,y+uy*1.28,row.z+.22,.14,row.h-.44,trim,side*.10);
      // The upper gallery has a low parapet; carving is not reconstructed.
      if(row.z===23){opening(x,y,row.z+.35,2.7,.15,trim,side*.12);for(let k=1;k<6;k++)opening(x+ux*k*.45,y+uy*k*.45,row.z+.05,.10,.52,trim,side*.12);}
     }
    }
    // Keep courses clear of the open central portico.
    for(let n=0;n<count;n++){const along=n*len/count,width=len/count,cx=a[0]+ux*along,cy=a[1]+uy*along;if(inPortico(cx+ux*width*.5,cy+uy*width*.5))continue;for(const z of [6.8,14.6,21.5,28.0])for(const side of [-1,1])opening(cx,cy,z,width,.20,trim,side*.11);}
   }
  }
  if(curved){const r=rings[0],xmin=Math.min(...r.map(p=>p[0])),xmax=Math.max(...r.map(p=>p[0])),ymin=Math.min(...r.map(p=>p[1])),ymax=Math.max(...r.map(p=>p[1]));const profile=[ [0.94,0],[1,0.04],[1,.09],[.89,.12],[.91,.18],[.97,.30],[.98,.43],[.94,.56],[.82,.68],[.65,.76],[.42,.82],[.27,.88],[.20,.92],[.18,1],[0,1] ].map(([r,z])=>new T.Vector2(r,z));const g=new T.LatheGeometry(profile,64);g.rotateX(Math.PI/2);const matrix=new T.Matrix4().makeScale((xmax-xmin)/2,(ymax-ymin)/2,roofHeight);matrix.setPosition((xmin+xmax)/2,(ymin+ymax)/2,wallTop);append(g,roof,matrix);domes++;}
  else if(pyramid){const r=rings[0],cx=r.reduce((s,p)=>s+p[0],0)/r.length,cy=r.reduce((s,p)=>s+p[1],0)/r.length;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];roof.p.push(a[0],a[1],base,b[0],b[1],base,cx,cy,h);}}
  else{const {all,tri}=surface(rings,roof);for(const t of tri)for(const i of t)roof.p.push(all[i].x,all[i].y,h);}
  // Central tower uses separate published vertical anchors, not wing scaling.
  let mapZ=z=>z<=30?z*wingScale:z-30+D.wingRoofZ,slope=z=>z<=30?wingScale:1;
  if(p.osm_id==='way/363474998'){const s=(D.centralWingRoofZ-D.wingRoofZ)/8;mapZ=z=>D.wingRoofZ+(z-30)*s;slope=()=>s;}
  if(p.osm_id==='way/371511885'){const s=(D.centralDomeTopZ-D.centralWingRoofZ)/8;mapZ=z=>D.centralWingRoofZ+(z-38)*s;slope=()=>s;}
  // Source 47 m glass cylinder pierces the dome without photo support. Keep
  // mapped XY as an enclosed core ending at the estimated dome springline.
  if(p.osm_id==='way/371511883'){const s=(D.centralWingRoofZ-D.wingRoofZ)/17;mapZ=z=>D.wingRoofZ+(z-30)*s;slope=()=>s;}
  for(const [key,b] of batches){const start=starts.get(key)||0;for(const part of b.preservedNormals)if(part.start>=start)for(let i=0;i<part.values.length;i+=3){const scale=slope(b.p[part.start+i+2]),n=new T.Vector3(part.values[i],part.values[i+1],part.values[i+2]/scale).normalize();part.values.set(n.toArray(),i);}for(let i=start+2;i<b.p.length;i+=3)b.p[i]=mapZ(b.p[i]);}
 }
 const stone=material('#d2ccbf');
 const columns=data.features.filter(f=>f.properties.osm_id==='relation/5518184'),columnCenters=[];
 for(const f of columns){const ring=f.geometry.coordinates[0].slice(0,-1).map(xy),center=ring.reduce((s,p)=>[s[0]+p[0]/ring.length,s[1]+p[1]/ring.length],[0,0]);columnCenters.push(center);
  // Complete base, shaft and capital occupy exactly the sourced column height.
  // Round moulding profiles are estimated from the supplied photograph.
  const H=D.columnHeight,profile=[[0,0],[1.03,0],[1.03,.18],[.88,.30],[.80,.46],[.70,.56],[.63,.75],[.59,1.05],[.57,H-2.0],[.67,H-1.9],[.67,H-1.72],[.59,H-1.62],[.68,H-1.45],[.68,H-1.22],[.76,H-1.08],[.76,H-.83],[.87,H-.62],[.98,H-.42],[1.02,H-.24],[1.02,H],[0,H]];
  const g=new T.LatheGeometry(profile.map(([r,z])=>new T.Vector2(r,z)),24);g.rotateX(Math.PI/2);append(g,stone,new T.Matrix4().makeTranslation(center[0],center[1],D.landingZ));
 }
 let stairPlacement=null,foyer=null;
 if(portico.length){
  const ring=portico.slice(0,-1),shape=new T.Shape(ring.map(p=>new T.Vector2(...p)));
  const canopy=new T.ExtrudeGeometry(shape,{depth:D.canopyTop-D.canopyBottom,bevelEnabled:false});append(canopy,stone,new T.Matrix4().makeTranslation(0,0,D.canopyBottom));
  // Derive alignment from the longest mapped canopy edge; positive tangent
  // points along the NE facade, outward points SE toward the entrance road.
  let edge=[0,0],longest=0;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length>longest){longest=length;edge=[dx/length,dy/length];}}
  if(edge[0]<0)edge=edge.map(n=>-n);const u=edge,v=[u[1],-u[0]],along=ring.map(p=>p[0]*u[0]+p[1]*u[1]),outward=ring.map(p=>p[0]*v[0]+p[1]*v[1]),cx=(Math.min(...along)+Math.max(...along))/2,topV=Math.max(...outward)+.30,bottomV=topV+D.stairDepth,w=D.stairWidth/2;
  const position=(x,y,z)=>[(cx+x)*u[0]+y*v[0],(cx+x)*u[1]+y*v[1],z];
  // Reference photograph shows flared stair sides. Published width is used at
  // the foot; top width is estimated as the mapped canopy span plus 4 m.
  const topHalfWidth=(Math.max(...along)-Math.min(...along)+4)/2,halfWidth=y=>topHalfWidth+(w-topHalfWidth)*(y-topV)/D.stairDepth;
  const vertices=[];function quad(a,b,c,d){for(const p of [a,b,c,a,c,d])vertices.push(...p);}
  for(let step=1;step<=D.steps;step++){const front=bottomV-(step-1)*D.stairDepth/D.steps,back=bottomV-step*D.stairDepth/D.steps,z=step*D.landingZ/D.steps,previous=(step-1)*D.landingZ/D.steps;
   const wf=halfWidth(front),wb=halfWidth(back);
   quad(position(-wb,back,z),position(-wf,front,z),position(wf,front,z),position(wb,back,z));
   quad(position(-wf,front,previous),position(wf,front,previous),position(wf,front,z),position(-wf,front,z));
   quad(position(-wb,back,0),position(-wf,front,0),position(-wf,front,z),position(-wb,back,z));
   quad(position(wf,front,0),position(wb,back,0),position(wb,back,z),position(wf,front,z));
  }
  // Landing reaches behind all mapped columns. Its new footprint is estimated.
  const rearV=Math.min(...outward),landingFront=topV;quad(position(-topHalfWidth,rearV,D.landingZ),position(-topHalfWidth,landingFront,D.landingZ),position(topHalfWidth,landingFront,D.landingZ),position(topHalfWidth,rearV,D.landingZ));
  const stairGeometry=new T.BufferGeometry();stairGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));stairGeometry.computeVertexNormals();append(stairGeometry,stone,new T.Matrix4());
  // Photo-supported closed foyer behind the columns. The mapped canopy rear
  // supplies alignment only; opening size and recess depth are estimates.
  const back=rearV,half=(Math.max(...along)-Math.min(...along))/2,doorHalf=2.6,doorTop=D.landingZ+6.8,recess=.35;
  function face(batch,a,b,c,d){for(const p of [a,b,c,a,c,d])batch.p.push(...p);}
  function panel(batch,left,right,bottom,top,y){face(batch,position(left,y,bottom),position(right,y,bottom),position(right,y,top),position(left,y,top));}
  panel(stone,-half,-doorHalf,D.landingZ,D.canopyBottom,back);
  panel(stone,doorHalf,half,D.landingZ,D.canopyBottom,back);
  panel(stone,-doorHalf,doorHalf,doorTop,D.canopyBottom,back);
  face(stone,position(-doorHalf,back,D.landingZ),position(-doorHalf,back-recess,D.landingZ),position(-doorHalf,back-recess,doorTop),position(-doorHalf,back,doorTop));
  face(stone,position(doorHalf,back-recess,D.landingZ),position(doorHalf,back,D.landingZ),position(doorHalf,back,doorTop),position(doorHalf,back-recess,doorTop));
  face(stone,position(-doorHalf,back,doorTop),position(-doorHalf,back-recess,doorTop),position(doorHalf,back-recess,doorTop),position(doorHalf,back,doorTop));
  panel(material('#253b39'),-doorHalf,doorHalf,D.landingZ,doorTop,back-recess);
  // Stone threshold closes the short recess floor behind the mapped landing.
  face(stone,position(-doorHalf,back-recess,D.landingZ),position(-doorHalf,back,D.landingZ),position(doorHalf,back,D.landingZ),position(doorHalf,back-recess,D.landingZ));
  foyer={backV:back,width:half*2,entryWidth:doorHalf*2,entryHeight:6.8,recessDepth:recess,baseZ:D.landingZ,topZ:D.canopyBottom,estimated:true};
  stairPlacement={tangent:u,outward:v,centerAlong:cx,topV,bottomV,landingRearV:rearV,topWidth:topHalfWidth*2,estimated:true};
 }
 for(const b of batches.values()){if(!b.p.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.computeVertexNormals();const normals=g.getAttribute('normal');for(const part of b.preservedNormals)normals.array.set(part.values,part.start);g.computeBoundingSphere();const mesh=new T.Mesh(g,b.material);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);}
 return{group,domes,parts:data.features.length,architecture:{...D,columns:columns.length,columnCenters,stairPlacement,foyer,reviewOnly:true}};
}
