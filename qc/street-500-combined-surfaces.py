"""Exact immutable runtime flat-surface subtraction; no automatic route edits."""
import sys,json,hashlib,subprocess
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import shape,mapping
from shapely.ops import unary_union
from shapely.affinity import affine_transform
from shapely import set_precision
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'qc/street-500-combined'
HEAD='733fd3337caaf98b334c174e218e00820b447216'
raw=subprocess.check_output(['git','show',HEAD+':vidhana-street-data.json'],cwd=ROOT)
doc=json.loads(raw)
footraw=(OUT/'asset/vidhana-footprint.geojson').read_bytes()
foot=unary_union([shape(f['geometry']) for f in json.loads(footraw)['features']])
displayraw=(ROOT/'qc/street-500-surface-cleanup/asphalt-material-region.geojson').read_bytes()
display=shape(json.loads(displayraw)['geometry'])
origin=[77.59136,12.97984615]
import math
sx=111195.0802335329*math.cos(math.radians(origin[1]));sy=111195.0802335329
local=lambda g:affine_transform(g,[sx,0,0,sy,-origin[0]*sx,-origin[1]*sy])
world=lambda g:affine_transform(g,[1/sx,0,0,1/sy,origin[0],origin[1]])
foot=set_precision(local(foot),1e-6);display=set_precision(local(display),1e-6)
roadmask=foot.union(display)
masks={k:(m,m.buffer(0.000003),m.buffer(-0.000003)) for k,m in [('road',roadmask),('footpath',foot),('lane',foot)]}
features=[];changes=[]
for index,f in enumerate(doc['features']):
 kind=f['properties'].get('kind');g=set_precision(local(shape(f['geometry'])),1e-6)
 if kind not in masks:features.append(f);continue
 mask,outer,inner=masks[kind]
 result=g.difference(mask)
 # Exact ownership: no deletion outside verified replacement masks, no added area.
 assert result.difference(g.buffer(0.000003)).area<1e-9
 assert g.difference(result).difference(outer).area<1e-9, index
 assert result.intersection(inner).area<1e-9
 if not result.equals(g):changes.append({'index':index,'properties':f['properties'],'removedM2':g.area-result.area,'empty':result.is_empty})
 if not result.is_empty:features.append({**f,'geometry':mapping(world(result))} if not result.equals(g) else f)
target=OUT/'candidate-surfaces.json';target.write_text(json.dumps({**doc,'features':features},separators=(',',':')))
sha=lambda b:hashlib.sha256(b).hexdigest()
report={'sourceHead':HEAD,'sourceSurfaceSHA256':sha(raw),'groundFootprintSHA256':sha(footraw),'displayRegionSHA256':sha(displayraw),'candidateSurfaceSHA256':sha(target.read_bytes()),'beforeFeatures':len(doc['features']),'afterFeatures':len(features),'changes':changes,'exactOwnershipTestsPassed':True,'preservedKinds':'All except road, footpath, lane; explicit zebras unchanged','unresolved':'Auto-mode road quads and street-detail surfaces not changed; automatic routes remain unqualified. Base-map transportation and district shadow receiver retain current behavior.'}
(OUT/'surface-provenance.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='changes'}))


