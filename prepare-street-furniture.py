"""Extract mapped street furniture; dimensions are illustrative, not surveyed."""
import json, math, pathlib, xml.etree.ElementTree as ET
CENTER=(77.5908,12.9798)
SX=111320*math.cos(math.radians(CENTER[1])); SY=111320
root=ET.parse('vidhana-streets.osm').getroot()
nodes={n.get('id'):(float(n.get('lon')),float(n.get('lat'))) for n in root.findall('node')}
def xy(p):return ((p[0]-CENTER[0])*SX,(p[1]-CENTER[1])*SY)
segments=[]
for w in root.findall('way'):
 t={x.get('k'):x.get('v') for x in w.findall('tag')}
 if t.get('highway') not in ['primary','secondary','tertiary','residential','service','unclassified','primary_link','secondary_link','tertiary_link']:continue
 refs=[x.get('ref') for x in w.findall('nd')]
 for a,b in zip(refs,refs[1:]):
  if a in nodes and b in nodes:segments.append((xy(nodes[a]),xy(nodes[b])))
def nearest_heading(p,lamp):
 best=(float('inf'),0)
 for a,b in segments:
  dx,dy=b[0]-a[0],b[1]-a[1];ll=dx*dx+dy*dy
  if not ll:continue
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/ll));q=(a[0]+t*dx,a[1]+t*dy);d=math.hypot(q[0]-p[0],q[1]-p[1])
  # Lamp arm points toward road, signal faces opposite mapped way direction.
  h=math.degrees(math.atan2(q[0]-p[0],q[1]-p[1])) if lamp else math.degrees(math.atan2(-dx,-dy))
  if d<best[0]:best=(d,h%360)
 return round(best[1],2)
items=[]
for n in root.findall('node'):
 t={x.get('k'):x.get('v') for x in n.findall('tag')};kind=t.get('highway');p=nodes[n.get('id')]
 if kind not in ['street_lamp','traffic_signals'] or math.hypot(*xy(p))>500:continue
 raw=t.get('direction','');explicit=raw.replace('.','',1).isdigit()
 items.append(dict(id=n.get('id'),kind='lamp' if kind=='street_lamp' else 'signal',coordinates=p,mount=t.get('lamp_mount','unknown'),heading=float(raw)%360 if explicit else nearest_heading(xy(p),kind=='street_lamp'),headingSource='OSM direction' if explicit else 'inferred nearest road',shapeSource='original simplified reconstruction; dimensions unverified',tags=t))
data=dict(center=CENTER,radiusMetres=500,source='OpenStreetMap vidhana-streets.osm',counts={k:sum(i['kind']==k for i in items) for k in ['lamp','signal']},notes=['Coordinates retained exactly from mapped nodes. Signal nodes may identify traffic control points rather than physical mast bases.','Lamp mount and direction use OSM tags where available; untagged shape, height and signal orientation are inferred.','No statue or monument geometry generated. Signal lenses are unlit; no invented traffic phase.'],references=['https://commons.wikimedia.org/wiki/File:Dr_Ambedkar_Veedhi,_Bengaluru_(03).jpg','https://commons.wikimedia.org/wiki/File:Light_pole,_Dr_Ambedkar_Veedhi,_Bengaluru_(01).jpg'],items=items)
pathlib.Path('assets/streets').mkdir(parents=True,exist_ok=True)
pathlib.Path('assets/streets/furniture.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
print(json.dumps(data['counts']))
