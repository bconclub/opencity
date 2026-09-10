"""Build editable Blender pedal-cycle scene from verified original Three geometry.
Run: blender --background --python assets-source/cycle.py
Re-export mesh JSON with node verify-cycle-asset.cjs after changing cycle-model.js.
"""
import bpy, json, pathlib
from mathutils import Matrix
root = pathlib.Path('D:/CodexTools/Blender')
nodes = json.loads((root / 'cycle-mesh.json').read_text())
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
objects = {}
materials = {}
for n in nodes:
    data = None
    if 'positions' in n:
        p = n['positions']; vertices = [p[i:i+3] for i in range(0,len(p),3)]
        ids = n['indices'] if n['indices'] is not None else list(range(len(vertices)))
        lines = n['lines']
        faces = [] if lines else [ids[i:i+3] for i in range(0,len(ids),3)]
        edges = [ids[i:i+2] for i in range(0,len(ids),2)] if lines else []
        data = bpy.data.meshes.new(n['name']); data.from_pydata(vertices,edges,faces); data.update()
    obj = bpy.data.objects.new(n['name'],data); bpy.context.collection.objects.link(obj)
    objects[n['id']] = obj
    if n.get('parent') in objects: obj.parent=objects[n['parent']]
    m=n['matrix']; obj.matrix_local=Matrix([[m[c*4+r] for c in range(4)] for r in range(4)])
    if data:
        key=str((n['color'],n['roughness'],n['metalness']))
        if key not in materials:
            mat=bpy.data.materials.new('Cycle material'); mat.diffuse_color=(*n['color'],1); mat.use_nodes=True
            shader=mat.node_tree.nodes.get('Principled BSDF'); shader.inputs['Base Color'].default_value=(*n['color'],1)
            shader.inputs['Roughness'].default_value=n['roughness']; shader.inputs['Metallic'].default_value=n['metalness']; materials[key]=mat
        obj.data.materials.append(materials[key])
        for poly in data.polygons: poly.use_smooth=True
bpy.context.scene.unit_settings.system='METRIC'
bpy.context.scene['source']='Original OpenCity cycle-model.js; not a downloaded asset'
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'cycle.blend'))
print('CYCLE_BLEND_READY', len(objects), 'objects')

