const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const refs={baseline:'f1fd503',candidate:process.env.OPENCITY_CANDIDATE_REF||'4e4a19a'},root=path.resolve('qc/release-cumulative-snapshots'),result={};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [mode,ref]of Object.entries(refs)){
 const commit=execFileSync('git',['rev-parse',ref],{encoding:'utf8'}).trim(),read=file=>execFileSync('git',['show',commit+':'+file],{maxBuffer:40*1024*1024});
 const worker=read('sw.js').toString(),files=new Set([...worker.match(/const files=\[(.*?)\];/s)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));
 for(const m of worker.matchAll(/files\.push\(([^;]*)\);/g))for(const f of m[1].matchAll(/'([^']+)'/g))files.add(f[1]);
 for(const f of ['sw.js','local-cache.js','release.json','cycle-model.js','drone-model.js','street-detail.js'])files.add(f);
 const entries=[],directory=path.join(root,mode);fs.mkdirSync(directory,{recursive:true});
 for(const file of [...files].sort()){if(path.isAbsolute(file)||file.includes('..'))throw Error('Invalid manifest path');const bytes=read(file),target=path.join(directory,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);entries.push({path:file,bytes:bytes.length,sha256:sha(bytes)});}
 const packageVersion=JSON.parse(read('package.json')).version,release=JSON.parse(read('release.json'));
 result[mode]={commit,packageVersion,release,files:entries,snapshotBytes:entries.reduce((n,f)=>n+f.bytes,0),manifestSha256:sha(Buffer.from(JSON.stringify(entries)))};
}
const manifest={prepared:new Date().toISOString(),baselineJustification:'Immutable repository release f1fd503 version0.0.30. cb70fa3 documents a live0.0.30 audit, but historical production byte identity is not asserted. Candidate is the complete immutable repository source identified below, not a partial module overlay.',excludedForBoth:['multiplayer-client.js is fulfilled empty','local-cache.js is fulfilled empty','service workers blocked; fresh contexts and network cache disabled'],snapshots:result};
fs.writeFileSync('qc/release-cumulative-snapshots.json',JSON.stringify(manifest,null,2));console.log(Object.fromEntries(Object.entries(result).map(([k,v])=>[k,{commit:v.commit,version:v.packageVersion,files:v.files.length,bytes:v.snapshotBytes,manifestSha256:v.manifestSha256}])));
