import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareStreetSurfaces} from './street-surface-materials.js';

export const STREET_PATCH_ORIGIN=Object.freeze([77.5907159,12.9797946]);
const installed=new WeakMap();
const ASSET=new URL('./assets/streets/vidhana-streets.glb',import.meta.url).href;
const METADATA=new URL('./assets/streets/vidhana-streets.json',import.meta.url).href;
export const STREET_PATCH_FOOTPRINT=new URL('./assets/streets/vidhana-footprint.geojson',import.meta.url).href;

// Z-up batched asset; never rotate this asset again after loading.
export function installStreetPatch(map){
 if(!installed.has(map))installed.set(map,install(map).catch(error=>{installed.delete(map);throw error;}));
 return installed.get(map);
}
async function install(map){
 const [gltf,response]=await Promise.all([new GLTFLoader().loadAsync(ASSET),fetch(METADATA)]);
 if(!response.ok)throw Error('Street patch metadata unavailable');
 const metadata=await response.json(),origin=maplibregl.MercatorCoordinate.fromLngLat(STREET_PATCH_ORIGIN,0),scale=origin.meterInMercatorCoordinateUnits();
 const scene=new THREE.Scene(),camera=new THREE.Camera(),cells=new Map(),triangles=[],cellSize=12;
 let disposed=false,visible=true,renderer,frames=0,lastCalls=0,lastTriangles=0;
 gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.frustumCulled=false;
  const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
  for(let i=0;i<(index?.count??p.count);i+=3){
   const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
   const [a,b,c]=v,den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
   if(Math.abs(den)<1e-8)continue;
   const triangle={a,b,c,den},id=triangles.push(triangle)-1;
   for(let x=Math.floor(Math.min(a.x,b.x,c.x)/cellSize);x<=Math.floor(Math.max(a.x,b.x,c.x)/cellSize);x++)for(let y=Math.floor(Math.min(a.y,b.y,c.y)/cellSize);y<=Math.floor(Math.max(a.y,b.y,c.y)/cellSize);y++){const key=x+','+y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(id);}
  }
 });
 const surfaces=prepareStreetSurfaces(gltf.scene);
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
 function disposeResources(){if(disposed)return;disposed=true;surfaces.dispose();gltf.scene.traverse(m=>{if(m.isMesh){m.geometry.dispose();for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();}});renderer?.dispose();cells.clear();triangles.length=0;installed.delete(map);}
 const api={bounds:metadata.bounds,origin:STREET_PATCH_ORIGIN,footprintURL:STREET_PATCH_FOOTPRINT,heightAt,contains:(lng,lat)=>heightAt(lng,lat)!==null,setVisible(value){visible=!!value;map.triggerRepaint();},state:()=>({ready:!disposed,visible,origin:STREET_PATCH_ORIGIN,bounds:metadata.bounds,meshes:metadata.meshes,triangles:metadata.triangles,indexedTriangles:triangles.length,indexCells:cells.size,frames,drawCalls:lastCalls,renderedTriangles:lastTriangles,...surfaces.state()}),dispose(){if(map.getLayer(layer.id))map.removeLayer(layer.id);else disposeResources();}};
 map.addLayer(layer);map.triggerRepaint();return api;
}
