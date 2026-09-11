import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const source=read('qc/npc-curve-baseline.mjs');
const target="const target=car.path.ended?0:Math.min(car.cruise||6,Math.sqrt(Math.max(0,gap-.8)*5));";
if(source.split(target).length!==2)throw Error('Preserved baseline target changed, review candidate insertion');
const candidate=source.replace("from './auto-roads.js'","from '../auto-roads.js'").replace(target,"const target=car.path.ended?0:Math.min(npcCurveSpeed(graph,car),Math.sqrt(Math.max(0,gap-.8)*5));")+'\n'+read('qc/npc-curve-speed-helper.txt');
fs.writeFileSync(new URL('npc-curve-candidate.mjs',import.meta.url),candidate);
// Reuse all six exact baseline scenarios, with the candidate as the only
// algorithm change. Keep baseline artifacts untouched.
let suite=read('qc/traffic-production-audit.mjs').replace("from './npc-curve-baseline.mjs'","from './npc-curve-candidate.mjs'").replaceAll('qc/traffic-production-audit.json','qc/npc-curve-candidate-audit.json');
suite=suite.replace('sourceHashes:Object.fromEntries([','sourceHashes:Object.fromEntries([\'qc/npc-curve-candidate.mjs\',');
suite=suite.replace('maxHeadingStep:0,headingJumps:[]','maxHeadingStep:0,maxEdge511HeadingStep:0,edge511MaxSpeed:0,headingJumps:[]');
suite=suite.replace('const e=graph.edges[c.path.edge];if',"if(c.path.edge===511&&c.path.turn){result.maxEdge511HeadingStep=Math.max(result.maxEdge511HeadingStep,gap);result.edge511MaxSpeed=Math.max(result.edge511MaxSpeed,c.speed);}\n   const e=graph.edges[c.path.edge];if");
fs.writeFileSync(new URL('npc-curve-candidate-audit.mjs',import.meta.url),suite);
console.log('Wrote isolated candidate and six-scenario audit under qc/ only.');
