import {polygonTouchesCBD} from './cbd-dome.js';
import {CBD_DOME} from './cbd-boundary.js';
// Central Bengaluru art pass: mapped footprints, preserved mapped colours, illustrative fallback materials and planting.
export async function installDistrict(map){
 const [T,response,contextModule,landmarkModule,landmarkResponse]=await Promise.all([import('https://unpkg.com/three@0.169.0/build/three.module.js'),fetch('./district-data.json'),import('./building-context.js'),import('./landmarks.js'),fetch('./landmark-data.json')]);
 if(!response.ok)throw new Error('District geometry unavailable');
 const data=await response.json(),origin=[77.5945,12.9755],metres=111320,cos=Math.cos(origin[1]*Math.PI/180);
 const xy=p=>[(p[0]-origin[0])*metres*cos,(p[1]-origin[1])*metres];
 if(!landmarkResponse.ok)throw new Error('Landmark data unavailable');const landmarkData=await landmarkResponse.json();
 const scene=new T.Scene(),camera=new T.Camera();let renderer,enabled=true,shown=null,buildingsVisible=true,treesVisible=true;
 const buckets=Array.from({length:7},()=>({p:[],uv:[]}));
 let seed=123456;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const inside=(p,ring)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 const inPoly=(p,rings)=>inside(p,rings[0])&&!rings.slice(1).some(r=>inside(p,r));
 const area=r=>Math.abs(r.reduce((s,a,i)=>{const b=r[(i+1)%r.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2);
 function texture(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
  const bases=['#789194','#d1c5af','#bc795d','#d6d7cd','#8e9185'];c.fillStyle=bases[kind];c.fillRect(0,0,128,128);
  if(kind<4){
   if(kind===0){c.fillStyle='#456871';c.fillRect(3,3,122,122);const g=c.createLinearGradient(0,0,110,125);g.addColorStop(0,'#aec4c6');g.addColorStop(.48,'#547d86');g.addColorStop(1,'#244952');c.fillStyle=g;c.fillRect(7,5,113,113);c.fillStyle='#abb6ad';c.fillRect(0,0,128,4);c.fillRect(0,0,4,128);c.fillRect(62,0,3,128);}
   else{c.fillStyle='rgba(40,40,28,.22)';c.fillRect(0,118,128,10);c.fillStyle='#4b5049';c.fillRect(20,18,90,85);c.fillStyle='#294c58';c.fillRect(25,23,79,71);c.fillStyle='#72919a';c.fillRect(28,25,32,65);c.fillStyle='#c9c7af';c.fillRect(62,21,4,74);c.fillRect(23,58,83,3);c.fillStyle='#ede4d0';c.fillRect(17,100,96,6);c.fillStyle='rgba(20,30,25,.17)';c.fillRect(17,106,96,7);}
  }else{for(let i=0;i<2500;i++){const gray=100+Math.floor(rand()*65);c.fillStyle=`rgba(${gray},${gray},${gray},.15)`;c.fillRect(rand()*128,rand()*128,2,2);}c.strokeStyle='#767d72';c.strokeRect(0,0,128,128);}
  const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
 }
 const materials=[0,1,2,3].map(k=>new T.MeshStandardMaterial({map:texture(k),roughness:k===0?.33:.86,metalness:k===0?.3:.02,side:T.DoubleSide}));
 materials.push(new T.MeshStandardMaterial({map:texture(4),roughness:.98,side:T.DoubleSide}),new T.MeshStandardMaterial({color:0xc3beb0,roughness:.9}),new T.MeshStandardMaterial({color:0x344345,roughness:.7,metalness:.2}));
 const mappedMaterials=new Map();let mappedColorBuildings=0;
 function materialFor(feature,height,rings){const colour=feature.properties.colour;if(typeof colour==='string'&&/^#[0-9a-f]{6}$/i.test(colour)){mappedColorBuildings++;if(!mappedMaterials.has(colour)){mappedMaterials.set(colour,materials.length);materials.push(new T.MeshStandardMaterial({color:colour,roughness:.82,side:T.DoubleSide}));buckets.push({p:[],uv:[]});}return mappedMaterials.get(colour);}
 // Stable per-footprint fallback, explicitly illustrative where material data is absent.
 const hash=rings[0].reduce((n,p)=>(Math.imul(n,31)+Math.round(p[0]*10)+Math.round(p[1]*10))|0,17);
 return height>32?0:1+Math.abs(hash)%3;
 }
 function triangle(bucket,a,b,c,ua=[0,0],ub=[1,0],uc=[1,1]){buckets[bucket].p.push(...a,...b,...c);buckets[bucket].uv.push(...ua,...ub,...uc);}
 function wall(a,b,base,height,kind){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),u=len/(kind===0?2.5:4),v=(height-base)/3.4;const p=[a[0],a[1],base],q=[b[0],b[1],base],r=[b[0],b[1],height],s=[a[0],a[1],height];triangle(kind,p,q,r,[0,0],[u,0],[u,v]);triangle(kind,p,r,s,[0,0],[u,v],[0,v]);}
 const box=new T.BoxGeometry(1,1,1).toNonIndexed().getAttribute('position');
 function addBox(x,y,z,w,d,h,kind=5,angle=0){const c=Math.cos(angle),s=Math.sin(angle),b=buckets[kind];for(let i=0;i<box.count;i++){const px=box.getX(i)*w,py=box.getY(i)*d;b.p.push(x+px*c-py*s,y+px*s+py*c,z+box.getZ(i)*h);b.uv.push(box.getX(i)+.5,box.getY(i)+.5);}}
 // Each building now has one visible owner; no depth-bias workaround is needed.
 const buildingPolygons=[],spatial=new Map(),roads=new Map(),seenBuildings=new Set();let duplicateBuildings=0;
 function index(map,bounds,item){for(let x=Math.floor(bounds[0]/40);x<=Math.floor(bounds[2]/40);x++)for(let y=Math.floor(bounds[1]/40);y<=Math.floor(bounds[3]/40);y++){const key=x+','+y;if(!map.has(key))map.set(key,[]);map.get(key).push(item);}}
 function boundsOf(r){return[Math.min(...r.map(p=>p[0])),Math.min(...r.map(p=>p[1])),Math.max(...r.map(p=>p[0])),Math.max(...r.map(p=>p[1]))];}
 let roofDetails=0,replacedParts=0;const landmarkRings=landmarkData.features.map(f=>f.geometry.coordinates[0].map(xy));
 for(const feature of data.features.filter(f=>f.properties._layer==='building'&&polygonTouchesCBD(f.geometry.coordinates))){
  const rings=feature.geometry.coordinates.map(r=>r.slice(0,-1).map(xy));if(rings[0].length<3)continue;
  const b=boundsOf(rings[0]),size=area(rings[0]);if(size<5)continue;
  const key=rings.map(r=>r.map(p=>p.map(v=>v.toFixed(2)).join(',')).sort().join(';')).sort().join('|')+'|'+feature.properties.render_height+'|'+feature.properties.render_min_height;
  if(seenBuildings.has(key)){duplicateBuildings++;continue;}seenBuildings.add(key);
  buildingPolygons.push(rings);index(spatial,b,rings);
  const center=[(b[0]+b[2])/2,(b[1]+b[3])/2];if(landmarkRings.some(r=>inside(center,r))){replacedParts++;continue;}
  const height=Math.max(3,Number(feature.properties.render_height)||8),base=Number(feature.properties.render_min_height)||0;
  const kind=materialFor(feature,height,rings);
  for(const ring of rings)for(let i=0;i<ring.length;i++){
   const a=ring[i],c=ring[(i+1)%ring.length];wall(a,c,base,height,kind);
   const len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len>1.5)wall(a,c,height,height+.85,5);
  }
  const contour=rings[0].map(p=>new T.Vector2(...p)),holes=rings.slice(1).map(r=>r.map(p=>new T.Vector2(...p))),all=[...contour,...holes.flat()];
  for(const tri of T.ShapeUtils.triangulateShape(contour,holes)){const points=tri.map(i=>all[i]);triangle(4,...points.map(p=>[p.x,p.y,height+.06]),...points.map(p=>[p.x/8,p.y/8]));}
  const slots=base>0||feature.properties.colour?0:Math.min(5,Math.floor(size/100));
  for(let i=0;i<slots;i++){const x=b[0]+rand()*(b[2]-b[0]),y=b[1]+rand()*(b[3]-b[1]);if(![[x-2,y-2],[x+2,y-2],[x+2,y+2],[x-2,y+2]].every(p=>inPoly(p,rings)))continue;const utility=rand()>.45;addBox(x,y,height+(utility?1:.5),utility?3:3.5,utility?2:2.6,utility?2:.5,utility?5:6);if(utility)addBox(x,y,height+2.05,2.3,1.3,.12,6);roofDetails++;}
 }
 for(const f of data.features.filter(f=>f.properties._layer==='transportation'&&f.geometry.type==='LineString'&&f.properties.brunnel!=='tunnel')){const points=f.geometry.coordinates.map(xy),clearance=f.properties.class==='path'?4:['primary','secondary','tertiary'].includes(f.properties.class)?11:7;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];index(roads,[Math.min(a[0],b[0])-clearance,Math.min(a[1],b[1])-clearance,Math.max(a[0],b[0])+clearance,Math.max(a[1],b[1])+clearance],{a,b,clearance});}}
 const distanceSegment=(p,{a,b})=>{const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);};
 const treePositions=[],treeGrid=new Set();
 const patches=data.features.filter(f=>f.properties._layer==='landcover'&&(f.properties.class==='wood'||['park','garden','shrubbery','scrub'].includes(f.properties.subclass)));
 for(const f of patches){const rings=f.geometry.coordinates.map(r=>r.map(xy)),b=boundsOf(rings[0]),count=Math.min(1800,Math.ceil(area(rings[0])/140));for(let i=0;i<count*3&&treePositions.length<2800;i++){
  const x=b[0]+rand()*(b[2]-b[0]),y=b[1]+rand()*(b[3]-b[1]);if(x*x/(CBD_DOME.x**2)+y*y/(CBD_DOME.y**2)>1||!inPoly([x,y],rings))continue;
  // Keep virtual departure pad clear; planting does not represent surveyed trees.
  const pad=xy([77.592,12.9745]);if(Math.hypot(x-pad[0],y-pad[1])<34)continue;
  const cell=Math.floor(x/40)+','+Math.floor(y/40);if((spatial.get(cell)||[]).some(r=>inPoly([x,y],r)))continue;
  if((roads.get(cell)||[]).some(r=>distanceSegment([x,y],r)<r.clearance))continue;
  const key=Math.floor(x/9)+','+Math.floor(y/9);if(treeGrid.has(key))continue;treeGrid.add(key);treePositions.push({x,y,r:3+rand()*2.8,h:6+rand()*7});if(treePositions.length>=2800)break;
 }}
 const structure=new T.Group(),vegetation=new T.Group();scene.add(structure,vegetation);const landmarks=landmarkModule.buildLandmarks(T,landmarkData,xy);structure.add(landmarks.group);
 for(let i=0;i<buckets.length;i++){const b=buckets[i];if(!b.p.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,materials[i]);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;structure.add(mesh);}
 const trunk=new T.InstancedMesh(new T.CylinderGeometry(.3,.55,1,6),new T.MeshStandardMaterial({color:0x665341,roughness:1}),treePositions.length);
 const crowns=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),treePositions.length*2);
 const dummy=new T.Object3D(),color=new T.Color();let n=0;
 treePositions.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.h/2);dummy.rotation.set(Math.PI/2,0,0);dummy.scale.set(1, p.h,1);dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);for(let j=0;j<2;j++){dummy.position.set(p.x+(rand()-.5)*p.r,p.y+(rand()-.5)*p.r,p.h+(j===0?1:-1));dummy.rotation.set(rand(),rand(),rand());dummy.scale.set(p.r*(.8+rand()*.35),p.r*(.8+rand()*.35),p.r*.85);dummy.updateMatrix();crowns.setMatrixAt(n,dummy.matrix);color.setHSL(.24+rand()*.08,.22+rand()*.15,.22+rand()*.13);crowns.setColorAt(n++,color);}});
 for(const mesh of [trunk,crowns]){mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;vegetation.add(mesh);}
 const sun=new T.DirectionalLight(0xfff1d7,2.6);sun.position.set(-900,-1200,1800);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-1900,right:1900,top:1900,bottom:-1900,near:1,far:5000});sun.shadow.bias=-.0004;sun.shadow.normalBias=1.2;scene.add(sun,sun.target,new T.HemisphereLight(0xcce0ec,0x8c8068,1.6));
 const ground=new T.Mesh(new T.PlaneGeometry(5000,5000),new T.ShadowMaterial({opacity:.25,depthWrite:false}));ground.position.z=.12;ground.receiveShadow=true;ground.frustumCulled=false;scene.add(ground);
 const bbox=data.bbox,mask={type:'Polygon',coordinates:[[[bbox[0],bbox[1]],[bbox[2],bbox[1]],[bbox[2],bbox[3]],[bbox[0],bbox[3]],[bbox[0],bbox[1]]]]};
 const geo={type:'FeatureCollection',features:data.features.filter(f=>f.properties._layer==='building')};
 const context=contextModule.createBuildingContext(map,bbox);
 const firstSymbol=map.getStyle().layers.find(l=>l.type==='symbol')?.id;
 map.addSource('district-pick',{type:'geojson',data:geo});map.addLayer({id:'district-pick',type:'fill-extrusion',source:'district-pick',minzoom:13.7,paint:{'fill-extrusion-height':['max',3,['coalesce',['get','render_height'],8]],'fill-extrusion-opacity':0}},firstSymbol);
 map.addSource('district-green',{type:'geojson',data:{type:'FeatureCollection',features:data.features.filter(f=>f.properties._layer==='landcover')}});
 const firstRoad=map.getStyle().layers.find(l=>l['source-layer']==='transportation')?.id;
 map.addLayer({id:'district-green',type:'fill',source:'district-green',paint:{'fill-color':['match',['get','class'],'wood','#587448','grass','#819769','sand','#d0c3a1','#a0a583']}},firstRoad);
 for(const l of map.getStyle().layers){if(l['source-layer']==='transportation'&&l.type==='line'&&!l.id.includes('rail'))map.setPaintProperty(l.id,'line-color',l.id.includes('casing')?'#b6b0a0':l.id.includes('path')?'#c4b699':'#626865');if(l.id==='landcover_wood'){map.setPaintProperty(l.id,'fill-color','#5c774d');map.setPaintProperty(l.id,'fill-opacity',1);}if(l.id==='water')map.setPaintProperty(l.id,'fill-color','#538d99');if(l.type==='background')map.setPaintProperty(l.id,'background-color','#c8c7b9');}
 const transform=maplibregl.MercatorCoordinate.fromLngLat(origin,0),s=transform.meterInMercatorCoordinateUnits();
 const matrix=new T.Matrix4().makeTranslation(transform.x,transform.y,transform.z).scale(new T.Vector3(s,-s,s));
 map.addLayer({id:'district-detail',type:'custom',renderingMode:'3d',onAdd(m,gl){renderer=new T.WebGLRenderer({canvas:m.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;},render(gl,args){if(!shown)return;structure.visible=buildingsVisible;vegetation.visible=treesVisible;ground.visible=buildingsVisible||treesVisible;camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(matrix);renderer.resetState();{const submitStart=performance.now();renderer.render(scene,camera);window.recordCityRender?.('District',renderer,performance.now()-submitStart);}}},firstSymbol);
 const label=document.createElement('label');label.className='toggle';label.innerHTML='<span>Detailed central district</span><input id="detail-toggle" type="checkbox" checked>';document.querySelector('#nature').closest('fieldset').appendChild(label);
 const note=document.createElement('div');note.id='detail-note';note.textContent='CBD study · Landmark reconstruction in progress';document.body.appendChild(note);
 function visibility(){const center=map.getCenter();const near=center.lng>bbox[0]-.006&&center.lng<bbox[2]+.006&&center.lat>bbox[1]-.006&&center.lat<bbox[3]+.006;const value=enabled&&map.getZoom()>=13.7&&near;if(value!==shown){shown=value;map.setFilter('city-buildings',['==',['literal',1],0]);map.setLayoutProperty('city-buildings','visibility',shown?'none':buildingsVisible?'visible':'none');context.setVisible(shown&&buildingsVisible);map.setLayoutProperty('district-pick','visibility',shown&&buildingsVisible?'visible':'none');map.setLayoutProperty('district-green','visibility',shown?'visible':'none');map.triggerRepaint();}note.hidden=!shown;}
 document.querySelector('#detail-toggle').onchange=e=>{enabled=e.target.checked;visibility();};
 document.querySelector('#buildings').addEventListener('change',e=>{buildingsVisible=e.target.checked;map.setLayoutProperty('city-buildings','visibility',shown?'none':buildingsVisible?'visible':'none');context.setVisible(shown&&buildingsVisible);map.setLayoutProperty('district-pick','visibility',shown&&buildingsVisible?'visible':'none');renderer.shadowMap.needsUpdate=true;map.triggerRepaint();});
 document.querySelector('#nature').addEventListener('change',e=>{treesVisible=e.target.checked;renderer.shadowMap.needsUpdate=true;map.triggerRepaint();});
 map.on('move',visibility);map.on('click','district-pick',e=>{const f=e.features?.[0];if(!f)return;document.querySelector('#building-name').textContent=f.properties.name||'Mapped building · illustrative facade';document.querySelector('#building-height').textContent=`Display height: ${Math.max(3,Number(f.properties.render_height)||8)} m (schematic)`;document.querySelector('#inspector').hidden=false;});
 const pickTargets=[...data.features.filter(f=>f.properties._layer==='building'),...landmarkData.features].map((f,i)=>({id:'building-'+i,properties:f.properties,rings:f.geometry.coordinates.map(r=>r.map(xy))}));
 const raycaster=new T.Raycaster(),inverse=new T.Matrix4();
 window.pickDistrictFocus=()=>{
  if(!shown||!buildingsVisible)return null;
  inverse.copy(camera.projectionMatrix).invert();
  const near=new T.Vector3(0,.28,-1).applyMatrix4(inverse),far=new T.Vector3(0,.28,1).applyMatrix4(inverse);
  raycaster.set(near,far.sub(near).normalize());
  const hit=raycaster.intersectObject(structure,true)[0];if(!hit)return null;
  const point=[hit.point.x,hit.point.y],z=hit.point.z;
  const candidates=pickTargets.filter(f=>inPoly(point,f.rings)&&z>=(Number(f.properties.min_height??f.properties.render_min_height)||0)-1&&z<=(Number(f.properties.height??f.properties.render_height)||8)+2);
  candidates.sort((a,b)=>area(a.rings[0])-area(b.rings[0]));const target=candidates[0];if(!target)return null;
  const p=target.properties;return{id:target.id,name:p.name||p.site||'Unnamed mapped building',height:Number(p.height??p.render_height)||8,source:'OpenStreetMap',note:'Model height is schematic',lng:origin[0]+point[0]/(metres*cos),lat:origin[1]+point[1]/metres};
 };
 renderer.compile(scene,camera);
 visibility();map.triggerRepaint();window.districtState=()=>({loaded:true,landmarkParts:landmarks.parts,landmarkDomes:landmarks.domes,replacedParts,mappedColorBuildings,enabled,shown,buildings:buildingPolygons.length,trees:treePositions.length,roofDetails,duplicateBuildings,contextBuildings:context.count,drawGroups:structure.children.length+2});
 document.querySelector('#view-caption').textContent='Central district preview. Facades, roof details and planting are illustrative.';
}



