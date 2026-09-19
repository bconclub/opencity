import xml.etree.ElementTree as E, math,json,collections
from pathlib import Path
r=E.parse('vidhana-streets.osm').getroot();origin=(77.5908,12.9798);mx=111320*math.cos(math.radians(origin[1]));radius=500
nodes={n.get('id'):(float(n.get('lon')),float(n.get('lat'))) for n in r.findall('node')}
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
features=[];network=[];roads=[];devaraj_segments=[];counts=collections.Counter();seen=set()
def poly(c,kind,props):
 features.append({'type':'Feature','properties':{'kind':kind,**props},'geometry':{'type':'Polygon','coordinates':[[geo(p) for p in c+[c[0]]]]}})
def strip(a,b,width,kind,props):
 dx,dy=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dy)
 if L<.01:return
 nx,ny=-dy/L*width/2,dx/L*width/2
 poly([(a[0]+nx,a[1]+ny),(b[0]+nx,b[1]+ny),(b[0]-nx,b[1]-ny),(a[0]-nx,a[1]-ny)],kind,props)
def strip_offset(a,b,offset,strip_width,kind,props):
 dx,dy=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dy)
 if L<.01:return
 nx,ny=-dy/L,dx/L
 ca=(a[0]+nx*offset,a[1]+ny*offset);cb=(b[0]+nx*offset,b[1]+ny*offset)
 strip(ca,cb,strip_width,kind,props)
def seg_heading(a,b):
 dx,dy=b[0]-a[0],b[1]-a[1];return math.degrees(math.atan2(dx,dy))%360
def seg_normal(a,b):
 dx,dy=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dy)
 return (-dy/L,dx/L) if L>.01 else (0,0)
def nearest_segment(segments,lon,lat):
 p=local((lon,lat));best=None
 for a,b,width,props in segments:
  dx,dy=b[0]-a[0],b[1]-a[1];L2=dx*dx+dy*dy
  if L2<.01:continue
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2))
  q=(a[0]+t*dx,a[1]+t*dy);d=math.hypot(p[0]-q[0],p[1]-q[1])
  if best is None or d<best[0]:best=(d,q,seg_heading(a,b),a,b,width,props,t)
 return best
def add_point(kind,lon,lat,heading,ref,name='Devaraj Urs Road'):
 features.append({'type':'Feature','properties':{'kind':kind,'name':name,'ref':ref,'heading':round(heading,1)},'geometry':{'type':'Point','coordinates':[lon,lat]}})
 counts[kind]+=1
def add_rail(a,b,side,width,ref,span):
 nx,ny=seg_normal(a,b);dx,dy=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dy)
 if L<.01:return
 off=side*(width/2+.55);la=(a[0]+nx*off,a[1]+ny*off);lb=(b[0]+nx*off,b[1]+ny*off)
 features.append({'type':'Feature','properties':{'kind':'barrier_rail','name':'Devaraj Urs Road','ref':ref,'side':side,'heading':round(seg_heading(a,b),1)},'geometry':{'type':'LineString','coordinates':[geo(la),geo(lb)]}})
 counts['barrier_rail']+=1
 for i in range(max(2,int(span/2))+1):
  t=i/max(2,int(span/2));pt=(la[0]+(lb[0]-la[0])*t,la[1]+(lb[1]-la[1])*t)
  g=geo(pt);add_point('barrier_post',g[0],g[1],seg_heading(a,b),ref+'-post-'+str(i))
for w in r.findall('way'):
 t=tags(w);h=t.get('highway');foot=h in ('footway','path','pedestrian','cycleway');road=h in ('primary','primary_link','secondary','secondary_link','tertiary','residential','unclassified','service')
 if not(foot or road) or t.get('bridge')=='yes' or t.get('tunnel')=='yes' or t.get('layer','0')!='0':continue
 if foot and t.get('footway')=='crossing':continue
 refs=[n.get('ref') for n in w.findall('nd')];p=[local(nodes[n]) for n in refs if n in nodes]
 try:lanes=int(t.get('lanes','0'));width=float(t.get('width','').split()[0])
 except (ValueError,IndexError):
  try:lanes=int(t.get('lanes','0'))
  except ValueError:lanes=0
  width=(max(3,lanes*3.2) if lanes else {'primary':9,'secondary':7,'tertiary':6,'service':4}.get(h,5)) if road else 1.8
 props={'osm':'way/'+w.get('id'),'name':t.get('name',''),'surface':t.get('surface','unknown'),'width':width,'widthEstimated':'width' not in t,'lanes':lanes,'note':t.get('note',''),'oneway':t.get('oneway','yes' if t.get('junction')=='roundabout' else 'no')}
 used=False
 for a,b in zip(p,p[1:]):
  segment=clip(a,b)
  if not segment:continue
  a,b=segment;strip(a,b,width,'road' if road else 'footpath',props);used=True
  if road:
   network.append({'type':'Feature','properties':{**props,'_layer':'transportation','class':{'residential':'minor','unclassified':'minor','primary_link':'primary','secondary_link':'secondary'}.get(h,h)},'geometry':{'type':'LineString','coordinates':[geo(a),geo(b)]}});roads.append((a,b,width,props,refs));dx,dy=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dy)
   if t.get('name')=='Devaraj Urs Road':devaraj_segments.append((a,b,width,props))
   for q in [a,b]:poly([(q[0]+math.cos(k*math.pi/8)*width/2,q[1]+math.sin(k*math.pi/8)*width/2) for k in range(16)],'road',props)
   paint_lanes=lanes>1 and t.get('lane_markings') not in ('no','none') and t.get('name')!='Devaraj Urs Road'
   if paint_lanes:
    for lane in range(1,lanes):
     off=-width/2+lane*width/lanes
     for d in range(10,int(L)-10,9):
      def at(s):return(a[0]+dx/L*s-dy/L*off,a[1]+dy/L*s+dx/L*off)
      strip(at(d),at(min(d+3,L-10)),.12,'lane',props)
   if t.get('name')=='Devaraj Urs Road':
    kerb_w=.28;walk_w=1.9;seg=len(features)
    for side in (-1,1):
     inner=side*(width/2)
     strip_offset(a,b,inner+side*(kerb_w/2),kerb_w,'kerb',{**props,'kerbTone':(seg+int(side>0))%2})
     if t.get('sidewalk')=='separate':
      outer=inner+side*kerb_w
      strip_offset(a,b,outer+side*(walk_w/2),walk_w,'footpath',{**props,'surface':'paving_stones'})
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
if devaraj_segments:
 _,gate_q,gate_h,ga,gb,gate_w,_,_=nearest_segment(devaraj_segments,77.5887702,12.9813056)
 gate_nx,gate_ny=seg_normal(ga,gb)
 for i in range(9):
  along=(i-4)*1.4
  pt=(gate_q[0]+math.sin(math.radians(gate_h))*along,gate_q[1]+math.cos(math.radians(gate_h))*along)
  edge=(pt[0]-gate_nx*(gate_w/2+.35),pt[1]-gate_ny*(gate_w/2+.35))
  g=geo(edge);add_point('barrier_police',g[0],g[1],gate_h+90,'OBS-04-gate1-'+str(i))
 _,mid_q,mid_h,ma,mb,mid_w,_,_=nearest_segment(devaraj_segments,77.587664,12.9798928)
 mid_nx,mid_ny=seg_normal(ma,mb);dx,dy=mb[0]-ma[0],mb[1]-ma[1];L=math.hypot(dx,dy);ux,uy=(dx/L,dy/L) if L>.01 else (0,0)
 span=25;ra=(mid_q[0]-ux*span,mid_q[1]-uy*span);rb=(mid_q[0]+ux*span,mid_q[1]+uy*span)
 for side,tag in [(-1,'L'),(1,'R')]:add_rail(ra,rb,side,mid_w,'OBS-06-rail-'+tag,span*2)
 for i in range(13):
  along=(i-6)*2.0
  pt=(mid_q[0]+ux*along,mid_q[1]+uy*along)
  edge=(pt[0]-mid_nx*(mid_w/2+.25),pt[1]-mid_ny*(mid_w/2+.25))
  g=geo(edge);add_point('barrier_cone',g[0],g[1],mid_h,'OBS-06-cone-'+str(i))
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
  if f['properties']['kind'] in ('road','footpath','lane','kerb'):
   geom=shape(f['geometry']).difference(patch)
   if geom.is_empty:continue
   f={**f,'geometry':mapping(geom)}
  clipped.append(f)
 features=clipped
out={'type':'FeatureCollection','source':'OpenStreetMap contributors','captured':'2026-09-10','center':origin,'radius':radius,'counts':dict(counts),'features':features};Path('vidhana-street-data.json').write_text(json.dumps(out,separators=(',',':')),encoding='utf-8');print(dict(counts));print('Bytes',Path('vidhana-street-data.json').stat().st_size)
Path('vidhana-road-network.json').write_text(json.dumps({'type':'FeatureCollection','features':network},separators=(',',':')),encoding='utf-8')
