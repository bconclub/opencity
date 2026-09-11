import json,math,sys
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import Polygon,Point
from shapely.ops import unary_union
from shapely.strtree import STRtree
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'qc/street-500-junction-kerb'
source=ROOT/'qc/street-500-junction-kerb.py';s=source.read_text().split('updated=[]')[0];h={'__file__':str(source)};exec(compile(s,str(source),'exec'),h)
def read(p):
 d=json.loads(p.read_text());t=d['triangles'];faces=[t[i:i+9] for i in range(0,len(t),9)];polys=[Polygon([(v[j],v[j+1]) for j in (0,3,6)]) for v in faces];return d,faces,polys
old,ov,op=read(ROOT/'qc/street-500-gap-export/asset/vidhana-ground.json');new,nv,np=read(out/'asset/vidhana-ground.json');assert old['origin']==new['origin']
oldground=unary_union(op);newground=unary_union(np);delta=oldground.symmetric_difference(newground).area;assert delta<.001
tree=STRtree(np)
def height(p):
 hs=[]
 for i in tree.query(p):
  if np[i].covers(p):hs.append(max(nv[i][2::3]))
 return max(hs) if hs else None
oldraised=unary_union([p for v,p in zip(ov,op) if min(v[2::3])>.05]);zone=oldraised.intersection(h['interior'].buffer(-.001));bounds=zone.bounds;tested=[]
for ix in range(math.ceil((bounds[2]-bounds[0])/.2)+1):
 for iy in range(math.ceil((bounds[3]-bounds[1])/.2)+1):
  p=Point(bounds[0]+ix*.2,bounds[1]+iy*.2)
  if not zone.contains(p):continue
  z=height(p);assert z is not None and z<.001,(p,z);tested.append(z)
assert len(tested)>50
preview=json.loads((ROOT/'qc/street-500-route-preview.geojson').read_text())['features'];samples=0;miss=[]
for f in preview:
 a,b=[h['local'](*p) for p in f['geometry']['coordinates']];steps=max(1,math.ceil(math.dist(a,b)/5))
 assert f['properties']['sourceWay']!='1091198031'
 for i in range(steps+1):
  p=Point(a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps);samples+=1
  if p.distance(newground)>.001:miss.append(f['properties'])
assert not miss
report={'passed':True,'actualFloat32FootprintDifferenceM2':delta,'interiorFormerRaisedSamples':len(tested),'maximumNewHeightM':max(tested),'routeSamples':samples,'routeMissesOver1mm':len(miss),'conditionalCircleExcluded':True,'turnQualified':False}
(out/'export-tests.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
