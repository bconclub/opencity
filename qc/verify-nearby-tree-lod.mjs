import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createNearbyTreeLOD,selectNearTreeIndices} from '../nearby-tree-lod.js';
const T=await import(pathToFileURL('D:/CodexTools/OSM2World/three.module.js').href);
function fixture(){
 const positions=Array.from({length:70},(_,i)=>({x:(i%10-5)*8,y:(Math.floor(i/10)-3)*8,z:.1,h:8,r:3}));
 const trunk=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshStandardMaterial(),positions.length),crowns=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshStandardMaterial(),positions.length*2),parent=new T.Group();parent.add(trunk,crowns);
 const m=new T.Matrix4();positions.forEach((p,i)=>{m.makeTranslation(p.x,p.y,4.1);trunk.setMatrixAt(i,m);for(let j=0;j<2;j++){m.makeTranslation(p.x+j,p.y,8+j);crowns.setMatrixAt(i*2+j,m);}});
 const originals=[trunk.instanceMatrix.array.slice(),crowns.instanceMatrix.array.slice()];
 return {positions,trunk,crowns,parent,originals};
}
function source(){const group=new T.Group();for(let i=0;i<3;i++){const mesh=new T.Mesh(new T.BoxGeometry(2,4,2),new T.MeshStandardMaterial({transparent:i>0}));mesh.position.y=2+i;group.add(mesh);}return group;}
const f=fixture();let mobile=false,changes=0;
const controller=createNearbyTreeLOD(T,{...f,mobile:()=>mobile,onChange:()=>changes++,loadAsset:async()=>source()});
controller.update({active:true,x:0,y:0,now:1000});assert.deepEqual(f.trunk.instanceMatrix.array,f.originals[0]);
assert(await controller.ready);let state=controller.state();assert.equal(state.nearCount,32);assert.equal(state.drawCalls,3);assert.equal(state.sourceTriangles,36);assert.equal(state.hiddenFarInstances,96);
const near=f.parent.children.find(x=>x.name==='nearby-tree-lod');assert.equal(near.children.length,3);
for(const id of state.selectedIndices){assert.equal(f.trunk.instanceMatrix.array[id*16],0);assert.equal(f.crowns.instanceMatrix.array[id*32],0);assert.equal(f.crowns.instanceMatrix.array[id*32+16],0);}
for(let i=0;i<f.positions.length;i++)if(!state.selectedIndices.includes(i))assert.deepEqual(f.trunk.instanceMatrix.array.slice(i*16,i*16+16),f.originals[0].slice(i*16,i*16+16));
assert.equal(near.children[0].instanceMatrix.array[14],Math.fround(.1),'Ground Z must be preserved');
assert(!controller.update({active:true,x:500,y:500,now:1100}));assert.equal(controller.state().nearCount,32,'Throttle must avoid early rewrite');
controller.update({active:true,x:500,y:500,now:1300});assert.equal(controller.state().nearCount,0);assert.deepEqual(f.trunk.instanceMatrix.array,f.originals[0]);assert.deepEqual(f.crowns.instanceMatrix.array,f.originals[1]);
mobile=true;controller.update({active:true,x:0,y:0,now:1600});assert.equal(controller.state().nearCount,16);
controller.update({active:false,now:1601});assert.equal(controller.state().nearCount,0,'Deactivation restores immediately without throttle');
controller.update({active:true,x:0,y:0,now:1900});controller.dispose();controller.dispose();assert.deepEqual(f.trunk.instanceMatrix.array,f.originals[0]);assert.deepEqual(f.crowns.instanceMatrix.array,f.originals[1]);assert(!f.parent.children.includes(near));
const invalid=fixture(),failed=createNearbyTreeLOD(T,{...invalid,loadAsset:async()=>{throw Error('synthetic unavailable asset');}});assert.equal(await failed.ready,false);assert(failed.state().error.includes('synthetic'));assert.deepEqual(invalid.trunk.instanceMatrix.array,invalid.originals[0]);failed.dispose();
const pending=fixture();let complete;const removed=createNearbyTreeLOD(T,{...pending,loadAsset:()=>new Promise(r=>complete=r)});removed.dispose();complete(source());assert.equal(await removed.ready,false);assert.deepEqual(pending.trunk.instanceMatrix.array,pending.originals[0]);
const boundary=[{x:75,y:0},{x:81,y:0}];assert.deepEqual(selectNearTreeIndices(boundary,{active:true,x:0,y:0}),[]);assert.deepEqual(selectNearTreeIndices(boundary,{active:true,x:0,y:0},{selected:new Set([0,1])}),[0]);
assert.deepEqual(selectNearTreeIndices(boundary,{active:true,x:NaN,y:0}),[]);
console.log(JSON.stringify({pass:true,checks:['deferred loading keeps originals','32 desktop / 16 mobile caps','three shared batches','selected far slots hidden without duplicates','unselected slots unchanged','ground height preserved','throttled updates','inactive restoration','dispose restoration','load failure fallback','dispose during pending load','entry/exit hysteresis'],sourceAssetBudget:{trianglesPerTree:646,desktopNearTriangles:32*646,mobileNearTriangles:16*646,extraDrawCalls:3},changes},null,2));
