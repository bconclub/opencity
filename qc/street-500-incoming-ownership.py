"""Shared static/dynamic surface ownership, with a source-contiguous basic arc."""
import sys,json,math,hashlib,xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import Polygon,LineString,Point,shape,mapping
from shapely.ops import unary_union,transform
from shapely import set_precision
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qc/street-500-incoming-junction';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
origin=[77.59136000000001,12.97984615];c=2*math.pi*6371008.8*math.cos(math.radians(origin[1]));my=lambda lat:math.asinh(math.tan(math.radians(lat)))/(2*math.pi)
local=lambda x,y,z=None:((x-origin[0])*c/360,(my(y)-my(origin[1]))*c)
geo=lambda x,y,z=None:(origin[0]+x*360/c,math.degrees(math.atan(math.sinh((y/c+my(origin[1]))*2*math.pi))))
xml=ET.parse(OUT/'source.osm').getroot();nodes={n.get('id'):local(float(n.get('lon')),float(n.get('lat'))) for n in xml.findall('node')};ways={w.get('id'):w for w in xml.findall('way')};refs=lambda w:[n.get('ref') for n in w.findall('nd')]
a=refs(ways['38542917']);b=refs(ways['1091198032']);assert a[-1]==b[0]=='428831267'
line=LineString([nodes[n] for n in a+b[1:]])
# Same converter-derived carriageway width as two-lane circle arms. Not surveyed.
width=7.1*(2*math.pi*6371008.8/40075016.686)
full=set_precision(line.buffer(width/2,cap_style=2,join_style=1,quad_segs=16),1e-6)
footDoc=json.loads((OUT/'asset/vidhana-footprint.geojson').read_text())
foot=set_precision(unary_union([transform(local,shape(f['geometry'])) for f in footDoc['features']]),1e-6)
centre=Point(local(77.5908,12.9798));circle=Polygon([(centre.x+500*math.cos(i*math.pi*2/256),centre.y+500*math.sin(i*math.pi*2/256)) for i in range(256)])
arc=full.difference(circle).difference(foot)
assert not arc.is_empty
# Preserve source gardens/island and explicit crossings; never add geometry across them.
protected=unary_union([Polygon([nodes[n] for n in refs(ways[w])]) for w in ['338941369','38318887']])
assert arc.intersection(protected).area<1e-8
assert arc.difference(full).area<1e-8
base=json.loads((OUT/'candidate-surfaces.json').read_text())
arcFeature={'type':'Feature','properties':{'kind':'road','osm':'way/38542917 + way/1091198032','surface':'asphalt','width':width,'widthEstimated':True,'basicSourceArc':True,'routingEnabled':False},'geometry':mapping(transform(geo,arc))}
(OUT/'basic-arc.geojson').write_text(json.dumps(arcFeature))
static={**base,'features':base['features']+[arcFeature]};(OUT/'shared-static-surfaces.json').write_text(json.dumps(static,separators=(',',':')))
mask=foot.union(arc);outer=mask.buffer(.000003);inner=mask.buffer(-.000003);counts={};outputs={}
for label in ['auto','detail']:
 source=OUT/(label+'-surfaces-source.json');doc=json.loads(source.read_text());features=[];changed=[];patches=[];beforeArea=afterArea=0
 for index,f in enumerate(doc['features']):
  p=set_precision(transform(local,shape(f['geometry'])),1e-6)
  # Original auto filter hides vidhana=true features; preserve that contract.
  if label=='auto' and f['properties'].get('vidhana'):features.append(f);continue
  q=p.difference(mask);removed=p.area-q.area;beforeArea+=p.area;afterArea+=q.area
  assert p.difference(q).difference(outer).area<1e-8
  assert q.intersection(inner).area<1e-8
  if removed>1e-9:changed.append({'index':index,'removedM2':removed,'kind':f['properties'].get('kind'),'empty':q.is_empty})
  if q.is_empty:patches.append([index,None])
  elif q.equals(p):features.append(f)
  else:
   geometry=mapping(transform(geo,q));features.append({**f,'geometry':geometry});patches.append([index,geometry])
 target=OUT/(label+'-surfaces-owned.json');target.write_text(json.dumps({**doc,'features':features},separators=(',',':')))
 (OUT/(label+'-surface-patches.json')).write_text(json.dumps(patches,separators=(',',':')))
 counts[label]={'beforeFeatures':len(doc['features']),'afterFeatures':len(features),'removedSummedOverlapM2':beforeArea-afterArea,'changes':changed,'sourceSHA256':sha(source),'ownedSHA256':sha(target)}
 outputs[label]=str(target.relative_to(ROOT))
report={'passed':True,'sourceWays':['38542917','1091198032'],'sharedNode':'428831267','widthM':width,'widthProvenance':'7.1 m native converter estimate, scaled once to map metre frame; not surveyed',
 'basicArcAreaM2':arc.area,'basicArcMaximumRadiusM':max(Point(p).distance(centre) for g in ([arc] if arc.geom_type=='Polygon' else arc.geoms) for p in g.exterior.coords),'basicArcNativeOverlapM2':arc.intersection(foot).area,
 'protectedAreaOverlapM2':arc.intersection(protected).area,'detailedGeometryRadiusM':500,'ownership':counts,'outputs':outputs,'graphChanged':False,'conditionalMotorAccessEnabled':False,'runtimePromoted':False}
(OUT/'ownership-audit.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='ownership'},indent=2));print({k:{x:y for x,y in v.items() if x!='changes'} for k,v in counts.items()})
