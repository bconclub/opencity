import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildLandmarks as before} from './vidhana-landmark-before.js';import {buildLandmarks as after} from '../landmarks.js';
const response=await fetch('https://unpkg.com/three@0.169.0/build/three.module.js');assert(response.ok);const T=await import('data:text/javascript;base64,'+Buffer.from(await response.text()).toString('base64'));
const data=JSON.parse(fs.readFileSync('landmark-data.json')),xy=p=>[(p[0]-77.59065)*111320*Math.cos(12.97973*Math.PI/180),(p[1]-12.97973)*111320];
const summary={};for(const [key,build] of Object.entries({before,after})){const m=build(T,data,xy);summary[key]={parts:m.parts,domes:m.domes,draws:m.group.children.length,triangles:m.group.children.reduce((s,v)=>s+v.geometry.attributes.position.count/3,0)};for(const mesh of m.group.children)for(const attr of Object.values(mesh.geometry.attributes))assert([...attr.array].every(Number.isFinite));}
assert.equal(summary.before.draws,summary.after.draws);assert.equal(summary.before.domes,summary.after.domes);assert.equal(summary.before.parts,summary.after.parts);
// Isolate one nonuniformly scaled dome. Curved vertex normals must no longer
// equal each triangle's plane normal, while separate ordinary walls stay flat.
const dome=data.features.find(f=>f.properties['roof:shape']==='onion'),result=after(T,{features:[dome]},xy),g=result.group.children[0].geometry,p=g.attributes.position,n=g.attributes.normal;
let curved=0,unit=0;for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),face=b.sub(a).cross(c.sub(a)).normalize(),normal=new T.Vector3().fromBufferAttribute(n,i);if(face.lengthSq()>.9&&normal.dot(face)<.9999)curved++;if(Math.abs(normal.length()-1)<1e-5)unit++;}
assert(curved>100);assert(unit>100);console.log(JSON.stringify({passed:true,summary,curvedTriangles:curved,unitNormalTriangles:unit}));
