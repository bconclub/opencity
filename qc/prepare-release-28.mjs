import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const path=name=>new URL(name,root);
let worker=await readFile(path('sw.js'),'utf8');
for(const name of ['traffic-simulation.js','vehicle-tuning.js','vehicle-boost.js','boost-meter.js','auto-roam-physics.js','assets/vehicles/cybercab.glb']){
 if(!worker.includes(`'${name}'`))worker=worker.replace('const files=[',`const files=['${name}',`);
}
worker=worker.replace("'assets/vehicles/cybercab-v2.glb',",'').replace("'assets/vehicles/cybercab-v2-lod.glb',",'');await writeFile(path('sw.js'),worker);
const pkg=JSON.parse(await readFile(path('package.json'),'utf8'));pkg.version='0.0.28';await writeFile(path('package.json'),JSON.stringify(pkg,null,2)+'\n');
await writeFile(path('release.json'),JSON.stringify({version:'0.0.28',date:'2026-09-10',name:'Traffic rules, earned boost and model comparison',versionScheme:'base-100-release-counter'})+'\n');
