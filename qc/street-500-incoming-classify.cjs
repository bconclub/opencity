// Reclassify regenerated geometry by source material and exact furniture identity.
// Native mesh indices are not stable when the missing approach is restored.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {clipMesh}=require('../experiments/osm2world/clip-coverage.cjs');
const dir=path.join(__dirname,'street-500-incoming-junction'),oldDir=path.join(__dirname,'../experiments/osm2world/coverage-500');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),oldBytes=fs.readFileSync(path.join(oldDir,'meshes.json')),bytes=fs.readFileSync(path.join(dir,'meshes-raw.json'));
assert.equal(sha(oldBytes),'ca8789d4181bc435398ac6edbab468e6c489e37eaffbef4155dc11c5912c1f3e');
const before=JSON.parse(oldBytes),after=JSON.parse(bytes),conversion=JSON.parse(fs.readFileSync(path.join(dir,'conversion-results.json'))),selection=JSON.parse(fs.readFileSync(path.join(dir,'selection-audit.json')));
assert.equal(sha(bytes),conversion.meshesSHA256);assert.deepEqual(selection.origin,[77.59136000000001,12.97984615]);
const identity=m=>sha(JSON.stringify({positions:m.positions,normals:m.normals,indices:m.indices,uvs:m.uvs,color:m.color,texture:m.texture}));
const oldIdentities=new Map(before.map((m,i)=>[identity(m),i]));
const furnitureHashes=new Set([970,971].map(i=>identity(before[i])));
assert.equal(furnitureHashes.size,2);assert.equal(before.filter(m=>furnitureHashes.has(identity(m))).length,2);
const profiles=[{color:[77/255,77/255,77/255],role:'asphalt'},{color:[140/255,140/255,140/255],role:'concrete'},{color:[102/255,102/255,102/255],role:'paving'},{color:[229/255,229/255,229/255],role:'marking'},{color:[77/255,0,0],role:'source'},{color:[200/255,200/255,200/255],role:'source'},{color:[1,1,1],role:'source'}];
const factor=2*Math.PI*6371008.8/40075016.686,origin=selection.origin,circ=2*Math.PI*6371008.8*Math.cos(origin[1]*Math.PI/180),my=lat=>Math.asinh(Math.tan(lat*Math.PI/180))/(2*Math.PI),center=[(77.5908-origin[0])*circ/360,(my(12.9798)-my(origin[1]))*circ];
const changedMeshes=[],furniture=[],meshes=after.map((m,i)=>{const hash=identity(m),prior=oldIdentities.get(hash),profile=profiles.find(p=>m.color.every((v,j)=>Math.abs(v-p.color[j])<1e-6));assert(profile,'Unknown regenerated material');if(prior===undefined)changedMeshes.push({index:i,materialName:m.materialName,triangles:m.indices.length/3});if(furnitureHashes.has(hash))furniture.push({index:i,prior,triangles:m.indices.length/3});const normals=[];for(let j=0;j<m.normals.length;j+=3){const v=[m.normals[j]/factor,m.normals[j+1],m.normals[j+2]/factor],l=Math.hypot(...v)||1;normals.push(...v.map(x=>x/l));}return{...m,positions:m.positions.map((v,j)=>j%3===1?v:v*factor),normals,sourceMeshIndex:i,priorSourceMeshIndex:prior??null,surfaceRole:profile.role,groundEligible:!furnitureHashes.has(hash)};});
assert.equal(furniture.length,2);assert.equal(furniture.reduce((n,m)=>n+m.triangles,0),17);
const clipped=meshes.map(m=>clipMesh(m,center,500)).filter(m=>m.indices.length);assert.equal(clipped.filter(m=>!m.groundEligible).reduce((n,m)=>n+m.indices.length/3,0),17);
fs.writeFileSync(path.join(dir,'meshes-classified.json'),JSON.stringify(clipped));
const report={rawSHA256:sha(bytes),oldRawSHA256:sha(oldBytes),horizontalScaleAppliedOnce:factor,origin,center,clipRadiusM:500,clipSides:256,sourceMeshCount:after.length,unchangedWholeMeshes:after.length-changedMeshes.length,changedMeshes,furnitureMatchedByExactGeometry:furniture,furnitureTrianglesRetained:17,profiles,automaticRoutesEnabled:false,runtimePromoted:false};
fs.writeFileSync(path.join(dir,'classification.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
