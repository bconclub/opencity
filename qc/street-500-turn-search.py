"""Isolated CPU route-shape search inside existing source-cycle ground."""
import ast,json,math,hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
# Reuse pure audited graph/path helpers without executing or rewriting the
# previous audit artifacts. No imports of runtime side-effect modules.
source=ROOT/'qc/street-500-loop-audit.py';tree=ast.parse(source.read_text())
names={'ROOT','SOURCE','FOOTPRINT','ORIGIN','CIRC','MY'}
keep=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.FunctionDef)) or
      isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in names for t in n.targets) or
      isinstance(n,ast.Expr) and isinstance(n.value,ast.Call) and getattr(n.value.func,'attr','')=='insert']
helpers={'__file__':str(source)}
exec(compile(ast.Module(body=keep,type_ignores=[]),str(source),'exec'),helpers)
from shapely.geometry import Point,Polygon,LineString
from shapely.ops import unary_union,transform
states,turns,_=helpers['graph'](json.loads(helpers['SOURCE'].read_text())['features'])
loops,*_=helpers['cycles'](states,turns,helpers['components'](turns))
ground=unary_union([transform(helpers['local'],helpers['shape'](f['geometry'])) for f in json.loads(helpers['FOOTPRINT'].read_text())['features']])
ground_tol=ground.buffer(.002)
parts=list(ground.geoms) if hasattr(ground,'geoms') else [ground]
trials=[];candidates=[];hulls={}
for loop_id in (2,4):
    original=helpers['loop_path'](states,loops[loop_id])
    region=Polygon(original.coords).buffer(0)
    # Candidate follows the same island(s) enclosed by the existing legal loop.
    # Hull does not add asphalt: every resulting envelope must independently
    # fit existing ground and the source-road corridor.
    islands=[Polygon(r) for p in parts for r in p.interiors if Polygon(r).area>.1 and region.covers(Polygon(r).representative_point())]
    hull=unary_union(islands).convex_hull
    hulls[loop_id]=hull
    for offset in [3+i*.25 for i in range(29)]:
        ring=hull.buffer(offset,resolution=64).exterior
        coords=list(ring.coords)
        # Maintain source loop direction.
        signed=lambda ps:sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ps,ps[1:]))
        if signed(coords)*signed(list(original.coords))<0:coords.reverse()
        path=LineString(coords)
        missing=path.buffer(1.05,resolution=16).difference(ground_tol).area
        row={'loop':loop_id,'family':'enclosed-island convex offset','offsetM':offset,'lengthM':path.length,
             'outsideGroundM2':missing,'minimumCircularRadiusM':offset}
        trials.append(row);candidates.append((missing,loop_id,offset,path,row))
    # Round an offset envelope with a rolling disk. This keeps straight sides
    # close to the island while increasing corner radius; unlike a global
    # larger offset it need not push long straights off narrow carriageways.
    for offset in [1.5+i*.25 for i in range(13)]:
        for radius in (5,5.5,6,7,8):
            rounded=hull.buffer(offset,resolution=64).buffer(-radius,resolution=64).buffer(radius,resolution=64)
            if rounded.is_empty or rounded.geom_type!='Polygon':continue
            coords=list(rounded.exterior.coords)
            if signed(coords)*signed(list(original.coords))<0:coords.reverse()
            path=LineString(coords)
            missing=path.buffer(1.05,resolution=16).difference(ground_tol).area
            row={'loop':loop_id,'family':'rolling-disk rounded island offset','offsetM':offset,'lengthM':path.length,
                 'outsideGroundM2':missing,'minimumCircularRadiusM':radius}
            trials.append(row);candidates.append((missing,loop_id,offset,path,row))
from shapely.affinity import translate
seed=sorted([c for c in candidates if c[4]['minimumCircularRadiusM']>=5],key=lambda item:item[0])[0]
for dx in [-.6,-.4,-.2,0,.2,.4,.6]:
    for dy in [-.6,-.4,-.2,0,.2,.4,.6]:
        path=translate(seed[3],dx,dy)
        missing=path.buffer(1.05,resolution=16).difference(ground_tol).area
        row={**seed[4],'family':'rounded island offset, bounded rigid adjustment','adjustmentXYM':[dx,dy],
             'outsideGroundM2':missing}
        trials.append(row);candidates.append((missing,seed[1],seed[2],path,row))
for radius in (5.1,5.2,5.3):
    rounded=hulls[2].buffer(3,resolution=128).buffer(-radius,resolution=128).buffer(radius,resolution=128)
    coords=list(rounded.exterior.coords)
    original=helpers['loop_path'](states,loops[2])
    if signed(coords)*signed(list(original.coords))<0:coords.reverse()
    for dx in (-.6,-.4):
        for dy in (.6,.8):
            path=translate(LineString(coords),dx,dy)
            missing=path.buffer(1.05,resolution=32).difference(ground_tol).area
            row={'loop':2,'family':'rounded island offset, higher-radius refinement','offsetM':3,'lengthM':path.length,
                 'minimumCircularRadiusM':radius,'adjustmentXYM':[dx,dy],'outsideGroundM2':missing}
            trials.append(row);candidates.append((missing,2,3,path,row))
rounded=hulls[2].buffer(3,resolution=128).buffer(-5.1,resolution=128).buffer(5.1,resolution=128)
coords=list(rounded.exterior.coords)
if signed(coords)*signed(list(original.coords))<0:coords.reverse()
for dx in (-.65,-.55,-.5,-.45,-.35):
    for dy in (.65,.7,.75,.85):
        path=translate(LineString(coords),dx,dy);missing=path.buffer(1.05,resolution=32).difference(ground_tol).area
        row={'loop':2,'family':'rounded island offset, fine bounded adjustment','offsetM':3,'lengthM':path.length,
             'minimumCircularRadiusM':5.1,'adjustmentXYM':[dx,dy],'outsideGroundM2':missing}
        trials.append(row);candidates.append((missing,2,3,path,row))
best=sorted(candidates,key=lambda item:(item[0],0 if item[4]['minimumCircularRadiusM']>5 else 1))[:8]
def check_body(path):
    count=math.ceil(path.length/.25);bad=0;max_area=0
    for k in range(count):
        d=k*path.length/count;p=path.interpolate(d);q=path.interpolate((d+.02)%path.length)
        dx,dy=q.x-p.x,q.y-p.y;l=math.hypot(dx,dy)
        if l<1e-9:continue
        dx/=l;dy/=l
        body=Polygon([(p.x+f*dx-s*dy,p.y+f*dy+s*dx) for f,s in [(2.3,1.05),(2.3,-1.05),(-2.3,-1.05),(-2.3,1.05)]])
        missing=body.difference(ground_tol).area
        if missing>.0001:bad+=1;max_area=max(max_area,missing)
    return {'bodySamples':count,'failedBodySamples':bad,'maximumBodyOutsideGroundM2':max_area}
for *_,path,row in best:
    row.update(check_body(path))
import struct
glb=(helpers['FOOTPRINT'].parent/'vidhana-streets.glb').read_bytes();json_len=struct.unpack_from('<I',glb,12)[0]
doc=json.loads(glb[20:20+json_len]);binary_start=20+json_len+8
def accessor(index):
    a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC3':3}[a['type']]
    fmt={5126:'f',5125:'I',5123:'H'}[a['componentType']];size=struct.calcsize('<'+fmt)*n
    start=binary_start+v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size)
    return [struct.unpack_from('<'+fmt*n,glb,start+i*stride) for i in range(a['count'])]
asphalt_triangles=[]
for mesh in doc['meshes']:
    for primitive in mesh['primitives']:
        role=doc['materials'][primitive['material']].get('extras',{}).get('streetSurfaceRole')
        if role not in ('asphalt','marking'):continue
        ps=accessor(primitive['attributes']['POSITION']);ids=[x[0] for x in accessor(primitive['indices'])]
        for i in range(0,len(ids),3):
            vertices=[ps[n] for n in ids[i:i+3]]
            if max(v[2] for v in vertices)>.05:continue
            poly=Polygon([(v[0],v[1]) for v in vertices])
            if poly.area>1e-8:asphalt_triangles.append(poly)
asphalt=unary_union(asphalt_triangles).buffer(.002)
selected=[]
for missing,lid,offset,path,row in best:
    if row['minimumCircularRadiusM']<5 or row['failedBodySamples'] or missing>.0001:continue
    cycle=loops[lid];source_line=LineString([states[k]['a'] for k in cycle]+[states[cycle[0]]['a']])
    source_corridor=unary_union([LineString([states[k]['a'],states[k]['b']]).buffer(states[k]['properties']['width']/2) for k in cycle])
    outside_asphalt=0;outside_source=0;progress=[];radii=[]
    count=math.ceil(path.length/.1)
    body_envelopes=[]
    for k in range(count):
        d=k*path.length/count;p=path.interpolate(d);q=path.interpolate((d+.02)%path.length)
        dx,dy=q.x-p.x,q.y-p.y;l=math.hypot(dx,dy);dx/=l;dy/=l
        body=Polygon([(p.x+f*dx-s*dy,p.y+f*dy+s*dx) for f,s in [(2.3,1.05),(2.3,-1.05),(-2.3,-1.05),(-2.3,1.05)]])
        outside_asphalt+=body.difference(asphalt).area>.0001
        outside_source+=body.difference(source_corridor).area>.0001
        progress.append(source_line.project(p));body_envelopes.append(body)
        a=path.interpolate((d-.25)%path.length);b=path.interpolate((d+.25)%path.length)
        area2=abs((p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x))
        if area2>1e-8:radii.append(a.distance(p)*p.distance(b)*a.distance(b)/(2*area2))
    jumps=[(b-a+source_line.length/2)%source_line.length-source_line.length/2 for a,b in zip(progress,progress[1:]+progress[:1])]
    swept=unary_union(body_envelopes)
    row.update({'denseBodySamples':count,'bodyPosesOutsideAsphaltOrMarking':outside_asphalt,
        'bodyPosesOutsideOriginalSourceRoadCorridor':outside_source,'backwardSourceProgressSteps':sum(j<-.01 for j in jumps),
        'minimumMeasuredRadiusM':min(radii),'sweptBodyOutsideGroundM2':swept.difference(ground_tol).area,
        'sweptBodyOutsideAsphaltM2':swept.difference(asphalt).area,
        'maxLateralAccelerationAt3mps':9/min(radii)})
    selected.append((path,row,swept))
    # One accepted preview is sufficient; no exhaustive optimization claim.
    if not outside_asphalt and not any(j<-.01 for j in jumps) and min(radii)>=5:break
if selected:
    path,row,swept=selected[-1]
    (ROOT/'qc/street-500-turn-candidate.geojson').write_text(json.dumps({'type':'FeatureCollection','features':[
        {'type':'Feature','properties':row,'geometry':{'type':'LineString','coordinates':[helpers['geo'](*p) for p in path.coords]}}]},separators=(',',':')))
print(json.dumps([r for *_,r in best],indent=2))
(ROOT/'qc/street-500-turn-search.json').write_text(json.dumps({'trials':trials,'best':[r for *_,r in best],
  'denseChecks':[row for _,row,_ in selected],
  'runtimeChanged':False,'priorAuditUnmodified':True,'groundSha256':hashlib.sha256(helpers['FOOTPRINT'].read_bytes()).hexdigest()},indent=2)+'\n')
