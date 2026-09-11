"""Reuse existing isolated500m scene, subtract only repaired footprint additions."""
import json,hashlib,sys
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import shape,mapping,Point
from shapely.ops import unary_union
root=Path(__file__).resolve().parents[1];out=root/'qc/street-500-gap-scene';out.mkdir(exist_ok=True)
base=root/'qc/street-500-scene-data';asset=root/'experiments/osm2world/coverage-500-classified/asset';repair=root/'qc/street-500-gap-export/asset'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
provenance=json.loads((base/'provenance.json').read_text());assert provenance['candidateFootprintSHA256']==sha(asset/'vidhana-footprint.geojson')
doc=json.loads((base/'vidhana-street-data.json').read_text());patch=shape(json.loads((root/'qc/street-500-gap-repair.geojson').read_text())['features'][0]['geometry']);window=patch.buffer(1e-8);foot=unary_union([shape(f['geometry']).intersection(window) for f in json.loads((repair/'vidhana-footprint.geojson').read_text())['features'] if shape(f['geometry']).intersects(window)]);features=[];changed=[]
probe=Point(77.59020226666667,12.975491600004656)
beforeProbe=[];afterProbe=[]
for i,f in enumerate(doc['features']):
 if f['properties']['kind'] in ('road','footpath','lane'):
  original=shape(f['geometry'])
  if original.covers(probe):beforeProbe.append({'index':i,'properties':f['properties']})
  geom=original.difference(foot)
  if not original.equals(geom):changed.append(i)
  if geom.is_empty:continue
  if geom.covers(probe):afterProbe.append(i)
  f={**f,'geometry':mapping(geom)}
 features.append(f)
(out/'baseline-surfaces.json').write_bytes((base/'vidhana-street-data.json').read_bytes())
(out/'candidate-surfaces.json').write_text(json.dumps({**doc,'features':features},separators=(',',':')))
report={'baselineSurfaceSHA256':sha(base/'vidhana-street-data.json'),'baselineFootprintSHA256':sha(asset/'vidhana-footprint.geojson'),'candidateFootprintSHA256':sha(repair/'vidhana-footprint.geojson'),'changedFeatureIndices':changed,'legacyProbeBefore':beforeProbe,'legacyProbeAfter':afterProbe,'baselineClippingProvenance':provenance,'ownershipLimit':'Only source-generated road/footpath/lane surfaces are subtracted. Base-map transportation lines and common district shadow receiver remain unchanged. Auto-mode surfaces are never activated. Scene is not proof of surveyed kerb or external map-tile ownership.'}
assert not afterProbe
(out/'surface-provenance.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'changedFeatures':len(changed),'probeBefore':beforeProbe,'probeAfter':afterProbe}))
