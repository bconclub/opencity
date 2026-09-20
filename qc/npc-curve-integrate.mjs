import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url),path=p=>new URL(p,root),read=p=>fs.readFileSync(path(p),'utf8'),write=(p,s)=>fs.writeFileSync(path(p),s);
const current=read('traffic-simulation.js'),target="const target=car.path.ended?0:Math.min(car.cruise||6,Math.sqrt(Math.max(0,gap-.8)*5));";
assert.equal(current.split(target).length,2,'Expected unchanged reviewed production baseline');
assert.ok(!fs.existsSync(path('qc/npc-curve-baseline.mjs')),'Refuse to overwrite preserved baseline');
write('qc/npc-curve-baseline.mjs',current.replace("from './auto-roads.js'","from '../auto-roads.js'"));
for(const p of ['npc-curve-fixtures.json','npc-curve-candidate-review.md'])fs.copyFileSync(path('qc/'+p),path('qc/'+p.replace(/(\.[^.]+)$/,'-before-integration$1')));
for(const p of ['qc/npc-curve-fixtures.mjs','qc/npc-curve-cpu.mjs']){
 let s=read(p).replace("import * as baseline from '../traffic-simulation.js'","import * as baseline from './npc-curve-baseline.mjs'").replace("import * as candidate from './npc-curve-candidate.mjs'","import * as candidate from '../traffic-simulation.js'");
 if(p.endsWith('fixtures.mjs'))s=s.replace("new URL('npc-curve-fixtures.json'","new URL('npc-curve-integrated-fixtures.json'");
 write(p,s);
}
let audit=read('qc/traffic-production-audit.mjs').replace("from '../traffic-simulation.js'","from './npc-curve-baseline.mjs'").replace("['traffic-simulation.js','npc-traffic.js'","['qc/npc-curve-baseline.mjs','npc-traffic.js'");write('qc/traffic-production-audit.mjs',audit);
let builder=read('qc/npc-curve-candidate-build.mjs').replace("read('traffic-simulation.js')","read('qc/npc-curve-baseline.mjs')").replace('Production target changed','Preserved baseline target changed').replace(".replace(\"from '../traffic-simulation.js'\",\"from './npc-curve-candidate.mjs'\")",".replace(\"from './npc-curve-baseline.mjs'\",\"from './npc-curve-candidate.mjs'\")");write('qc/npc-curve-candidate-build.mjs',builder);
const integrated=current.replace(target,"const target=car.path.ended?0:Math.min(npcCurveSpeed(graph,car),Math.sqrt(Math.max(0,gap-.8)*5));")+'\n'+read('qc/npc-curve-speed-helper.txt');
const normalize=s=>s.replaceAll('\r\n','\n').replace("from '../auto-roads.js'","from './auto-roads.js'");
assert.equal(normalize(integrated),normalize(read('qc/npc-curve-candidate.mjs')),'Production patch must exactly equal reviewed candidate');
write('traffic-simulation.js',integrated);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
write('qc/npc-curve-integration.json',JSON.stringify({created:new Date().toISOString(),baselineSHA256:hash(current),runtimeSHA256:hash(read('traffic-simulation.js')),candidateSHA256:hash(read('qc/npc-curve-candidate.mjs')),normalizedEquivalent:true,baselinePreserved:'qc/npc-curve-baseline.mjs',status:'Integrated; verification pending'},null,2)+'\n');
console.log('Integrated exact reviewed candidate; original module and results preserved.');
