const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'street-500-incoming-junction'),head='733fd3337caaf98b334c174e218e00820b447216';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const names=cp.execFileSync('git',['ls-tree','-r','--name-only',head],{cwd:root,encoding:'utf8'}).trim().split('\n');
const selected=names.filter(p=>!p.includes('/')&&/\.(js|json|html|css)$/.test(p)||/^assets\/(auto|streets)\//.test(p)||/^assets\/vehicles\/[^/]+\.glb$/.test(p)||/^assets\/vehicles\/previews\//.test(p));
const common=selected.map(p=>{const b=cp.execFileSync('git',['show',head+':'+p],{cwd:root,maxBuffer:32*1024*1024});return{path:p,gitHead:head,bytes:b.length,sha256:sha(b)}});
const variants={baseline:[],candidate:[]};
for(const name of ['vidhana-streets.glb','vidhana-streets.json','vidhana-ground.json','vidhana-footprint.geojson']){const sourceFile='qc/street-500-incoming-junction/asset/'+name,b=fs.readFileSync(path.join(root,sourceFile));variants.candidate.push({path:'assets/streets/'+name,sourceFile,bytes:b.length,sha256:sha(b)});}
const sourceFile='qc/street-500-incoming-junction/candidate-surfaces.json',b=fs.readFileSync(path.join(root,sourceFile));variants.candidate.push({path:'vidhana-street-data.json',sourceFile,bytes:b.length,sha256:sha(b)});
const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'street-500-combined/scene-manifest.json')));variants.baseline=prior.variants.candidate;
const manifest={sourceHead:head,common,variants,scope:'Immutable runtime; baseline combined repair versus regenerated missing-approach source, each four street assets and static flat surface data. Automatic routes not activated or qualified. Cache and multiplayer modules suppressed identically for isolation.'};
const file=path.join(dir,'scene-manifest.json'),body=JSON.stringify(manifest,null,2)+'\n';if(fs.existsSync(file))assert.equal(fs.readFileSync(file,'utf8'),body,'Refuse to overwrite a different immutable manifest');else fs.writeFileSync(file,body);
console.log({common:common.length,manifestSHA256:sha(Buffer.from(body)),candidateOverrides:variants.candidate.length});
