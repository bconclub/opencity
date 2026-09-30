"""Source-loop3 single-vehicle fixture; never rewrites runtime graph or curves."""
import ast,json,math,hashlib,sys,xml.etree.ElementTree as ET,struct
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import Polygon,LineString,Point,mapping
from shapely.ops import unary_union,transform
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'qc/street-500-island-route';out.mkdir(exist_ok=True)
source=ROOT/'qc/street-500-loop-audit.py';tree=ast.parse(source.read_text());names={'ROOT','SOURCE','FOOTPRINT','ORIGIN','CIRC','MY'}
keep=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.FunctionDef)) or isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in names for t in n.targets) or isinstance(n,ast.Expr) and isinstance(n.value,ast.Call) and getattr(n.value.func,'attr','')=='insert']
h={'__file__':str(source)};exec(compile(ast.Module(body=keep,type_ignores=[]),str(source),'exec'),h)
features=json.loads(h['SOURCE'].read_text())['features'];states,turns,rejected=h['graph'](features);loops,*_=h['cycles'](states,turns,h['components'](turns))
expected={'338941361','1092049622','763048421','358318638'};loop=next(c for c in loops if {states[k]['properties']['sourceWay'] for k in c}==expected and len(c)==10)
sourcePoints=[states[k]['a'] for k in loop];sourcePoints.append(sourcePoints[0]);sourceLine=LineString(sourcePoints)
for i,k in enumerate(loop):assert states[k]['to']==states[loop[(i+1)%len(loop)]]['from'] and loop[(i+1)%len(loop)] in turns[k]
signed=lambda ps:sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ps,ps[1:]))
rounded=Polygon(sourcePoints).buffer(.5,join_style=2).buffer(-6,resolution=128).buffer(6,resolution=128)
coords=list(rounded.exterior.coords)
if signed(coords)*signed(sourcePoints)<0:coords.reverse()
route=LineString(coords)
corridor=unary_union([LineString([states[k]['a'],states[k]['b']]).buffer(states[k]['properties']['width']/2) for k in loop])
groundpath=ROOT/'qc/street-500-junction-kerb/asset/vidhana-ground.json';grounddoc=json.loads(groundpath.read_text());t=grounddoc['triangles'];faces=[t[i:i+9] for i in range(0,len(t),9)];polys=[Polygon([(v[j],v[j+1]) for j in (0,3,6)]) for v in faces];ground=unary_union(polys);raised=unary_union([p for v,p in zip(faces,polys) if max(v[2::3])>.05])
osmfile=ROOT/'vidhana-streets.osm';osm=ET.parse(osmfile).getroot();nodes={n.get('id'):h['local'](float(n.get('lon')),float(n.get('lat'))) for n in osm.findall('node')};ways={w.get('id'):w for w in osm.findall('way')};tags=lambda w:{t.get('k'):t.get('v') for t in w.findall('tag')};refs=lambda w:[n.get('ref') for n in w.findall('nd')]
island=Polygon([nodes[n] for n in refs(ways['338941369'])]);obstacles=[]
for wid,w in ways.items():
 rr=refs(w);tt=tags(w)
 if len(rr)<4 or rr[0]!=rr[-1] or any(n not in nodes for n in rr):continue
 if tt.get('landuse')=='grass' or tt.get('leisure')=='garden' or tt.get('barrier')=='kerb' or 'building' in tt:
  p=Polygon([nodes[n] for n in rr]).buffer(0)
  if p.distance(route)<10:obstacles.append((wid,p))
count=math.ceil(route.length/.1);bodies=[];centers=[];progress=[];radii=[]
for i in range(count):
 d=i*route.length/count;p=route.interpolate(d);q=route.interpolate((d+.01)%route.length);dx=q.x-p.x;dy=q.y-p.y;n=math.hypot(dx,dy);dx/=n;dy/=n
 centers.append(p);progress.append(sourceLine.project(p));bodies.append(Polygon([(p.x+a*dx-b*dy,p.y+a*dy+b*dx) for a,b in [(2.3,1.05),(2.3,-1.05),(-2.3,-1.05),(-2.3,1.05)]]))
 p0=route.interpolate((d-.2)%route.length);p1=route.interpolate((d+.2)%route.length);aa=p0.distance(p);bb=p.distance(p1);cc=p1.distance(p0);cross=abs((p.x-p0.x)*(p1.y-p0.y)-(p.y-p0.y)*(p1.x-p0.x))
 if cross>1e-10:radii.append(aa*bb*cc/(2*cross))
# Join successive body polygons conservatively, plus2mm numerical swept margin.
sweep=unary_union([b.union(bodies[(i+1)%count]).convex_hull for i,b in enumerate(bodies)]).buffer(.002)
miss=sweep.difference(ground).area;outside=sweep.difference(corridor).area;islandOverlap=sweep.intersection(island).area;raisedOverlap=sweep.intersection(raised).area
assert miss<1e-8,(miss,'off ground');assert outside<1e-8,(outside,'outside source roads');assert islandOverlap==0;assert raisedOverlap<1e-8,(raisedOverlap,'raised kerb')
for wid,p in obstacles:assert sweep.intersection(p).area<1e-8,wid
assert min(radii)>5.2,min(radii)
differences=[(progress[(i+1)%count]-progress[i]+sourceLine.length/2)%sourceLine.length-sourceLine.length/2 for i in range(count)];assert min(differences)>-.002,min(differences)
oldContact=json.loads((ROOT/'qc/street-500-turn-qualification.json').read_text())['islandClearanceFailure'];assert oldContact['totalSweptOverlapM2']>0
assert hashlib.sha256(osmfile.read_bytes()).hexdigest()=='9d4e23f03a19cf4f819d0ca49e42c8a79f9b28458d7e2f76b57a2c75262c0ac8'
for k in loop:
 st=states[k];rr=refs(ways[st['properties']['sourceWay']]);pairs=list(zip(rr,rr[1:]));pair=(st['from'],st['to']);direction=st['properties']['oneway'];assert pair in pairs if direction=='yes' else pair[::-1] in pairs if direction=='-1' else pair in pairs or pair[::-1] in pairs
bad=transform(h['local'],h['shape'](json.loads((ROOT/'qc/street-500-turn-candidate.geojson').read_text())['features'][0]['geometry']));badcount=math.ceil(bad.length/.1);index=oldContact['contactPoses'][0]['pose'];d=index*bad.length/badcount;p=bad.interpolate(d);q=bad.interpolate((d+.02)%bad.length);dx=q.x-p.x;dy=q.y-p.y;n=math.hypot(dx,dy);dx/=n;dy/=n
badbody=Polygon([(p.x+a*dx-b*dy,p.y+a*dy+b*dx) for a,b in [(2.3,1.05),(2.3,-1.05),(-2.3,-1.05),(-2.3,1.05)]])
assert badbody.intersection(island).area>1e-7,'Known unsafe old curve must still fail actual geometry test'
# Isolated graph exposes only this verified source cycle to the fixture vehicle.
# Original legal graph/tags remain untouched. Opposing traffic is not simulated.
selected={k:[loop[(i+1)%len(loop)]] for i,k in enumerate(loop)}
assert len(h['components'](selected))==1
arcs=[{'sourceWay':states[k]['properties']['sourceWay'],'sourceSegment':states[k]['properties']['sourceSegment'],'from':states[k]['from'],'to':states[k]['to'],'oneway':states[k]['properties']['oneway']} for k in loop]
report={'passed':True,'scope':'Single4.6m vehicle fixture,2.1m width includes0.1m side margins; not runtime traffic activation','sourceWays':sorted(expected),'sourceArcs':arcs,'pathLengthM':route.length,'sourceLengthM':sourceLine.length,'offsetM':.5,'roundingRadiusM':6,'sampleSpacingM':route.length/count,'bodyPoses':count,'extraSweptMarginM':.002,'outsideGroundM2':miss,'outsideSourceCorridorsM2':outside,'islandOverlapM2':islandOverlap,'raisedKerbOverlapM2':raisedOverlap,'minimumIslandDistanceM':sweep.distance(island),'minimumMeasuredTurningRadiusM':min(radii),'minimumSourceProgressStepM':min(differences),'oldRejectedCurveIslandOverlapM2':oldContact['totalSweptOverlapM2'],'graph':{'originalDirectedStates':len(states),'originalCycles':len(loops),'fixtureDirectedStates':len(loop),'fixtureCycles':1,'unsupportedBoundaryPortalSegmentsStillExcluded':rejected['unsupported-boundary-portal'],'originalGraphModified':False},'limits':['Rejected old curve remains disabled; replacement uses actual connector1092049622, not relabeled loop2.','Two-way connector legs need exclusive occupancy or separately qualified opposing lanes before multi-NPC activation;0.5m offset is not proof of lane separation.','Vehicle envelopes larger than4.6x2.1m not qualified.','Source width estimates labeled; no new road polygons, nearest-node connections or boundary handoffs.'],'sourceSHA256':hashlib.sha256(osmfile.read_bytes()).hexdigest(),'groundSHA256':hashlib.sha256(groundpath.read_bytes()).hexdigest()}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
(out/'candidate.geojson').write_text(json.dumps({'type':'FeatureCollection','features':[{'type':'Feature','properties':{'sourceCycleWays':sorted(expected),'singleVehicleOnly':True,'oldCurveEnabled':False},'geometry':mapping(transform(lambda x,y:h['geo'](x,y),route))}]})+'\n')
(out/'graph-fixture.json').write_text(json.dumps({'arcs':arcs,'oldRejectedCurveEnabled':False,'multiVehicleEnabled':False,'boundaryPortalsEnabled':False},indent=2)+'\n')
portals=json.loads((ROOT/'qc/street-500-route-audit.json').read_text())['boundaryPortals488m'];district=json.loads((ROOT/'district-data.json').read_text());transport=[f for f in district['features'] if f['properties'].get('_layer')=='transportation']
def portal_identity(p):return(p['sourceWay'],p['sourceSegment'],tuple(p['sourceNodes']),p['fraction'])
fixture=portals[0];other={**fixture,'sourceNodes':['unrelated','same-position']}
assert portal_identity(fixture)==portal_identity(dict(fixture));assert portal_identity(fixture)!=portal_identity(other)
assert all(0<p['fraction']<1 for p in portals)
splice={'portals':len(portals),'districtTransportationFeatures':len(transport),'districtFeaturesWithSourceWayAndNodes':sum('sourceWay' in f['properties'] and 'sourceNodes' in f['properties'] for f in transport),'sourceIdentityPositiveFixture':True,'sameCoordinatesDifferentNodesRejected':True,'openedPortals':0,'status':'Independent blocker: district vectors lack source way/node provenance,488m geometric cut plus1.5m node rounding cannot prove handoff. Keep all22 external portals closed; this isolated loop needs none.'}
(out/'splice-audit.json').write_text(json.dumps(splice,indent=2)+'\n')
from PIL import Image,ImageDraw,ImageFont
img=Image.new('RGB',(1100,900),'#ebe7dc');draw=ImageDraw.Draw(img);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18);bounds=corridor.bounds;scale=min(900/(bounds[2]-bounds[0]),700/(bounds[3]-bounds[1]));cx=(bounds[0]+bounds[2])/2;cy=(bounds[1]+bounds[3])/2
pixel=lambda p:(550+(p[0]-cx)*scale,490-(p[1]-cy)*scale)
def paint(g,color):
 for p in ([g] if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if p.geom_type=='Polygon':
   draw.polygon([pixel(v) for v in p.exterior.coords],fill=color)
   for ring in p.interiors:draw.polygon([pixel(v) for v in ring.coords],fill='#ebe7dc')
paint(corridor,'#999f9e');paint(sweep,'#b7cec0');paint(island,'#649252');draw.line([pixel(p) for p in route.coords],fill='#18697c',width=3)
for k in loop:
 s=states[k];a,b=s['a'],s['b'];draw.line([pixel(a),pixel(b)],fill='#565b5c',width=1)
for i in (0,count//4,count//2,3*count//4):draw.polygon([pixel(p) for p in bodies[i].exterior.coords],outline='#172b3c',width=2)
draw.text((25,20),'Source-connected loop3: single-vehicle swept fixture',font=font,fill='#172b3c');draw.text((25,48),'Mapped connector1092049622; green island338941369 remains untouched.',font=font,fill='#172b3c');draw.text((25,76),'Light band: complete body sweep plus2mm. Source-road ribbons grey. Not multi-NPC qualification.',font=font,fill='#172b3c');img.save(out/'fixture.png')
print(json.dumps({k:v for k,v in report.items() if k not in ('sourceArcs','limits')},indent=2))
