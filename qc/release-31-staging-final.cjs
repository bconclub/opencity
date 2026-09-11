const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const prior=JSON.parse(fs.readFileSync('qc/release-31-staging-audit.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const paths=new Set(prior.sourceFiles.map(row=>row.path)),worker=fs.readFileSync('sw.js','utf8');
const manifest=worker.match(/const files=\[(.*?)\];/s);assert(manifest,'Runtime cache manifest missing');
for(const m of manifest[1].matchAll(/'([^']+)'/g))paths.add(m[1]);
for(const addition of worker.matchAll(/files\.push\(([^;]*)\);/g))for(const m of addition[1].matchAll(/'([^']+)'/g))paths.add(m[1]);
const oldHashes=new Map(prior.sourceFiles.map(row=>[row.path,row.sha256]));
const files=[...paths].map(path=>{
 const source=fs.readFileSync(path),staged=fs.readFileSync('public-release/'+path);
 const hash=sha(source);assert.equal(sha(staged),hash,path+' staging mismatch');
 return {path,sha256:hash,bytes:source.length,changedSinceAudit:hash!==oldHashes.get(path)};
});
assert(files.length>=prior.sourceFiles.length);
for(const d of prior.directDependencies)assert(fs.existsSync('public-release/'+d.path),'Missing dependency '+d.path);
const report={runtimeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),passed:true,sourceFiles:files,dependencyPairsChecked:prior.directDependencies.length,
 changedSinceAudit:files.filter(f=>f.changedSinceAudit).map(f=>f.path),
 scope:'Refresh source/staged hashes and existing dependency presence after accepted runtime changes. Earlier complete manifest and unexpected-name audit retained separately. No network or rendering test.'};
fs.writeFileSync('qc/release-31-staging-final.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,files:files.length,changed:report.changedSinceAudit}));
