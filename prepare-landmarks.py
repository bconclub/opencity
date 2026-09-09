import xml.etree.ElementTree as ET
import json

features=[]
for file,site in [('vidhana-osm.xml','Vidhana Soudha'),('ub-osm.xml','UB City')]:
    root=ET.parse(file).getroot()
    nodes={n.attrib['id']:[float(n.attrib['lon']),float(n.attrib['lat'])] for n in root.findall('node')}
    ways={w.attrib['id']:w for w in root.findall('way')}
    def tags(e): return {t.attrib['k']:t.attrib['v'] for t in e.findall('tag')}
    def ring(w):
        refs=[n.attrib['ref'] for n in w.findall('nd')]
        return [nodes[n] for n in refs] if refs and refs[0]==refs[-1] and all(n in nodes for n in refs) else None
    def add(rings,p,id):
        if not rings or not rings[0]: return
        features.append({'type':'Feature','properties':{**p,'site':site,'osm_id':id},'geometry':{'type':'Polygon','coordinates':rings}})
    for id,w in ways.items():
        p=tags(w)
        if p.get('building:part')=='yes':
            r=ring(w)
            if r:add([r],p,'way/'+id)
    for rel in root.findall('relation'):
        p=tags(rel)
        if p.get('building:part')!='yes' or p.get('name')=='Vikasa Soudha':continue
        outer=[];inner=[];pending={'outer':[],'inner':[]}
        for m in rel.findall('member'):
            if m.attrib['type']!='way' or m.attrib['ref'] not in ways:continue
            r=ring(ways[m.attrib['ref']])
            role='inner' if m.attrib['role']=='inner' else 'outer'
            if r:(inner if role=='inner' else outer).append(r)
            else:pending[role].append([n.attrib['ref'] for n in ways[m.attrib['ref']].findall('nd')])
        for role,segments in pending.items():
            while segments:
                chain=segments.pop(0)
                while chain and chain[0]!=chain[-1]:
                    match=next(((i,seg if seg[0]==chain[-1] else list(reversed(seg))) for i,seg in enumerate(segments) if seg[0]==chain[-1] or seg[-1]==chain[-1]),None)
                    if match is None:break
                    i,seg=match;chain+=seg[1:];segments.pop(i)
                if chain and chain[0]==chain[-1] and all(n in nodes for n in chain):
                    (inner if role=='inner' else outer).append([nodes[n] for n in chain])
        for r in outer:add([r]+inner,p,'relation/'+rel.attrib['id'])
json.dump({'type':'FeatureCollection','source':'OpenStreetMap API, retrieved 2026-09-09','features':features},open('landmark-data.json','w',encoding='utf-8'),ensure_ascii=False)
print('Landmark polygons:',len(features))
