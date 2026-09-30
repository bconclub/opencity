const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict');
const dir='qc/street-frontage-final',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert(!fs.existsSync(dir+'/manifest.json'),'Do not replace immutable final manifest');fs.mkdirSync(dir,{recursive:true});
const overrides=Object.fromEntries(['vidhana-streets.glb','vidhana-streets.json','vidhana-ground.json','vidhana-footprint.geojson'].map(n=>['assets/streets/'+n,'qc/street-500-incoming-junction/asset/'+n]));
Object.assign(overrides,{'vidhana-street-data.json':'qc/street-500-incoming-junction/shared-static-surfaces.json','assets/streets/vidhana-owned-surfaces.json':'qc/street-500-frontage-combined/owned-runtime-surfaces.json','auto-mode.js':'qc/street-500-frontage-combined/auto-mode-owned.js'});
const manifest={baseline:'733fd33',candidate:'9df5546',overrides,variants:{},scope:'Complete frozen runtime before/after cumulative frontage plus seven street overrides. No route additions. Street detail unchanged.'};
for(const [mode,ref]of[['before',manifest.baseline],['after',manifest.candidate]]){
 const head=cp.execFileSync('git',['rev-parse',ref],{encoding:'utf8'}).trim();const names=cp.execFileSync('git',['ls-tree','-r','--name-only',head],{encoding:'utf8'}).trim().split('\n');
 const selected=names.filter(p=>!p.includes('/')&&/\.(js|json|html|css)$/.test(p)||/^assets\/(auto|streets)\//.test(p)||/^assets\/vehicles\/[^/]+\.glb$/.test(p)||/^assets\/vehicles\/previews\//.test(p));
 const entries=new Map();for(const p of selected){const b=cp.execFileSync('git',['show',head+':'+p],{maxBuffer:32*1024*1024});entries.set(p,{body:b,head});}
 if(mode==='after')for(const [p,source]of Object.entries(overrides))entries.set(p,{body:fs.readFileSync(source),source});
 const files=[];for(const[p,e]of entries){const file=dir+'/'+mode+'/'+p;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,e.body);files.push({path:p,file,head:e.head,source:e.source,bytes:e.body.length,sha256:sha(e.body)});}
 manifest.variants[mode]={head,files};console.log(mode,files.length,files.reduce((n,f)=>n+f.bytes,0));
}
const composition=JSON.parse(fs.readFileSync('qc/street-500-frontage-combined/composition.json'));const gitAuto=cp.execFileSync('git',['show','9df5546:auto-mode.js']),sourceAuto=fs.readFileSync('qc/frontage-runtime-candidate/auto-mode.js');assert.equal(sourceAuto.toString().replace(/\r\n/g,'\n'),gitAuto.toString().replace(/\r\n/g,'\n'),'Committed auto must match reviewed source apart from CRLF');assert.equal(sha(sourceAuto),composition.inputAutoSHA256);assert.equal(manifest.variants.after.files.find(f=>f.path==='auto-mode.js').sha256,composition.outputAutoSHA256);manifest.composition={...composition,gitAutoSHA256:sha(gitAuto),lineEndingNormalizationOnly:sha(gitAuto)!==sha(sourceAuto)};
fs.writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));console.log('Frozen final manifest',sha(fs.readFileSync(dir+'/manifest.json')));
