import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareStreetSurfaces} from './street-surface-materials.js';

const installed=new WeakMap();
const ASSET=new URL('./assets/streets/vidhana-streets.glb',import.meta.url).href;
const METADATA=new URL('./assets/streets/vidhana-streets.json',import.meta.url).href;
export const STREET_PATCH_FOOTPRINT=new URL('./assets/streets/vidhana-footprint.geojson',import.meta.url).href;

// Z-up batched asset; never rotate this asset again after loading.
export function installStreetPatch(map){
 if(!installed.has(map))installed.set(map,install(map).catch(error=>{installed.delete(map);throw error;}));
 return installed.get(map);
}
function validateOrigin(value,label){
 if(!Array.isArray(value)||value.length!==2||!value.every(Number.isFinite)||Math.abs(value[0])>180||Math.abs(value[1])>=85.05112878)throw Error(label+' must be a finite Mercator longitude/latitude pair');
 return Object.freeze([...value]);
}
async function loadGroundIndex(metadata,anchor){
 if(!Object.hasOwn(metadata,'groundIndexURL'))return null;
 if(typeof metadata.groundIndexURL!=='string'||!metadata.groundIndexURL.trim())throw Error('Street groundIndexURL must be a nonempty URL');
 const url=new URL(metadata.groundIndexURL,METADATA).href,response=await fetch(url);
 if(!response.ok)throw Error('Street ground index unavailable');
 const data=await response.json();
 if(!data||data.version!==1)throw Error('Unsupported street ground index version');
 const indexOrigin=validateOrigin(data.origin,'Street ground index origin');
 if(indexOrigin.some((v,i)=>v!==anchor[i]))throw Error('Street ground index origin does not match metadata');
 if(!Array.isArray(data.triangles)||data.triangles.length===0||data.triangles.length%9!==0)throw Error('Street ground index requires complete triangle coordinates');
 const positions=new Float32Array(data.triangles.length);
 for(let i=0;i<data.triangles.length;i++){
  const value=data.triangles[i];
  if(!Number.isFinite(value)||!Number.isFinite(Math.fround(value)))throw Error('Street ground index coordinates must be finite Float32 numbers');
  positions[i]=value;
 }
 return {url,positions};
}
async function install(map){
 const response=await fetch(METADATA);
 if(!response.ok)throw Error('Street patch metadata unavailable');
 const metadata=await response.json(),anchor=validateOrigin(metadata?.origin,'Street metadata origin');
 // A declared ground index must succeed before any layer is installed. Never
 // silently index sign tops or furniture when the ground-only asset fails.
 const groundIndex=await loadGroundIndex(metadata,anchor),loader=new GLTFLoader();
 let assetBytes,gltf;
 if(metadata.surfaceCoverage){
  // Fetch once. These same bytes feed integrity checking and the GLTF parser.
  const assetResponse=await fetch(ASSET);if(!assetResponse.ok)throw Error('Street patch geometry unavailable');
  assetBytes=await assetResponse.arrayBuffer();gltf=await loader.parseAsync(assetBytes,new URL('./',ASSET).href);
 }else gltf=await loader.loadAsync(ASSET);
 const origin=maplibregl.MercatorCoordinate.fromLngLat(anchor,0),scale=origin.meterInMercatorCoordinateUnits();
 const scene=new THREE.Scene(),camera=new THREE.Camera(),cells=new Map(),triangles=[],cellSize=12;
 let disposed=false,visible=true,renderer,surfaces,coverage,frames=0,lastCalls=0,lastTriangles=0;
 const classified=gltf.parser?.json?.materials?.some(m=>Object.hasOwn(m.extras??{},'streetSurfaceRole'))??false;
 function indexTriangle(a,b,c){
  if(![a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z].every(Number.isFinite))throw Error('Street ground geometry contains nonfinite coordinates');
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
  if(Math.abs(den)<1e-8)return;
  const minX=Math.floor(Math.min(a.x,b.x,c.x)/cellSize),maxX=Math.floor(Math.max(a.x,b.x,c.x)/cellSize),minY=Math.floor(Math.min(a.y,b.y,c.y)/cellSize),maxY=Math.floor(Math.max(a.y,b.y,c.y)/cellSize);
  if(![minX,maxX,minY,maxY].every(Number.isSafeInteger)||(maxX-minX+1)*(maxY-minY+1)>100000)throw Error('Street ground triangle exceeds spatial index extent');
  const id=triangles.push({a,b,c,den})-1;
  for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){const key=x+','+y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(id);}
 }
 try{
 gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.frustumCulled=false;
  if(groundIndex)return;
  const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
  for(let i=0;i<(index?.count??p.count);i+=3){
   const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
   indexTriangle(...v);
  }
 });
 if(groundIndex)for(let i=0;i<groundIndex.positions.length;i+=9)indexTriangle(...[0,3,6].map(offset=>new THREE.Vector3().fromArray(groundIndex.positions,i+offset)));
 // QC display-only asphalt. Ground sidecar was indexed above; never index these faces.
 const displayGeometry=new THREE.BufferGeometry();
 displayGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-126.11890536715681,-487.5462192232773,0,-126.13177501727256,-487.8418499360452,0,-126.06633156701731,-487.6366572641195,0,-124.5510711681274,-490.24322509693764,0,-126.06633156695841,-487.6366572638234,0,-126.06633156701731,-487.6366572641195,0,-124.55107116723315,-490.24322509724175,0,-124.5510711681274,-490.24322509693764,0,-124.55107116699219,-490.24322509765625,0,-122.22305099669929,-491.03492722320766,0,-124.49403355736045,-490.2626221787481,0,-122.93839091738775,-491.1772146787827,0,-124.16160348176005,-490.9339068484864,0,-122.93839091738775,-491.1772146787827,0,-124.49403355736045,-490.2626221787481,0,-126.10735905938903,-487.8429127953809,0,-125.89148727914218,-489.2040533958906,0,-124.5510711681274,-490.24322509693764,0,-126.10735905938903,-487.8429127953809,0,-126.13479938595053,-487.9808622240629,0,-125.89148727914218,-489.2040533958906,0,-126.10735905938903,-487.8429127953809,0,-126.06633156701731,-487.6366572641195,0,-126.13177501727256,-487.8418499360452,0,-124.55107116699219,-490.24322509765625,0,-124.16160348176005,-490.9339068484864,0,-124.49403355736045,-490.2626221787481,0,-125.19859302017153,-490.24102475804347,0,-124.5510711681274,-490.24322509693764,0,-125.89148727914218,-489.2040533958906,0,-124.5510711681274,-490.24322509693764,0,-126.06633156701731,-487.6366572641195,0,-126.10735905938903,-487.8429127953809,0,-124.16160348176005,-490.9339068484864,0,-124.55107116699219,-490.24322509765625,0,-125.19859302017153,-490.24102475804347,0,-124.5510711681274,-490.24322509693764,0,-125.19859302017153,-490.24102475804347,0,-124.55107116699219,-490.24322509765625,0,-123.01475362562434,-483.94605086898855,0,-123.01467132643121,-483.9459533696112,0,-125.81147405779367,-480.48416652028516,0,-124.76332465456242,-486.01756195882314,0,-125.10176789637308,-486.41851405879834,0,-123.01475362562434,-483.94605086898855,0,-125.68988865962248,-477.691208815904,0,-125.81147405779367,-480.48416652028516,0,-123.01467132643121,-483.9459533696112,0,-123.29559326171875,-484.27874755859375,0,-124.76332465456242,-486.01756195882314,0,-123.01475362562434,-483.94605086898855,0,-123.29559326171875,-484.27874755859375,0,-123.01475362562434,-483.94605086898855,0,-125.81147405779367,-480.48416652028516,0],3));
 displayGeometry.computeVertexNormals();
 const displayMaterial=new THREE.MeshStandardMaterial({color:0x4d4d4d,roughness:.95,metalness:0,side:THREE.DoubleSide});
 displayMaterial.userData.streetSurfaceRole='asphalt';
 const displayMesh=new THREE.Mesh(displayGeometry,displayMaterial);displayMesh.frustumCulled=false;displayMesh.name='QC circle1091198031 existing-surface material';
 gltf.scene.add(displayMesh);
 surfaces=prepareStreetSurfaces(gltf.scene);
 if(metadata.surfaceCoverage){
  try{const {enableStreetCoverage}=await import('./street-surface-coverage.js');coverage=await enableStreetCoverage(gltf.scene,{metadata:metadata.surfaceCoverage,assetBytes,origin:anchor,localBounds:metadata.localBounds,baseURL:METADATA,classified});}
  catch(error){coverage={state:()=>({status:'fallback',reason:error.message}),dispose(){}};}
 }
 scene.add(gltf.scene,new THREE.HemisphereLight(0xffffff,0x596568,2.1));
 const sun=new THREE.DirectionalLight(0xfffbf3,2.5);sun.position.set(-20,-30,60);scene.add(sun);
 const matrix=new THREE.Matrix4().makeTranslation(origin.x,origin.y,origin.z).scale(new THREE.Vector3(scale,-scale,scale));
 const layer={id:'osm2world-street-patch',type:'custom',renderingMode:'3d',onAdd(m,gl){renderer=new THREE.WebGLRenderer({canvas:m.getCanvas(),context:gl});renderer.autoClear=false;renderer.resetState();},render(gl,args){
  if(!visible||disposed)return;
  const projection=args.defaultProjectionData?.mainMatrix??args;
  camera.projectionMatrix.fromArray(projection).multiply(matrix);renderer.resetState();const start=performance.now();renderer.render(scene,camera);frames++;lastCalls=renderer.info.render.calls;lastTriangles=renderer.info.render.triangles;window.recordCityRender?.('OSM2World streets',renderer,performance.now()-start);
 },onRemove(){disposeResources();}};
 function heightAt(lng,lat){
  if(disposed||!Number.isFinite(lng)||!Number.isFinite(lat))return null;
  const p=maplibregl.MercatorCoordinate.fromLngLat([lng,lat],0),x=(p.x-origin.x)/scale,y=(origin.y-p.y)/scale;let height=null;
  for(const id of cells.get(Math.floor(x/cellSize)+','+Math.floor(y/cellSize))??[]){const {a,b,c,den}=triangles[id],u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6){const z=u*a.z+v*b.z+w*c.z;height=height===null?z:Math.max(height,z);}}
  return height;
 }
 const api={bounds:metadata.bounds,origin:anchor,footprintURL:STREET_PATCH_FOOTPRINT,heightAt,contains:(lng,lat)=>heightAt(lng,lat)!==null,setVisible(value){visible=!!value;map.triggerRepaint();},state:()=>({ready:!disposed,visible,origin:anchor,bounds:metadata.bounds,meshes:metadata.meshes,triangles:metadata.triangles,indexedTriangles:triangles.length,indexCells:cells.size,groundIndexSource:groundIndex?'sidecar':'mesh',groundIndexURL:groundIndex?.url??null,frames,drawCalls:lastCalls,renderedTriangles:lastTriangles,...surfaces.state(),surfaceCoverage:coverage?.state()??{status:'disabled'}}),dispose(){if(map.getLayer(layer.id))map.removeLayer(layer.id);else disposeResources();}};
 map.addLayer(layer);map.triggerRepaint();return api;
 }catch(error){disposeResources();throw error;}
 function disposeResources(){if(disposed)return;disposed=true;coverage?.dispose();surfaces?.dispose();gltf.scene.traverse(m=>{if(m.isMesh){m.geometry.dispose();for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();}});renderer?.dispose();cells.clear();triangles.length=0;installed.delete(map);}
}
