const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {selectCoverage}=require('../experiments/osm2world/select-coverage.cjs');
const dir=path.join(__dirname,'street-500-incoming-junction'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const elements=JSON.parse(fs.readFileSync(path.join(dir,'elements.json'))),selected=selectCoverage(elements,[77.5908,12.9798],500);
assert.equal(selected.missingNodeWays.length,0);
const ways=selected.input.elements.filter(e=>e.type==='way'),nodes=new Map(selected.input.elements.filter(e=>e.type==='node').map(n=>[n.id,n]));
const incoming=ways.find(w=>w.id===1091198032);assert(incoming);assert.deepEqual(incoming.nodes,[428831251,4017403935,428831252]);
assert.equal(incoming.tags['motor_vehicle:conditional'],'yes @ (Mo-Sa 08:00-21:00)');
for(const id of [1091198032,1091198031,52057928])assert(ways.find(w=>w.id===id).nodes.includes(428831252));
const old=JSON.parse(fs.readFileSync(path.join(__dirname,'../experiments/osm2world/coverage-500/input.json')));
const before=new Map(old.elements.map(e=>[e.type+'/'+e.id,e]));
const added=[];for(const e of selected.input.elements){const prior=before.get(e.type+'/'+e.id);if(prior)assert.deepEqual(e,prior,'Existing selected source changed');else added.push(e.type+'/'+e.id);}
assert.equal(selected.input.elements.length,old.elements.length+added.length);
const ns=[...nodes.values()],origin=[(Math.min(...ns.map(n=>n.lon))+Math.max(...ns.map(n=>n.lon)))/2,(Math.min(...ns.map(n=>n.lat))+Math.max(...ns.map(n=>n.lat)))/2];
const input=JSON.stringify(selected.input);fs.writeFileSync(path.join(dir,'input.json'),input);fs.writeFileSync(path.join(dir,'provenance.json'),JSON.stringify(selected.provenance,null,2));
const report={...selected.stats,inputSHA256:sha(input),addedElements:added,incomingSelectedNodes:incoming.nodes,origin,sourceElementsUnchanged:true,conditionalMotorAccessEnabled:false,routesChanged:false};
fs.writeFileSync(path.join(dir,'selection-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
