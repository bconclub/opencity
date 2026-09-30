import * as THREE from 'three';

// Optional, asset-bound distant lane coverage. Never changes geometry or alpha.
const SHA256=/^[a-f0-9]{64}$/;
export function validateStreetCoverage(value,{origin,localBounds,baseURL}){
 if(!value||value.version!==1||value.encoding!=='premultiplied-linear-rgba8')throw Error('Unsupported street coverage metadata');
 if(!SHA256.test(value.geometrySha256)||!SHA256.test(value.atlasSha256))throw Error('Invalid street coverage hashes');
 if(value.size!==1024||!Number.isSafeInteger(value.atlasBytes)||value.atlasBytes<33||value.atlasBytes>2*1024*1024)throw Error('Street coverage texture budget exceeded');
 if(!Array.isArray(value.origin)||value.origin.length!==2||value.origin.some((v,i)=>!Number.isFinite(v)||v!==origin?.[i]))throw Error('Street coverage origin mismatch');
 const b=value.bounds;
 if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[2]<=b[0]||b[3]<=b[1]||Math.abs((b[2]-b[0])-(b[3]-b[1]))>1e-6||b[2]-b[0]>1000)throw Error('Invalid street coverage bounds');
 if(!localBounds?.min||!localBounds?.max||[0,1].some(i=>!Number.isFinite(localBounds.min[i])||!Number.isFinite(localBounds.max[i])||b[i]>localBounds.min[i]||b[i+2]<localBounds.max[i]||localBounds.min[i]-b[i]>20||b[i+2]-localBounds.max[i]>20))throw Error('Street coverage does not fit geometry');
 if(typeof value.atlasURL!=='string'||!value.atlasURL.trim())throw Error('Missing street coverage URL');
 const url=new URL(value.atlasURL,baseURL),base=new URL(baseURL);
 if(url.origin!==base.origin||!url.pathname.endsWith('.png')||url.username||url.password)throw Error('Street coverage requires a same-origin PNG');
 return {...value,bounds:[...b],url:url.href};
}
async function digest(bytes){
 if(!globalThis.crypto?.subtle)throw Error('Street coverage digest unavailable');
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
}

export async function enableStreetCoverage(root,options){
 let atlas=null,disposed=false,status='loading',reason=null;const modified=[];
 const controller={state:()=>({status,reason,atlasSize:atlas?1024:0,atlasGpuBytesIncludingMips:atlas?5592404:0,totalSurfaceGpuBytes:atlas?6291452:699048,geometryAdded:0}),dispose(){
  if(disposed)return;disposed=true;status='disposed';
  for(const {material,beforeCompile,cacheKey}of modified){material.onBeforeCompile=beforeCompile;material.customProgramCacheKey=cacheKey;material.needsUpdate=true;}
  modified.length=0;atlas?.dispose();atlas=null;
 }};
 try{
  const meta=validateStreetCoverage(options.metadata,options);
  // Exact GLB bytes, before parsing or material replacement, bind geometry and
  // source material ownership. A classified replacement needs its own atlas.
  if(options.classified||!(options.assetBytes instanceof ArrayBuffer)||await digest(options.assetBytes)!==meta.geometrySha256)throw Error('Street coverage geometry mismatch');
  const materials=new Set();
  root.traverse(mesh=>{if(mesh.isMesh){
   if(!mesh.matrixWorld.equals(new THREE.Matrix4()))throw Error('Street coverage requires untransformed source geometry');
   for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(material);
  }});
  if(materials.size!==4||[...materials].some(m=>!['marking','concrete','paving','asphalt'].includes(m.userData.streetSurfaceRole)))throw Error('Street coverage material mismatch');
  const response=await fetch(meta.url,{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Street coverage atlas unavailable');
  const declared=Number(response.headers.get('content-length'));
  if(declared>2*1024*1024)throw Error('Street coverage response too large');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength!==meta.atlasBytes||await digest(bytes)!==meta.atlasSha256)throw Error('Street coverage atlas integrity mismatch');
  const header=new DataView(bytes);
  if(header.getUint32(0)!==0x89504e47||header.getUint32(4)!==0x0d0a1a0a||header.getUint32(12)!==0x49484452||header.getUint32(16)!==meta.size||header.getUint32(20)!==meta.size)throw Error('Street coverage PNG dimensions mismatch');
  const objectURL=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  try{atlas=await new THREE.TextureLoader().loadAsync(objectURL);}finally{URL.revokeObjectURL(objectURL);}
  if(atlas.image.width!==meta.size||atlas.image.height!==meta.size)throw Error('Street coverage decoded dimensions mismatch');
  atlas.name='street-source-coverage';atlas.colorSpace=THREE.NoColorSpace;
  atlas.wrapS=atlas.wrapT=THREE.ClampToEdgeWrapping;atlas.minFilter=THREE.LinearMipmapLinearFilter;
  atlas.magFilter=THREE.LinearFilter;atlas.generateMipmaps=true;atlas.anisotropy=1;atlas.needsUpdate=true;
  const min=new THREE.Vector2(...meta.bounds.slice(0,2)),span=new THREE.Vector2(meta.bounds[2]-meta.bounds[0],meta.bounds[3]-meta.bounds[1]);
  for(const material of materials){
   const beforeCompile=material.onBeforeCompile,cacheKey=material.customProgramCacheKey;
   modified.push({material,beforeCompile,cacheKey});
   material.onBeforeCompile=function(shader,renderer){
    beforeCompile.call(this,shader,renderer);
    Object.assign(shader.uniforms,{streetCoverageAtlas:{value:atlas},streetCoverageMin:{value:min},streetCoverageSpan:{value:span}});
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vCoverageXY; varying float vCoverageGround;')
     .replace('#include <begin_vertex>','#include <begin_vertex>\nvCoverageXY=position.xy; vCoverageGround=(abs(position.z)<0.00001 && abs(normal.z)>0.9)?1.0:0.0;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
     varying vec2 vCoverageXY; varying float vCoverageGround;
     uniform sampler2D streetCoverageAtlas;
     uniform vec2 streetCoverageMin; uniform vec2 streetCoverageSpan;`)
     .replace('#include <map_fragment>',`#include <map_fragment>
      // Gradients are evaluated uniformly, before the fragment-dependent branch.
      vec2 coverageDx=dFdx(vCoverageXY),coverageDy=dFdy(vCoverageXY);
      vec2 coverageUV=(vCoverageXY-streetCoverageMin)/streetCoverageSpan;
      vec2 coverageUVDx=coverageDx/streetCoverageSpan,coverageUVDy=coverageDy/streetCoverageSpan;
      float metricPixel=max(length(coverageDx),length(coverageDy));
      float coverageBlend=smoothstep(0.18,0.65,metricPixel)*step(0.999,vCoverageGround);
      if(coverageBlend>0.0){
       vec4 coverage=textureGrad(streetCoverageAtlas,coverageUV,coverageUVDx,coverageUVDy);
       coverageBlend*=step(0.0001,coverage.a);
       diffuseColor.rgb=mix(diffuseColor.rgb,coverage.rgb/max(coverage.a,0.0001),coverageBlend);
      }`);
   };
   const priorKey=cacheKey.call(material);
   material.customProgramCacheKey=()=>priorKey+'|street-source-coverage-v2-grad-branch-review';material.needsUpdate=true;
  }
  status='ready';
 }catch(error){
  controller.dispose();disposed=false;status='fallback';reason=error.message;
 }
 return controller;
}
