import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p);
const json=p=>JSON.parse(read(p));
const manifest=json('qc/frontage-runtime-manifest.json');
const browser=json('qc/frontage-runtime-browser-results.json');
const performance=json('qc/vidhana-stair-analytic-v2-performance.json');
const rotation=json('qc/frontage-rotation-browser-results.json');
const rotationBody=json('qc/frontage-rotation-browser-results-body-audit.json');
assert.equal(browser.passed,true);assert.equal(performance.passed,true);
assert.equal(rotation.passed,true);assert.equal(rotationBody.passed,true);
assert.equal(rotationBody.browserResultSha256,sha(read('qc/frontage-rotation-browser-results.json')));
assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.misses,[]);
assert(browser.checks.some(s=>s.includes('fills dwell circle')));
const selected='qc/vidhana-stair-analytic-v2-shadow-on-bundle.js';
const selectedHash='74ef4d3e12c737a70361386e7db9f83455b395befae5cf6ab2b4d93b9bccc110';
assert.equal(sha(read(selected)),selectedHash);
const files=manifest.files.map(f=>({...f,candidate:'qc/frontage-runtime-candidate/'+f.path}));
files.push({path:'landmarks.js',candidate:selected,sha256:selectedHash});
for(const f of files){
 assert.equal(sha(read(f.candidate)),f.sha256,f.path+' candidate changed');
 const checked=f.path==='auto-physics.js'?rotation:browser;
 assert.equal(checked.snapshot.productionFiles.find(p=>p.path===f.path)?.sha256,f.sha256,f.path+' not browser verified');
 assert.equal(rotation.snapshot.productionFiles.find(p=>p.path===f.path)?.sha256,f.sha256,f.path+' changed since rotation test');
}
for(const f of manifest.sourceBaselines)assert.equal(sha(read(f.path)),f.sha256,f.path+' changed since preparation');
assert.equal(sha(read('landmarks.js')),performance.manifest.baselineLandmarkSha256,'Landmark baseline changed');
const helpers=files.map(f=>f.path).filter(p=>!fs.existsSync(p));
const workerBefore=read('sw.js').toString();
const worker=workerBefore.replace("const allowed=new Set(files.map",'files.push('+helpers.map(p=>"'"+p+"'").join(',')+');\nconst allowed=new Set(files.map');
assert.notEqual(worker,workerBefore,'Cache manifest insertion failed');
// Validate every dependency of promoted files before changing any runtime bytes.
const proposed=new Map(files.map(f=>[f.path,read(f.candidate)]));proposed.set('sw.js',Buffer.from(worker));
const dependencies=[];
for(const [name,bytes] of proposed)for(const m of bytes.toString().matchAll(/(?:from\s*|import\s*\()\s*['"]\.\/([^'"]+)['"]/g)){
 assert(proposed.has(m[1])||fs.existsSync(m[1]),name+' missing dependency '+m[1]);dependencies.push({file:name,dependency:m[1]});
}
const report={passed:true,localOnly:true,files:[...proposed].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})),dependencies,
 browserReceiptSha256:sha(read('qc/frontage-runtime-browser-results.json')),rotationReceiptSha256:sha(read('qc/frontage-rotation-browser-results.json')),performanceReceiptSha256:sha(read('qc/vidhana-stair-analytic-v2-performance.json')),
 scope:'Exact browser-tested frontage, measured focus targets, full-body stair clearance and mapped passage. Automatic private routes excluded; generic collision and room protocol unchanged. No production publication.'};
if(process.argv.includes('--apply')){
 for(const [name,bytes]of proposed)fs.writeFileSync(name,bytes);
 fs.writeFileSync('qc/frontage-runtime-promotion.json',JSON.stringify(report,null,2)+'\n');
 console.log('Promoted '+proposed.size+' reviewed runtime files locally.');
}else console.log(JSON.stringify({ready:true,files:report.files.map(f=>f.path),dependencies:dependencies.length}));
