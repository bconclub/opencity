import bpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(r"C:/Users/user/Documents/ChatGPT/Z");QC=ROOT/'qc/cybercab-latest'
bpy.ops.wm.open_mainfile(filepath=r"D:/CodexTools/Blender/projects/cybercab-latest-final.blend")
objs=[bpy.data.objects[n] for n in ['Body','Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR']]
scene=bpy.context.scene
for o in list(scene.objects):
 if o.type in {'LIGHT','CAMERA'}:bpy.data.objects.remove(o,do_unlink=True)
for pos,energy,size in [((4,5,6),1200,5),((-4,1,4),850,4),((1,-5,3),900,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=energy;l.data.size=size;l.rotation_euler=(Vector((0,0,.65))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5.8,6.6,3.1));cam=bpy.context.object;cam.data.lens=58;cam.rotation_euler=(Vector((0,0,.7))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
for o in objs[1:]:o.rotation_mode='XYZ';o.rotation_euler.x=1.0
for o in (objs[1],objs[2]):o.rotation_euler.z=.32
scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=640;scene.render.resolution_y=420;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(QC/'cybercab-latest-final-spin-steer.png');bpy.ops.render.render(write_still=True)
print('MOTION_RENDER_READY',flush=True)
