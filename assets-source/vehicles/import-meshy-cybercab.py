"""Optimize user supplied Meshy GLB; source file is never written."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/vehicles'
SOURCE=Path('D:/Brands BCON/OpenCity/Models/CyberCAB Textured.glb')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
def bounds():
 bpy.context.view_layer.update();vs=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
 return Vector([min(v[i] for v in vs) for i in range(3)]),Vector([max(v[i] for v in vs) for i in range(3)])
lo,hi=bounds();print('IMPORTED_BOUNDS',list(lo),list(hi),flush=True)
# Meshy GLB is Y-up. Blender importer converts it to Z-up. Normalize only scale/ground placement.
if hi.x-lo.x>hi.y-lo.y:
 for o in objects:o.rotation_euler.z+=math.pi/2
lo,hi=bounds();scale=4.45/(hi.y-lo.y)
for o in objects:
 o.location*=scale;o.scale*=scale
lo,hi=bounds();center=(lo+hi)/2
for o in objects:o.location-=Vector((center.x,center.y,lo.z))
bpy.context.view_layer.update()
total=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 d=o.modifiers.new('Browser mesh 24k triangles','DECIMATE');d.ratio=min(1,24000/total);d.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=d.name)
 o.name='Meshy_Cybercab_Body';o['source']='User supplied Meshy textured GLB';o['wheels']='Joined static source mesh, no invented wheel rig'
for im in bpy.data.images:
 if im.type=='IMAGE' and im.size[0] and max(im.size)>1024:
  factor=1024/max(im.size);im.scale(round(im.size[0]*factor),round(im.size[1]*factor));im.pack()
for m in bpy.data.materials:
 if m.use_nodes:
  p=m.node_tree.nodes.get('Principled BSDF')
  if p:p.inputs['Metallic'].default_value=.45;p.inputs['Roughness'].default_value=.36
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'cybercab-meshy.glb'),export_format='GLB',use_selection=True,export_yup=True,export_image_format='AUTO')
lo,hi=bounds();report={'source':str(SOURCE),'sourceBytes':SOURCE.stat().st_size,'sourceTriangles':total,'gameTriangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),'gameBytes':(OUT/'cybercab-meshy.glb').stat().st_size,'boundsMin':list(lo),'boundsMax':list(hi),'materials':len({m for o in objects for m in o.data.materials}),'images':[{'name':im.name,'size':list(im.size)} for im in bpy.data.images if im.type=='IMAGE'],'wheelRig':'static joined mesh','lengthMetres':4.45,'scaleNote':'Uniformly scaled to estimated length; original proportions preserved'}
(OUT/'cybercab-meshy-validation.json').write_text(json.dumps(report,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.color=(.3,.3,.3)
for pos in [(4,3,6),(-4,-3,5),(2,-5,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);light=bpy.context.object;light.data.energy=1400;light.data.size=5;light.rotation_euler=(Vector((0,0,.7))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(6,7,3.7));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.7))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=6.4;scene.camera=cam
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.wm.save_as_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-meshy-review.blend')
scene.render.filepath=str(OUT/'cybercab-meshy-preview.png');bpy.ops.render.render(write_still=True)
print('MESHY_CYBERCAB_READY',json.dumps(report),flush=True)
