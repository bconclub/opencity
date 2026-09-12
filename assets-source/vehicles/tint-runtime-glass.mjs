import {readFileSync,writeFileSync} from 'node:fs';
// Edit only explicit glass materials. Preserve geometry, embedded textures and paint.
for(const id of ['cybertruck','kitt']){
 const path=new URL(`../../assets/vehicles/${id}.glb`,import.meta.url);
 // This script lives in assets-source/vehicles, two levels below the project root.
 const source=readFileSync(path),jsonLength=source.readUInt32LE(12);
 const gltf=JSON.parse(source.subarray(20,20+jsonLength).toString());
 const glass=gltf.materials.filter(m=>m.name==='Glass');
 if(glass.length!==1)throw Error(`${id}: expected one explicit glass material`);
 for(const material of glass){
  material.alphaMode='OPAQUE';delete material.alphaCutoff;
  Object.assign(material.pbrMetallicRoughness,{baseColorFactor:[.008,.014,.019,1],metallicFactor:.2,roughnessFactor:.22});
 }
 const text=Buffer.from(JSON.stringify(gltf)),json=Buffer.alloc(Math.ceil(text.length/4)*4,0x20);text.copy(json);
 const rest=source.subarray(20+jsonLength),output=Buffer.alloc(20+json.length+rest.length);
 source.copy(output,0,0,20);output.writeUInt32LE(output.length,8);output.writeUInt32LE(json.length,12);json.copy(output,20);rest.copy(output,20+json.length);
 writeFileSync(path,output);console.log(`${id}: opaque smoked glass; binary geometry/textures unchanged (${rest.length} bytes)`);
}
