// Preserve the completed frontage fixture; override only exact physics candidate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const args=process.argv.slice(2),replay=args.length===1&&args[0]==='--replay-accepted';
assert(replay||(args.length===3&&args[1]==='--output-prefix'&&!args[0].startsWith('--')),'Usage: --replay-accepted OR <physics-source> --output-prefix <new-qc-prefix>');
const outputPrefix=replay?'qc/frontage-rotation-browser':args[2];
if(!replay){assert(!fs.existsSync(outputPrefix+'-snapshot.json'),'Refusing to overwrite an existing snapshot receipt');assert(path.resolve(outputPrefix).startsWith(path.resolve('qc')+path.sep),'Output prefix must be inside qc/');}
const accepted=replay?JSON.parse(fs.readFileSync('qc/frontage-rotation-browser-results.json')):null;
const originalReceipt=JSON.parse(fs.readFileSync('qc/frontage-runtime-browser-results.json'));
assert.equal(originalReceipt.passed,true);
const original=JSON.parse(fs.readFileSync('qc/frontage-runtime-browser-snapshot.json'));
assert.deepEqual(original,originalReceipt.snapshot);
if(replay){assert.equal(accepted.passed,true);assert.deepEqual(JSON.parse(fs.readFileSync(outputPrefix+'-snapshot.json')),accepted.snapshot);}
const sourcePath=replay?accepted.snapshot.physicsCandidate:args[0],root=outputPrefix+'-snapshot',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),physics=fs.readFileSync(sourcePath),entries=[],files=[];
if(replay){const recorded=accepted.snapshot.productionFiles.filter(e=>e.path==='auto-physics.js');assert.equal(recorded.length,1);assert.equal(sha(physics),recorded[0].sha256,'Physics candidate bytes changed');}
for(const e of original.entries){let b=fs.readFileSync(path.join('qc/frontage-runtime-browser-snapshot',e.path));assert.equal(sha(b),e.sha256);if(e.path==='auto-physics.js')b=physics;files.push([e.path,b]);entries.push({...e,sha256:sha(b),bytes:b.length,productionOverride:e.productionOverride||e.path==='auto-physics.js'});}
const manifest={...original,physicsCandidate:sourcePath,productionFiles:[...original.productionFiles,{path:'auto-physics.js',sha256:sha(physics)}],entries};
if(replay)assert.deepEqual(manifest,accepted.snapshot,'Rotation fixture differs from accepted browser receipt');
for(const [name,b]of files){const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b);}
if(!replay)fs.writeFileSync(outputPrefix+'-snapshot.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({replay,physicsCandidate:sourcePath,sha256:sha(physics),root,files:entries.length}));
