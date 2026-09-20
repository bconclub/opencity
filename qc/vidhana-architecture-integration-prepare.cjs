const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const commit=execFileSync('git',['rev-parse','733fd33'],{encoding:'utf8'}).trim(),read=file=>execFileSync('git',['show',commit+':'+file],{maxBuffer:40*1024*1024});
const original=read('landmarks.js').toString(),architecture=fs.readFileSync('qc/vidhana-architecture-candidate.js','utf8'),dome=fs.readFileSync('qc/vidhana-dome-candidate.js','utf8');
assert.equal(original.split('export function buildLandmarks').length,2);assert.equal(architecture.split('export function buildLandmarks').length,2);assert(dome.includes('revision:2'));
function once(source,needle,value){assert.equal(source.split(needle).length,2,needle);return source.replace(needle,value);}
let architectureMeasured=architecture;
architectureMeasured=once(architectureMeasured,'const group=new T.Group(),batches=new Map();let domes=0;',`const group=new T.Group(),batches=new Map();let domes=0;
 const displayParts=Object.fromEntries(data.features.map(f=>[f.properties.osm_id,null]));
 const rangeStarts=()=>new Map([...batches].map(([key,b])=>[key,b.p.length]));
 function recordPart(id,starts){let base=Infinity,height=-Infinity;for(const[key,b]of batches)for(let i=(starts.get(key)||0)+2;i<b.p.length;i+=3){base=Math.min(base,Math.fround(b.p[i]));height=Math.max(height,Math.fround(b.p[i]));}if(base!==Infinity){const old=displayParts[id];displayParts[id]={base:Math.min(old?.base??Infinity,base),height:Math.max(old?.height??-Infinity,height)};}}
`);
architectureMeasured=once(architectureMeasured,'b.p[i]=mapZ(b.p[i]);}', 'b.p[i]=mapZ(b.p[i]);}recordPart(p.osm_id,starts);');
architectureMeasured=once(architectureMeasured,'for(const f of columns){const ring=', 'for(const f of columns){const columnStart=rangeStarts();const ring=');
architectureMeasured=once(architectureMeasured,'D.landingZ));\n }','D.landingZ));recordPart(f.properties.osm_id,columnStart);\n }');
architectureMeasured=once(architectureMeasured,'if(portico.length){','if(portico.length){const porticoStart=rangeStarts();');
architectureMeasured=once(architectureMeasured,'stairPlacement={tangent:u,outward:v,centerAlong:cx,topV,bottomV,landingRearV:rearV,topWidth:topHalfWidth*2,estimated:true};','stairPlacement={tangent:u,outward:v,centerAlong:cx,topV,bottomV,landingRearV:rearV,topWidth:topHalfWidth*2,estimated:true};recordPart("relation/5519270",porticoStart);');
architectureMeasured=once(architectureMeasured,'return{group,domes,parts:data.features.length,architecture:', 'return{group,domes,displayParts,parts:data.features.length,architecture:');
let domeMeasured=dome;
domeMeasured=once(domeMeasured,'const batches=new Map();',`const batches=new Map();
 function measuredRange(starts=new Map()){let base=Infinity,height=-Infinity;for(const[key,b]of batches)for(let i=(starts.get(key)||0)+2;i<b.p.length;i+=3){base=Math.min(base,Math.fround(b.p[i]));height=Math.max(height,Math.fround(b.p[i]));}return base===Infinity?null:{base,height};}
`);
domeMeasured=once(domeMeasured,'function lathe(profile,segments=64)', 'model.displayParts[drum.properties.osm_id]=measuredRange();const crownStarts=new Map([...batches].map(([key,b])=>[key,b.p.length]));\n function lathe(profile,segments=64)');
domeMeasured=once(domeMeasured,'let added=0;', 'model.displayParts[dome.properties.osm_id]=measuredRange(crownStarts);model.displayParts["way/371511883"]=null;\n let added=0;');
const selected=architectureMeasured.replace('export function buildLandmarks','function buildArchitecture')+'\n'+domeMeasured.replace("import {buildLandmarks as buildArchitecture,ARCHITECTURE_DIMENSIONS} from './vidhana-architecture-candidate.js';",'').replace('export {ARCHITECTURE_DIMENSIONS};','');
const wrapper=original.replace('export function buildLandmarks','function buildOtherLandmarks')+'\n'+selected.replace('export function buildLandmarks','function buildVidhana')+`
// Integration candidate: other landmark geometry unchanged; combine only exact
// matching material/render-state and position/normal layouts into existing batches.
export function buildLandmarks(T,data,xy){
 const v=buildVidhana(T,data,xy),other=buildOtherLandmarks(T,{...data,features:data.features.filter(f=>f.properties.site!=='Vidhana Soudha')},xy),group=new T.Group(),batches=new Map();
 const box=new T.Box3().setFromObject(v.group),siteDisplayBounds={min:box.min.toArray(),max:box.max.toArray()};
 const s=v.architecture.stairPlacement,D=v.architecture,at=(along,outward)=>[along*s.tangent[0]+outward*s.outward[0],along*s.tangent[1]+outward*s.outward[1]];
 const stairRing=s?[at(s.centerAlong-s.topWidth/2,s.topV),at(s.centerAlong-D.stairWidth/2,s.bottomV),at(s.centerAlong+D.stairWidth/2,s.bottomV),at(s.centerAlong+s.topWidth/2,s.topV)]:[];
 const extraFocusTargets=s?[{id:'vidhana-front-stairs',name:'Vidhana Soudha entrance stairs',rings:[stairRing],base:0,height:D.landingZ,note:'Estimated flared stair footprint aligned to mapped canopy; not a driving heightfield. Under-canopy passage remains provisional.'}]:[];
 for(const mesh of [...other.group.children,...v.group.children]){
  const m=mesh.material,key=JSON.stringify([m.type,m.color.getHexString(),m.roughness,m.metalness,m.side,m.transparent,m.opacity,m.depthWrite,m.depthTest,m.vertexColors,m.flatShading,mesh.castShadow,mesh.receiveShadow,mesh.frustumCulled,Object.entries(mesh.geometry.attributes).map(([n,a])=>[n,a.itemSize,a.normalized])]);
  if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
 }
 for(const meshes of batches.values()){
  if(meshes.length===1){group.add(meshes[0]);continue;}
  const first=meshes[0],geometry=new T.BufferGeometry();
  for(const [name,a]of Object.entries(first.geometry.attributes)){const size=meshes.reduce((n,m)=>n+m.geometry.attributes[name].array.length,0),array=new Float32Array(size);let offset=0;for(const m of meshes){const values=m.geometry.attributes[name].array;array.set(values,offset);offset+=values.length;}geometry.setAttribute(name,new T.BufferAttribute(array,a.itemSize,a.normalized));}
  geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,first.material);mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.frustumCulled=first.frustumCulled;group.add(mesh);
  for(const old of meshes){old.geometry.dispose();if(old.material!==first.material)old.material.dispose();old.removeFromParent();}
 }
 return{group,displayParts:v.displayParts,siteDisplayBounds,extraFocusTargets,domes:v.domes+other.domes,parts:v.parts+other.parts,architecture:{...v.architecture,actualCentralTopZ:v.architecture.domeUpdate.collarTop,publishedOverallTopZ:v.architecture.domeUpdate.publishedOverallTop,upperPedestalAndEmblemMissing:true}};
}
`;
fs.writeFileSync('qc/vidhana-architecture-integration-baseline.js',original);fs.writeFileSync('qc/vidhana-architecture-integration-selected.js',selected);fs.writeFileSync('qc/vidhana-architecture-integration-candidate.js',wrapper);
const worker=read('sw.js').toString(),files=new Set([...worker.match(/const files=\[(.*?)\];/s)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));for(const m of worker.matchAll(/files\.push\(([^;]*)\);/g))for(const f of m[1].matchAll(/'([^']+)'/g))files.add(f[1]);for(const f of execFileSync('git',['ls-tree','--name-only',commit],{encoding:'utf8'}).trim().split('\n'))if(/\.(js|css|html|json|webmanifest|ico)$/.test(f))files.add(f);
const directory='qc/vidhana-architecture-integration-snapshot',entries=[];for(const file of [...files].sort()){assert(!file.includes('..')&&!path.isAbsolute(file));const body=read(file),target=path.join(directory,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);entries.push({path:file,bytes:body.length,sha256:sha(body)});}
assert(read('index.html').toString().includes('maplibre-gl@5.7.2'));assert(!read('app.js').toString().includes('antialias:true'));
const manifest={commit,baselineLandmarkSha256:sha(original),architectureSourceSha256:sha(architecture),domeRevision2SourceSha256:sha(dome),selectedVidhanaSha256:sha(selected),candidateWrapperSha256:sha(wrapper),files:entries,manifestSha256:sha(JSON.stringify(entries)),scope:'Complete immutable733fd33 runtime. Candidate overrides only landmarks.js with architecture plus latest dome revision2 and exact-compatible batch merge. Actual top39.8m; published45.72includes missing pedestal/emblem, no shell stretch. All other landmarks retained, renderer5.7.2 AAoff. No collider change.'};fs.writeFileSync('qc/vidhana-architecture-integration-manifest.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({commit,baseline:manifest.baselineLandmarkSha256,architecture:manifest.architectureSourceSha256,dome:manifest.domeRevision2SourceSha256,selected:manifest.selectedVidhanaSha256,candidate:manifest.candidateWrapperSha256,snapshot:manifest.manifestSha256}));
