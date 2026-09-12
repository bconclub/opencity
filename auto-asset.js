import {paintHex,selectedVehicleColor} from './vehicle-colors.js';
import {bindVehicleWheelRig} from './blender-vehicle.js';
let assetPromise;
export function loadAutoAsset(){
 if(!assetPromise)assetPromise=import('three/addons/loaders/GLTFLoader.js').then(({GLTFLoader})=>new GLTFLoader().loadAsync('./assets/auto/auto-rickshaw-rigged.glb')).catch(error=>{assetPromise=null;throw error;});
 return assetPromise;
}
export function upgradeAuto(T,model,remote){
 let disposed=false,loadedPaint=[],paintKey=remote?null:selectedVehicleColor();const fallbackPaint=model.setPaint,fallbackDispose=model.disposePaint;
 const apply=key=>{if(!paintHex(key))return false;paintKey=key;fallbackPaint(key);for(const u of loadedPaint){u.tint.value.set(paintHex(key));u.enabled.value=1;}return true;};
 const changed=e=>apply(e.detail?.color);if(!remote)window.addEventListener('vehicle-color-change',changed);
 model.setPaint=apply;model.disposePaint=()=>{disposed=true;fallbackDispose();window.removeEventListener('vehicle-color-change',changed);};
 model.group.addEventListener('removed',()=>{disposed=true;window.removeEventListener('vehicle-color-change',changed);});
 model.group.userData.assetStatus='loading';
 model.ready=loadAutoAsset().then(gltf=>{
  if(disposed)return false;
  const imported=gltf.scene.clone(true);imported.rotation.x=Math.PI/2; // glTF Y-up to game Z-up.
  imported.traverse(object=>{if(!object.isMesh)return;object.geometry=object.geometry.clone();object.frustumCulled=false;object.castShadow=object.receiveShadow=true;
   const copy=original=>{const m=original.clone();for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(m[key]){m[key]=m[key].clone();m[key].needsUpdate=true;}
    const uniform={tint:{value:new T.Color(0xffffff)},enabled:{value:0}};loadedPaint.push(uniform);
    // Repaint only yellow body pixels. Black canopy, tyres, glass and decals remain intact.
    m.onBeforeCompile=shader=>{shader.uniforms.autoTint=uniform.tint;shader.uniforms.autoTintEnabled=uniform.enabled;shader.fragmentShader='uniform vec3 autoTint; uniform float autoTintEnabled;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat bodyMask = step(0.22, diffuseColor.r) * step(0.16, diffuseColor.g) * (1.0-step(0.22,diffuseColor.b)) * autoTintEnabled; diffuseColor.rgb = mix(diffuseColor.rgb, autoTint * max(diffuseColor.r, diffuseColor.g),bodyMask);');};m.customProgramCacheKey=()=> 'user-auto-paint-v1';return m;};
   object.material=Array.isArray(object.material)?object.material.map(copy):copy(object.material);
  });
  const rig=bindVehicleWheelRig(T,imported);
  if(rig.wheels.length!==3)throw Error('Imported auto requires three independent wheel pivots');
  for(const child of model.body.children)child.visible=false;
  model.body.add(imported);model.wheels.splice(0,model.wheels.length,...rig.wheels);
  model.wheelRadius=rig.wheelRadius;model.wheelbase=rig.wheelbase;
  model.updateDrive=(angle,steer=0,time=0,slipAngle=0)=>rig.update(angle,steer,slipAngle);
  model.getWheelContacts=()=>rig.getWheelContacts(model.group);
  model.group.userData.assetStatus='ready';model.group.userData.assetSource='user-auto-rickshaw-wheel-rig';if(paintKey)apply(paintKey);window.dispatchEvent(new CustomEvent('vehicle-asset-ready',{detail:{vehicle:'auto'}}));return true;
 }).catch(error=>{model.group.userData.assetStatus='fallback';console.warn('Auto asset unavailable; using built-in model.',error.message);return false;});
 return model;
}
