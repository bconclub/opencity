import assert from 'node:assert/strict';
import {setMapSceneCamera} from '../map-scene-camera.js';
const response=await fetch('https://unpkg.com/three@0.169.0/build/three.module.js');assert(response.ok);
const T=await import('data:text/javascript;base64,'+Buffer.from(await response.text()).toString('base64'));
let count=0,worst=0;
for(const eye of [[120,-300,16],[0,0,400],[-1300,1100,1200]])for(const target of [[0,0,0],[30,80,10]]){
 const source=new T.PerspectiveCamera(55,16/9,.1,6000);source.up.set(0,0,1);source.position.set(...eye);source.lookAt(...target);source.updateMatrixWorld(true);source.projectionMatrix.elements[8]=.13;source.projectionMatrix.elements[9]=-.21;
 const combined=new T.Matrix4().multiplyMatrices(source.projectionMatrix,source.matrixWorldInverse),camera=new T.Camera();assert(setMapSceneCamera(T,camera,combined));assert(camera.position.distanceTo(source.position)<1e-6);
 const aliased=new T.Camera();aliased.projectionMatrix.copy(combined);assert(setMapSceneCamera(T,aliased,aliased.projectionMatrix));aliased.updateMatrixWorld(true);const aliasFactored=new T.Matrix4().multiplyMatrices(aliased.projectionMatrix,aliased.matrixWorldInverse);assert(aliasFactored.elements.every((n,i)=>Math.abs(n-combined.elements[i])<1e-8));
 const factored=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
 for(const p of [[0,0,0],[100,200,30],[-500,90,18],[2000,-1700,75]]){
  const a=new T.Vector4(...p,1).applyMatrix4(combined),b=new T.Vector4(...p,1).applyMatrix4(factored);for(const key of ['x','y','z','w']){const error=Math.abs(a[key]-b[key]);worst=Math.max(worst,error);assert(error<1e-8);}
 }count++;
 // Repeated updates use the same scratch object and preserve current eye.
 assert(setMapSceneCamera(T,camera,combined));assert(camera.position.distanceTo(source.position)<1e-6);
}
const orthographic=new T.Camera();assert.equal(setMapSceneCamera(T,orthographic,new T.Matrix4()),false);assert.deepEqual(orthographic.position.toArray(),[0,0,0]);
console.log(JSON.stringify({passed:true,cameraPoses:count,clipPoints:count*4,maxClipError:worst,orthographicFallback:true,aliasedInputAndRendererUpdate:true}));
