"""User-selected original Meshy appearance; no smoothing, recolouring or normal edits."""
import bpy, math, json
from pathlib import Path
from mathutils import Matrix
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles'
(OUT/'cybercab-meshy-approved.glb').write_bytes((OUT/'compare-generated.glb').read_bytes())
bpy.ops.wm.open_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-v2-review.blend')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in objects:
 o.matrix_world=Matrix.Rotation(math.pi,4,'Z')@o.matrix_world
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 d=o.modifiers.new('Traffic LOD only','DECIMATE');d.ratio=6000/24848;d.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=d.name)
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'cybercab-meshy-traffic.glb'),export_format='GLB',use_selection=True,export_yup=True)
(OUT/'cybercab-approved.json').write_text(json.dumps({'provenance':'Meshy7 reconstruction from three generated references, selected by user after comparison','playerTriangles':24848,'trafficTriangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),'materials':1,'textureMax':1024,'appearance':'Unmodified Meshy textures and normals','wheels':'Joined static mesh','playerBytes':(OUT/'cybercab-meshy-approved.glb').stat().st_size,'trafficBytes':(OUT/'cybercab-meshy-traffic.glb').stat().st_size},indent=2))
