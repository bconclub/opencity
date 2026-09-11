import xml.etree.ElementTree as E, math,json,collections
from pathlib import Path
origin=(77.5908,12.9798);mx=111320*math.cos(math.radians(origin[1]));radius=500
def local(p):return((p[0]-origin[0])*mx,(p[1]-origin[1])*111320)
def geo(p):return[origin[0]+p[0]/mx,origin[1]+p[1]/111320]
def tags(e):return{t.get('k'):t.get('v') for t in e.findall('tag')}
def clip(a,b):
 dx,dy=b[0]-a[0],b[1]-a[1];A=dx*dx+dy*dy
 if A<.01:return None
 B=2*(a[0]*dx+a[1]*dy);C=a[0]*a[0]+a[1]*a[1]-(radius-12)**2;D=B*B-4*A*C
 if D<0:return None
 lo=max(0,(-B-math.sqrt(D))/(2*A));hi=min(1,(-B+math.sqrt(D))/(2*A))
 if lo>=hi:return None
 return((a[0]+lo*dx,a[1]+lo*dy),(a[0]+hi*dx,a[1]+hi*dy))

MOTOR_HIGHWAYS = frozenset(('primary', 'primary_link', 'secondary', 'secondary_link',
                          'tertiary', 'tertiary_link', 'residential', 'unclassified', 'service'))

def surface_eligibility(t):
 # Raised/underground surfaces require their own vertical route and collision graph.
 if t.get('brunnel') in ('bridge', 'tunnel'): return False, 'brunnel'
 for key in ('bridge', 'tunnel'):
  if str(t.get(key, 'no')).lower() not in ('no', 'false', '0', ''):
   return False, key
 try:
  if float(t.get('layer', '0')) != 0: return False, 'layer'
 except (TypeError, ValueError): return False, 'invalid-layer'
 return True, 'surface'

def motor_route_eligibility(t):
 """Conservative public motor-traffic eligibility; does not remove visible roads."""
 if t.get('highway') not in MOTOR_HIGHWAYS: return False, 'non-motor-highway'
 eligible, reason = surface_eligibility(t)
 if not eligible: return eligible, reason
 # Schedules and reversible roads need a clock-aware routing implementation first.
 if any(k in t for k in ('access:conditional', 'vehicle:conditional', 'motor_vehicle:conditional',
                         'motorcar:conditional', 'oneway:conditional')):
  return False, 'conditional-unimplemented'
 for key in ('motorcar', 'motor_vehicle', 'vehicle', 'access'):
  if key not in t: continue
  value = str(t[key]).lower().strip()
  if value not in ('yes', 'permissive', 'designated'):
   return False, 'restricted-' + key + ':' + value
  break  # OSM specific motorcar permission overrides general access restrictions.
 if normalise_oneway(t) is None: return False, 'unsupported-oneway'
 return True, 'public-motor-road'

def normalise_oneway(t):
 value = str(t.get('oneway', 'yes' if t.get('junction') == 'roundabout' else 'no')).lower()
 if value in ('yes', 'true', '1'): return 'yes'
 if value in ('-1', 'reverse'): return '-1'
 if value in ('no', 'false', '0'): return 'no'
 return None

def source_segments(refs, node_map):
 """Never create an edge across a missing OSM node or reorder source node pairs."""
 for index, (a, b) in enumerate(zip(refs, refs[1:])):
  if a in node_map and b in node_map:
   yield index, a, b, node_map[a], node_map[b]

def route_metadata(t, way_id, index, start_ref, end_ref, source_a, source_b, a, b):
 dx, dy = source_b[0] - source_a[0], source_b[1] - source_a[1]
 length2 = dx * dx + dy * dy
 fraction = lambda p: ((p[0] - source_a[0]) * dx + (p[1] - source_a[1]) * dy) / length2
 # Identity survives clipping. Adjacent source segments join through their node IDs;
 # boundary portals join only to the same way, source pair and interpolation fraction.
 return {**{k: t[k] for k in ('highway', 'access', 'vehicle', 'motor_vehicle', 'motorcar',
          'bridge', 'tunnel', 'layer', 'junction', 'service') if k in t},
         'oneway': normalise_oneway(t), 'sourceWay': str(way_id), 'sourceSegment': index,
         'sourceNodes': [start_ref, end_ref], 'sourceFractions': [fraction(a), fraction(b)]}

def main():
 r=E.parse('vidhana-streets.osm').getroot()
 nodes={n.get('id'):(float(n.get('lon')),float(n.get('lat'))) for n in r.findall('node')}
 features=[];network=[];roads=[];counts=collections.Counter();seen=set()
 def poly(c,kind,props):
  features.append({'type':'Feature','properties':{'kind':kind,**props},'geometry':{'type':'Polygon','coordinates':[[geo(p) for p in c+[c[0]]]]}})
 def strip(a,b,width,kind,props):
  dx,dy=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dy)
  if L<.01:return
  nx,ny=-dy/L*width/2,dx/L*width/2
  poly([(a[0]+nx,a[1]+ny),(b[0]+nx,b[1]+ny),(b[0]-nx,b[1]-ny),(a[0]-nx,a[1]-ny)],kind,props)
 for w in r.findall('way'):
  t=tags(w);h=t.get('highway');foot=h in ('footway','path','pedestrian','cycleway');road=h in MOTOR_HIGHWAYS
  if not(foot or road) or not surface_eligibility(t)[0]:continue
  motor, motor_reason = motor_route_eligibility(t)
  if foot and t.get('footway')=='crossing':continue
  refs=[n.get('ref') for n in w.findall('nd')]
  try:lanes=int(t.get('lanes','0'));width=float(t.get('width','').split()[0])
  except (ValueError,IndexError):
   try:lanes=int(t.get('lanes','0'))
   except ValueError:lanes=0
   width=(max(3,lanes*3.2) if lanes else {'primary':9,'secondary':7,'tertiary':6,'service':4}.get(h,5)) if road else 1.8
  props={'osm':'way/'+w.get('id'),'name':t.get('name',''),'surface':t.get('surface','unknown'),'width':width,'widthEstimated':'width' not in t,'lanes':lanes,'note':t.get('note',''),'oneway':t.get('oneway','yes' if t.get('junction')=='roundabout' else 'no')}
  used=False
  for source_index, start_ref, end_ref, source_geo_a, source_geo_b in source_segments(refs, nodes):
   source_a, source_b = local(source_geo_a), local(source_geo_b)
   segment=clip(source_a,source_b)
   if not segment:continue
   a,b=segment;strip(a,b,width,'road' if road else 'footpath',props);used=True
   if road:
    if motor:
     metadata = route_metadata(t, w.get('id'), source_index, start_ref, end_ref, source_a, source_b, a, b)
     network.append({'type':'Feature','properties':{**props,**metadata,'_layer':'transportation','class':{'residential':'minor','unclassified':'minor','primary_link':'primary','secondary_link':'secondary','tertiary_link':'tertiary'}.get(h,h)},'geometry':{'type':'LineString','coordinates':[geo(a),geo(b)]}})
    else: counts['excludedMotorSegments:'+motor_reason]+=1
    roads.append((a,b,width,props,refs));dx,dy=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dy)
    # Round joins keep road ribbons continuous at mapped junctions.
    for q in [a,b]:poly([(q[0]+math.cos(k*math.pi/8)*width/2,q[1]+math.sin(k*math.pi/8)*width/2) for k in range(16)],'road',props)
    if lanes>1:
     for lane in range(1,lanes):
      off=-width/2+lane*width/lanes
      for d in range(10,int(L)-10,9):
       def at(s):return(a[0]+dx/L*s-dy/L*off,a[1]+dy/L*s+dx/L*off)
       strip(at(d),at(min(d+3,L-10)),.12,'lane',props)
  if used:counts['roadWays' if road else 'footpathWays']+=1
 for n in r.findall('node'):
  t=tags(n);p=local(nodes[n.get('id')]);h=t.get('highway')
  if math.hypot(*p)>radius:continue
  if h=='crossing':
   counts['crossings']+=1
   if t.get('crossing:markings')!='zebra':continue
   matches=[s for s in roads if n.get('id') in s[4]]
   if not matches:continue
   def gap(s):
    a,b=s[:2];dx,dy=b[0]-a[0],b[1]-a[1];q=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return math.hypot(p[0]-a[0]-q*dx,p[1]-a[1]-q*dy)
   a,b,width,props,_=min(matches,key=gap);L=math.dist(a,b);ux,uy=(b[0]-a[0])/L,(b[1]-a[1])/L
   for k in range(-int(width/2),int(width/2)+1):
    c=(p[0]-uy*k*.9,p[1]+ux*k*.9);strip((c[0]-ux*1.5,c[1]-uy*1.5),(c[0]+ux*1.5,c[1]+uy*1.5),.42,'zebra',{'osm':'node/'+n.get('id')})
   counts['zebraCrossings']+=1
  if h=='traffic_signals' or t.get('memorial') in ('statue','bust') or t.get('artwork_type')=='statue':
   kind='signal' if h=='traffic_signals' else 'memorial';counts[kind]+=1;features.append({'type':'Feature','properties':{'kind':kind,'name':t.get('name',t.get('subject','Mapped memorial')) if kind=='memorial' else 'Traffic signal','osm':'node/'+n.get('id')},'geometry':{'type':'Point','coordinates':list(nodes[n.get('id')])}})

 # Clip separately mapped paths against carriageways. A crossing is painted only
 # when explicitly mapped, rather than a solid pavement ribbon across traffic.
 import sys
 sys.path.insert(0,'D:/CodexTools/python-libs')
 from shapely.geometry import shape,mapping
 from shapely.ops import unary_union
 road_union=unary_union([shape(f['geometry']) for f in features if f['properties']['kind']=='road'])
 clean=[]
 for f in features:
  if f['properties']['kind']=='footpath':
   geom=shape(f['geometry']).difference(road_union)
   if geom.is_empty:continue
   f={**f,'geometry':mapping(geom)}
  clean.append(f)
 features=clean
 patch_file=Path('assets/streets/vidhana-footprint.geojson')
 if patch_file.exists():
  patch=unary_union([shape(f['geometry']) for f in json.loads(patch_file.read_text())['features']])
  clipped=[]
  for f in features:
   if f['properties']['kind'] in ('road','footpath','lane'):
    geom=shape(f['geometry']).difference(patch)
    if geom.is_empty:continue
    f={**f,'geometry':mapping(geom)}
   clipped.append(f)
  features=clipped
 out={'type':'FeatureCollection','source':'OpenStreetMap contributors','captured':'2026-09-10','center':origin,'radius':radius,'counts':dict(counts),'features':features};Path('vidhana-street-data.json').write_text(json.dumps(out,separators=(',',':')),encoding='utf-8');print(dict(counts));print('Bytes',Path('vidhana-street-data.json').stat().st_size)

 Path('vidhana-road-network.json').write_text(json.dumps({'type':'FeatureCollection','features':network},separators=(',',':')),encoding='utf-8')

if __name__ == '__main__':
 main()
