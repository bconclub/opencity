// Controlled additive export. Inputs already use MapLibre horizontal scale.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),base=path.join(root,'experiments/osm2world/coverage-500-classified'),out=path.join(__dirname,'street-500-gap-export'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['vidhana-streets.glb','vidhana-streets.json','vidhana-ground.json','vidhana-footprint.geojson'];
const preserved=Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(path.join(base,'asset',f)))]));
const source=fs.readFileSync(path.join(base,'meshes.json')),meshes=JSON.parse(source),patchBytes=fs.readFileSync(path.join(__dirname,'street-500-gap-repair-triangles.json')),patch=JSON.parse(patchBytes),meta=JSON.parse(fs.readFileSync(path.join(base,'asset/vidhana-streets.json')));
assert.equal(patch.triangles.length,9);assert(patch.triangles.every(Number.isFinite));assert(patch.origin.every((n,i)=>Math.abs(n-meta.origin[i])<1e-12));
assert(!meshes.some(m=>m.repairId==='way52057928-segment0'),'Repair already present');
const asphalt=meshes.find(m=>m.surfaceRole==='asphalt'&&m.groundEligible!==false),positions=[],normals=[];
for(let i=0;i<9;i+=3){positions.push(patch.triangles[i],patch.triangles[i+2],patch.triangles[i+1]);normals.push(0,1,0);}
// Swapping north/up reverses winding; builder reverses back to runtime Z-up.
meshes.push({positions,normals,indices:[0,2,1],uvs:[],color:asphalt.color,texture:null,surfaceRole:'asphalt',groundEligible:true,repairId:'way52057928-segment0'});
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'meshes.json'),JSON.stringify(meshes));
cp.execFileSync(process.execPath,[path.join(root,'verify-street-patch-build.cjs'),'--source',path.join(out,'meshes.json'),'--output',path.join(out,'asset'),'--origin',meta.origin.join(',')],{cwd:root,stdio:'inherit'});
for(const f of files)assert.equal(sha(fs.readFileSync(path.join(base,'asset',f))),preserved[f],'Baseline changed');
const report={sourceSHA256:sha(source),repairSHA256:sha(patchBytes),projectionScaleApplied:1,repairAppends:1,baselinePreserved:preserved,output:Object.fromEntries(files.map(f=>{const b=fs.readFileSync(path.join(out,'asset',f));return[f,{bytes:b.length,sha256:sha(b)}]}))};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
