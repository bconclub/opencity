"""Prepare generated Cybercab without changing its geometry or supplied originals."""
import bpy, math, json, os
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/vehicles'
SOURCE=Path('D:/CodexTools/Meshy/cybercab-v2/source.glb')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
def bounds():
 bpy.context.view_layer.update()
 vs=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
 return Vector([min(v[i] for v in vs) for i in range(3)]),Vector([max(v[i] for v in vs) for i in range(3)])
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
lo,hi=bounds();print('SOURCE_BOUNDS',list(lo),list(hi),flush=True)
if hi.x-lo.x>hi.y-lo.y:
 for o in objects:o.matrix_world=Matrix.Rotation(math.pi/2,4,'Z')@o.matrix_world
lo,hi=bounds();scale=4.45/(hi.y-lo.y)
for o in objects:o.matrix_world=Matrix.Scale(scale,4)@o.matrix_world
lo,hi=bounds();offset=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))
for o in objects:o.matrix_world=Matrix.Translation(offset)@o.matrix_world
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 o.name='Meshy_Cybercab_ClosedDoors';o['provenance']='Meshy reconstruction from three AI-generated reference views; not manufacturer CAD'
for im in bpy.data.images:
 if im.type=='IMAGE' and im.size[0] and max(im.size)>1024:
  factor=1024/max(im.size);im.scale(round(im.size[0]*factor),round(im.size[1]*factor));im.pack()
def export(filename):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,export_yup=True)
export('cybercab-v2.glb')
lo,hi=bounds();tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
report={'source':str(SOURCE),'triangles':tris,'bytes':(OUT/'cybercab-v2.glb').stat().st_size,'boundsMin':list(lo),'boundsMax':list(hi),'materials':len({m for o in objects for m in o.data.materials}),'provenance':'Meshy reconstruction from generated images','wheels':'Joined static source mesh','estimatedLength':4.45}
(OUT/'cybercab-v2-validation.json').write_text(json.dumps(report,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.color=(.28,.28,.28)
for pos in [(4,3,6),(-4,-3,5),(2,-5,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=1200;o.data.size=5;o.rotation_euler=(Vector((0,0,.6))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(6,7,3.3));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.8;scene.camera=cam
for angle,pos in [('front',(6,7,3.3)),('rear',(-6,-7,3.3)),('side',(8,0,2.2))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(OUT/f'cybercab-v2-{angle}.png');bpy.ops.render.render(write_still=True)
cam.location=(6,7,3.3);cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.wm.save_as_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-v2-review.blend')
# Traffic uses a separate lower-detail mesh while preserving the same textures.
for o in objects:
 bpy.context.view_layer.objects.active=o
 d=o.modifiers.new('Traffic LOD','DECIMATE');d.ratio=min(1,6000/tris);d.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=d.name)
export('cybercab-v2-lod.glb')
print('CANDIDATE_READY',json.dumps(report),flush=True)
