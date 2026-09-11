"""CPU regression: classified material ownership and legacy asset identity."""
import sys,json,tempfile,subprocess,itertools,hashlib,struct
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import Polygon,Point
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parent.parent
NODE='C:/Program Files/nodejs/node.exe'
LEGACY_SHA='87fe720941fc52856fd04f8ffa47f16df1bd363c56017530af65e6436a46b0dc'

def polygons(mesh):
    p=mesh['positions']
    return [Polygon([(p[k*3],p[k*3+2]) for k in mesh['indices'][i:i+3]]) for i in range(0,len(mesh['indices']),3)]

def fixture(role,value):
    return {'positions':[0,0,0,10,0,0,0,0,10],'normals':[0,1,0]*3,'indices':[0,1,2],
            'color':[value]*3,'texture':None,'uvs':[],'surfaceRole':role,'groundEligible':True}

with tempfile.TemporaryDirectory(prefix='street-cleaner-regression-') as tmp:
    tmp=Path(tmp)
    def clean(meshes):
        p=tmp/'input.json';p.write_text(json.dumps(meshes),encoding='utf-8')
        return json.loads(subprocess.check_output([sys.executable,str(ROOT/'verify-street-patch-clean.py'),str(p)],cwd=ROOT))
    def areas(result):
        return {m['surfaceRole']:unary_union(polygons(m)).area for m in result['meshes']}

    asphalt=fixture('asphalt',.3);concrete=fixture('concrete',.55);marking=fixture('marking',.9)
    orders=0
    # Exactly identical triangles must not discard higher-priority material
    # merely because lower-priority source geometry appears first.
    for sequence in itertools.permutations([asphalt,concrete]):
        result=clean(sequence);a=areas(result)
        assert abs(a.get('concrete',0)-50)<1e-9 and a.get('asphalt',0)==0,a
        orders+=1
    for sequence in itertools.permutations([asphalt,concrete,marking]):
        result=clean(sequence);a=areas(result)
        assert abs(a.get('marking',0)-50)<1e-9 and a.get('concrete',0)==a.get('asphalt',0)==0,a
        orders+=1
    duplicated=clean([asphalt,asphalt,concrete])
    assert duplicated['report']['duplicatesRemoved']==1
    assert abs(areas(duplicated)['concrete']-50)<1e-9

    # Geometry with distinct grounding eligibility must remain distinguishable.
    furniture={**concrete,'groundEligible':False}
    eligible=clean([concrete,furniture])['meshes']
    assert sum(len(m['indices'])//3 for m in eligible if m.get('groundEligible',True))==1
    assert sum(len(m['indices'])//3 for m in eligible if not m.get('groundEligible',True))==1

    # Actual two-triangle regression, original source mesh IDs 798 and 800.
    source=json.loads((ROOT/'experiments/osm2world/coverage-500-classified/meshes.json').read_text())
    pair={m['sourceMeshIndex']:m for m in source if m['sourceMeshIndex'] in (798,800)}
    assert set(pair)=={798,800}
    for sequence in [list(pair.values()),list(reversed(list(pair.values())))]:
        result=clean(sequence)
        expected=unary_union(polygons(pair[800]));actual=unary_union([p for m in result['meshes'] if m['surfaceRole']=='concrete' for p in polygons(m)])
        assert expected.symmetric_difference(actual).area<1e-8
    duplicates=[]
    for a in polygons(pair[798]):
        if any(a.equals(b) for b in polygons(pair[800])):duplicates.append(a)
    assert len(duplicates)==2
    repaired_area=sum(p.area for p in duplicates)
    assert abs(repaired_area-1.0012245385373653)<1e-8

    # Verify final emitted GLB ownership as well as cleaner intermediates.
    asset=ROOT/'experiments/osm2world/coverage-500-classified/asset/vidhana-streets.glb'
    blob=asset.read_bytes();n=struct.unpack_from('<I',blob,12)[0];doc=json.loads(blob[20:20+n]);binary=28+n
    def accessor(i):
        a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];count=a['count']*({'SCALAR':1,'VEC3':3}[a['type']]);fmt={5126:'f',5125:'I'}[a['componentType']]
        return struct.unpack_from('<'+str(count)+fmt,blob,binary+v.get('byteOffset',0)+a.get('byteOffset',0))
    final=[]
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            p=accessor(primitive['attributes']['POSITION']);idx=accessor(primitive['indices']);role=doc['materials'][primitive['material']]['extras']['streetSurfaceRole']
            for i in range(0,len(idx),3):
                polygon=Polygon([(p[j*3],p[j*3+1]) for j in idx[i:i+3]])
                if polygon.area>1e-8:final.append((role,polygon))
    owners=[]
    for triangle in duplicates:
        point=triangle.centroid;roles=[role for role,p in final if p.covers(point)]
        assert roles==['concrete'],roles
        owners.append({'pointLocalXY':list(point.coords)[0],'roles':roles})

    # Rebuild old input into temporary output and compare actual binary bytes.
    subprocess.check_output([NODE,str(ROOT/'verify-street-patch-build.cjs'),'--source',str(ROOT/'experiments/osm2world/sample-meshes.json'),'--output',str(tmp/'legacy'),'--origin','77.5907159,12.9797946'],cwd=ROOT)
    legacy=(tmp/'legacy/vidhana-streets.glb').read_bytes()
    assert hashlib.sha256(legacy).hexdigest()==LEGACY_SHA,'legacy GLB binary changed'
    metadata=json.loads((tmp/'legacy/vidhana-streets.json').read_text())
    assert 'groundIndexURL' not in metadata,'legacy path unexpectedly enabled sidecar'

    report={'passed':True,'cpuOnly':True,'sourceOrdersTested':orders+2,'duplicateWithinMaterialRemoved':True,
            'groundEligibilityPreserved':True,'repairedConcreteAreaM2':repaired_area,'actualGlbOwnership':owners,
            'candidateGlbSHA256':hashlib.sha256(blob).hexdigest(),'legacyGlbSHA256':LEGACY_SHA,'legacyByteIdentity':True}
    (ROOT/'qc/street-500-runtime-cleaner-results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
