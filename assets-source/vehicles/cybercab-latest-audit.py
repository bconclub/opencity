import bpy, json, sys
from pathlib import Path
from mathutils import Vector

SOURCE = Path(r"D:/Brands BCON/OpenCity/Models/Cyber CAB.glb")
OUT = Path(r"C:/Users/user/Documents/ChatGPT/Z/qc/cybercab-latest-source-audit.json")
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.context.view_layer.update()
verts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = [min(v[i] for v in verts) for i in range(3)]
hi = [max(v[i] for v in verts) for i in range(3)]
report = {
  'source': str(SOURCE), 'bytes': SOURCE.stat().st_size,
  'meshCount': len(meshes),
  'objects': [{'name': o.name, 'vertices': len(o.data.vertices),
               'polygons': len(o.data.polygons),
               'triangles': sum(len(p.vertices)-2 for p in o.data.polygons),
               'materials': [m.name if m else None for m in o.data.materials]}
              for o in meshes],
  'boundsMin': lo, 'boundsMax': hi,
  'dimensions': [hi[i]-lo[i] for i in range(3)],
  'materials': [{'name': m.name, 'blend_method': getattr(m, 'surface_render_method', None),
                 'nodes': [{'name': n.name, 'type': n.type,
                            'image': n.image.name if n.type == 'TEX_IMAGE' and n.image else None}
                           for n in m.node_tree.nodes] if m.use_nodes else []}
                for m in bpy.data.materials],
  'images': [{'name': i.name, 'size': list(i.size), 'packed': bool(i.packed_file)}
             for i in bpy.data.images if i.type == 'IMAGE']
}
OUT.write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2), flush=True)
