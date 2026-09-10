import * as THREE from 'three';

// Original locally generated surface treatments, not photographs of Bengaluru.
// Existing OSM2World geometry owns all kerbs, lane paint and mapped crossings.
// Metric UVs keep aggregate at centimetre scale instead of stretching it per face.
export function prepareStreetSurfaces(root){
 const textures=[];
 const SIZE=256,REPEAT_METRES=2;
 function texture(kind){
  const pixels=new Uint8Array(SIZE*SIZE*4);let seed=kind==='asphalt'?15497:991;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const grain=rand(),fine=rand(),p=(y*SIZE+x)*4;
   // Aggregate and shallow pores, with restrained contrast for stable mipmaps.
   let value=kind==='asphalt'?157+(grain-.5)*42+(fine>.976?26:0):205+(grain-.5)*13;
   if(kind==='concrete'&&fine>.97)value-=12;
   pixels[p]=Math.max(0,Math.min(255,value));pixels[p+1]=pixels[p];pixels[p+2]=pixels[p];pixels[p+3]=255;
  }
  const map=new THREE.DataTexture(pixels,SIZE,SIZE,THREE.RGBAFormat);
  map.name='street-'+kind+'-original';map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;
  map.minFilter=THREE.LinearMipmapNearestFilter;map.generateMipmaps=true;map.anisotropy=1;map.needsUpdate=true;textures.push(map);return map;
 }
 const asphalt=texture('asphalt'),concrete=texture('concrete');
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){
   // Vertical kerb faces use height on V, horizontal pavement uses world XY.
   const vertical=Math.abs(n.getZ(i))<.5;
   uv[i*2]=(vertical?(Math.abs(n.getX(i))>.5?p.getY(i):p.getX(i)):p.getX(i))/REPEAT_METRES;
   uv[i*2+1]=(vertical?p.getZ(i):p.getY(i))/REPEAT_METRES;
  }
  mesh.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  const replacements=materials.map(mat=>{
   const value=mat.color.r;
   // The audited asset batches use converter defaults: white paint, .55
   // concrete, .4 paving and .3 asphalt (stored in glTF linear colour).
   const paint=value>.6;
   // These are dry matte surfaces; vertex-lit diffuse shading avoids spending
   // per-pixel metallic BRDF work on a near-zero-specular pavement material.
   // Restrained visual match to the documented 2019 Ambedkar Veedhi photo.
   // Material batch identification comes from the export, not pixel surveying.
   const replacement=new THREE.MeshLambertMaterial({side:mat.side,color:paint?'#ecebe2':value>.2?'#a6a9ab':value>.1?'#92958d':'#626b70',map:paint?null:value>.1?concrete:asphalt});
   mat.dispose();return replacement;
  });
  mesh.material=Array.isArray(mesh.material)?replacements:replacements[0];
 });
 return {state:()=>({surfaceTextures:textures.length,textureSize:SIZE,repeatMetres:REPEAT_METRES,geometryAdded:0,originalProceduralTextures:true}),dispose(){for(const t of textures)t.dispose();}};
}
