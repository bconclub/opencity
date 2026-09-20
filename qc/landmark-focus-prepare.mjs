import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const baseline = fs.readFileSync('district.js', 'utf8');
let candidate = baseline;
const replace = (before, after) => {
  assert.equal(candidate.split(before).length, 2, 'Expected exactly one reviewed source anchor');
  candidate = candidate.replace(before, after);
};
replace("import {polygonTouchesCBD}", "import {buildFocusTargets,findFocusTarget} from './landmark-focus.js';\nimport {polygonTouchesCBD}");
replace("const buildingPolygons=[],spatial=new Map(),roads=new Map(),seenBuildings=new Set();", "const visibleFocusFeatures=new Set(landmarkData.features);\n const buildingPolygons=[],spatial=new Map(),roads=new Map(),seenBuildings=new Set();");
replace("const kind=materialFor(feature,height,rings);", "visibleFocusFeatures.add(feature);\n  const kind=materialFor(feature,height,rings);");
replace("const pickTargets=[...data.features.filter(f=>f.properties._layer==='building'),...landmarkData.features].map((f,i)=>({id:'building-'+i,properties:f.properties,rings:f.geometry.coordinates.map(r=>r.map(xy))}));",
  "const pickTargets=buildFocusTargets([...data.features.filter(f=>f.properties._layer==='building'),...landmarkData.features],xy,landmarks,visibleFocusFeatures);");
replace("const candidates=pickTargets.filter(f=>{const top=Number(f.properties.height??f.properties.render_height)||8,mappedBase=Number(f.properties.min_height??f.properties.render_min_height)||0,base=mappedBase>=0&&mappedBase<top?mappedBase:0;return inPoly(point,f.rings)&&z>=base-1&&z<=top+2;});",
  "const target=findFocusTarget(pickTargets,point,z,inPoly,area);");
replace("candidates.sort((a,b)=>area(a.rings[0])-area(b.rings[0]));const target=candidates[0];if(!target)return null;", "if(!target)return null;");
replace("const p=target.properties;return{id:target.id,name:p.name||p.site||'Unnamed mapped building',height:Number(p.height??p.render_height)||8,source:'OpenStreetMap',note:'Model height is schematic',lng:origin[0]+point[0]/(metres*cos),lat:origin[1]+point[1]/metres};",
  "return{id:target.id,name:target.name,height:target.height,source:target.source,note:target.note,lng:origin[0]+point[0]/(metres*cos),lat:origin[1]+point[1]/metres};");
fs.writeFileSync('qc/landmark-focus-district-candidate.js', candidate);
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
fs.writeFileSync('qc/landmark-focus-manifest.json', JSON.stringify({ reviewOnly: true,
  baseline: { path: 'district.js', sha256: sha(baseline) },
  candidate: { path: 'qc/landmark-focus-district-candidate.js', sha256: sha(candidate) },
  helper: { path: 'qc/landmark-focus-candidate.js', sha256: sha(fs.readFileSync('qc/landmark-focus-candidate.js')) },
  futureRuntimeImport: 'landmark-focus.js',
  deployment: 'Requires helper in preload/cache manifest. No runtime files changed.',
}, null, 2));
console.log('Prepared isolated district focus candidate; runtime unchanged.');
