const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const prior=JSON.parse(fs.readFileSync('qc/release-31-staging-audit.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=prior.sourceFiles.map(row=>{
 const source=fs.readFileSync(row.path),staged=fs.readFileSync('public-release/'+row.path);
 const hash=sha(source);assert.equal(sha(staged),hash,row.path+' staging mismatch');
 return {path:row.path,sha256:hash,bytes:source.length,changedSinceAudit:hash!==row.sha256};
});
assert.equal(files.length,108);
for(const d of prior.directDependencies)assert(fs.existsSync('public-release/'+d.path),'Missing dependency '+d.path);
const report={runtimeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),passed:true,sourceFiles:files,dependencyPairsChecked:prior.directDependencies.length,
 changedSinceAudit:files.filter(f=>f.changedSinceAudit).map(f=>f.path),
 scope:'Refresh source/staged hashes and existing dependency presence after accepted runtime changes. Earlier complete manifest and unexpected-name audit retained separately. No network or rendering test.'};
fs.writeFileSync('qc/release-31-staging-final.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,files:files.length,changed:report.changedSinceAudit}));
