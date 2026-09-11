"""Review-only, source-segment-bounded repair. No runtime assets are written."""
import hashlib,json,math,struct,sys,xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import Point,Polygon,LineString,shape,mapping,box
from shapely.ops import unary_union,transform,triangulate
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
rawpath=ROOT/'experiments/osm2world/coverage-500/meshes.json'
osmfile=ROOT/'vidhana-streets.osm'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(rawpath)=='ca8789d4181bc435398ac6edbab468e6c489e37eaffbef4155dc11c5912c1f3e'
assert sha(osmfile)=='9d4e23f03a19cf4f819d0ca49e42c8a79f9b28458d7e2f76b57a2c75262c0ac8'
origin=[77.59136,12.97984615];factor=2*math.pi*6371008.8/40075016.686
circ=2*math.pi*6371008.8*math.cos(math.radians(origin[1]));my=lambda y:math.asinh(math.tan(math.radians(y)))/(2*math.pi)
def local(x,y,z=None):return ((x-origin[0])*circ/360,(my(y)-my(origin[1]))*circ)
def geo(x,y,z=None):return (origin[0]+x*360/circ,math.degrees(math.atan(math.sinh((y/circ+my(origin[1]))*2*math.pi))))
osm=ET.parse(osmfile).getroot();nodes={n.get('id'):local(float(n.get('lon')),float(n.get('lat'))) for n in osm.findall('node')}
ways={w.get('id'):w for w in osm.findall('way')};tags=lambda e:{t.get('k'):t.get('v') for t in e.findall('tag')}
refs=lambda w:[n.get('ref') for n in w.findall('nd')]
assert refs(ways['52057928'])[:2]==['428831252','663564863']
assert '428831252' in refs(ways['1091198031'])
a,b=[nodes[n] for n in refs(ways['52057928'])[:2]];route=LineString([a,b]);probe=Point(local(77.59020226666667,12.975491600004656))
meshes=json.loads(rawpath.read_text());m=meshes[323]
xyz=lambda n:tuple(m['positions'][n*3+j]*(factor if j!=1 else 1) for j in range(3))
xy=lambda n:(xyz(n)[0],xyz(n)[2])
# Two first triangles form the source service-road strip. Their far cross-section
# supplies width; no guessed lane-width constant or nearest-road ownership rule.
start=[xy(0),xy(1)];end=[xy(2),xy(4)];width=math.dist(*end)
assert abs(width-3.5*factor)<.0001
assert all(abs(xyz(i)[1])<1e-8 for i in range(6))
endmid=tuple((end[0][i]+end[1][i])/2 for i in range(2))
assert math.dist(endmid,b)<.4,'Source mesh cross-section no longer matches source endpoint'
u=((b[0]-a[0])/route.length,(b[1]-a[1])/route.length)
assert abs((end[1][0]-end[0][0])*u[0]+(end[1][1]-end[0][1])*u[1])<.001
nextmid=tuple((xy(8)[i]+xy(10)[i])/2 for i in range(2))
assert math.dist(nextmid,nodes[refs(ways['52057928'])[2]])<.001,'Continuation must match same source way, not merely nearest road'
join=meshes[1074];joinxy={(join['positions'][i]*factor,join['positions'][i+2]*factor) for i in range(0,len(join['positions']),3)}
assert set(start)<=joinxy,'Both service start-cap vertices must be shared with junction mesh1074'
strip=Polygon([start[0],start[1],end[1],end[0]])
ribbon=route.buffer(width/2,cap_style=2)
footpath=ROOT/'experiments/osm2world/coverage-500-classified/asset/vidhana-footprint.geojson'
doc=json.loads(footpath.read_text());ground=unary_union([transform(local,shape(f['geometry'])) for f in doc['features']])
missing=ribbon.difference(ground)
parts=list(missing.geoms) if hasattr(missing,'geoms') else [missing]
# Only connected omission containing the known probe, never a broad hull/fill.
patch=next(p for p in parts if p.covers(probe))
localtris=[];raised=[]
for mi,mesh in enumerate(meshes):
 for ti in range(0,len(mesh['indices']),3):
  ps=[mesh['positions'][n*3:n*3+3] for n in mesh['indices'][ti:ti+3]]
  poly=Polygon([(p[0]*factor,p[2]*factor) for p in ps])
  if poly.area<1e-9 or poly.distance(route)>5:continue
  localtris.append((mi,ti//3,poly,min(p[1] for p in ps),max(p[1] for p in ps)))
  if min(p[1] for p in ps)>.05:raised.append(poly)
raisedground=unary_union(raised)
obstacles=[];barriers=[];nearby=[]
for wid,w in ways.items():
 rr=refs(w)
 if any(n not in nodes for n in rr) or len(rr)<2:continue
 pts=[nodes[n] for n in rr];line=LineString(pts);t=tags(w)
 if line.distance(route)>30:continue
 nearby.append({'way':wid,'tags':t,'distanceM':line.distance(route)})
 if t.get('barrier') in ('kerb','wall','fence','hedge','guard_rail'):barriers.append((wid,line,t))
 if rr[0]==rr[-1] and len(rr)>3 and (t.get('landuse')=='grass' or t.get('natural') in ('water','scrub') or t.get('leisure')=='garden' or 'building' in t or t.get('barrier')=='kerb'):
  obstacles.append((wid,Polygon(pts).buffer(0),t))
float32=lambda v:struct.unpack('<f',struct.pack('<f',v))[0]
tri=[]
for t in triangulate(patch):
 if patch.covers(t.representative_point()):
  assert t.difference(patch).area<1e-8
  points=[(float32(x),float32(y),0.0) for x,y in list(t.exterior.coords)[:3]]
  # Positive Z normal for runtime Z-up sidecar.
  if (points[1][0]-points[0][0])*(points[2][1]-points[0][1])-(points[1][1]-points[0][1])*(points[2][0]-points[0][0])<0:points.reverse()
  tri.extend(v for p in points for v in p)
export=unary_union([Polygon([(tri[i+j],tri[i+j+1]) for j in (0,3,6)]) for i in range(0,len(tri),9)])
repaired=unary_union([ground,export])
overlaps=[{'way':wid,'tags':t,'patchOverlapM2':export.intersection(p).area,'distanceM':export.distance(p)} for wid,p,t in obstacles]
kerbs=[{'way':wid,'tags':t,'patchIntersectionM':export.intersection(p).length,'distanceM':export.distance(p)} for wid,p,t in barriers]
tests={'finiteFloat32':all(math.isfinite(v) for v in tri),'probeCovered':repaired.covers(probe),'sourceRibbonExcursionM2':export.difference(ribbon).area,'existingGroundOverlapM2':export.intersection(ground).area,'raisedSidewalkOverlapM2':export.intersection(raisedground).area,'mappedObstacleOverlapM2':sum(x['patchOverlapM2'] for x in overlaps),'mappedKerbIntersectionM':sum(x['patchIntersectionM'] for x in kerbs),'wholeSourceSegmentUncoveredM':route.difference(repaired).length,'triangulationDifferenceM2':export.symmetric_difference(patch).area}
corridors=[]
for halfwidth in [.95,1.05,1.20665]:
 corridor=route.buffer(halfwidth,cap_style=2)
 corridors.append({'halfWidthM':halfwidth,'uncoveredBeforeM2':corridor.difference(ground).area,'uncoveredAfterM2':corridor.difference(repaired).area,'raisedSidewalkOverlapM2':corridor.intersection(raisedground).area,'mappedObstacleOverlapM2':sum(corridor.intersection(p).area for _,p,_ in obstacles)})
assert tests['probeCovered'] and tests['finiteFloat32']
assert tests['sourceRibbonExcursionM2']<.001 and tests['existingGroundOverlapM2']<.001
assert tests['mappedObstacleOverlapM2']==0 and tests['mappedKerbIntersectionM']==0
assert tests['raisedSidewalkOverlapM2']<.001 and tests['wholeSourceSegmentUncoveredM']<.001
assert tests['triangulationDifferenceM2']<.001
for c in corridors:
 assert c['uncoveredAfterM2']<.0001 and c['mappedObstacleOverlapM2']==0 and c['raisedSidewalkOverlapM2']==0
# Negative controls prove barrier and fill checks reject meaningful failures.
assert patch.intersection(probe.buffer(.2)).area>.1
assert route.buffer(1.05,cap_style=2).difference(ground).area>9
bodychecks=[]
for length,fullwidth in [(4.6,2.1),(5.6829,2.6133)]:
 missingmax=0;obstaclemax=0;raisedmax=0;count=0
 for i in range(math.ceil((route.length-length)/.1)+1):
  d=length/2+min(i*.1,route.length-length);c=route.interpolate(d);v=(-u[1],u[0])
  body=Polygon([(c.x+along*u[0]+side*v[0],c.y+along*u[1]+side*v[1]) for along,side in [(-length/2,-fullwidth/2),(-length/2,fullwidth/2),(length/2,fullwidth/2),(length/2,-fullwidth/2)]])
  missingmax=max(missingmax,body.difference(repaired).area);raisedmax=max(raisedmax,body.intersection(raisedground).area)
  obstaclemax=max(obstaclemax,max((body.intersection(p).area for _,p,_ in obstacles),default=0));count+=1
 assert missingmax<.0001 and raisedmax==0 and obstaclemax==0
 bodychecks.append({'lengthM':length,'widthIncludingMarginsM':fullwidth,'poses':count,'maximumUncoveredAreaM2':missingmax,'maximumObstacleOverlapM2':obstaclemax,'maximumRaisedSidewalkOverlapM2':raisedmax})
out=ROOT/'qc/street-500-gap-repair'
report={'status':'review-only source-derived fill; not route activation or surveyed kerb acceptance','sourceHashes':{'osm':sha(osmfile),'raw':sha(rawpath),'classifiedFootprint':sha(footpath)},'origin':origin,'sourceWay':'52057928','sourceSegment':0,'nodeRefs':refs(ways['52057928'])[:2],'incidentCircularWay':'1091198031','sourceTags':tags(ways['52057928']),'incidentTags':tags(ways['1091198031']),'rawServiceMesh':323,'sourceTriangleIndices':[0,1],'ownershipEvidence':'Hash-pinned geometric attribution: far cap perpendicular to original first segment, center within0.4m of its original end node, contiguous strip matches following source nodes. Converter provides no per-mesh OSM IDs.','widthM':width,'widthProvenance':'Measured converter far cross-section, not surveyed road width','startCapMidpointOffsetFromMappedSharedNodeM':math.dist(tuple((start[0][i]+start[1][i])/2 for i in range(2)),a),'endCapCenterOffsetFromSourceNodeM':math.dist(endmid,b),'beforeGapM':probe.distance(ground),'patchAreaM2':patch.area,'patchTriangles':len(tri)//9,'patchBoundsLngLat':[geo(*patch.bounds[:2]),geo(*patch.bounds[2:])],'tests':tests,'corridors':corridors,'obstacles':overlaps,'kerbs':kerbs,'nearbyWays':nearby}
report['straightBodyChecks']=bodychecks
report['scopeLimit']='Body poses confined to original straight segment. Does not qualify a turning envelope onto restricted circular road, exterior handoff, or real-world surveyed width.'
report['neighborHeightM']=0
out.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
out.with_suffix('.geojson').write_text(json.dumps({'type':'FeatureCollection','features':[{'type':'Feature','properties':{'sourceWay':'52057928','sourceSegment':0,'role':'asphalt','heightM':0,'reviewOnly':True,'widthProvenance':'O2W measured cross-section'},'geometry':mapping(transform(geo,export))}]},indent=2)+'\n')
out.with_name(out.name+'-triangles.json').write_text(json.dumps({'version':1,'origin':origin,'triangles':tri,'reviewOnly':True})+'\n')
# CPU diagnostic drawing. No browser/GPU and no alteration of source photos.
img=Image.new('RGB',(1100,800),'#eee9dc');draw=ImageDraw.Draw(img);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
cx,cy=probe.x,probe.y;scale=25
pixel=lambda p:(550+(p[0]-cx)*scale,420-(p[1]-cy)*scale)
window=box(cx-20,cy-12,cx+20,cy+12)
def paint(g,col):
 for p in ([g] if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if p.geom_type=='Polygon':draw.polygon([pixel(p) for p in p.exterior.coords],fill=col)
for _,_,p,lo,hi in localtris:paint(p.intersection(window),'#a9a69b' if lo>.05 else '#66696a')
paint(export,'#e7a23f')
for _,p,_ in obstacles:paint(p.intersection(window),'#559454')
draw.line([pixel(p) for p in route.coords],fill='#f34949',width=3)
for p in (a,b):
 x,y=pixel(p);draw.ellipse((x-4,y-4,x+4,y+4),fill='white')
draw.text((25,25),'Ringwood source segment0: bounded missing-asphalt candidate',font=font,fill='#172b3c')
draw.text((25,57),f'Orange: {patch.area:.3f} m2 repair. Red: original route. Width {width:.4f} m from O2W cap.',font=font,fill='#172b3c')
draw.text((25,735),'Review only. Mapped grass/kerb and raised sidewalk overlap tested; no runtime road or route changed.',font=font,fill='#172b3c')
img.save(out.with_suffix('.png'))
print(json.dumps({k:report[k] for k in ('patchAreaM2','patchTriangles','tests','corridors')},indent=2))
