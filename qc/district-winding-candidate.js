import {polygonTouchesCBD} from './cbd-dome.js';
import {CBD_DOME} from './cbd-boundary.js';
import {installVehicleEnvironment} from './vehicle-environment.js';
import {setMapSceneCamera} from './map-scene-camera.js';
// Central Bengaluru art pass: mapped footprints, preserved mapped colours, illustrative fallback materials and planting.
export async function installDistrict(map){
 const [T,response,contextModule,landmarkModule,landmarkResponse]=await Promise.all([import('https://unpkg.com/three@0.169.0/build/three.module.js'),fetch('./district-data.json'),import('./building-context.js'),import('./landmarks.js'),fetch('./landmark-data.json')]);
 if(!response.ok)throw new Error('District geometry unavailable');
 const data=await response.json(),origin=[77.5945,12.9755],metres=111320,cos=Math.cos(origin[1]*Math.PI/180);
 const xy=p=>[(p[0]-origin[0])*metres*cos,(p[1]-origin[1])*metres];
 if(!landmarkResponse.ok)throw new Error('Landmark data unavailable');const landmarkData=await landmarkResponse.json();
 const scene=new T.Scene(),camera=new T.Camera(),districtClip=new T.Matrix4();let renderer,disposeReflections,enabled=true,shown=null,buildingsVisible=true,treesVisible=true;
 const buckets=Array.from({length:7},()=>({p:[],uv:[]}));
 // Material noise is independent from illustrative planting and roof-detail randomness.
 let seed=2288307676;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const inside=(p,ring)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 const inPoly=(p,rings)=>inside(p,rings[0])&&!rings.slice(1).some(r=>inside(p,r));
 const area=r=>Math.abs(r.reduce((s,a,i)=>{const b=r[(i+1)%r.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2);
 // Four-by-four facade atlases vary glazing, blinds and surface wear without
 // adding meshes or draw calls. One atlas cell is one floor / structural bay.

 function texture(kind,baseColour){
  const size=kind===4?256:512,canvas=document.createElement('canvas'),rough=document.createElement('canvas');
  for(const item of [canvas,rough])item.width=item.height=size;
  const c=canvas.getContext('2d'),r=rough.getContext('2d');
  let noiseSeed=7193+kind*197;const noise=()=>{noiseSeed=(Math.imul(noiseSeed,1664525)+1013904223)>>>0;return noiseSeed/4294967296;};
  const bases=['#70878e','#d5d0c4','#a56550','#e0e1db','#b3b2a8'];
  c.fillStyle=baseColour||bases[kind];c.fillRect(0,0,size,size);r.fillStyle=kind===0?'#505050':'#dedede';r.fillRect(0,0,size,size);
  // Sub-pixel aggregate and soft weathering read as material, not painted outlines.
  for(let i=0;i<size*24;i++){const x=noise()*size,y=noise()*size,light=noise()>.5;c.fillStyle=light?'rgba(255,255,255,.065)':'rgba(30,33,30,.04)';c.fillRect(x,y,1,1);}
  if(kind===4){
   for(let y=0;y<size;y+=64){c.fillStyle='rgba(65,70,68,.12)';c.fillRect(0,y,size,1);}
   for(let x=0;x<size;x+=128){c.fillStyle='rgba(65,70,68,.1)';c.fillRect(x,0,1,size);}
  }else for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   const x=col*128,y=row*128,v=noise();
   const glass=(gx,gy,gw,gh)=>{
    const gradient=c.createLinearGradient(gx,gy,gx+gw*.45,gy+gh);
    gradient.addColorStop(0,['#637d87','#8a9da4','#70878d','#7c939c'][Math.floor(v*4)]);
    gradient.addColorStop(.48,['#354c58','#435b68','#4c6470','#344c5b'][Math.floor(v*4)]);
    gradient.addColorStop(1,'#1b303c');c.fillStyle=gradient;c.fillRect(gx,gy,gw,gh);
    c.save();c.beginPath();c.rect(gx,gy,gw,gh);c.clip();
    c.fillStyle='rgba(195,214,217,.13)';c.beginPath();c.moveTo(gx-4,gy+gh*.15);c.lineTo(gx+gw*.7,gy);c.lineTo(gx+gw,gy+gh*.3);c.lineTo(gx+gw*.15,gy+gh*.65);c.fill();
    if(kind!==0&&v>.73){c.fillStyle='rgba(184,180,161,.82)';const blind=gh*(.18+v*.24);c.fillRect(gx,gy,gw,blind);c.strokeStyle='rgba(73,77,74,.22)';for(let by=gy+4;by<gy+blind;by+=4){c.beginPath();c.moveTo(gx,by);c.lineTo(gx+gw,by);c.stroke();}}
    c.restore();r.fillStyle='#393939';r.fillRect(gx,gy,gw,gh);
   };
   if(kind===0){
    glass(x+4,y+4,120,120);c.fillStyle='#a7b0ae';c.fillRect(x,y,128,3);c.fillRect(x,y,3,128);c.fillStyle='#334750';c.fillRect(x+3,y+3,125,1);c.fillRect(x+3,y+3,1,125);c.fillStyle='rgba(21,34,41,.38)';c.fillRect(x+4,y+105,120,19);
   }else{
    // Recessed frames, stone sills and shallow floor joints. Different masonry
    // families use different window proportions instead of one repeated motif.
    const wx=x+(kind===2?28:22),wy=y+22,ww=kind===2?72:84,wh=kind===3?76:70;
    c.fillStyle='rgba(38,39,34,.16)';c.fillRect(wx-4,wy-3,ww+8,wh+12);
    const inset=c.createLinearGradient(wx-3,wy-3,wx+5,wy+7);inset.addColorStop(0,'#535952');inset.addColorStop(1,'#9b9e94');c.fillStyle=inset;c.fillRect(wx-2,wy-2,ww+4,wh+4);
    glass(wx+2,wy+2,ww-4,wh-4);
    c.fillStyle=kind===3?'#c3cbc8':'#a8b0ac';c.fillRect(wx+ww*.5-1,wy+1,2,wh-2);
    if(kind===1)c.fillRect(wx+1,wy+wh*.68,ww-2,2);
    c.fillStyle='rgba(255,255,247,.48)';c.fillRect(wx-5,wy+wh+2,ww+10,3);
    const shade=c.createLinearGradient(0,wy+wh+5,0,wy+wh+13);shade.addColorStop(0,'rgba(33,37,33,.2)');shade.addColorStop(1,'rgba(33,37,33,0)');c.fillStyle=shade;c.fillRect(wx-4,wy+wh+5,ww+8,8);
    c.fillStyle='rgba(62,67,60,.10)';c.fillRect(x,y+124,128,1);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x,y+125,128,1);
    if(kind===2){c.fillStyle='rgba(48,50,44,.06)';for(let by=6;by<128;by+=12){c.fillRect(x,y+by,128,1);}}
   }
  }
  // Pack roughness into otherwise unused alpha. Opaque facade fragments reuse
  // the diffuse sample, avoiding an extra map fetch across every city pixel.
  const pixels=c.getImageData(0,0,size,size).data,roughPixels=r.getImageData(0,0,size,size).data;
  for(let i=3;i<pixels.length;i+=4)pixels[i]=roughPixels[i-3];
  const tex=new T.DataTexture(new Uint8Array(pixels.buffer),size,size,T.RGBAFormat);
  tex.flipY=true;tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
  tex.wrapS=tex.wrapT=T.RepeatWrapping;if(kind!==4)tex.repeat.set(.25,.25);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;tex.needsUpdate=true;return{map:tex};
 }
 function packedMaterial(options){
  const material=new T.MeshStandardMaterial(options);
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
#ifdef USE_MAP
 roughnessFactor *= sampledDiffuseColor.a;
 diffuseColor.a = opacity;
#endif`);};
  material.customProgramCacheKey=()=> 'district-packed-roughness-v1';return material;
 }
 const materials=[0,1,2,3].map(k=>packedMaterial({...texture(k),roughness:1,metalness:k===0?.18:0,side:T.FrontSide,shadowSide:T.DoubleSide}));
 const roofMaps=texture(4);materials.push(packedMaterial({...roofMaps,roughness:1,side:T.DoubleSide}),new T.MeshStandardMaterial({color:0xc6c8bf,roughness:.88}),new T.MeshStandardMaterial({color:0x425054,roughness:.65,metalness:.15}));
 const mappedMaterials=new Map();let mappedColorBuildings=0;
 function materialFor(feature,height,rings){const colour=feature.properties.colour;if(typeof colour==='string'&&/^#[0-9a-f]{6}$/i.test(colour)){mappedColorBuildings++;if(!mappedMaterials.has(colour)){mappedMaterials.set(colour,materials.length);materials.push(packedMaterial({...texture(3,colour),roughness:1,side:T.FrontSide,shadowSide:T.DoubleSide}));buckets.push({p:[],uv:[]});}return mappedMaterials.get(colour);}
 // Stable per-footprint fallback, explicitly illustrative where material data is absent.
 const hash=rings[0].reduce((n,p)=>(Math.imul(n,31)+Math.round(p[0]*10)+Math.round(p[1]*10))|0,17);
 return height>32?0:1+Math.abs(hash)%3;
 }
 function triangle(bucket,a,b,c,ua=[0,0],ub=[1,0],uc=[1,1]){buckets[bucket].p.push(...a,...b,...c);buckets[bucket].uv.push(...ua,...ub,...uc);}
 function wall(a,b,base,height,kind,flip=false){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),u=Math.max(1,Math.round(len/(kind===0?2.5:4))),v=Math.max(1,Math.round((height-base)/3.4));const p=[a[0],a[1],base],q=[b[0],b[1],base],r=[b[0],b[1],height],s=[a[0],a[1],height];if(flip){triangle(kind,p,r,q,[0,0],[u,v],[u,0]);triangle(kind,p,s,r,[0,0],[0,v],[u,v]);}else{triangle(kind,p,q,r,[0,0],[u,0],[u,v]);triangle(kind,p,r,s,[0,0],[u,v],[0,v]);}}
 const box=new T.BoxGeometry(1,1,1).toNonIndexed().getAttribute('position');
 function addBox(x,y,z,w,d,h,kind=5,angle=0){const c=Math.cos(angle),s=Math.sin(angle),b=buckets[kind];for(let i=0;i<box.count;i++){const px=box.getX(i)*w,py=box.getY(i)*d;b.p.push(x+px*c-py*s,y+px*s+py*c,z+box.getZ(i)*h);b.uv.push(box.getX(i)+.5,box.getY(i)+.5);}}
 // Each building now has one visible owner; no depth-bias workaround is needed.
 const buildingPolygons=[],spatial=new Map(),roads=new Map(),seenBuildings=new Set();let duplicateBuildings=0;
 function index(map,bounds,item){for(let x=Math.floor(bounds[0]/40);x<=Math.floor(bounds[2]/40);x++)for(let y=Math.floor(bounds[1]/40);y<=Math.floor(bounds[3]/40);y++){const key=x+','+y;if(!map.has(key))map.set(key,[]);map.get(key).push(item);}}
 function boundsOf(r){return[Math.min(...r.map(p=>p[0])),Math.min(...r.map(p=>p[1])),Math.max(...r.map(p=>p[0])),Math.max(...r.map(p=>p[1]))];}
 let roofDetails=0,replacedParts=0,invalidElevatedBases=0;const landmarkRings=landmarkData.features.map(f=>f.geometry.coordinates[0].map(xy));
 for(const feature of data.features.filter(f=>f.properties._layer==='building'&&polygonTouchesCBD(f.geometry.coordinates))){
  const rings=feature.geometry.coordinates.map(r=>r.slice(0,-1).map(xy));if(rings[0].length<3)continue;
  const b=boundsOf(rings[0]),size=area(rings[0]);if(size<5)continue;
  const key=rings.map(r=>r.map(p=>p.map(v=>v.toFixed(2)).join(',')).sort().join(';')).sort().join('|')+'|'+feature.properties.render_height+'|'+feature.properties.render_min_height;
  if(seenBuildings.has(key)){duplicateBuildings++;continue;}seenBuildings.add(key);
  buildingPolygons.push(rings);index(spatial,b,rings);
  const center=[(b[0]+b[2])/2,(b[1]+b[3])/2];if(landmarkRings.some(r=>inside(center,r))){replacedParts++;continue;}
  const height=Math.max(3,Number(feature.properties.render_height)||8),mappedBase=Number(feature.properties.render_min_height)||0;
  // Contradictory source tags must not create an inverted solid (one footprint
  // reports a 120 m base and a 5 m top). Keep the stated top, use ground as the
  // conservative display base, and expose the count instead of inventing height.
  const base=mappedBase>=0&&mappedBase<height?mappedBase:0;if(base!==mappedBase)invalidElevatedBases++;
  const kind=materialFor(feature,height,rings);
  for(const [ringIndex,ring]of rings.entries())for(let i=0;i<ring.length;i++){
   const signedArea=ring.reduce((sum,a,j)=>{const b=ring[(j+1)%ring.length];return sum+a[0]*b[1]-b[0]*a[1];},0);const flip=ringIndex===0?signedArea<0:signedArea>0;
   const a=ring[i],c=ring[(i+1)%ring.length];wall(a,c,base,height,kind,flip);
   const len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len>1.5)wall(a,c,height,height+.85,5,flip);
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
 // Concentrate the existing shadow texture on the Vidhana frontage. Outside
 // this fixed light-space volume, direct lighting remains but shadows do not.
 const shadowCenter=xy([77.59065,12.97973]);
 const sun=new T.DirectionalLight(0xfff3e5,2.8);sun.target.position.set(shadowCenter[0],shadowCenter[1],0);sun.position.set(shadowCenter[0]-600,shadowCenter[1]-800,1200);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-450,right:450,top:450,bottom:-450,near:100,far:2500});sun.shadow.bias=-.0004;sun.shadow.normalBias=1.2;scene.add(sun,sun.target,new T.HemisphereLight(0xd8e7f5,0x716957,.95));
 sun.shadow.camera.updateProjectionMatrix();
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
 map.addLayer({id:'district-detail',type:'custom',renderingMode:'3d',onAdd(m,gl){renderer=new T.WebGLRenderer({canvas:m.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;disposeReflections=installVehicleEnvironment(T,renderer,scene);materials[0].envMap=scene.environment;materials[0].envMapIntensity=.85;materials[0].envMapRotation.x=Math.PI/2;scene.environment=null;renderer.resetState();},onRemove(){disposeReflections?.();},render(gl,args){if(!shown)return;structure.visible=buildingsVisible;vegetation.visible=treesVisible;ground.visible=buildingsVisible||treesVisible;districtClip.fromArray(args.defaultProjectionData.mainMatrix).multiply(matrix);setMapSceneCamera(T,camera,districtClip);renderer.resetState();{const submitStart=performance.now();renderer.render(scene,camera);window.recordCityRender?.('District',renderer,performance.now()-submitStart);}}},firstSymbol);
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
  inverse.copy(districtClip).invert();
  const near=new T.Vector3(0,.28,-1).applyMatrix4(inverse),far=new T.Vector3(0,.28,1).applyMatrix4(inverse);
  raycaster.set(near,far.sub(near).normalize());
  const hit=raycaster.intersectObject(structure,true)[0];if(!hit)return null;
  const point=[hit.point.x,hit.point.y],z=hit.point.z;
  const candidates=pickTargets.filter(f=>{const top=Number(f.properties.height??f.properties.render_height)||8,mappedBase=Number(f.properties.min_height??f.properties.render_min_height)||0,base=mappedBase>=0&&mappedBase<top?mappedBase:0;return inPoly(point,f.rings)&&z>=base-1&&z<=top+2;});
  candidates.sort((a,b)=>area(a.rings[0])-area(b.rings[0]));const target=candidates[0];if(!target)return null;
  const p=target.properties;return{id:target.id,name:p.name||p.site||'Unnamed mapped building',height:Number(p.height??p.render_height)||8,source:'OpenStreetMap',note:'Model height is schematic',lng:origin[0]+point[0]/(metres*cos),lat:origin[1]+point[1]/metres};
 };
 renderer.compile(scene,camera);
 visibility();map.triggerRepaint();window.districtState=()=>({loaded:true,landmarkParts:landmarks.parts,landmarkDomes:landmarks.domes,replacedParts,mappedColorBuildings,enabled,shown,buildings:buildingPolygons.length,trees:treePositions.length,roofDetails,duplicateBuildings,invalidElevatedBases,contextBuildings:context.count,drawGroups:structure.children.length+2,facadeAtlasSize:512,facadeVariants:16,materialDetail:'packed roughness and baked recess shading; illustrative facades'});
 document.querySelector('#view-caption').textContent='Central district preview. Facades, roof details and planting are illustrative.';
}



