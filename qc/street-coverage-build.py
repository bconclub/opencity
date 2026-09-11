"""Review-only, exact polygon area coverage atlas for the accepted street patch.

No supersampled triangle edges: integrate unioned material polygons over texels.
All colours are premultiplied LINEAR diffuse colour, never alpha transparency.
"""
import sys, json, math, hashlib
from pathlib import Path
sys.path.insert(0, 'D:/CodexTools/python-libs')
import numpy as np
import shapely
from shapely.geometry import Polygon, GeometryCollection
from shapely.ops import unary_union
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT/'experiments/osm2world/sample-meshes.json'
source = json.loads(SOURCE.read_text())
N = 1024
groups = {}
for mesh in source:
    color = tuple(mesh['color'])
    polygons = groups.setdefault(color, [])
    for i in range(0, len(mesh['indices']), 3):
        vertices = [mesh['positions'][j*3:j*3+3] for j in mesh['indices'][i:i+3]]
        if all(abs(v[1]) < 1e-8 for v in vertices):
            p = Polygon([(v[0], v[2]) for v in vertices])
            if p.area > 1e-8: polygons.append(p)
unions = {c: unary_union(p) for c,p in groups.items()}
def role(c):
    # Match the accepted GLB's source sRGB colours, before GLTF linear conversion.
    return 'marking' if c[0] > .8 else 'concrete' if c[0] > .5 else 'paving' if c[0] > .35 else 'asphalt'
assert len(unions)==4
paint = unary_union([p for c,p in unions.items() if role(c)=='marking'])
underlying = {}; covered = GeometryCollection()
for c,p in sorted(unions.items(), reverse=True):
    if role(c)=='marking': continue
    owned = p.difference(covered)
    underlying[role(c)] = paint.intersection(owned).area
    covered = covered.union(p)
unmapped_paint = paint.difference(covered).area
print('Source paint ownership:',json.dumps({'paintM2':paint.area,'underlyingM2':underlying,'unsupportedM2':unmapped_paint}),flush=True)
assert unmapped_paint<1e-5, 'Cannot infer material beneath unsupported paint'

# Match exact procedural texture pixel means in linear colour, including uint8 truncation.
def linear(v):
    v=np.asarray(v,dtype=float)
    return np.where(v<=.04045,v/12.92,((v+.055)/1.055)**2.4)
def texture_mean(kind):
    state=15497 if kind=='asphalt' else 991
    values=[]
    for i in range(256*256):
        state=(state*1664525+1013904223)&0xffffffff; grain=state/4294967296
        state=(state*1664525+1013904223)&0xffffffff; fine=state/4294967296
        value=157+(grain-.5)*42+(26 if fine>.976 else 0) if kind=='asphalt' else 205+(grain-.5)*13-(12 if fine>.97 else 0)
        values.append(int(max(0,min(255,value)))/255)
    return float(linear(values).mean())
base={'marking':'ecebe2','concrete':'a6a9ab','paving':'92958d','asphalt':'626b70'}
mean={k:texture_mean(k) for k in ('asphalt','concrete')}
colours={k:linear([int(v[i:i+2],16)/255 for i in (0,2,4)])*(1 if k=='marking' else mean['asphalt' if k=='asphalt' else 'concrete']) for k,v in base.items()}

footprint=unary_union(list(unions.values()))
rawbounds=footprint.bounds
# One-texel empty border, with square metric texels for derivative consistency.
side=max(rawbounds[2]-rawbounds[0],rawbounds[3]-rawbounds[1])*N/(N-2)
cx=(rawbounds[0]+rawbounds[2])/2; cy=(rawbounds[1]+rawbounds[3])/2
bounds=[cx-side/2,cy-side/2,cx+side/2,cy+side/2]
step=side/N; cellarea=step*step
owned=[];covered=GeometryCollection()
for c,p in sorted(unions.items(),reverse=True):
    owned.append((role(c),p.difference(covered)))
    covered=covered.union(p)
rgba=np.zeros((N,N,4),dtype=np.float64)
areas={}
for name, polygon in owned:
    total=0.
    for y0 in range(0,N,16):
        ys,xs=np.mgrid[y0:min(y0+16,N),0:N]
        # PNG top row is north. TextureLoader flipY gives v=0 at south.
        x=bounds[0]+xs.ravel()*step; y=bounds[3]-(ys.ravel()+1)*step
        cells=shapely.box(x,y,x+step,y+step)
        hit=shapely.intersects(cells,polygon)
        coverage=np.zeros(len(cells))
        coverage[hit]=shapely.area(shapely.intersection(cells[hit],polygon))/cellarea
        total+=coverage.sum()*cellarea
        shape=(min(16,N-y0),N)
        a=coverage.reshape(shape)
        rgba[y0:y0+shape[0],:,:3]+=a[:,:,None]*colours[name]
        rgba[y0:y0+shape[0],:,3]+=a
    areas[name]={'sourceM2':polygon.area,'atlasIntegratedM2':total,'errorM2':total-polygon.area}
    assert abs(total-polygon.area)<1e-5
assert rgba[:,:,3].max()<1.000001
image=np.uint8(np.round(np.clip(rgba,0,1)*255))
out=ROOT/'qc/street-coverage-atlas.png'
Image.fromarray(image,'RGBA').save(out)
gpu_atlas=sum(max(1,N>>i)**2*4 for i in range(int(math.log2(N))+1))
gpu_grain=2*sum(max(1,256>>i)**2*4 for i in range(9))
report={'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'size':N,'bounds':bounds,'texelMetres':step,'encoding':'RGBA8 premultiplied linear diffuse RGB, geometric coverage in A; sampled opacity remains 1','atlasGpuBytesIncludingMips':gpu_atlas,'existingGrainGpuBytesIncludingMips':gpu_grain,'totalSurfaceGpuBytes':gpu_atlas+gpu_grain,'atlasDownloadBytes':out.stat().st_size,'sourceUnderPaintM2':underlying,'unsupportedPaintM2':unmapped_paint,'areaChecks':areas,'linearDiffuseColours':{k:v.tolist() for k,v in colours.items()},'textureMeansLinear':mean,'quantizationMaxLinearError':.5/255}
(ROOT/'qc/street-coverage-atlas.json').write_text(json.dumps(report,indent=2))
assert report['totalSurfaceGpuBytes']<=8*1024*1024
print(json.dumps(report,indent=2))
