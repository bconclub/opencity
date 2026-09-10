"""Remove generated surface noise while retaining the reconstructed silhouette and colour texture."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles'
bpy.ops.wm.open_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-v2-review.blend')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 # The review establishes that the imported nose points -Y. Game uses +Y.
 o.matrix_world=Matrix.Rotation(math.pi,4,'Z')@o.matrix_world
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 if o.data.has_custom_normals:bpy.ops.mesh.customdata_custom_splitnormals_clear()
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
 bpy.ops.mesh.remove_doubles(threshold=.00005);bpy.ops.mesh.normals_make_consistent(inside=False)
 bpy.ops.object.mode_set(mode='OBJECT')
 for p in o.data.polygons:p.use_smooth=True
 smooth=o.modifiers.new('Subtle reconstruction cleanup','SMOOTH');smooth.factor=.4;smooth.iterations=4
 bpy.ops.object.modifier_apply(modifier=smooth.name)
 for m in o.data.materials:
  p=m.node_tree.nodes.get('Principled BSDF')
  for name in ['Normal','Metallic','Roughness']:
   for l in list(p.inputs[name].links):m.node_tree.links.remove(l)
  p.inputs['Metallic'].default_value=.28;p.inputs['Roughness'].default_value=.48
def export(name):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True,export_yup=True)
export('cybercab-v2.glb')
scene=bpy.context.scene;scene.cycles.use_denoising=True
cam=scene.camera
for angle,pos in [('front',(6,7,3.3)),('rear',(-6,-7,3.3)),('side',(8,0,2.2))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(OUT/f'cybercab-v2-{angle}.png');bpy.ops.render.render(write_still=True)
cam.location=(6,7,3.3);cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-v2-clean.blend')
tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
for o in objects:
 bpy.context.view_layer.objects.active=o
 d=o.modifiers.new('Traffic LOD','DECIMATE');d.ratio=min(1,6000/tris);d.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=d.name)
export('cybercab-v2-lod.glb')
report=json.loads((OUT/'cybercab-v2-validation.json').read_text());report.update(bytes=(OUT/'cybercab-v2.glb').stat().st_size,lodBytes=(OUT/'cybercab-v2-lod.glb').stat().st_size,lodTriangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),cleanup='Recomputed smooth normals, four light smoothing iterations, retained base colour; removed noisy generated PBR maps',forward='+Y')
(OUT/'cybercab-v2-validation.json').write_text(json.dumps(report,indent=2))
print('CLEAN_READY',json.dumps(report),flush=True)
