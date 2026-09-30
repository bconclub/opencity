"""Create review picker image and traffic LOD from cybercab-latest candidate."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector

ROOT=Path(r"C:/Users/user/Documents/ChatGPT/Z");QC=ROOT/'qc/cybercab-latest'
BLEND=Path(r"D:/CodexTools/Blender/projects/cybercab-latest-final.blend")
TRAFFIC=ROOT/'assets/vehicles/cybercab-latest-traffic.glb'
bpy.ops.wm.open_mainfile(filepath=str(BLEND))
objects=[bpy.data.objects[n] for n in ['Body','Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR']]
scene=bpy.context.scene
for o in list(scene.objects):
 if o.type in {'LIGHT','CAMERA'}:bpy.data.objects.remove(o,do_unlink=True)
scene.world.color=(.035,.035,.035);scene.render.film_transparent=True
for pos,energy,size in [((4,5,6),1200,5),((-4,1,4),850,4),((1,-5,3),900,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=energy;l.data.size=size;l.rotation_euler=(Vector((0,0,.65))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5.8,6.6,3.1));cam=bpy.context.object;cam.data.lens=58;cam.rotation_euler=(Vector((0,0,.7))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=640;scene.render.resolution_y=420;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(QC/'cybercab-latest-final-picker.png')
bpy.ops.render.render(write_still=True)
# Proof frame: independent wheel spin plus front steering around corrected pivots.
for o in objects[1:]:o.rotation_mode='XYZ';o.rotation_euler.x=1.0
for o in (objects[1],objects[2]):o.rotation_euler.z=.32
scene.render.film_transparent=False;scene.render.filepath=str(QC/'cybercab-latest-spin-steer.png')
if not Path(scene.render.filepath).exists():bpy.ops.render.render(write_still=True)
for o in objects[1:]:o.rotation_euler=(0,0,0)

# Independent 6k LOD, retaining hierarchy/material/UVs and usable wheel pivots.
lod_meshes=[(objects[0],4800)]+[(m,150) for root in objects[1:] for m in root.children if m.type=='MESH']
for o,target in lod_meshes:
 before=sum(len(p.vertices)-2 for p in o.data.polygons)
 if before>target:
  bpy.context.view_layer.objects.active=o;o.select_set(True);d=o.modifiers.new('Traffic Decimate','DECIMATE');d.ratio=target/before;d.use_collapse_triangulate=True
  bpy.ops.object.modifier_apply(modifier=d.name);o.select_set(False)
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
for root in objects:
 for child in root.children:child.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(TRAFFIC),export_format='GLB',use_selection=True,export_yup=True)
report={'trafficCandidate':str(TRAFFIC),'bytes':TRAFFIC.stat().st_size,
 'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o,_ in lod_meshes),
 'triangleBreakdown':{o.name:sum(len(p.vertices)-2 for p in o.data.polygons) for o,_ in lod_meshes},
 'materials':len({m.name for o,_ in lod_meshes for m in o.data.materials if m}),
 'textures':[{'name':i.name,'size':list(i.size)} for i in bpy.data.images if i.type=='IMAGE'],
 'wheelNodes':[o.name for o in objects[1:]],'picker':str(QC/'cybercab-latest-picker.png'),
 'limitation':'Aggressive 6k collapse from 1.94M-triangle source; intended for traffic distance only.'}
(QC/'cybercab-latest-traffic-report.json').write_text(json.dumps(report,indent=2));print('LATEST_FINALIZED',json.dumps(report),flush=True)
