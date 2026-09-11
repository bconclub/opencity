// REVIEW ONLY. Intercept street-surface-materials.js with this module.
// Geometry, material count and opaque depth coverage remain unchanged.
import * as THREE from 'three';
import {prepareStreetSurfaces as prepareBase} from '/qc/street-coverage-base.js';
const metadata=await fetch('/qc/street-coverage-atlas.json').then(r=>{if(!r.ok)throw Error('Missing coverage atlas metadata');return r.json();});
const atlas=await new THREE.TextureLoader().loadAsync('/qc/street-coverage-atlas.png');
atlas.colorSpace=THREE.NoColorSpace; // Already premultiplied LINEAR diffuse RGB.
atlas.wrapS=atlas.wrapT=THREE.ClampToEdgeWrapping;
atlas.minFilter=THREE.LinearMipmapLinearFilter;
atlas.magFilter=THREE.LinearFilter;
atlas.generateMipmaps=true;atlas.anisotropy=1;
atlas.name='review-street-exact-surface-coverage';
const min=new THREE.Vector2(...metadata.bounds.slice(0,2));
const span=new THREE.Vector2(metadata.bounds[2]-metadata.bounds[0],metadata.bounds[3]-metadata.bounds[1]);
export function prepareStreetSurfaces(root){
 const base=prepareBase(root);let materials=0;
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
   materials++;
   mat.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{streetCoverageAtlas:{value:atlas},streetCoverageMin:{value:min},streetCoverageSpan:{value:span}});
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vCoverageXY; varying float vCoverageGround;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvCoverageXY=position.xy; vCoverageGround=(abs(position.z)<0.00001 && abs(normal.z)>0.9)?1.0:0.0;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
     varying vec2 vCoverageXY; varying float vCoverageGround;
     uniform sampler2D streetCoverageAtlas;
     uniform vec2 streetCoverageMin; uniform vec2 streetCoverageSpan;`)
      .replace('#include <map_fragment>',`#include <map_fragment>
       vec4 coverage=texture2D(streetCoverageAtlas,(vCoverageXY-streetCoverageMin)/streetCoverageSpan);
       float metricPixel=max(length(dFdx(vCoverageXY)),length(dFdy(vCoverageXY)));
       float coverageBlend=smoothstep(0.18,0.65,metricPixel)*step(0.999,vCoverageGround)*step(0.0001,coverage.a);
       // Divide premultiplied colour by filtered coverage, avoiding dark fringes
       // at the outer road boundary. Both paint and surrounding road sample this.
       diffuseColor.rgb=mix(diffuseColor.rgb,coverage.rgb/max(coverage.a,0.0001),coverageBlend);`);
   };
   mat.customProgramCacheKey=()=> 'street-coverage-review-1';
   mat.needsUpdate=true;
  }
 });
 const state=()=>({...base.state(),reviewCoverage:true,materials,atlasSize:metadata.size,totalSurfaceGpuBytes:metadata.totalSurfaceGpuBytes,atlasDownloadBytes:metadata.atlasDownloadBytes,nearExactBelowMetresPerPixel:.18,farCoverageAboveMetresPerPixel:.65});
 window.streetCoverageReview={state};
 return{state,dispose(){base.dispose();atlas.dispose();}};
}
