import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildLandmarks as candidate,ARCHITECTURE_DIMENSIONS as D} from './vidhana-architecture-candidate.js';
import {buildLandmarks as current} from '../landmarks.js';
const response=await fetch('https://unpkg.com/three@0.169.0/build/three.module.js');assert(response.ok);
const T=await import('data:text/javascript;base64,'+Buffer.from(await response.text()).toString('base64'));
const data=JSON.parse(fs.readFileSync('landmark-data.json')),original=JSON.stringify(data),xy=p=>[(p[0]-77.59065)*111320*Math.cos(12.97973*Math.PI/180),(p[1]-12.97973)*111320],close=(a,b)=>assert(Math.abs(a-b)<1e-4,`${a} != ${b}`);
const summary={};for(const [name,build] of Object.entries({current,candidate})){const m=build(T,{features:data.features.filter(f=>f.properties.site==='Vidhana Soudha')},xy);summary[name]={draws:m.group.children.length,triangles:m.group.children.reduce((s,v)=>s+v.geometry.attributes.position.count/3,0),domes:m.domes,zBounds:(()=>{const b=new T.Box3().setFromObject(m.group);return[b.min.z,b.max.z]})()};for(const mesh of m.group.children)for(const a of Object.values(mesh.geometry.attributes))assert([...a.array].every(Number.isFinite));}
assert.equal(summary.candidate.domes,7);assert.equal(summary.current.draws,summary.candidate.draws);assert.equal(JSON.stringify(data),original);
const measurePart=id=>{const m=candidate(T,{features:data.features.filter(f=>f.properties.osm_id===id)},xy);return new T.Box3().setFromObject(m.group);};
const drumBox=measurePart('way/363474998'),domeBox=measurePart('way/371511885'),coreBox=measurePart('way/371511883');
close(drumBox.min.z,19.3548);close(drumBox.max.z,34.1376);close(domeBox.min.z,34.1376);close(domeBox.max.z,45.72);close(coreBox.max.z,34.1376);
// Isolate sourced column objects, then measure actual emitted vertex bounds.
const columns=data.features.filter(f=>f.properties.osm_id==='relation/5518184'),cm=candidate(T,{features:columns},xy),p=cm.group.children[0].geometry.attributes.position,perColumn=p.count/columns.length;
assert.equal(columns.length,12);assert(Number.isInteger(perColumn));
for(let j=0;j<columns.length;j++){const box=new T.Box3();for(let i=j*perColumn;i<(j+1)*perColumn;i++)box.expandByPoint(new T.Vector3().fromBufferAttribute(p,i));close(box.min.z,6.75);close(box.max.z-box.min.z,12.192);const ring=columns[j].geometry.coordinates[0].slice(0,-1).map(xy),center=ring.reduce((s,a)=>[s[0]+a[0]/ring.length,s[1]+a[1]/ring.length],[0,0]);close((box.min.x+box.max.x)/2,center[0]);close((box.min.y+box.max.y)/2,center[1]);}
// Isolate canopy and steps. Count horizontal levels from emitted tread faces,
// excluding the upper landing, and measure their oriented footprint directly.
const sm=candidate(T,{features:data.features.filter(f=>f.properties.osm_id==='relation/5519270')},xy),sp=sm.group.children[0].geometry.attributes.position,sn=sm.group.children[0].geometry.attributes.normal,placement=sm.architecture.stairPlacement,levels=new Set(),u=[],v=[];
for(let i=0;i<sp.count;i+=3){const z=sp.getZ(i),out=sp.getX(i)*placement.outward[0]+sp.getY(i)*placement.outward[1];if(sn.getZ(i)>.99&&z<=D.landingZ+.0001&&out>=placement.topV-.0001){levels.add(z.toFixed(4));for(let k=0;k<3;k++){u.push(sp.getX(i+k)*placement.tangent[0]+sp.getY(i+k)*placement.tangent[1]);v.push(sp.getX(i+k)*placement.outward[0]+sp.getY(i+k)*placement.outward[1]);}}}
assert.equal(levels.size,45);close(Math.max(...u)-Math.min(...u),62.1792);close(Math.max(...v)-Math.min(...v),21.336);
const result={passed:true,summary,centralDrumZ:[drumBox.min.z,drumBox.max.z],centralDomeZ:[domeBox.min.z,domeBox.max.z],enclosedCoreTop:coreBox.max.z,columnHeight:12.192,columnBase:6.75,columns:columns.length,mappedColumnCentersPreserved:true,measuredTreadLevels:levels.size,measuredStairWidth:Math.max(...u)-Math.min(...u),measuredStairDepth:Math.max(...v)-Math.min(...v),inputUnmodified:true};fs.writeFileSync('qc/vidhana-architecture-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
