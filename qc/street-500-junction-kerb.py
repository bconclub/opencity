"""Source-linked internal-kerb repair. Isolated meshes only, no runtime writes."""
import json,math,sys,hashlib,xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import Polygon,LineString,Point,box
from shapely.ops import unary_union
from shapely import constrained_delaunay_triangles
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'qc/street-500-junction-kerb';out.mkdir(exist_ok=True)
rawpath=ROOT/'experiments/osm2world/coverage-500/meshes.json';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(rawpath)=='ca8789d4181bc435398ac6edbab468e6c489e37eaffbef4155dc11c5912c1f3e'
raw=json.loads(rawpath.read_text());source=ROOT/'qc/street-500-gap-export/meshes.json';meshes=json.loads(source.read_text())
origin=[77.59136000000001,12.97984615];factor=2*math.pi*6371008.8/40075016.686;circ=2*math.pi*6371008.8*math.cos(math.radians(origin[1]));my=lambda y:math.asinh(math.tan(math.radians(y)))/(2*math.pi)
def local(x,y):return ((x-origin[0])*circ/360,(my(y)-my(origin[1]))*circ)
osm=ET.parse(ROOT/'vidhana-streets.osm').getroot();nodes={n.get('id'):local(float(n.get('lon')),float(n.get('lat'))) for n in osm.findall('node')};ways={w.get('id'):w for w in osm.findall('way')};refs=lambda w:[n.get('ref') for n in w.findall('nd')]
a=nodes['428831252'];circle=LineString([nodes[n] for n in refs(ways['1091198031'])[:2]]);service=LineString([nodes[n] for n in refs(ways['52057928'])[:2]])
assert refs(ways['1091198031'])[0]==refs(ways['52057928'])[0]=='428831252'
def xy(mi,n):return(raw[mi]['positions'][n*3]*factor,raw[mi]['positions'][n*3+2]*factor)
circleWidth=math.dist(xy(80,8),xy(80,16));serviceWidth=math.dist(xy(323,2),xy(323,4));assert abs(circleWidth-7.1*factor)<.001 and abs(serviceWidth-3.5*factor)<.001
#50mm interior margin protects exterior curb boundaries from source snapping.
interior=circle.buffer(circleWidth/2-.05,cap_style=2).union(service.buffer(serviceWidth/2-.05,cap_style=2))
island=Polygon([nodes[n] for n in refs(ways['338941369'])]);assert interior.intersection(island).area==0
garden=Polygon([nodes[n] for n in refs(ways['38318887'])]);assert interior.intersection(garden).area==0
def triangles(m):
 for i in range(0,len(m['indices']),3):
  ids=m['indices'][i:i+3];yield i//3,[m['positions'][n*3:n*3+3] for n in ids],[m['normals'][n*3:n*3+3] for n in ids]
def projected(v):return Polygon([(p[0],p[2]) for p in v])
oldGround=unary_union([projected(v) for m in meshes if m.get('groundEligible',True) for _,v,_ in triangles(m) if projected(v).area>1e-9])
caps=[]
for mi in (1074,1075):
 for _,v,_ in triangles(raw[mi]):caps.append(Polygon([(p[0]*factor,p[2]*factor) for p in v]))
junction=circle.buffer(circleWidth/2,cap_style=2).intersection(service.buffer(serviceWidth/2,cap_style=2)).union(unary_union(caps))
def empty(m):return{**m,'positions':[],'normals':[],'indices':[],'uvs':[]}
def add(m,vs,ns):
 base=len(m['positions'])//3
 for p,n in zip(vs,ns):m['positions'].extend(p);m['normals'].extend(n)
 m['indices'].extend([base,base+1,base+2])
def clipraised(v,ns):
 poly=projected(v)
 if poly.area>1e-9:
  assert max(p[1] for p in v)-min(p[1] for p in v)<1e-6,'Unreviewed sloped cap'
  remainder=poly.difference(interior);ret=[]
  for tri in constrained_delaunay_triangles(remainder).geoms:ret.append(([[x,v[0][1],z] for x,z in list(tri.exterior.coords)[:3]],[ns[0]]*3))
  return ret,poly.intersection(interior).area
 # Vertical triangles: clip in distance/height plane. Preserve their actual
 # triangular height profile, not a full rectangular replacement wall.
 points=[(p[0],p[2]) for p in v];p0,p1=max(((x,y) for x in points for y in points),key=lambda p:math.dist(*p));length=math.dist(p0,p1)
 if length<1e-9:return[(v,ns)],0
 u=((p1[0]-p0[0])/length,(p1[1]-p0[1])/length);line=LineString([p0,p1]);remaining=line.difference(interior);parts=[remaining] if remaining.geom_type=='LineString' else list(getattr(remaining,'geoms',[]))
 profile=Polygon([((p[0]-p0[0])*u[0]+(p[2]-p0[1])*u[1],p[1]) for p in v]);ret=[]
 for part in parts:
  if part.is_empty:continue
  ts=[line.project(Point(p)) for p in part.coords];section=profile.intersection(box(min(ts),-1,max(ts),3))
  for tri in constrained_delaunay_triangles(section).geoms:
   ret.append(([[p0[0]+t*u[0],h,p0[1]+t*u[1]] for t,h in list(tri.exterior.coords)[:3]],[ns[0]]*3))
 return ret,0
updated=[];changed=[];removedRaised=[];oldExterior=[];newExterior=[];oldMark=[]
for m in meshes:
 mi=m.get('sourceMeshIndex');new=empty(m)
 for ti,v,ns in triangles(m):
  if mi in (80,81) and max(p[1] for p in v)>.05:
   poly=projected(v);oldExterior.append(poly.difference(interior));pieces,area=clipraised(v,ns)
   if area>1e-9 or len(pieces)!=1:changed.append({'sourceMesh':mi,'triangle':ti,'removedTopAreaM2':area,'resultTriangles':len(pieces)})
   removedRaised.append(poly.intersection(interior))
   for vv,nn in pieces:add(new,vv,nn);newExterior.append(projected(vv).difference(interior))
  elif mi==79 and ti in (0,1):oldMark.append(projected(v))
  else:add(new,v,ns)
 updated.append(new)
# Reconstruct only first mapped center strip; stop at the union's shared-node
# junction region, never draw a centerline across a merging service entrance.
remainingLine=circle.difference(junction);marking=remainingLine.buffer(.05*factor,cap_style=2).intersection(oldGround)
markmesh=next(m for m in updated if m.get('sourceMeshIndex')==79)
for t in constrained_delaunay_triangles(marking).geoms:add(markmesh,[[x,0,z] for x,z in list(t.exterior.coords)[:3]],[[0,1,0]]*3)
newGround=unary_union([projected(v) for m in updated if m.get('groundEligible',True) for _,v,_ in triangles(m) if projected(v).area>1e-9])
diff=oldGround.symmetric_difference(newGround).area;exteriorDiff=unary_union(oldExterior).symmetric_difference(unary_union(newExterior)).area
assert diff<1e-7,diff
assert exteriorDiff<1e-8,exteriorDiff
assert marking.difference(oldGround).area<1e-9
assert marking.intersection(junction).area<.02 # square-ended line buffer corner precision
assert unary_union(removedRaised).intersection(island).area==0
report={'sourceSHA256':sha(source),'origin':origin,'sourceNode':'428831252','sourceWays':['52057928','1091198031'],'measuredCircleCarriagewayWidthM':circleWidth,'measuredServiceWidthM':serviceWidth,'widthProvenance':'Native converter cross-sections, not surveyed widths','interiorMarginM':.05,'removedRaisedAreaM2':unary_union(removedRaised).area,'changedRaisedTriangles':changed,'oldFirstMarkingAreaM2':unary_union(oldMark).area,'newFirstMarkingAreaM2':marking.area,'coverageDifferenceM2':diff,'exteriorRaisedDifferenceM2':exteriorDiff,'mappedIsland338941369OverlapM2':0,'mappedIsland338941369DistanceM':interior.distance(island),'mappedGarden38318887OverlapM2':0,'newGroundAreaAddedM2':newGround.difference(oldGround).area,'conditionalAccessUnchanged':True,'runtimePromoted':False}
(out/'meshes.json').write_text(json.dumps(updated,separators=(',',':')))
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='changedRaisedTriangles'},indent=2))
