"""Qualify offline refined curve against cached OSM ownership and restrictions."""
import ast,collections,hashlib,json,math,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'qc/street-500-loop-audit.py';tree=ast.parse(source.read_text())
names={'ROOT','SOURCE','FOOTPRINT','ORIGIN','CIRC','MY'}
keep=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.FunctionDef)) or
      isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in names for t in n.targets) or
      isinstance(n,ast.Expr) and isinstance(n.value,ast.Call) and getattr(n.value.func,'attr','')=='insert']
h={'__file__':str(source)};exec(compile(ast.Module(body=keep,type_ignores=[]),str(source),'exec'),h)
from shapely.geometry import Point,LineString,Polygon,shape
from shapely.ops import transform,unary_union
source_features=json.loads(h['SOURCE'].read_text())['features']
states,turns,_=h['graph'](source_features);loops,*_=h['cycles'](states,turns,h['components'](turns))
candidate_path=transform(h['local'],shape(json.loads((ROOT/'qc/street-500-turn-candidate.geojson').read_text())['features'][0]['geometry']))
osm=ET.parse(ROOT/'vidhana-streets.osm').getroot()
nodes={n.get('id'):n for n in osm.findall('node')}
ways={w.get('id'):w for w in osm.findall('way')}
tags=lambda e:{t.get('k'):t.get('v') for t in e.findall('tag')}
node_point=lambda n:h['local'](float(nodes[n].get('lon')),float(nodes[n].get('lat')))
way_points=lambda w:[node_point(n.get('ref')) for n in w.findall('nd') if n.get('ref') in nodes]
def road_corridor(lid):
 return unary_union([LineString([states[k]['a'],states[k]['b']]).buffer(states[k]['properties']['width']/2) for k in loops[lid]])
corridors={i:road_corridor(i) for i in (2,3)}
roads=[];areas=[];controls=[]
for wid,w in ways.items():
 pts=way_points(w);t=tags(w)
 if len(pts)<2:continue
 line=LineString(pts)
 if line.distance(candidate_path)>30:continue
 if t.get('highway') in ('tertiary','primary','secondary','service','unclassified','footway'):
  roads.append({'id':wid,'tags':t,'line':line,'refs':[n.get('ref') for n in w.findall('nd')]})
 if pts[0]==pts[-1] and len(pts)>=4:
  geom=Polygon(pts).buffer(0)
  areas.append({'id':wid,'tags':t,'polygon':geom})
for nid,n in nodes.items():
 t=tags(n)
 if t.get('highway') in ('stop','traffic_signals','crossing','give_way'):
  p=Point(node_point(nid))
  if p.distance(candidate_path)<40:controls.append({'id':nid,'tags':t,'point':p})
restrictions=[{'id':r.get('id'),'tags':tags(r),'members':[dict(m.attrib) for m in r.findall('member')]} for r in osm.findall('relation') if tags(r).get('type')=='restriction']
count=math.ceil(candidate_path.length/.1);poses=[];all_bodies=[]
for k in range(count):
 d=k*candidate_path.length/count;p=candidate_path.interpolate(d);q=candidate_path.interpolate((d+.02)%candidate_path.length)
 dx,dy=q.x-p.x,q.y-p.y;length=math.hypot(dx,dy);dx/=length;dy/=length
 body=Polygon([(p.x+f*dx-s*dy,p.y+f*dy+s*dx) for f,s in [(2.3,1.05),(2.3,-1.05),(-2.3,-1.05),(-2.3,1.05)]])
 all_bodies.append(body)
 outside={str(lid):body.difference(corridor).area for lid,corridor in corridors.items()}
 if outside['2']>.0001:
  nearest=sorted(roads,key=lambda road:road['line'].distance(p))[:3]
  overlaps=[{'way':a['id'],'areaM2':body.intersection(a['polygon']).area,'tags':a['tags']} for a in areas if body.intersection(a['polygon']).area>.0001]
  poses.append({'index':k,'distanceAlongM':d,'lngLat':h['geo'](p.x,p.y),'outsideEstimatedCorridorM2':outside,
   'nearestSourceWays':[{'id':road['id'],'distanceM':road['line'].distance(p),'tags':road['tags']} for road in nearest],
   'mappedAreaOverlaps':overlaps})
swept=unary_union(all_bodies)
island=next(a for a in areas if a['id']=='338941369')
island_contacts=[];body_without_margin=[]
for k,body in enumerate(all_bodies):
 overlap=body.intersection(island['polygon'])
 if overlap.area>.0000001:
  coords=[]
  parts=[overlap] if overlap.geom_type=='Polygon' else list(getattr(overlap,'geoms',[]))
  for part in parts:
   if part.geom_type=='Polygon':coords.extend(part.exterior.coords)
  d=k*candidate_path.length/count;p=candidate_path.interpolate(d)
  island_contacts.append({'pose':k,'lngLat':h['geo'](p.x,p.y),'overlapM2':overlap.area,
    'maxVertexPenetrationM':max((Point(v).distance(island['polygon'].boundary) for v in coords),default=0)})
  q=candidate_path.interpolate((d+.02)%candidate_path.length);dx,dy=q.x-p.x,q.y-p.y;length=math.hypot(dx,dy);dx/=length;dy/=length
  bare=Polygon([(p.x+f*dx-s*dy,p.y+f*dy+s*dx) for f,s in [(2.3,.95),(2.3,-.95),(-2.3,-.95),(-2.3,.95)]])
  body_without_margin.append(bare.intersection(island['polygon']).area)
relevant_ids={states[k]['properties']['sourceWay'] for lid in (2,3) for k in loops[lid]}
report={'candidatePoses':count,'outsideOriginalLoop2RibbonPoses':len(poses),
 'outsideAlternativeLoop3RibbonPoses':sum(b.difference(corridors[3]).area>.0001 for b in all_bodies),
 'nearestRoadAtOriginalRibbonFailures':dict(collections.Counter(p['nearestSourceWays'][0]['id'] for p in poses)),
 'loops':{str(lid):[{'way':states[k]['properties']['sourceWay'],'segment':states[k]['properties']['sourceSegment'],
     'from':states[k]['from'],'to':states[k]['to'],'oneway':states[k]['properties']['oneway']} for k in loops[lid]] for lid in (2,3)},
 'relevantWays':[{'id':wid,'tags':tags(ways[wid]),'refs':[n.get('ref') for n in ways[wid].findall('nd')]} for wid in sorted(relevant_ids)],
 'mappedAreas':[{'id':a['id'],'tags':a['tags'],'sweptBodyOverlapM2':swept.intersection(a['polygon']).area} for a in areas],
 'nearbyMappedControls':[{'id':c['id'],'tags':c['tags'],'distanceToCandidateM':c['point'].distance(candidate_path),'distanceToSweptBodyM':c['point'].distance(swept)} for c in controls],
 'cachedRestrictions':restrictions,'restrictionsTouchingEitherLoop':[r for r in restrictions if any(m.get('type')=='way' and m.get('ref') in relevant_ids for m in r['members'])],
 'failurePoses':poses,'osmSha256':hashlib.sha256((ROOT/'vidhana-streets.osm').read_bytes()).hexdigest(),
 'runtimeChanged':False,'geometryChanged':False,'limitations':'OSM snapshot only; absence of a restriction is not proof no real-world restriction exists.'}
report['islandClearanceFailure']={'responsibleWay':'338941369','tags':island['tags'],
  'sourceNodes':[n.get('ref') for n in ways['338941369'].findall('nd')],
  'contactPoses':island_contacts,'totalSweptOverlapM2':swept.intersection(island['polygon']).area,
  'bareVehicleOverlapMaxM2':max(body_without_margin,default=0),
  'classification':'Required0.1m lateral margin violates mapped kerbed island; reject current candidate.'}
report['crossingWays']=[{'id':r['id'],'tags':r['tags'],'distanceToSweptBodyM':r['line'].distance(swept)} for r in roads if r['tags'].get('footway')=='crossing']
report['ownershipGroups']=[{'nearestWay':wid,'poseCount':len(ps),'firstPose':ps[0]['index'],'lastPose':ps[-1]['index'],
  'firstLngLat':ps[0]['lngLat'],'lastLngLat':ps[-1]['lngLat'],
  'maxCenterDistanceToSourceLineM':max(p['nearestSourceWays'][0]['distanceM'] for p in ps),
  'classification':'Unverified widened junction ownership; nearest-way proximity alone is not a source assignment.'}
 for wid in sorted({p['nearestSourceWays'][0]['id'] for p in poses})
 for ps in [[p for p in poses if p['nearestSourceWays'][0]['id']==wid]]]
report['qualification']='REJECTED for current required clearance; junction ownership additionally unverified. No runtime integration.'
(ROOT/'qc/street-500-turn-qualification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('failurePoses','loops','relevantWays','cachedRestrictions')},indent=2))
