const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(fs.readFileSync('qc/'+f));
const perf=read('npc-detail-cumulative-performance.json'),visual=read('npc-detail-visual.json'),mobile=read('npc-detail-mobile-visual.json');
assert(perf.passed&&visual.passed&&mobile.passed);assert.equal(perf.runs.length,12);
const mappings={'npc-traffic.js':'qc/npc-detail-candidate.js','npc-detail-state.js':'qc/npc-detail-state.mjs','npc-detailed-batches.js':'qc/npc-detailed-batches.js'};
for(const [target,source]of Object.entries(mappings)){const hash=sha(fs.readFileSync(source));assert.equal(hash,visual.hashes[target]);assert.equal(hash,mobile.hashes[target]);assert.equal(hash,perf.snapshotManifest.snapshots.candidate.files.find(f=>f.path===target).sha256);}
const before=fs.readFileSync('npc-traffic.js');assert.equal(before.toString().replace(/\r\n/g,'\n'),fs.readFileSync('qc/npc-detail-baseline.js','utf8').replace(/\r\n/g,'\n'));
for(const target of ['npc-detail-state.js','npc-detailed-batches.js'])assert(!fs.existsSync(target),'Unexpected runtime helper already exists');
const worker=fs.readFileSync('sw.js','utf8'),anchor="files.push('street-detail.js','street-surface-coverage.js','assets/streets/vidhana-coverage.png');";
assert.equal(worker.split(anchor).length,2);
for(const [target,source]of Object.entries(mappings))fs.copyFileSync(source,target);
fs.writeFileSync('sw.js',worker.replace(anchor,anchor+"\nfiles.push('npc-detail-state.js','npc-detailed-batches.js');"));
const receipt={passed:true,before:sha(before),runtimeHashes:Object.fromEntries(Object.keys(mappings).map(f=>[f,sha(fs.readFileSync(f))])),comparisons:perf.comparisons,mobileEmulation:true,scope:'Root desktop/mobile visual acceptance; identical reviewed runtime modules. Added two helpers to local cache/staging manifest. No asset changes, push or deployment.'};
fs.writeFileSync('qc/npc-detail-promotion.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
