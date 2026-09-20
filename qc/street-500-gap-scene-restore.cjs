// Read-only git recovery, or explicitly --restore disposable scene directories.
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'street-500-gap-scene'),mp=path.join(dir,'manifest.json'),manifestBytes=fs.readFileSync(mp),manifest=JSON.parse(manifestBytes),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert(/^[0-9a-f]{40}$/.test(manifest.sourceHead));
const hints=JSON.parse(fs.readFileSync(path.join(dir,'restore-hints.json')));assert.equal(hints.manifestSHA256,sha(manifestBytes),'Recovery hints belong to different manifest');
const recovered=[],failures=[],writes=[];
function match(f,bytes){
 const versions=[['git bytes',bytes]];
 if(/\.(js|json|geojson|html|css|txt|md)$/.test(f.path)&&!bytes.includes(0)){
  const text=bytes.toString('utf8');if(Buffer.from(text).equals(bytes)){const lf=text.replace(/\r\n/g,'\n');versions.push(['LF normalization',Buffer.from(lf)],['CRLF normalization',Buffer.from(lf.replace(/\n/g,'\r\n'))]);if(hints.mixedEOL[f.path]){const crlf=new Set(hints.mixedEOL[f.path]);let i=0;versions.push(['Recorded mixed LF/CRLF',Buffer.from(lf.replace(/\n/g,()=>crlf.has(i++)?'\r\n':'\n'))]);}}
 }
 return versions.find(([,b])=>b.length===f.bytes&&sha(b)===f.sha256);
}
for(const f of manifest.common){
 assert(!path.isAbsolute(f.path)&&!f.path.split(/[\\/]/).includes('..'),'Unsafe manifest path');
 let bytes,extra=false;try{bytes=cp.execFileSync('git',['show',manifest.sourceHead+':'+f.path],{cwd:root,maxBuffer:50*1024*1024,stdio:['ignore','pipe','pipe']});}catch(e){if(hints.extras.includes(f.path)){try{bytes=fs.readFileSync(path.join(dir,'recovery-extras',f.path));extra=true;}catch{}}if(!bytes){failures.push({path:f.path,reason:'Absent from recorded commit and explicit recovery extras',expectedSHA256:f.sha256});continue;}}
 const found=match(f,bytes);if(!found){failures.push({path:f.path,reason:'Recorded commit differs even after UTF8 LF/CRLF normalization',expectedSHA256:f.sha256,gitSHA256:sha(bytes)});continue;}
 recovered.push({path:f.path,method:extra?'Explicit untracked recovery extra':found[0],sha256:f.sha256});writes.push([path.join(dir,'snapshot',f.path),found[1]]);
}
for(const mode of ['baseline','candidate'])for(const f of manifest.variants[mode]){
 const file=f.path==='vidhana-street-data.json'?path.join(dir,mode+'-surfaces.json'):path.join(root,mode==='baseline'?'experiments/osm2world/coverage-500-classified/asset':'qc/street-500-gap-export/asset',path.basename(f.path));
 try{const b=fs.readFileSync(file);assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);writes.push([path.join(dir,mode,f.path),b]);}catch(e){failures.push({variant:mode,path:f.path,source:file,reason:'Preserved variant file unavailable or hash mismatch',expectedSHA256:f.sha256});}
}
const report={passed:failures.length===0,sourceHead:manifest.sourceHead,manifestSHA256:sha(manifestBytes),commonRecovered:recovered.length,commonTotal:manifest.common.length,normalizations:recovered.filter(f=>f.method!=='git bytes'),failures,restoreRequested:process.argv.includes('--restore')};
// No snapshot directory writes until EVERY source has passed exact hash checks.
if(report.restoreRequested&&report.passed)for(const [dest,b]of writes){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);}
assert(fs.readFileSync(mp).equals(manifestBytes),'Original manifest changed');
fs.writeFileSync(path.join(dir,'restore-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
