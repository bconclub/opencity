const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),prior=JSON.parse(fs.readFileSync('qc/release-31-staging-audit.json'));
const files=[...prior.sourceFiles.map(f=>f.path),'npc-detail-state.js','npc-detailed-batches.js'];
const receipt=JSON.parse(fs.readFileSync('qc/npc-detail-promotion.json'));
for(const [file,hash]of Object.entries(receipt.runtimeHashes))assert.equal(sha(fs.readFileSync(file)),hash);
const rows=[...new Set(files)].map(file=>{const source=fs.readFileSync(file),staged=fs.readFileSync('public-release/'+file);assert.equal(sha(source),sha(staged),file);return{file,bytes:source.length,sha256:sha(source)};});
for(const file of ['npc-detail-state.js','npc-detailed-batches.js'])assert(fs.readFileSync('sw.js','utf8').includes("'"+file+"'"));
for(const row of prior.directDependencies)assert(fs.existsSync('public-release/'+row.path));
assert.equal(rows.length,110);fs.writeFileSync('qc/npc-detail-stage.json',JSON.stringify({passed:true,files:rows,priorDependencies:prior.directDependencies.length,scope:'110 local source/staged hashes match, new imports included in cache manifest. No network release.'},null,2)+'\n');console.log('110 staged files match, new NPC helpers included');
