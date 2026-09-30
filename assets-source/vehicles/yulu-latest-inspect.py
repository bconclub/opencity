import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets-source' / 'vehicles' / 'candidates'
OUT.mkdir(parents=True, exist_ok=True)
kind = sys.argv[sys.argv.index('--') + 1]
source = Path('D:/Brands BCON/OpenCity/Models/Yulu.glb' if kind == 'yulu' else 'D:/Brands BCON/OpenCity/Models/Delivery Rider.glb')

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
bpy.context.view_layer.update()
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
def tris(o): return sum(len(p.vertices)-2 for p in o.data.polygons)
def bounds(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return [min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]
lo, hi = bounds(meshes)
report = {
    'source': str(source), 'bytes': source.stat().st_size,
    'triangles': sum(tris(o) for o in meshes), 'materials': sorted({m.name for o in meshes for m in o.data.materials if m}),
    'images': [{'name': i.name, 'size': list(i.size), 'packed': bool(i.packed_file)} for i in bpy.data.images if i.type == 'IMAGE'],
    'boundsMin': lo, 'boundsMax': hi, 'dimensions': [hi[i]-lo[i] for i in range(3)],
    'objects': [{'name':o.name, 'triangles':tris(o), 'vertices':len(o.data.vertices), 'materials':[m.name for m in o.data.materials if m],
                 'location':list(o.matrix_world.translation), 'dimensions':list(o.dimensions), 'parent':o.parent.name if o.parent else None} for o in meshes],
}
(OUT / f'{kind}-latest-source-report.json').write_text(json.dumps(report, indent=2))

# Neutral studio render, source untouched.
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE_NEXT'; scene.render.resolution_x=900; scene.render.resolution_y=650; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.film_transparent=False
scene.world=bpy.data.worlds.new('Studio World'); scene.world.color=(0.035,0.035,0.035)
center=Vector([(lo[i]+hi[i])/2 for i in range(3)]); span=max(hi[i]-lo[i] for i in range(3))
bpy.ops.object.light_add(type='AREA', location=center+Vector((span*1.8,-span*1.8,span*2.2))); bpy.context.object.data.energy=1800; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=span*2
bpy.ops.object.light_add(type='AREA', location=center+Vector((-span*1.5,span,span))); bpy.context.object.data.energy=1000; bpy.context.object.data.size=span
bpy.ops.object.camera_add(location=center+Vector((span*1.8,-span*2.3,span*1.35)))
cam=bpy.context.object; scene.camera=cam
def point(o,p): o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
point(cam, center); cam.data.type='ORTHO'; cam.data.ortho_scale=span*1.35
scene.render.filepath=str(OUT/f'{kind}-latest-source.png'); bpy.ops.render.render(write_still=True)
print(json.dumps(report))
