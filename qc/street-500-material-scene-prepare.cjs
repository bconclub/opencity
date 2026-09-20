const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),base=path.join(__dirname,'street-500-gap-scene'),dir=path.join(__dirname,'street-500-material-scene');fs.mkdirSync(dir,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),original=JSON.parse(fs.readFileSync(path.join(base,'manifest.json')));
const source=fs.readFileSync(path.join(base,'snapshot/street-patch.js'),'utf8');assert.equal(sha(Buffer.from(source)),original.common.find(f=>f.path==='street-patch.js').sha256);
const patch=JSON.parse(fs.readFileSync(path.join(__dirname,'street-500-surface-cleanup/asphalt-material-triangles.json')));assert.equal(patch.role,'asphalt');assert.equal(patch.groundEligible,false);assert.equal(patch.triangles.length,162);assert(patch.triangles.every(Number.isFinite));
const marker='surfaces=prepareStreetSurfaces(gltf.scene);';assert.equal(source.split(marker).length,2);
const injection=`// QC display-only asphalt. Ground sidecar was indexed above; never index these faces.
 const displayGeometry=new THREE.BufferGeometry();
 displayGeometry.setAttribute('position',new THREE.Float32BufferAttribute(${JSON.stringify(patch.triangles)},3));
 displayGeometry.computeVertexNormals();
 const displayMaterial=new THREE.MeshStandardMaterial({color:0x4d4d4d,roughness:.95,metalness:0,side:THREE.DoubleSide});
 displayMaterial.userData.streetSurfaceRole='asphalt';
 const displayMesh=new THREE.Mesh(displayGeometry,displayMaterial);displayMesh.frustumCulled=false;displayMesh.name='QC circle1091198031 existing-surface material';
 gltf.scene.add(displayMesh);
 ${marker}`;
fs.writeFileSync(path.join(dir,'street-patch-candidate.js'),source.replace(marker,injection));
const entry=(p,file)=>{const b=fs.readFileSync(file);return{path:p,sourceFile:path.relative(root,file).replaceAll('\\','/'),sha256:sha(b),bytes:b.length}};
const common=original.common.map(f=>entry(f.path,path.join(base,'snapshot',f.path)));const variants={};
for(const mode of ['baseline','candidate']){
 const list=['vidhana-streets.glb','vidhana-streets.json','vidhana-ground.json','vidhana-footprint.geojson'].map(f=>entry('assets/streets/'+f,path.join(__dirname,'street-500-gap-export/asset',f)));
 list.push(entry('vidhana-street-data.json',path.join(__dirname,mode==='baseline'?'street-500-gap-scene/candidate-surfaces.json':'street-500-surface-cleanup/asphalt-material-surfaces.json')));
 if(mode==='candidate')list.push(entry('street-patch.js',path.join(dir,'street-patch-candidate.js')));variants[mode]=list;
}
const manifest={sourceManifestSHA256:sha(fs.readFileSync(path.join(base,'manifest.json'))),scope:'Same repaired500m GLB+ground both variants, display-only explicit-asphalt remnant treatment differs',common,variants};fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
// Reuse proven matched camera/checkpoint harness with explicit immutable source paths.
let harness=fs.readFileSync(path.join(__dirname,'street-500-gap-scene.cjs'),'utf8');harness=harness.slice(harness.indexOf("const {chromium}"));
harness=`const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'street-500-material-scene'),manifestPath=path.join(dir,'manifest.json'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(!process.argv.includes('--run-gpu')){console.log('Prepared only; await explicit GPU release');process.exit(0);}
`+harness;
harness=harness.replaceAll("local:path.join(dir,'snapshot',f.path)","local:path.join(root,f.sourceFile)").replaceAll('local:path.join(dir,mode,f.path)','local:path.join(root,f.sourceFile)').replaceAll('street-500-gap-scene-', 'street-500-material-scene-');
harness=harness.replace("headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']","headless:true");
harness=harness.replace('({patch:vidhanaStreetPatch.state()',"({gpu:(()=>{const gl=map.getCanvas().getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return{renderer:gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER),vendor:gl.getParameter(ext?ext.UNMASKED_VENDOR_WEBGL:gl.VENDOR),version:gl.getParameter(gl.VERSION)};})(),patch:vidhanaStreetPatch.state()");
harness=harness.replace("assert.equal(telemetry.patch.indexedTriangles,metadata.groundIndexTriangles);","assert.equal(telemetry.patch.indexedTriangles,metadata.groundIndexTriangles);assert.equal(telemetry.patch.renderedTriangles,metadata.triangles+(mode==='candidate'?18:0));assert.equal(telemetry.patch.drawCalls,mode==='candidate'?8:7);");
harness=harness.replace("Classified500m before versus repaired500m after, source-generated flat roads clipped per footprint; base-map transportation and district shadow receiver remain shared; no auto-mode or route qualification","Same repaired500m geometry/ground, explicit-asphalt legacy remnant gains patch material via18 display-only triangles; no new ground or route qualification");
fs.writeFileSync(path.join(__dirname,'street-500-material-scene.cjs'),harness);
const before=source.slice(0,source.indexOf(marker)),candidate=source.replace(marker,injection);assert.equal(candidate.slice(0,candidate.indexOf('// QC display-only')),before);assert(candidate.includes('if(groundIndex)for('));
fs.writeFileSync(path.join(dir,'cpu-contract.json'),JSON.stringify({passed:true,displayTriangles:18,groundIndexInputUnchanged:true,injectionAfterGroundIndex:true,sourcePatchSHA256:sha(Buffer.from(source)),candidatePatchSHA256:sha(Buffer.from(candidate)),manifestSHA256:sha(fs.readFileSync(path.join(dir,'manifest.json')))},null,2));
console.log('Prepared material comparison; GPU not used');
