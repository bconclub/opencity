// QC-only loading of the offline clipped road/detail surfaces. Runtime untouched.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(__dirname,'street-500-incoming-junction'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];},sourceArg=arg('--auto-source'),outputArg=arg('--output');
assert(!sourceArg||outputArg,'Composition requires explicit --output; preserve captured QC candidate');
const output=outputArg?path.resolve(root,outputArg):dir;
assert(output.startsWith(root+path.sep),'Output must remain inside workspace');fs.mkdirSync(output,{recursive:true});
const receipt=JSON.parse(fs.readFileSync(path.join(dir,'dynamic-source-audit.json')));
for(const [p,h] of Object.entries(receipt.files))if(!(sourceArg&&p==='auto-mode.js'))assert.equal(sha(fs.readFileSync(path.join(root,p))),h,'Source changed before ownership integration '+p);
const owned={sourceRoadSHA256:receipt.sourceRoadSHA256,roadPatches:JSON.parse(fs.readFileSync(path.join(dir,'auto-surface-patches.json'))),detailPatches:JSON.parse(fs.readFileSync(path.join(dir,'detail-surface-patches.json')))};
for(const [label,patches]of [['auto',owned.roadPatches],['detail',owned.detailPatches]]){const source=JSON.parse(fs.readFileSync(path.join(dir,label+'-surfaces-source.json'))),map=new Map(patches);const restored={...source,features:source.features.flatMap((f,i)=>!map.has(i)?[f]:map.get(i)?[{...f,geometry:map.get(i)}]:[])};assert.deepEqual(restored,JSON.parse(fs.readFileSync(path.join(dir,label+'-surfaces-owned.json'))));}
assert.equal(owned.detailPatches.length,0,'Current integration must preserve street-detail; review any future overlap separately');
fs.writeFileSync(path.join(output,'owned-runtime-surfaces.json'),JSON.stringify({sourceRoadSHA256:owned.sourceRoadSHA256,roadPatches:owned.roadPatches}));
const autoPath=sourceArg?path.resolve(root,sourceArg):path.join(root,'auto-mode.js');let auto=fs.readFileSync(autoPath,'utf8');const inputAutoSHA256=sha(auto);
const roadLine=auto.split('\n').find(s=>s.trimStart().startsWith("const roads={type:'FeatureCollection'"));
const originalRoadLine=fs.readFileSync(path.join(root,'auto-mode.js'),'utf8').split('\n').find(s=>s.trimStart().startsWith("const roads={type:'FeatureCollection'"));assert.equal(roadLine,originalRoadLine,'Candidate changes authoritative road generator; regenerate ownership before composing');
const add=" map.addSource('auto-roads',{type:'geojson',data:roads});";assert(auto.includes(add));
auto=auto.replace(add," const ownedResponse=await fetch('./assets/streets/vidhana-owned-surfaces.json');if(!ownedResponse.ok)throw Error('Shared street surfaces unavailable');const owned=await ownedResponse.json();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(roads))))).map(n=>n.toString(16).padStart(2,'0')).join('');if(digest!==owned.sourceRoadSHA256)throw Error('Shared street surfaces do not match current road graph');const roadPatches=new Map(owned.roadPatches);roads.features=roads.features.flatMap((f,i)=>!roadPatches.has(i)?[f]:roadPatches.get(i)?[{...f,geometry:roadPatches.get(i)}]:[]);\n map.addSource('auto-roads',{type:'geojson',data:roads});");
assert(auto.includes('addStreetDetail(map,graph,data)'));fs.writeFileSync(path.join(output,'auto-mode-owned.js'),auto);
const detail=fs.readFileSync(path.join(root,'street-detail.js'));fs.writeFileSync(path.join(output,'street-detail-unchanged.js'),detail);
const composed={runtimeChanged:false,streetDetailUnchanged:true,autoInput:path.relative(root,autoPath),inputAutoSHA256,outputAutoSHA256:sha(auto),sourceRoadSHA256:receipt.sourceRoadSHA256,ownedSurfaceBytes:fs.statSync(path.join(output,'owned-runtime-surfaces.json')).size};fs.writeFileSync(path.join(output,'composition.json'),JSON.stringify(composed,null,2));console.log(composed);
