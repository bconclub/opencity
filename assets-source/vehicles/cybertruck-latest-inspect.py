import bpy, json, hashlib
from pathlib import Path

SOURCE=Path(r'D:/Brands BCON/OpenCity/Models/cYBER tRUCK.glb')
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/vehicles/cybertruck-latest-qc'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
def tris(o): return sum(max(0,len(p.vertices)-2) for p in o.data.polygons)
lo=[min((o.matrix_world@v.co)[i] for o in meshes for v in o.data.vertices) for i in range(3)]
hi=[max((o.matrix_world@v.co)[i] for o in meshes for v in o.data.vertices) for i in range(3)]
report={
 'source':str(SOURCE),'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'bytes':SOURCE.stat().st_size,'objects':len(meshes),'triangles':sum(map(tris,meshes)),
 'boundsMin':lo,'boundsMax':hi,'dimensions':[hi[i]-lo[i] for i in range(3)],
 'meshes':[{'name':o.name,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons),'triangles':tris(o),'materials':[m.name if m else None for m in o.data.materials]} for o in meshes],
 'materials':[{'name':m.name,'useNodes':m.use_nodes,'baseColor':list(m.diffuse_color),'images':sorted({n.image.name for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image}) if m.use_nodes else []} for m in bpy.data.materials],
 'images':[{'name':i.name,'size':list(i.size),'source':i.source,'packed':bool(i.packed_file),'filepath':i.filepath} for i in bpy.data.images],
}
(OUT/'cybertruck-latest-source-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
