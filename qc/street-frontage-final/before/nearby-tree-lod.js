const DEFAULT_ASSET=new URL('./assets/trees/review/shapespark-tree-01-1.glb',import.meta.url).href;

// Positions are the district's existing metre-space planting locations. This
// selects detail only; it never creates planting locations or ground heights.
export function selectNearTreeIndices(positions,focus,{radius=80,limit=32,selected=new Set()}={}){
 if(!focus?.active||!Number.isFinite(focus.x)||!Number.isFinite(focus.y))return [];
 const candidates=[];
 for(let i=0;i<positions.length;i++){
  const p=positions[i],d=Math.hypot(p.x-focus.x,p.y-focus.y);
  // An eight-metre exit band prevents toggling around the entry boundary.
  if(d<(selected.has(i)?radius:Math.max(0,radius-8)))candidates.push({i,d,score:d-(selected.has(i)?4:0)});
 }
 return candidates.sort((a,b)=>a.score-b.score||a.i-b.i).slice(0,limit).map(p=>p.i).sort((a,b)=>a-b);
}

/**
 * Drop-in controller, not installed by this module itself.
 * `parent`, `positions`, `trunk`, `crowns` belong to the existing district.
 * Call update({active,x,y,now}) in district render with an active ground focus.
 * `onChange` should request a map repaint. No timers/render loops are created.
 */
export function createNearbyTreeLOD(T,{parent,positions,trunk,crowns,assetURL=DEFAULT_ASSET,radius=80,maxDesktop=32,maxMobile=16,mobile=()=>globalThis.matchMedia?.('(max-width: 700px), (pointer: coarse)').matches??false,onChange=()=>{},loadAsset}={}){
 if(!parent||!positions||trunk.count!==positions.length||crowns.count!==positions.length*2)throw Error('Nearby tree LOD needs one trunk and two crown instances per planting');
 const originalTrunks=trunk.instanceMatrix.array.slice(),originalCrowns=crowns.instanceMatrix.array.slice();
 const group=new T.Group();group.name='nearby-tree-lod';parent.add(group);
 const hidden=new T.Matrix4().makeScale(0,0,0),dummy=new T.Object3D(),sourceTransform=new T.Matrix4().makeRotationX(Math.PI/2);
 let disposed=false,loaded=false,error=null,selected=new Set(),key='',lastUpdate=-Infinity,lastFocus={active:false},sourceHeight=1,sourceTriangles=0,updates=0;
 const batches=[],ownedTextures=new Set(),capacity=Math.max(maxDesktop,maxMobile);
 function invalidate(){try{onChange();}catch(e){error="Repaint callback: "+String(e.message??e);}}
 function restore(id){trunk.instanceMatrix.array.set(originalTrunks.subarray(id*16,id*16+16),id*16);for(let j=0;j<2;j++){const offset=(id*2+j)*16;crowns.instanceMatrix.array.set(originalCrowns.subarray(offset,offset+16),offset);}}
 function apply(ids){
  const nextKey=ids.join(',');if(nextKey===key)return false;
  const next=new Set(ids);for(const id of selected)if(!next.has(id))restore(id);
  for(const id of ids){trunk.setMatrixAt(id,hidden);crowns.setMatrixAt(id*2,hidden);crowns.setMatrixAt(id*2+1,hidden);}
  for(let slot=0;slot<ids.length;slot++){
   const id=ids[slot],p=positions[id],height=p.h+1+p.r*.85;
   dummy.position.set(p.x,p.y,Number.isFinite(p.z)?p.z:0);dummy.rotation.set(0,0,(id*2.399963229728653)%(Math.PI*2));dummy.scale.setScalar(height/sourceHeight);dummy.updateMatrix();
   for(const b of batches)b.mesh.setMatrixAt(slot,dummy.matrix);
  }
  for(const b of batches){b.mesh.count=ids.length;b.mesh.instanceMatrix.needsUpdate=true;}
  trunk.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;selected=next;key=nextKey;updates++;invalidate();return true;
 }
 function update(focus){lastFocus={...focus};if(disposed||!loaded)return false;const now=focus.now??performance.now();if(focus.active&&now-lastUpdate<250)return false;lastUpdate=now;return apply(selectNearTreeIndices(positions,focus,{radius,limit:mobile()?maxMobile:maxDesktop,selected}));}
 const ready=(async()=>{
  let root;
  try{
   root=loadAsset?await loadAsset(): (await new (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader().loadAsync(assetURL)).scene;
   root.updateMatrixWorld(true);const sourceBounds=new T.Box3().setFromObject(root);sourceHeight=sourceBounds.max.y-sourceBounds.min.y;if(!(sourceHeight>0))throw Error('Tree source has no positive height');
   const normalize=new T.Matrix4().makeTranslation(0,-sourceBounds.min.y,0);
   root.traverse(o=>{
    if(!o.isMesh)return;
    if(Array.isArray(o.material))throw Error('Expected independently batched tree primitives');
    const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(normalize).applyMatrix4(sourceTransform),material=o.material.clone();
    for(const value of Object.values(o.material))if(value?.isTexture)ownedTextures.add(value);
    if(material.transparent){material.transparent=false;material.alphaTest=.3;material.depthWrite=true;material.alphaToCoverage=true;material.emissive.setRGB(.09,.09,.09);material.emissiveMap=material.map;}
    material.needsUpdate=true;const mesh=new T.InstancedMesh(geometry,material,capacity);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(mesh);batches.push({mesh,geometry,material});sourceTriangles+=(geometry.index?.count??geometry.attributes.position.count)/3;
   });
   if(!batches.length)throw Error('Tree source has no meshes');
   if(disposed){disposeAssets();return false;}
   loaded=true;lastUpdate=-Infinity;update(lastFocus);invalidate();return true;
  }catch(e){error=String(e.message??e);disposeAssets();return false;}
  finally{root?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
 })();
 function disposeAssets(){for(const b of batches){group.remove(b.mesh);b.geometry.dispose();b.material.dispose();}batches.length=0;for(const t of ownedTextures)t.dispose();ownedTextures.clear();}
 function dispose(){if(disposed)return;for(const id of selected)restore(id);if(selected.size){trunk.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;}selected.clear();key='';disposed=true;parent.remove(group);disposeAssets();invalidate();}
 return {ready,update,dispose,state:()=>({loaded,disposed,error,selectedIndices:[...selected],nearCount:selected.size,radius,limit:mobile()?maxMobile:maxDesktop,drawCalls:selected.size?batches.length:0,triangles:selected.size*sourceTriangles,sourceTriangles,hiddenFarInstances:selected.size*3,updates,assetURL})};
}
