const fs=require('node:fs');
const path=require('node:path');
const meshes=JSON.parse(fs.readFileSync(path.join(__dirname,'sample-meshes.json')));
const doc={asset:{version:'2.0',generator:'OSM2World isolated OpenCity probe',copyright:'Map data (c) OpenStreetMap contributors, ODbL 1.0'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}]};
const chunks=[];let offset=0;
function attr(values,type,integer=false){
 const bytes=Buffer.from((integer?new Uint32Array(values):new Float32Array(values)).buffer);
 const view=doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length})-1;chunks.push(bytes);offset+=bytes.length;
 const size={SCALAR:1,VEC2:2,VEC3:3}[type];
 const a={bufferView:view,componentType:integer?5125:5126,count:values.length/size,type};
 if(type==='VEC3'){a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<values.length;i++){a.min[i%3]=Math.min(a.min[i%3],values[i]);a.max[i%3]=Math.max(a.max[i%3],values[i]);}}
 return doc.accessors.push(a)-1;
}
for(const m of meshes){
 if(!m.positions.length)continue;
 const material=doc.materials.push({pbrMetallicRoughness:{baseColorFactor:[...m.color.slice(0,3),1],metallicFactor:0,roughnessFactor:.9},doubleSided:true})-1;
 const attributes={POSITION:attr(m.positions,'VEC3'),NORMAL:attr(m.normals,'VEC3')};
 if(m.uvs.length)attributes.TEXCOORD_0=attr(m.uvs,'VEC2');
 const mesh=doc.meshes.push({primitives:[{attributes,indices:attr(m.indices,'SCALAR',true),material}]})-1;
 doc.scenes[0].nodes.push(doc.nodes.push({mesh})-1);
}
doc.buffers[0].byteLength=offset;
let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const bin=Buffer.concat(chunks);const total=12+8+json.length+8+bin.length;
const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(total,8);
const jh=Buffer.alloc(8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);
const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
fs.writeFileSync(path.join(__dirname,'vidhana-sample.glb'),Buffer.concat([header,jh,json,bh,bin]));
console.log(JSON.stringify({glbBytes:total,meshes:doc.meshes.length,accessors:doc.accessors.length}));
