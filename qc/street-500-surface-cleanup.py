"""Intersection-only estimated-surface cleanup; no native road geometry edits."""
import json,math,hashlib,sys
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import shape,mapping,Polygon,Point
from shapely.ops import unary_union,transform
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'qc/street-500-surface-cleanup';out.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
scene=ROOT/'qc/street-500-gap-scene';manifest=json.loads((scene/'manifest.json').read_text());source=scene/'candidate-surfaces.json'
expected=next(f['sha256'] for f in manifest['variants']['candidate'] if f['path']=='vidhana-street-data.json');assert sha(source)==expected
origin=[77.59136000000001,12.97984615];circ=2*math.pi*6371008.8*math.cos(math.radians(origin[1]));my=lambda y:math.asinh(math.tan(math.radians(y)))/(2*math.pi)
def local(x,y,z=None):return ((x-origin[0])*circ/360,(my(y)-my(origin[1]))*circ)
def geo(x,y,z=None):return (origin[0]+x*360/circ,math.degrees(math.atan(math.sinh((y/circ+my(origin[1]))*2*math.pi))))
probe=Point(local(77.59020226666667,12.975491600004656));window=probe.buffer(18,resolution=64)
groundpath=ROOT/'qc/street-500-gap-export/asset/vidhana-ground.json';grounddoc=json.loads(groundpath.read_text());assert grounddoc['origin']==origin
t=grounddoc['triangles'];ground=unary_union([Polygon([(t[i+j],t[i+j+1]) for j in (0,3,6)]) for i in range(0,len(t),9)])
owned=ground.intersection(window);doc=json.loads(source.read_text());features=[];evidence=[];removed=[];remnants=[]
for i,f in enumerate(doc['features']):
 if f['properties']['kind'] not in ('road','footpath','lane'):
  features.append(f);continue
 original=transform(local,shape(f['geometry']));near=original.intersection(window)
 if near.is_empty:features.append(f);continue
 overlap=original.intersection(owned);clean=original.difference(owned)
 assert overlap.difference(ground).area<1e-10
 assert clean.symmetric_difference(original).difference(window).area<1e-10
 assert clean.intersection(owned).area<1e-10
 evidence.append({'featureIndex':i,'properties':f['properties'],'areaWithin18mM2':near.area,'removedOwnedOverlapM2':overlap.area,'retainedUnownedAreaM2':near.difference(ground).area,'nearestProbeM':near.distance(probe)})
 if overlap.area>0:
  removed.append(overlap);f={**f,'geometry':mapping(transform(geo,clean))}
 features.append(f);remnants.append((f['properties'].get('osm'),near.difference(ground)))
# Classify local raw-converter triangles by measured height, not guessed object labels.
rawpath=ROOT/'experiments/osm2world/coverage-500/meshes.json';assert sha(rawpath)=='ca8789d4181bc435398ac6edbab468e6c489e37eaffbef4155dc11c5912c1f3e'
factor=2*math.pi*6371008.8/40075016.686;raw=json.loads(rawpath.read_text());native=[]
for mi,m in enumerate(raw):
 for j in range(0,len(m['indices']),3):
  ps=[m['positions'][n*3:n*3+3] for n in m['indices'][j:j+3]];poly=Polygon([(p[0]*factor,p[2]*factor) for p in ps])
  if poly.distance(probe)>18:continue
  edges=[math.dist(poly.exterior.coords[k],poly.exterior.coords[k+1]) for k in range(3)];long=max(edges)
  native.append({'mesh':mi,'triangle':j//3,'color':m['color'],'heightMin':min(p[1] for p in ps),'heightMax':max(p[1] for p in ps),'projectedAreaM2':poly.area,'minimumProjectedAltitudeM':2*poly.area/long if long else 0,'coordinates':[(p[0]*factor,p[2]*factor,p[1]) for p in ps]})
raised=[x for x in native if x['heightMax']>.05];thin=[x for x in native if x['minimumProjectedAltitudeM']<.16]
total=sum(e['removedOwnedOverlapM2'] for e in evidence)
assert total<.00001,'Unexpected substantial ownership overlap, repeat audit before emitting cleanup'
# All other semantic features remain byte-equivalent JSON objects.
for i,f in enumerate(doc['features']):
 if f['properties']['kind'] not in ('road','footpath','lane'):assert features[i]==f
report={'sourceCommitRequested':'daf95fdfa60839638df72348d3d7f569a5535fd8','frozenSceneSourceHead':manifest['sourceHead'],'sourceSurfaceSHA256':sha(source),'groundSHA256':sha(groundpath),'windowRadiusM':18,'probe':[77.59020226666667,12.975491600004656],'changedGeometry':'Only estimated road/footpath/lane intersections with exact repaired ground within18m; native mesh unchanged','removedAreaM2SumAcrossFeatures':total,'features':evidence,'rawNativeTriangles':native,'nativeRaisedTriangleCount':len(raised),'nativeThinTriangleCount':len(thin),'nativeRaisedMeshIndices':sorted(set(x['mesh'] for x in raised)),'tests':{'removalContainedByGround':True,'noChangesOutsideWindow':True,'remainingOwnedOverlapBelow1e10M2':True,'nonRoadFeaturesUnchanged':True,'runtimeUntouched':True},'verdict':'No meaningful overlapping estimated surface remains. Numerical-only cleanup cannot remove visible grey remnant or native tapered triangles. Broader cleanup is blocked by source ownership, not by missing subtraction code.'}
(out/'candidate-surfaces.json').write_text(json.dumps({**doc,'features':features},separators=(',',':')))
(out/'audit.json').write_text(json.dumps(report,indent=2)+'\n')
fc={'type':'FeatureCollection','features':[{'type':'Feature','properties':{'osm':osm,'role':'retained-outside-ground'},'geometry':mapping(transform(geo,g))} for osm,g in remnants]}
(out/'retained-remnants.geojson').write_text(json.dumps(fc)+'\n')
im=Image.new('RGB',(1000,1000),'#e7e1d5');draw=ImageDraw.Draw(im);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',19);s=23;pixel=lambda p:(500+(p[0]-probe.x)*s,520-(p[1]-probe.y)*s)
def paint(g,col):
 for p in ([g] if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if p.geom_type=='Polygon':draw.polygon([pixel(x) for x in p.exterior.coords],fill=col)
paint(owned,'#454b50')
for _,g in remnants:paint(g,'#df944b')
for x in raised:
 poly=Polygon([(p[0],p[1]) for p in x['coordinates']]);paint(poly.intersection(window),'#9297b9')
draw.text((25,20),'18m probe window: source ownership, no guessed road expansion',font=font,fill='#172b3c')
draw.text((25,52),'Dark: O2W ground. Orange: estimated remnants OUTSIDE ground.',font=font,fill='#172b3c')
draw.text((25,84),'Purple: native converter faces with height above5cm.',font=font,fill='#172b3c')
draw.ellipse((495,515,505,525),fill='red');draw.text((25,955),f'Allowed overlap removal only {total:.9f} m2; visible remnants cannot be erased.',font=font,fill='#172b3c');im.save(out/'ownership.png')
print(json.dumps({k:report[k] for k in ('removedAreaM2SumAcrossFeatures','nativeRaisedTriangleCount','nativeThinTriangleCount','nativeRaisedMeshIndices','verdict')},indent=2))

# Recommended alternative: preserve coverage, match explicitly tagged asphalt.
# This is display-only geometry; it never enters the O2W ground index.
import xml.etree.ElementTree as ET
from shapely import constrained_delaunay_triangles
osm=ET.parse(ROOT/'vidhana-streets.osm').getroot();way=next(w for w in osm.findall('way') if w.get('id')=='1091198031');tags={x.get('k'):x.get('v') for x in way.findall('tag')}
assert tags['surface']=='asphalt' and 'motor_vehicle:conditional' in tags
circle=unary_union([transform(local,shape(f['geometry'])) for f in doc['features'] if f['properties'].get('osm')=='way/1091198031' and f['properties']['kind']=='road'])
replacement=circle.intersection(window).difference(ground)
display=[];before=[];after=[];replaced=[]
for i,f in enumerate(doc['features']):
 if f['properties']['kind']!='road':display.append(f);continue
 p=transform(local,shape(f['geometry']));before.append(p)
 # Remove any underlying estimated road duplicates only beneath exact replacement.
 q=p.difference(replacement);after.append(q)
 if p.intersection(replacement).area>1e-10:replaced.append({'index':i,'osm':f['properties'].get('osm'),'areaM2':p.intersection(replacement).area})
 if not q.is_empty:display.append({**f,'geometry':mapping(transform(geo,q))})
coverage=unary_union(before).symmetric_difference(unary_union(after+[replacement])).area
assert coverage<1e-8 and replacement.difference(circle).area<1e-9 and replacement.intersection(ground).area<1e-9
values=[]
for tr in constrained_delaunay_triangles(replacement).geoms:
 pts=list(tr.exterior.coords)[:3]
 if (pts[1][0]-pts[0][0])*(pts[2][1]-pts[0][1])-(pts[1][1]-pts[0][1])*(pts[2][0]-pts[0][0])<0:pts.reverse()
 values.extend(v for x,y in pts for v in (x,y,0))
candidate={'origin':origin,'role':'asphalt','sourceWay':'1091198031','sourceTags':tags,'groundEligible':False,'triangles':values,'note':'Display-only replacement of existing estimated polygon; no new ground coverage or routing permission'}
(out/'asphalt-material-triangles.json').write_text(json.dumps(candidate)+'\n')
(out/'asphalt-material-surfaces.json').write_text(json.dumps({**doc,'features':display},separators=(',',':')))
(out/'asphalt-material-region.geojson').write_text(json.dumps({'type':'Feature','properties':{'sourceWay':'1091198031','surface':'asphalt','displayOnly':True},'geometry':mapping(transform(geo,replacement))})+'\n')
(out/'asphalt-material-report.json').write_text(json.dumps({'recommended':True,'areaM2':replacement.area,'triangles':len(values)//9,'changedFeatures':replaced,'sourceTags':tags,'coverageSymmetricDifferenceM2':coverage,'overlapNativeGroundM2':replacement.intersection(ground).area,'groundIndexChanged':False,'nativeKerbsChanged':False,'unknownSurfaceOutsideCircleUnchanged':True,'visualTestPending':True},indent=2)+'\n')
import struct
rounded=[struct.unpack('<f',struct.pack('<f',v))[0] for v in values]
actual=unary_union([Polygon([(rounded[i+j],rounded[i+j+1]) for j in (0,3,6)]) for i in range(0,len(rounded),9)])
delta=actual.symmetric_difference(replacement).area;assert delta<.001
materialdir=ROOT/'qc/street-500-material-scene';materialdir.mkdir(exist_ok=True)
(materialdir/'float32-test.json').write_text(json.dumps({'passed':True,'triangles':len(rounded)//9,'float32RegionDifferenceM2':delta,'maxHeight':max(rounded[2::3]),'newGroundTriangles':0},indent=2))
