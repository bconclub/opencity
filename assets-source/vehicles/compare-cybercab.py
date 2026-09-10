"""Render the three treatments under identical studio lighting and scale."""
import bpy, math
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles'
versions=[('generated','cybercab-v2-review.blend',True),('smoothed','cybercab-v2-clean.blend',False),('recoloured','cybercab-polished.blend',False)]
for label,file,reverse in versions:
 bpy.ops.wm.open_mainfile(filepath='D:/CodexTools/Blender/projects/'+file)
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
 if reverse:
  for o in objects:o.matrix_world=Matrix.Rotation(math.pi,4,'Z')@o.matrix_world
 scene=bpy.context.scene;scene.cycles.samples=24;scene.cycles.use_denoising=True
 scene.render.resolution_x=1000;scene.render.resolution_y=680;scene.render.resolution_percentage=100
 cam=scene.camera;cam.location=(6,7,3);cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=5.8
 scene.render.filepath=str(OUT/f'compare-{label}.png');bpy.ops.render.render(write_still=True)
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'compare-{label}.glb'),export_format='GLB',use_selection=True,export_yup=True)
 print('COMPARISON_READY',label,flush=True)
