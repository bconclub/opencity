import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
// Explicit runtime manifest excludes source tools, credentials and test pages.
const root=import.meta.dirname,output=join(root,'public-release');
const worker=await readFile(join(root,'sw.js'),'utf8');
const manifest=worker.match(/const files=\[(.*?)\];/s);
if(!manifest)throw Error('Service worker runtime manifest missing');
const files=[...manifest[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
// Include static additions as well as the initial list. Optional runtime modules
// still need to be deployed even when their loader can fall back without them.
for(const addition of worker.matchAll(/files\.push\(([^;]*)\);/g)){
 const text=addition[1];
 if(text.replace(/'[^']+'/g,'').replace(/[\s,]/g,''))throw Error('Runtime manifest additions must be static quoted paths');
 files.push(...[...text.matchAll(/'([^']+)'/g)].map(m=>m[1]));
}
files.push('sw.js','local-cache.js','release.json','cycle-model.js','drone-model.js','street-detail.js');
// Review assets are available on demand and deliberately absent from game precaching.
files.push('vehicle-review.html','assets/vehicles/compare-generated.glb','assets/vehicles/compare-smoothed.glb','assets/vehicles/compare-recoloured.glb');
files.push('kitt-workshop.html','assets/vehicles/kitt-review/kitt-reference.glb','assets/vehicles/kitt-review/runtime-before-promotion.glb','assets/vehicles/kitt-review/validation.json');
files.push('assets/vehicles/kitt-review/README.md');
await mkdir(output,{recursive:true});
for(const file of new Set(files)){await mkdir(dirname(join(output,file)),{recursive:true});await copyFile(join(root,file),join(output,file));}
await writeFile(join(output,'vercel.json'),JSON.stringify({framework:null,buildCommand:null,installCommand:null,headers:[{source:'/release.json',headers:[{key:'Cache-Control',value:'no-store'}]},{source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache'}]}]},null,2));
console.log(`Staged ${new Set(files).size} runtime files in ${output}`);
