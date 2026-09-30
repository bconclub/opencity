// Building-part geometry and material tags from OSM. Roof profiles are parametric,
// not scans. Conflicting source heights are retained and documented, not rescaled.
export function buildLandmarks(T,data,xy){
 const portico=data.features.find(f=>f.properties.osm_id==='relation/5519270')?.geometry.coordinates[0].map(xy)||[];
 function inPortico(x,y){let inside=false,near=false;for(let i=0,j=portico.length-1;i<portico.length;j=i++){const a=portico[i],b=portico[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)<.35)near=true;}return inside||near;}
 const group=new T.Group(),batches=new Map();let domes=0;
 function material(colour,glass=false){const key=colour+'|'+glass;if(!batches.has(key))batches.set(key,{material:new T.MeshStandardMaterial({color:colour,roughness:glass?.26:.86,metalness:glass?.3:0,side:T.DoubleSide}),p:[]});return batches.get(key);}
 function append(geometry,batch,matrix){const g=geometry.index?geometry.toNonIndexed():geometry;g.applyMatrix4(matrix);const p=g.getAttribute('position');for(let i=0;i<p.count;i++)batch.p.push(p.getX(i),p.getY(i),p.getZ(i));if(g!==geometry)g.dispose();geometry.dispose();}
 function surface(points,batch){const contour=points[0].map(p=>new T.Vector2(...p)),holes=points.slice(1).map(r=>r.map(p=>new T.Vector2(...p))),all=[...contour,...holes.flat()];return{contour,holes,all,tri:T.ShapeUtils.triangulateShape(contour,holes)};}
 for(const f of data.features){const p=f.properties,rings=f.geometry.coordinates.map(r=>r.slice(0,-1).map(xy));if(rings[0].length<3)continue;
  const h=Number(p.height)||8,base=Number(p.min_height)||0,shape=p['roof:shape']||'flat',curved=['onion','dome'].includes(shape),pyramid=shape==='pyramidal';
  const stone=p.site==='Vidhana Soudha'?'#d2ccbf':p['building:colour']||p['roof:colour']||'#c8c1ad';const wall=material(stone,p['building:material']==='glass'),roof=material(p.site==='Vidhana Soudha'?(p['roof:colour']==='red'?'#ac624d':p['roof:material']==='glass'?'#b4c9c4':stone):p['roof:colour']||stone,p['roof:material']==='glass');
  const roofHeight=curved?Math.min(Number(p['roof:height'])||h-base,h-base):pyramid?h-base:0,wallTop=h-roofHeight;
  for(const r of rings)for(let i=0;i<r.length;i++){const first=r[i],last=r[(i+1)%r.length],count=p.osm_id==='relation/5284317'?Math.ceil(Math.hypot(last[0]-first[0],last[1]-first[1])):1;for(let k=0;k<count;k++){const at=t=>[first[0]+(last[0]-first[0])*t,first[1]+(last[1]-first[1])*t],a=at(k/count),b=at((k+1)/count),bottom=p.osm_id==='relation/5284317'&&inPortico((a[0]+b[0])/2,(a[1]+b[1])/2)?27:base;wall.p.push(a[0],a[1],bottom,b[0],b[1],bottom,b[0],b[1],wallTop,a[0],a[1],bottom,b[0],b[1],wallTop,a[0],a[1],wallTop);}}
  if(p.osm_id==='relation/5284317'){
   const glazing=material('#264e45'),trim=material('#d8d1c3');
   for(const r of rings)for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<14)continue;const ux=dx/len,uy=dy/len,nx=uy,ny=-ux,count=Math.floor(len/4.7);
    function arch(cx,cy,z,w,height,batch,offset){const local=[[0,0],[w,0],[w,height-w/2]];for(let k=0;k<=16;k++){const angle=k/16*Math.PI;local.push([w/2+Math.cos(angle)*w/2,height-w/2+Math.sin(angle)*w/2]);}local.push([0,0]);const poly=local.map(v=>new T.Vector2(...v));for(const tri of T.ShapeUtils.triangulateShape(poly,[]))for(const j of tri){const v=poly[j];batch.p.push(cx+ux*v.x+nx*offset,cy+uy*v.x+ny*offset,z+v.y);}}
    for(let n=0;n<count;n++){const x=a[0]+ux*((n+.5)*len/count-1.35),y=a[1]+uy*((n+.5)*len/count-1.35);if(inPortico(x+ux*1.35,y+uy*1.35))continue;for(let floor=0;floor<4;floor++){const z=2+floor*6.8;for(const side of [-1,1]){arch(x,y,z,2.7,5.0,trim,side*.035);arch(x+ux*.24,y+uy*.24,z+.25,2.22,4.48,glazing,side*.07);}}}
   }
  }
  if(curved){const r=rings[0],xmin=Math.min(...r.map(p=>p[0])),xmax=Math.max(...r.map(p=>p[0])),ymin=Math.min(...r.map(p=>p[1])),ymax=Math.max(...r.map(p=>p[1]));const profile=[ [0.94,0],[1,0.04],[1,.09],[.89,.12],[.91,.18],[.97,.30],[.98,.43],[.94,.56],[.82,.68],[.65,.76],[.42,.82],[.27,.88],[.20,.92],[.18,1],[0,1] ].map(([r,z])=>new T.Vector2(r,z));const g=new T.LatheGeometry(profile,64);g.rotateX(Math.PI/2);const matrix=new T.Matrix4().makeScale((xmax-xmin)/2,(ymax-ymin)/2,roofHeight);matrix.setPosition((xmin+xmax)/2,(ymin+ymax)/2,wallTop);append(g,roof,matrix);domes++;}
  else if(pyramid){const r=rings[0],cx=r.reduce((s,p)=>s+p[0],0)/r.length,cy=r.reduce((s,p)=>s+p[1],0)/r.length;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];roof.p.push(a[0],a[1],base,b[0],b[1],base,cx,cy,h);}}
  else{const {all,tri}=surface(rings,roof);for(const t of tri)for(const i of t)roof.p.push(all[i].x,all[i].y,h);}
 }
 for(const b of batches.values()){if(!b.p.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,b.material);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);}
 return{group,domes,parts:data.features.length};
}
