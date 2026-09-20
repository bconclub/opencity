import fs from 'node:fs';
import assert from 'node:assert/strict';
import { buildFocusTargets, findFocusTarget } from './landmark-focus-candidate.js';
const data = JSON.parse(fs.readFileSync('district-data.json'));
const landmarks = JSON.parse(fs.readFileSync('landmark-data.json'));
const measured = JSON.parse(fs.readFileSync('qc/vidhana-architecture-integration-cpu.json'));
const xy = point => [(point[0]-77.5945)*111320*Math.cos(12.9755*Math.PI/180),(point[1]-12.9755)*111320];
const features = [...data.features.filter(feature => feature.properties._layer === 'building'), ...landmarks.features];
const sourceBefore = JSON.stringify(features);
const inside = (point, ring) => { let hit=false; for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
  const a=ring[i],b=ring[j]; if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;
} return hit; };
const inPoly = (point,rings) => inside(point,rings[0])&&!rings.slice(1).some(ring=>inside(point,ring));
const area = ring => Math.abs(ring.reduce((sum,a,i)=>{const b=ring[(i+1)%ring.length];return sum+a[0]*b[1]-b[0]*a[1];},0)/2);
const center = ring => ring.reduce((sum,p)=>[sum[0]+p[0]/ring.length,sum[1]+p[1]/ring.length],[0,0]);
// Reproduce the renderer's landmark replacement rule. Such source buildings
// still exist in district-data but must never compete with visible parts.
const landmarkRings=landmarks.features.map(feature=>feature.geometry.coordinates[0].map(xy));
const visibleFeatures=new Set(features.filter(feature=>{
  if(landmarks.features.includes(feature))return true;
  const ring=feature.geometry.coordinates[0].map(xy),xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);
  const midpoint=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];
  return !landmarkRings.some(ring=>inside(midpoint,ring));
}));
const targets = buildFocusTargets(features, xy, measured, visibleFeatures);
const crown = targets.find(target => target.properties?.osm_id === 'way/371511885');
assert.equal(crown.height, Math.fround(39.8));
assert.equal(crown.base, Math.fround(28.1));
assert.equal(targets.some(target => target.properties?.osm_id === 'way/371511883'), false);
assert.equal(targets.some(target=>target.id==='building-2086'),false,'Hidden district core excluded');
const topPick = findFocusTarget(targets, center(crown.rings[0]), crown.height, inPoly, area);
assert.equal(topPick.id, crown.id, 'Actual crown picked at its displayed summit');
assert.equal(findFocusTarget(targets, center(crown.rings[0]), 46, inPoly, area), null, 'Old nonexistent summit does not resolve');
const stairs = targets.find(target=>target.id==='vidhana-front-stairs');
assert.equal(findFocusTarget(targets,center(stairs.rings[0]),stairs.height,inPoly,area)?.id,stairs.id);
for(const target of targets.filter(target=>target.properties && target.properties.site!=='Vidhana Soudha')) {
  const expected=Number(target.properties.height??target.properties.render_height)||8;
  assert.equal(target.height,expected,'Other buildings keep existing height');
}
assert.equal(JSON.stringify(features),sourceBefore);
console.log(JSON.stringify({passed:true,targets:targets.length,crown:{id:crown.id,base:crown.base,height:crown.height},stairs:stairs.id,sourceUnmodified:true}));
