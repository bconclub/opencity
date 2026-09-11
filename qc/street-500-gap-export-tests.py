"""Actual exported Float32 route coverage, material ownership and obstacle tests."""
import json,math,sys,struct,hashlib,importlib.util
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import Polygon,Point,LineString,shape
from shapely.ops import unary_union,transform
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'qc/street-500-gap-export';base=ROOT/'experiments/osm2world/coverage-500-classified/asset'
meta=json.loads((out/'asset/vidhana-streets.json').read_text());origin=meta['origin'];circ=2*math.pi*6371008.8*math.cos(math.radians(origin[1]));my=lambda y:math.asinh(math.tan(math.radians(y)))/(2*math.pi)
def local(x,y,z=None):return ((x-origin[0])*circ/360,(my(y)-my(origin[1]))*circ)
def polys(values):return [Polygon([(values[i+j],values[i+j+1]) for j in (0,3,6)]) for i in range(0,len(values),9)]
def glb(p):
 data=p.read_bytes();n=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+n]);binary=data[28+n:]
 def attr(i):
  a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];size=3 if a['type']=='VEC3' else 1
  return struct.unpack_from('<'+('f' if a['componentType']==5126 else 'I')*(a['count']*size),binary,v.get('byteOffset',0)+a.get('byteOffset',0))
 groups={};triangles={}
 for mesh in doc['meshes']:
  for p in mesh['primitives']:
   role=doc['materials'][p['material']]['extras']['streetSurfaceRole'];ps=attr(p['attributes']['POSITION']);ids=attr(p['indices']);flat=[ps[n*3+j] for n in ids for j in range(3)]
   triangles.setdefault(role,[]).extend(tuple(flat[i:i+9]) for i in range(0,len(flat),9));groups.setdefault(role,[]).extend(poly for poly in polys(flat) if poly.area>1e-9)
 return {k:unary_union(v) for k,v in groups.items()},triangles
roles,rendertris=glb(out/'asset/vidhana-streets.glb');oldroles,oldtris=glb(base/'vidhana-streets.glb')
changes={r:roles[r].symmetric_difference(oldroles[r]).area for r in roles}
assert all(v<1e-8 for r,v in changes.items() if r!='asphalt'),changes
grounddoc=json.loads((out/'asset/vidhana-ground.json').read_text());assert grounddoc['origin']==origin
ground=unary_union(polys(grounddoc['triangles']));oldground=unary_union(polys(json.loads((base/'vidhana-ground.json').read_text())['triangles']))
foot=unary_union([transform(local,shape(f['geometry'])) for f in json.loads((out/'asset/vidhana-footprint.geojson').read_text())['features']])
assert foot.symmetric_difference(ground).area<.001
key=lambda t:tuple(sorted(tuple(t[i:i+3]) for i in (0,3,6)))
renderkeys={key(t) for ts in rendertris.values() for t in ts}
for i in range(0,len(grounddoc['triangles']),9):assert key(grounddoc['triangles'][i:i+9]) in renderkeys
added=ground.difference(oldground);removed=oldground.difference(ground)
repair=unary_union([shape(f['geometry']) for f in json.loads((ROOT/'qc/street-500-gap-repair.geojson').read_text())['features']]);repair=transform(local,repair)
outside=added.difference(repair.buffer(.0001))
# Re-running polygon union changes a few remote triangulation edges at Float32
# precision. Bound both area and physical distance, never hide metre-sized gaps.
assert outside.area<.0001
assert outside.difference(oldground.boundary.buffer(.0001)).area<1e-10
assert removed.area<.001
preview=json.loads((ROOT/'qc/street-500-route-preview.geojson').read_text())['features'];misses=[];count=0;maxgap=0
for f in preview:
 a,b=[local(*p) for p in f['geometry']['coordinates']];steps=max(1,math.ceil(math.dist(a,b)/5))
 assert f['properties']['sourceWay']!='1091198031','Conditional circle must remain excluded'
 for i in range(steps+1):
  p=Point(a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps);gap=p.distance(ground);maxgap=max(maxgap,gap);count+=1
  if gap>.001:misses.append({'way':f['properties']['sourceWay'],'segment':f['properties']['sourceSegment'],'gapM':gap})
assert not misses,misses
spec=importlib.util.spec_from_file_location('streets',ROOT/'prepare-vidhana-streets.py');streets=importlib.util.module_from_spec(spec);spec.loader.exec_module(streets)
assert not streets.motor_route_eligibility({'highway':'unclassified','motor_vehicle:conditional':'yes @ (Mo-Sa 08:00-21:00)'})[0]
# Repeat the already established containment suite against exported ground only.
source=(ROOT/'qc/street-500-gap-repair.py').read_text();scope={'__file__':str(ROOT/'qc/street-500-gap-repair.py')}
exec(compile(source[:source.index('out=ROOT/')],scope['__file__'],'exec'),scope)
route=scope['route'];bodies=[]
for half in (1.05,1.30665):
 corridor=route.buffer(half,cap_style=2);gaparea=corridor.difference(ground).area
 assert gaparea<.0001
 bodies.append({'halfWidthIncludingMarginM':half,'uncoveredM2':gaparea})
assert added.intersection(scope['raisedground']).area<.0001
assert sum(added.intersection(p).area for _,p,_ in scope['obstacles'])==0
manifest=json.loads((out/'manifest.json').read_text())
for f,h in manifest['baselinePreserved'].items():assert hashlib.sha256((base/f).read_bytes()).hexdigest()==h
report={'passed':True,'routeSamples':count,'missesOver1mm':misses,'maximumSampleGapM':maxgap,'conditionalCircularWayExcluded':True,'materialChangedAreaM2':changes,'addedGroundAreaM2':added.area,'removedGroundAreaM2':removed.area,'remoteRetriangulationAddedAreaM2':outside.area,'remoteRetriangulationMaxBoundaryDistanceM':.0001,'footprintGroundDifferenceM2':foot.symmetric_difference(ground).area,'allGroundFacesExistInGLB':True,'actualExportCorridors':bodies,'raisedSidewalkAddedOverlapM2':added.intersection(scope['raisedground']).area,'baselineHashesPreserved':True,'turnQualified':False}
(out/'export-tests.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
