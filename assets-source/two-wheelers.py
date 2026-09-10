"""Editable Blender copies of original browser assets, sourced from exported mesh JSON."""
import bpy, json, pathlib
from mathutils import Matrix
root = pathlib.Path('D:/CodexTools/Blender/projects/two-wheelers')
assets = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'two-wheelers'
assets.mkdir(parents=True, exist_ok=True)
for variant in ('yulu', 'bike', 'delivery', 'cycle'):
    nodes = json.loads((root / (variant + '.json')).read_text())
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    objects, materials = {}, {}
    for n in nodes:
        data = None
        if 'positions' in n:
            values = n['positions']
            vertices = [values[i:i+3] for i in range(0, len(values), 3)]
            ids = n['indices'] if n['indices'] is not None else list(range(len(vertices)))
            edges = [ids[i:i+2] for i in range(0, len(ids), 2)] if n['lines'] else []
            faces = [] if n['lines'] else [ids[i:i+3] for i in range(0, len(ids), 3)]
            data = bpy.data.meshes.new(n['name'])
            data.from_pydata(vertices, edges, faces)
            data.update()
        obj = bpy.data.objects.new(n['name'], data)
        bpy.context.collection.objects.link(obj)
        objects[n['id']] = obj
        if n.get('parent') in objects:
            obj.parent = objects[n['parent']]
        m = n['matrix']
        obj.matrix_local = Matrix([[m[c*4+r] for c in range(4)] for r in range(4)])
        if data:
            key = str((n['color'], n['roughness'], n['metalness']))
            if key not in materials:
                mat = bpy.data.materials.new('Body paint' if n['paint'] else 'Vehicle material')
                mat.diffuse_color = (*n['color'], 1)
                mat.use_nodes = True
                shader = mat.node_tree.nodes.get('Principled BSDF')
                shader.inputs['Base Color'].default_value = (*n['color'], 1)
                shader.inputs['Roughness'].default_value = n['roughness']
                shader.inputs['Metallic'].default_value = n['metalness']
                materials[key] = mat
            obj.data.materials.append(materials[key])
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene['source'] = 'Original OpenCity procedural geometry, no third-party model or brand logos'
    bpy.ops.wm.save_as_mainfile(filepath=str(root / (variant + '.blend')))
    bpy.ops.export_scene.gltf(filepath=str(assets / (variant + '.glb')), export_format='GLB', export_extras=True)
    print('VEHICLE_EXPORT_READY', variant, len(objects))
