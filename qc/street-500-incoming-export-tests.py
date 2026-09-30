"""Source-alignment tests for regenerated junction, not broken-footprint identity."""
import sys, json, math, hashlib, xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0, 'D:/CodexTools/python-libs')
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qc/street-500-incoming-junction'
origin=[77.59136000000001,12.97984615];c=2*math.pi*6371008.8*math.cos(math.radians(origin[1]));my=lambda lat:math.asinh(math.tan(math.radians(lat)))/(2*math.pi)
local=lambda x,y:((x-origin[0])*c/360,(my(y)-my(origin[1]))*c)
def read(name):
 d=json.loads(name.read_text());assert d['origin']==origin;t=d['triangles'];return unary_union([Polygon([(t[i+j],t[i+j+1]) for j in (0,3,6)]) for i in range(0,len(t),9)])
before=read(ROOT/'qc/street-500-combined/asset/vidhana-ground.json');after=read(OUT/'asset/vidhana-ground.json')
xml=ET.parse(OUT/'source.osm').getroot();nodes={n.get('id'):local(float(n.get('lon')),float(n.get('lat'))) for n in xml.findall('node')};ways={w.get('id'):w for w in xml.findall('way')};refs=lambda w:[n.get('ref') for n in w.findall('nd')]
junction=Point(nodes['428831252']);delta=after.symmetric_difference(before);outsideGeometry=delta.difference(junction.buffer(40));outside=outsideGeometry.area
# Independent rebatching triangulates identical remote polygons differently;
# Float32 export can leave thin slivers. Prove their width, not arbitrary area.
def polygons(g):
 if g.geom_type=='Polygon':yield g
 else:
  for p in getattr(g,'geoms',[]):yield from polygons(p)
outsideMaximumBoundaryDistance=max((Point(v).distance(before.boundary) for p in polygons(outsideGeometry) for v in p.exterior.coords),default=0)
# A tiny interior triangulation hole can sit metres from the exterior boundary.
# Symmetric buffered coverage tests both missing and added strips, including holes.
remoteAddedBeyondTolerance=after.difference(before.buffer(.0001)).difference(junction.buffer(40)).area
remoteRemovedBeyondTolerance=before.difference(after.buffer(.0001)).difference(junction.buffer(40)).area
assert remoteAddedBeyondTolerance<1e-8 and remoteRemovedBeyondTolerance<1e-8,(outside,remoteAddedBeyondTolerance,remoteRemovedBeyondTolerance)
protected=[]
for wid in ['338941369','38318887']:
 area=Polygon([nodes[n] for n in refs(ways[wid])]);overlap=after.difference(before).intersection(area).area;assert overlap<.001
 protected.append(dict(way=wid,newGroundOverlapM2=overlap,distanceFromJunctionM=area.distance(junction)))
center=Point(local(77.5908,12.9798));incoming=LineString([nodes[n] for n in refs(ways['1091198032'])[-3:]])
samples=[]
for i in range(math.ceil(incoming.length/.25)+1):
 p=incoming.interpolate(min(i*.25,incoming.length))
 if p.distance(center)>499.95:continue
 distance=p.distance(after);assert distance<.001,(p,distance);samples.append(distance)
preview=json.loads((ROOT/'qc/street-500-route-preview.geojson').read_text())['features'];routeSamples=0;miss=[]
for f in preview:
 assert f['properties']['sourceWay'] not in ('1091198031','1091198032')
 a,b=[local(*p) for p in f['geometry']['coordinates']];steps=max(1,math.ceil(math.dist(a,b)/5))
 for i in range(steps+1):
  p=Point(a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps);routeSamples+=1
  if p.distance(after)>.001:miss.append(dict(properties=f['properties'],distanceM=p.distance(after)))
assert not miss,miss
oldStatic=json.loads((ROOT/'vidhana-street-data.json').read_text());newStatic=json.loads((OUT/'candidate-surfaces.json').read_text())
unchangedKinds=['zebra','signal','memorial']
for kind in unchangedKinds:assert [f for f in oldStatic['features'] if f['properties']['kind']==kind]==[f for f in newStatic['features'] if f['properties']['kind']==kind]
report=dict(passed=True,groundAddedM2=after.difference(before).area,groundRemovedM2=before.difference(after).area,changedAreaOutside40mM2=outside,remoteAddedBeyondToleranceM2=remoteAddedBeyondTolerance,remoteRemovedBeyondToleranceM2=remoteRemovedBeyondTolerance,remoteBoundaryToleranceM=.0001,
 protectedMappedAreas=protected,incomingSamples=len(samples),incomingMaximumGroundMissM=max(samples),existingRouteSamples=routeSamples,existingRouteMissesOver1mm=len(miss),
 unchangedMappedFeatureKinds=unchangedKinds,conditionalMotorAccessEnabled=False,automaticRouteQualification=False,runtimePromoted=False)
(OUT/'export-tests.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
