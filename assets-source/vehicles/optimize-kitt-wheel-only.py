"""Blender review tool. Changes only four GLB index accessors, preserving other bytes."""
import json, struct, math, hashlib, collections, argparse, sys
from pathlib import Path

def read_glb(path):
    data=path.read_bytes(); length=struct.unpack_from('<I',data,12)[0]
    return json.loads(data[20:20+length]), data[28+length:]

def accessor(g,b,index):
    a=g['accessors'][index]; v=g['bufferViews'][a['bufferView']]
    code={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']]
    width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    size=struct.calcsize('<'+code*width); stride=v.get('byteStride',size)
    offset=v.get('byteOffset',0)+a.get('byteOffset',0)
    return [struct.unpack_from('<'+code*width,b,offset+i*stride) for i in range(a['count'])]

def components(positions,indices):
    parent={}
    keys=[tuple(round(x,5) for x in p) for p in positions]
    def find(x):
        parent.setdefault(x,x)
        while parent[x]!=x:
            parent[x]=parent[parent[x]]; x=parent[x]
        return x
    faces=[indices[i:i+3] for i in range(0,len(indices),3)]
    for face in faces:
        root=find(keys[face[0]])
        for i in face[1:]:parent[find(keys[i])]=root
    groups=collections.defaultdict(list)
    for face in faces:groups[find(keys[face[0]])].append(face)
    return list(groups.values())

def run(source,out,inspect=False):
    g,b=read_glb(source); original_g=json.loads(json.dumps(g)); original_b=b
    reports=[]
    for node in g['nodes']:
        if not (node.get('name','').startswith('Wheel_') and node['name'].endswith('_RubberTrim')):continue
        p=g['meshes'][node['mesh']]['primitives'][0]
        pos=accessor(g,b,p['attributes']['POSITION']); ind=[x[0] for x in accessor(g,b,p['indices'])]
        groups=components(pos,ind)
        counts=collections.Counter(map(len,groups))
        if inspect:
            print(node['name'],dict(counts)); continue
        tyre=[c for c in groups if len(c)==864]
        grooves=[c for c in groups if len(c)==16]
        if len(tyre)!=1 or len(grooves)!=40:
            raise ValueError(f'Unexpected wheel topology: {node["name"]} {counts}')
        tyre=tyre[0]; vertices={i for face in tyre for i in face}
        cy=(min(pos[i][1] for i in vertices)+max(pos[i][1] for i in vertices))/2
        cz=(min(pos[i][2] for i in vertices)+max(pos[i][2] for i in vertices))/2
        rings=collections.defaultdict(dict)
        for i in vertices:
            x,y,z=pos[i]; angle=round(math.atan2(y-cy,z-cz)*48/math.tau)%48
            rings[round(x,5)][angle]=i
        if len(rings)!=10 or any(len(r)!=48 for r in rings.values()):
            raise ValueError('Expected ten 48-segment tyre rings')
        remap={i:ring[k-k%2] for ring in rings.values() for k,i in ring.items()}
        newtyre=[]
        for face in tyre:
            mapped=tuple(remap[i] for i in face)
            if len(set(mapped))==3:newtyre.append(mapped)
        kept=[face for c in groups if c is not tyre and len(c)!=16 for face in c]
        final=kept+newtyre
        assert len(final)==1364, len(final)
        offset=len(b); b+=struct.pack('<'+'I'*(3*len(final)),*(i for face in final for i in face))
        view=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(b)-offset,'target':34963})
        # Only these four accessor definitions change. All original buffer bytes remain.
        a=dict(g['accessors'][p['indices']])
        p['indices']=len(g['accessors']);g['accessors'].append(a)
        a.update(bufferView=view,byteOffset=0,componentType=5125,count=3*len(final))
        a.pop('min',None);a.pop('max',None)
        reports.append({'node':node['name'],'before':len(ind)//3,'after':len(final),
                        'removed_tread_tubes':40,'tyre_segments_before':48,'tyre_segments_after':24,
                        'retained_vertex_positions':True,'retained_rim_trim_triangles':len(kept)})
    if inspect:return
    assert len(reports)==4
    g['buffers'][0]['byteLength']=len(b)
    encoded=json.dumps(g,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
    b+=b'\0'*((-len(b))%4)
    candidate=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(b))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(b),b'BIN\0')+b
    out.mkdir(parents=True,exist_ok=True)
    dest=out/'kitt-wheel-candidate.glb'
    if dest.exists():raise FileExistsError(dest)
    dest.write_bytes(candidate)
    fixed=[]
    for n in g['nodes']:
        if 'mesh' not in n or n['name'].endswith('_RubberTrim') and n['name'].startswith('Wheel_'):continue
        mesh=g['meshes'][n['mesh']]
        assert mesh==original_g['meshes'][n['mesh']]
        hashes={}
        for pi,p in enumerate(mesh['primitives']):
            for label,ai in dict(p['attributes'],indices=p['indices']).items():
                assert g['accessors'][ai]==original_g['accessors'][ai]
                a=g['accessors'][ai];v=g['bufferViews'][a['bufferView']];start=v.get('byteOffset',0)
                payload=b[start:start+v['byteLength']]
                assert payload==original_b[start:start+v['byteLength']]
                hashes[f'{pi}:{label}']=hashlib.sha256(payload).hexdigest()
        fixed.append({'node':n['name'],'buffer_view_sha256':hashes})
    assert g['nodes']==original_g['nodes'] and g['materials']==original_g['materials']
    assert b[:len(original_b)]==original_b
    total=sum(g['accessors'][p['indices']]['count']//3 for n in g['nodes'] if 'mesh'in n for p in g['meshes'][n['mesh']]['primitives'])
    report={'status':'PENDING_VISUAL_REVIEW','source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
            'candidate_sha256':hashlib.sha256(candidate).hexdigest(),'triangles_after':total,'triangle_reduction':4288,
            'nodes_and_materials_identical':True,'original_binary_prefix_identical':True,'wheels':reports,'unchanged_meshes':fixed,
            'limits':'24-sided tyre radius retains 0.321m vertex extrema; tread tubes removed. Maximum polygon sagitta 2.747mm versus 0.687mm at 48 segments. All rim vertices/indices remain unchanged. Original unused indices/vertices remain in binary, so file size is not optimized.'}
    (out/'geometry-audit.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='unchanged_meshes'},indent=2))
    return dest

def capture(source,candidate,out):
    import bpy
    from mathutils import Vector
    for state,path in [('current',source),('candidate',candidate)]:
        bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
        bpy.ops.import_scene.gltf(filepath=str(path))
        scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8
        scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=3
        scene.render.resolution_x=1000;scene.render.resolution_y=650;scene.render.resolution_percentage=100
        scene.world.color=(.22,.22,.22)
        for position,power,size in [((4,4,6),1600,5),((-4,1,3),1200,4),((0,-5,4),1000,4)]:
            bpy.ops.object.light_add(type='AREA',location=position);lamp=bpy.context.object
            lamp.data.energy=power;lamp.data.size=size
            lamp.rotation_euler=(Vector((0,0,.6))-lamp.location).to_track_quat('-Z','Y').to_euler()
        bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
        for view,position,target,scale in [('full',(-5.8,7,3), (0,0,.65),5.6),
                                            ('wheel',(-3.8,2.8,1.15),(-.762,1.2827,.321),1.03)]:
            cam.location=position;cam.data.ortho_scale=scale
            cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
            scene.render.filepath=str(out/f'{state}-{view}.png');bpy.ops.render.render(write_still=True)
        if state=='candidate':
            bpy.ops.wm.save_as_mainfile(filepath=str(out/'kitt-wheel-candidate.blend'))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--out',type=Path,required=True);parser.add_argument('--inspect',action='store_true')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else None)
    if not args.inspect and args.out.resolve().drive.upper()!='D:':raise ValueError('Blender outputs must be on D:')
    destination=run(args.source,args.out,args.inspect)
    if destination:capture(args.source,destination,args.out)
