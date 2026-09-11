"""Remove coincident faces and resolve actual coplanar material overlaps offline."""
import sys,json
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import Polygon, GeometryCollection
from shapely.ops import unary_union
from shapely import constrained_delaunay_triangles

source_path=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).parent/'experiments/osm2world/sample-meshes.json'
source=json.loads(source_path.read_text())
classified=any('surfaceRole' in mesh or 'groundEligible' in mesh for mesh in source)
groups={};seen=set();duplicates=0;original_flat=[]
for mesh in source:
    color=tuple(mesh['color']);role=mesh.get('surfaceRole');ground=mesh.get('groundEligible',True)
    key=(color,role,ground)
    group=groups.setdefault(key,{'flat':[],'raised':[]})
    for i in range(0,len(mesh['indices']),3):
        ids=mesh['indices'][i:i+3]
        vertices=[tuple(mesh['positions'][j*3:j*3+3]) for j in ids]
        identity=(tuple(sorted(vertices)),color,role,ground) if classified else tuple(sorted(vertices))
        if identity in seen:
            duplicates+=1
            continue
        seen.add(identity)
        if ground and all(abs(v[1])<1e-8 for v in vertices):
            polygon=Polygon([(v[0],v[2]) for v in vertices])
            if polygon.area>1e-8:
                group['flat'].append(polygon)
                original_flat.append(polygon)
        else:
            group['raised'].append((vertices,[mesh['normals'][j*3:j*3+3] for j in ids]))

# Higher luminance material owns coincident ground pixels: markings, footways,
# gray paving, dark asphalt. Real raised/curb geometry retains source elevation.
covered=GeometryCollection();prepared=[];clean_flat=[];original_area_sum=0
def priority(item):
    color,role,ground=item[0]
    # Legacy sample keeps its audited colour order. Explicit profiles give
    # mapped paint precedence and keep distinct source colour above asphalt.
    rank={'marking':40,'concrete':30,'paving':20,'source':15,'asphalt':10}.get(role,0)
    return (rank,color)
for (color,role,ground),group in sorted(groups.items(),key=priority,reverse=True):
    surface=unary_union(group['flat'])
    original_area_sum+=sum(p.area for p in group['flat'])
    clean=surface.difference(covered)
    covered=covered.union(surface)
    clean_flat.append(clean)
    out={'color':list(color),'positions':[],'normals':[],'indices':[],'uvs':[],'texture':None}
    if role is not None:out['surfaceRole']=role
    if not ground:out['groundEligible']=False
    def add(vertices,normals):
        a,b,c=vertices
        u=[b[i]-a[i] for i in range(3)];v=[c[i]-a[i] for i in range(3)]
        cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
        if sum(cross[i]*sum(n[i] for n in normals) for i in range(3))<0:
            vertices=list(reversed(vertices));normals=list(reversed(normals))
        base=len(out['positions'])//3
        for v,n in zip(vertices,normals):
            out['positions'].extend(v);out['normals'].extend(n)
        out['indices'].extend([base,base+1,base+2])
    # GEOS constrained triangulation preserves polygon holes and boundaries.
    for tri in constrained_delaunay_triangles(clean).geoms:
        p=list(tri.exterior.coords)[:3]
        # Native mesh Y up: XZ clockwise winding gives upward face normal.
        if (p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[2][0]-p[0][0])*(p[1][1]-p[0][1])>0:
            p.reverse()
        add([(x,0,z) for x,z in p],[(0,1,0)]*3)
    for vertices,normals in group['raised']:
        add(vertices,normals)
    prepared.append(out)

original_union=unary_union(original_flat)
clean_union=unary_union(clean_flat)
coverage_error=original_union.symmetric_difference(clean_union).area
cross_overlap=sum(a.intersection(b).area for i,a in enumerate(clean_flat) for b in clean_flat[i+1:])
assert coverage_error<1e-6,coverage_error
assert cross_overlap<1e-6,cross_overlap
report={'duplicatesRemoved':duplicates,'sourceTriangles':sum(len(m['indices'])//3 for m in source),'sourceMeshes':len(source),'coplanarRedundantAreaRemovedM2':original_area_sum-original_union.area,'coverageDifferenceM2':coverage_error,'remainingCoplanarMaterialOverlapM2':cross_overlap}
print(json.dumps({'meshes':prepared,'report':report},separators=(',',':')))
