// Reproducible offline preparation from the audited OSM2World sample.
const fs=require('node:fs'),path=require('node:path');
// Optional source/output/origin flags prepare isolated candidates without
// replacing the accepted runtime patch. No flags preserves the audited sample.
const args=process.argv.slice(2),allowed=new Set(['--source','--output','--origin']);
if(args.length%2||args.some((a,i)=>i%2===0&&!allowed.has(a)))throw Error('Use --source file --output directory --origin longitude,latitude');
const options=Object.fromEntries(Array.from({length:args.length/2},(_,i)=>[args[i*2],args[i*2+1]]));
if(options['--source']&&(!options['--output']||!options['--origin']))throw Error('Custom source requires explicit output and verified projection origin');
const dir=options['--output']?path.resolve(options['--output']):path.join(__dirname,'assets/streets');fs.mkdirSync(dir,{recursive:true});
const cleanArgs=[path.join(__dirname,'verify-street-patch-clean.py'),...(options['--source']?[path.resolve(options['--source'])]:[])];
const prepared=JSON.parse(require('node:child_process').execFileSync('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',cleanArgs,{maxBuffer:40*1024*1024}));const source=prepared.meshes;
// Match MapLibre 5.6.1 meterInMercatorCoordinateUnits(), including its mean Earth radius.
const groups=new Map(),origin=options['--origin']?options['--origin'].split(',').map(Number):[77.5907159,12.9797946];
if(origin.length!==2||!origin.every(Number.isFinite)||Math.abs(origin[0])>180||Math.abs(origin[1])>=90)throw Error('Invalid projection origin');
const circ=2*Math.PI*6371008.8*Math.cos(origin[1]*Math.PI/180);
const ox=(origin[0]+180)/360,oy=(1-Math.asinh(Math.tan(origin[1]*Math.PI/180))/Math.PI)/2;
const lnglat=(x,y)=>[(ox+x/circ)*360-180,Math.atan(Math.sinh(Math.PI*(1-2*(oy-y/circ))))*180/Math.PI];
const classified=source.some(m=>Object.hasOwn(m,'surfaceRole')||Object.hasOwn(m,'groundEligible'));
if(classified&&source.some(m=>typeof m.surfaceRole!=='string'))throw Error('Classified source requires a role on every mesh');
const groundTriangles=[];
const seenTriangles=new Set();let duplicatesRemoved=0;const footprint={type:'FeatureCollection',features:[]};let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
for(const m of source){
 m.positions=m.positions.map(Math.fround); // Footprint must use precisely the GLB's Float32 geometry.
 if(m.texture)throw Error('Textured input requires a separate material audit');
 const key=JSON.stringify([m.color,m.surfaceRole]);if(!groups.has(key))groups.set(key,{color:m.color,role:m.surfaceRole,positions:[],normals:[],indices:[]});const g=groups.get(key),base=g.positions.length/3;
 for(let i=0;i<m.positions.length;i+=3){const p=[m.positions[i],m.positions[i+2],m.positions[i+1]];g.positions.push(...p);g.normals.push(m.normals[i],m.normals[i+2],m.normals[i+1]);p.forEach((v,k)=>{min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);});}
 for(let i=0;i<m.indices.length;i+=3){const ids=[m.indices[i],m.indices[i+2],m.indices[i+1]];const triangleKey=ids.map(n=>m.positions.slice(n*3,n*3+3).join(',')).sort().join('|');if(seenTriangles.has(triangleKey)){duplicatesRemoved++;continue;}seenTriangles.add(triangleKey);g.indices.push(...ids.map(n=>n+base));if(m.groundEligible===false)continue;const p=ids.map(n=>[m.positions[n*3],m.positions[n*3+2]]);if(Math.abs((p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[2][0]-p[0][0])*(p[1][1]-p[0][1]))<1e-8)continue;if(classified)for(const n of ids)groundTriangles.push(m.positions[n*3],m.positions[n*3+2],m.positions[n*3+1]);const ring=p.map(v=>lnglat(...v));ring.push(ring[0]);footprint.features.push({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[ring]}});}
}
if(groups.size>8)throw Error('Street patch exceeds draw-call budget');
const doc={asset:{version:'2.0',generator:'OSM2World OpenCity material batching',copyright:'Map data © OpenStreetMap contributors, ODbL 1.0'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}]};
const chunks=[];let offset=0;
function attr(values,type,integer=false){const bytes=Buffer.from((integer?new Uint32Array(values):new Float32Array(values)).buffer),view=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length})-1;chunks.push(bytes);offset+=bytes.length;const a={bufferView:view,componentType:integer?5125:5126,count:values.length/(type==='VEC3'?3:1),type};if(type==='VEC3'){a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity];values.forEach((v,i)=>{a.min[i%3]=Math.min(a.min[i%3],v);a.max[i%3]=Math.max(a.max[i%3],v)});}return doc.accessors.push(a)-1;}
for(const g of groups.values()){const material=doc.materials.push({pbrMetallicRoughness:{baseColorFactor:[...g.color.map(c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)),1],metallicFactor:0,roughnessFactor:.95},doubleSided:true,...(g.role?{extras:{streetSurfaceRole:g.role}}:{})})-1;const mesh=doc.meshes.push({primitives:[{attributes:{POSITION:attr(g.positions,'VEC3'),NORMAL:attr(g.normals,'VEC3')},indices:attr(g.indices,'SCALAR',true),material}]})-1;doc.scenes[0].nodes.push(doc.nodes.push({mesh})-1);}
doc.buffers[0].byteLength=offset;let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(chunks),total=28+json.length+bin.length,head=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(total,8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(path.join(dir,'vidhana-streets.glb'),Buffer.concat([head,jh,json,bh,bin]));
const metadata={origin,axes:'X east, Y north, Z up; transformed once from OSM2World X east, Y up, Z north',localBounds:{min,max},bounds:[...lnglat(min[0],min[1]),...lnglat(max[0],max[1])],...prepared.report,meshes:groups.size,triangles:[...groups.values()].reduce((n,g)=>n+g.indices.length/3,0),bytes:total,footprintTriangles:footprint.features.length};
if(classified){metadata.groundIndexURL='vidhana-ground.json';const bytes=Buffer.from(JSON.stringify({version:1,origin,triangles:groundTriangles}));fs.writeFileSync(path.join(dir,metadata.groundIndexURL),bytes);metadata.groundIndexBytes=bytes.length;metadata.groundIndexTriangles=groundTriangles.length/9;}
fs.writeFileSync(path.join(dir,'vidhana-footprint.geojson'),JSON.stringify(footprint));fs.writeFileSync(path.join(dir,'vidhana-streets.json'),JSON.stringify(metadata,null,2));console.log(metadata);
