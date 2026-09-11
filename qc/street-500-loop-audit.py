"""Bounded CPU source-identity loop and cab corridor audit. No runtime writes."""
import collections, hashlib, json, math, sys
from pathlib import Path
sys.path.insert(0, 'D:/CodexTools/python-libs')
from shapely.geometry import Point, Polygon, LineString, shape
from shapely.ops import unary_union, transform

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'qc/street-500-scene-data/vidhana-road-network.json'
FOOTPRINT = ROOT / 'experiments/osm2world/coverage-500-classified/asset/vidhana-footprint.geojson'
ORIGIN = [77.59136, 12.97984615]
CIRC = 2 * math.pi * 6371008.8 * math.cos(math.radians(ORIGIN[1]))
MY = lambda lat: math.asinh(math.tan(math.radians(lat))) / (2 * math.pi)
def local(lon, lat, z=None): return ((lon-ORIGIN[0])*CIRC/360, (MY(lat)-MY(ORIGIN[1]))*CIRC)
def geo(x, y): return [ORIGIN[0]+x/CIRC*360, math.degrees(math.atan(math.sinh((y/CIRC+MY(ORIGIN[1]))*2*math.pi)))]
def delta(a, b): return (a-b+math.pi)%(2*math.pi)-math.pi
def graph(features, width_policy=True):
    states=[]; adjacency=collections.defaultdict(list); rejected=collections.Counter()
    for f in features:
        p=f['properties']; fractions=p['sourceFractions']
        if p['sourceWay']=='52057928' and p['sourceSegment']==0:
            rejected['known-junction-gap']+=1;continue
        if abs(fractions[0])>1e-9 or abs(fractions[1]-1)>1e-9:
            rejected['unsupported-boundary-portal']+=1;continue
        if width_policy and p['width'] < (4.8 if p['oneway']=='no' else 3):
            rejected['narrow-carriageway']+=1;continue
        a,b=p['sourceNodes']; pa,pb=[local(*v) for v in f['geometry']['coordinates']]
        length=math.dist(pa,pb)
        if length<.5:rejected['sub-half-metre-edge']+=1;continue
        h=math.atan2(pb[1]-pa[1],pb[0]-pa[0])
        directions=[(a,b,pa,pb,h)] if p['oneway']=='yes' else [(b,a,pb,pa,h+math.pi)] if p['oneway']=='-1' else [(a,b,pa,pb,h),(b,a,pb,pa,h+math.pi)]
        for start,end,ap,bp,heading in directions:
            i=len(states); adjacency[start].append(i)
            states.append({'from':start,'to':end,'a':ap,'b':bp,'heading':heading,'length':length,'properties':p})
    turns={i:[j for j in adjacency[s['to']] if states[j]['to']!=s['from'] and
              abs(delta(states[j]['heading'],s['heading']))<math.radians(135)] for i,s in enumerate(states)}
    return states,turns,dict(rejected)
def components(turns):
    seen=set();order=[];reverse=collections.defaultdict(list)
    def visit(i):
        if i in seen:return
        seen.add(i)
        for j in turns[i]:visit(j)
        order.append(i)
    for i,vs in turns.items():
        for j in vs:reverse[j].append(i)
    for i in turns:visit(i)
    seen.clear();out=[]
    def collect(i,c):
        if i in seen:return
        seen.add(i);c.append(i)
        for j in reverse[i]:collect(j,c)
    for i in reversed(order):
        if i not in seen:
            c=[];collect(i,c)
            if len(c)>=3:out.append(c)
    return out
def cycles(states, turns, comps):
    found=[]; capped=False;calls=0
    for comp in comps:
        allowed=set(comp)
        for start in sorted(comp):
            def walk(path,used):
                nonlocal capped,calls
                calls+=1
                if calls>200000 or len(found)>=2000:capped=True;return
                for n in turns[path[-1]]:
                    if n not in allowed or n<start:continue
                    if n==start and len(path)>=3:
                        if sum(states[k]['length'] for k in path)>=100:found.append(path[:])
                    elif n not in used:
                        walk(path+[n],used|{n})
                    if capped:return
            walk([start],{start})
            if capped:return found,capped,calls
    return found,capped,calls
def lane_point(s, distance):
    dx,dy=math.cos(s['heading']),math.sin(s['heading']);p=s['properties']
    offset=0 if p['oneway']!='no' and p['width']<=4 else min(1.45,p['width']/4)
    return (s['a'][0]+dx*distance-dy*offset,s['a'][1]+dy*distance+dx*offset)
def loop_path(states, cycle):
    out=[]
    for index, sid in enumerate(cycle):
        prev,s,nxt=[states[cycle[k%len(cycle)]] for k in (index-1,index,index+1)]
        trim_in=min(7,prev['length']*.3,s['length']*.3)
        trim_out=min(7,s['length']*.3,nxt['length']*.3)
        a=lane_point(s,trim_in);b=lane_point(s,s['length']-trim_out)
        if not out:out.append(a)
        out.append(b)
        c=lane_point(nxt,trim_out)
        v=(math.cos(s['heading']),math.sin(s['heading']));w=(math.cos(nxt['heading']),math.sin(nxt['heading']))
        cross=v[0]*w[1]-v[1]*w[0]
        if abs(cross)>.1:
            t=((c[0]-b[0])*w[1]-(c[1]-b[1])*w[0])/cross
            control=(b[0]+v[0]*t,b[1]+v[1]*t)
        else:control=((b[0]+c[0])/2,(b[1]+c[1])/2)
        # Same quadratic corner and 24 subdivisions as current NPC route model.
        for k in range(1,25):
            t=k/24;u=1-t
            out.append((u*u*b[0]+2*u*t*control[0]+t*t*c[0],u*u*b[1]+2*u*t*control[1]+t*t*c[1]))
    out.append(out[0]);return LineString(out)

# Deterministic fixtures protect against spuriously closing nearby source nodes,
# reversing a directed edge, or accepting an unverified seam.
def fixture():
    points=[(0,0),(40,0),(40,40),(0,40)]
    return [{'properties':{'sourceWay':str(10+i),'sourceSegment':0,'sourceFractions':[0,1],
                          'sourceNodes':[str(i),str((i+1)%4)],'width':6.4,'oneway':'yes'},
             'geometry':{'coordinates':[geo(*points[i]),geo(*points[(i+1)%4])]}} for i in range(4)]
test=fixture();ts,tg,_=graph(test);tc=components(tg);tl,_,_=cycles(ts,tg,tc)
assert len(tl)==1 and len(tl[0])==4
test_path=loop_path(ts,tl[0]);assert Polygon([(-10,-10),(50,-10),(50,50),(-10,50)]).covers(test_path.buffer(1.05))
test=fixture();test[1]['properties']['oneway']='-1';ss,gg,_=graph(test);assert not components(gg)
test=fixture();test[1]['properties']['sourceNodes'][0]='unrelated-nearby-node';ss,gg,_=graph(test);assert not components(gg)
test=fixture();test[0]['properties']['sourceFractions'][0]=.1;ss,gg,rr=graph(test);assert not components(gg) and rr['unsupported-boundary-portal']==1
test=fixture();test[0]['properties']['sourceWay']='52057928';ss,gg,rr=graph(test);assert not components(gg) and rr['known-junction-gap']==1
test=fixture()
for f in test:f['properties'].update(width=4,oneway='no')
ss,gg,rr=graph(test);assert not ss and rr['narrow-carriageway']==4
test=fixture()[:1];test[0]['properties']['oneway']='no';ss,gg,_=graph(test);assert all(not v for v in gg.values())

features=json.loads(SOURCE.read_text())['features']
states,turns,rejected=graph(features)
comps=components(turns);loops,capped,calls=cycles(states,turns,comps)
top_states,top_turns,_=graph(features,False);top_comps=components(top_turns)
ground=unary_union([transform(local,shape(f['geometry'])) for f in json.loads(FOOTPRINT.read_text())['features']])
# No permissive tolerance: outside area itself is reported; the tiny buffered
# tolerance below is only for Float32/mm seams, not road widening.
ground_tolerant=ground.buffer(.002)
results=[];previews=[]
for i,cycle in enumerate(loops):
    path=loop_path(states,cycle)
    # NPC collision model uses4.5m x1.85m defaults. Use the larger actual player
    # Cybercab4.6m x1.9m footprint, plus0.1m lateral margin on each side.
    corridor=path.buffer(1.05,resolution=8)
    missing=corridor.difference(ground_tolerant)
    positions=max(1,math.ceil(path.length/.5));bad_body=0;first=None;max_outside=0;failure_runs=[];failing=False
    for k in range(positions):
        d=k*path.length/positions;p=path.interpolate(d);q=path.interpolate((d+.05)%path.length)
        dx,dy=q.x-p.x,q.y-p.y;length=math.hypot(dx,dy)
        if length<1e-8:continue
        dx/=length;dy/=length
        body=Polygon([(p.x+forward*dx-side*dy,p.y+forward*dy+side*dx) for forward,side in [(2.3,1.05),(2.3,-1.05),(-2.3,-1.05),(-2.3,1.05)]])
        outside=body.difference(ground_tolerant).area
        if outside>.0001:
            bad_body+=1;max_outside=max(max_outside,outside)
            if first is None:first={'distanceAlongLoopM':d,'lngLat':geo(p.x,p.y),'bodyOutsideGroundM2':outside}
            if not failing:
                nearest=min(cycle,key=lambda sid:LineString([states[sid]['a'],states[sid]['b']]).distance(p))
                failure_runs.append({'startDistanceM':d,'lngLat':geo(p.x,p.y),
                                     'nearestSourceWay':states[nearest]['properties']['sourceWay'],
                                     'nearestSourceSegment':states[nearest]['properties']['sourceSegment']})
            failing=True
        else:failing=False
    safe=missing.area<.0001 and bad_body==0
    props={'id':i,'sourceSegments':len(cycle),'sourceLengthM':sum(states[k]['length'] for k in cycle),
           'smoothLengthM':path.length,'sourceWays':sorted({states[k]['properties']['sourceWay'] for k in cycle}),
           'maxSourceTurnDeg':max(abs(math.degrees(delta(states[cycle[(k+1)%len(cycle)]]['heading'],states[s]['heading']))) for k,s in enumerate(cycle)),
           'corridorOutsideGroundM2':missing.area,'bodySamples':positions,'failedBodySamples':bad_body,
           'maxBodyOutsideGroundM2':max_outside,'firstFailure':first,'failureRuns':failure_runs,'groundCorridorPass':safe}
    results.append(props);previews.append({'type':'Feature','properties':props,'geometry':{'type':'LineString','coordinates':[geo(*p) for p in path.coords]}})
report={'inputSourceFeatures':len(features),'withheld':rejected,'sourceIdDirectedStates':len(states),
        'topologyOnlyCyclicComponents':[len(c) for c in top_comps],
        'widthEligibleCyclicComponents':[len(c) for c in comps],'meaningfulCycleMinimumM':100,
        'enumerationCalls':calls,'enumerationCapped':capped,'cycleCount':len(loops),'groundCorridorPassCount':sum(r['groundCorridorPass'] for r in results),
        'vehicleEnvelope':{'lengthM':4.6,'widthIncludingMarginM':2.1,'sampleSpacingAtMostM':.5,'numericSeamToleranceM':.002},
        'loops':results,'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'groundSha256':hashlib.sha256(FOOTPRINT.read_bytes()).hexdigest(),'runtimeChanged':False,'gpuUsed':False,
        'fixtureTests':['wide legal square accepted','wrong-way edge breaks loop','nearby unrelated node never merged',
                        'boundary portal withheld','known gap withheld','narrow two-way removed','immediate reversal rejected'],
        'limitations':['Ground includes pavement; passing ground coverage alone is not verified asphalt/kerb clearance.',
                       'No multi-car interactions or stop/signal timing acceptance in this isolated geometry test.',
                       'Current width estimates retained; no source geometry or connectors invented.']}
(ROOT/'qc/street-500-loop-audit.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'qc/street-500-loop-preview.geojson').write_text(json.dumps({'type':'FeatureCollection','features':previews},separators=(',',':')))
from PIL import Image, ImageDraw, ImageFont
image=Image.new('RGB',(1240,800),'#edf2f4');draw=ImageDraw.Draw(image)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
draw.text((25,18),'Source-connected loops exist, but current cab turns leave ground',fill='#153044',font=font)
draw.text((25,48),'CPU plan view. Cyan: smoothed NPC lane. Red circles: start of a failing vehicle-footprint run.',fill='#355061',font=small)
for panel,loop_id in enumerate((2,4)):
    if loop_id>=len(loops):continue
    path=loop_path(states,loops[loop_id]);minx,miny,maxx,maxy=path.bounds
    cx,cy=(minx+maxx)/2,(miny+maxy)/2;extent=max(maxx-minx,maxy-miny)+40;scale=520/extent
    def pixel(p):return (panel*620+310+(p[0]-cx)*scale,370-(p[1]-cy)*scale)
    draw.rectangle((panel*620+25,95,panel*620+595,645),fill='#d7decf',outline='#a1b0b6')
    from shapely.geometry import box
    visible=ground.intersection(box(cx-extent/2,cy-extent/2,cx+extent/2,cy+extent/2))
    polygons=list(visible.geoms) if hasattr(visible,'geoms') else [visible]
    for polygon in polygons:
        if polygon.geom_type!='Polygon':continue
        draw.polygon([pixel(p) for p in polygon.exterior.coords],fill='#697980')
        for interior in polygon.interiors:draw.polygon([pixel(p) for p in interior.coords],fill='#d7decf')
    draw.line([pixel(p) for p in path.coords],fill='#00d9ff',width=3)
    for f in results[loop_id]['failureRuns']:
        x,y=pixel(local(*f['lngLat']));draw.ellipse((x-9,y-9,x+9,y+9),outline='#df2239',width=3)
    row=results[loop_id]
    draw.text((panel*620+25,665),f"Loop {loop_id}: {row['smoothLengthM']:.0f} m, {row['failedBodySamples']}/{row['bodySamples']} cab poses fail",fill='#153044',font=font)
    draw.text((panel*620+25,695),f"Swept lane outside ground: {row['corridorOutsideGroundM2']:.2f} square metres",fill='#355061',font=small)
draw.text((25,747),'No loops enabled. Fix verified local turn corridors before NPC release; no snapping or invented connectors.',fill='#153044',font=font)
image.save(ROOT/'qc/street-500-loop-clearance.png')
print(json.dumps({k:v for k,v in report.items() if k!='loops'},indent=2))
for row in results:print(json.dumps(row))
