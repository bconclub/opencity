const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const THREE=await import(pathToFileURL('D:/CodexTools/OSM2World/three.module.js').href);
 global.__streetMaterialThree=THREE;
 const source=fs.readFileSync(path.join(__dirname,'../street-surface-materials.js'),'utf8').replace("import * as THREE from 'three';",'const THREE=globalThis.__streetMaterialThree;');
 const {prepareStreetSurfaces}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const root=new THREE.Group(),cases=[];
 function add(label,color,role,expected,map){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,2,0,0,0,2,0],3));g.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3));
  const mat=new THREE.MeshStandardMaterial({color});if(role!==undefined)mat.userData.streetSurfaceRole=role;
  const mesh=new THREE.Mesh(g,mat);root.add(mesh);cases.push({label,mesh,before:mat.color.clone(),expected:expected?new THREE.Color(expected):mat.color.clone(),map});
 }
 add('legacy asphalt','#4d4d4d',undefined,'#626b70','asphalt');
 add('legacy concrete','#8c8c8c',undefined,'#a6a9ab','concrete');
 add('legacy paving','#666666',undefined,'#92958d','concrete');
 add('legacy marking','#e5e5e5',undefined,'#ecebe2',null);
 add('explicit asphalt ignores input brightness','#ffffff','asphalt','#626b70','asphalt');
 add('source red preserved','#4d0000','source',null,null);
 add('source sign preserved','#c8c8c8','source',null,null);
 add('source white preserved','#ffffff','source',null,null);
 add('future unknown role preserves source','#22aa44','future-fixture',null,null);
 const api=prepareStreetSurfaces(root);
 for(const c of cases){assert(c.mesh.material.color.equals(c.expected),c.label+' colour changed');assert.equal(c.mesh.material.map?.name??null,c.map?'street-'+c.map+'-original':null,c.label+' map');assert.equal(c.mesh.geometry.attributes.position.count,3);assert.deepEqual([...c.mesh.geometry.attributes.uv.array],[0,0,1,0,0,1]);}
 assert.equal(api.state().surfaceTextures,2);let disposed=0;const maps=new Set(cases.map(c=>c.mesh.material.map).filter(Boolean));for(const m of maps)m.addEventListener('dispose',()=>disposed++);api.dispose();assert.equal(disposed,2);
 const dir=path.join(__dirname,'street-500-junction-kerb/asset');
 const bytes=fs.readFileSync(path.join(dir,'vidhana-streets.glb')),doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert.equal(doc.materials.length,7);assert(doc.materials.every(m=>m.extras?.streetSurfaceRole));assert.equal(doc.materials.filter(m=>m.extras.streetSurfaceRole==='source').length,3);
 const report={passed:true,cases:cases.map(c=>c.label),sharedTextures:2,assetMaterials:7,sourceColourBatches:3,geometryAdded:0};
 fs.writeFileSync(path.join(__dirname,'street-500-junction-kerb/material-results.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
})();
