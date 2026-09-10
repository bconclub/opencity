import bpy,os,json,math
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'));OUT=os.path.join(ROOT,'assets','vehicles')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='D:/Brands BCON/OpenCity/Models/Auto Driver.glb')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
info={'source':'User supplied D:/Brands BCON/OpenCity/Models/Auto Driver.glb','source_triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),'rigged':False,'animated':False}
for o in objects:
 bpy.context.view_layer.objects.active=o
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00004);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
 d=o.modifiers.new('Mobile candidate 12k','DECIMATE');d.ratio=12000/info['source_triangles'];bpy.ops.object.modifier_apply(modifier=d.name);o.name='UserAutoDriver'
for im in bpy.data.images:
 if im.size[0]>1024 or im.size[1]>1024:im.scale(1024,1024);im.pack()
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'auto-driver-candidate.glb'),export_format='GLB',use_selection=True,export_yup=True)
verts=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box];lo=Vector([min(v[i] for v in verts) for i in range(3)]);hi=Vector([max(v[i] for v in verts) for i in range(3)]);center=(lo+hi)/2;span=max(hi-lo)
info.update({'candidate_triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),'blender_bounds_min':list(lo),'blender_bounds_max':list(hi),'materials':len({m.name for o in objects for m in o.data.materials}),'textures':[{'name':im.name,'size':list(im.size)} for im in bpy.data.images]})
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.world.color=(.22,.22,.22)
for pos in [Vector((2,3,4)),Vector((-3,-1,2))]:
 bpy.ops.object.light_add(type='AREA',location=center+pos*span);o=bpy.context.object;o.data.energy=500*span**2;o.data.size=span*3;o.rotation_euler=(center-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=center+Vector((2,-3,1.4))*span);cam=bpy.context.object;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span*1.4;scene.camera=cam
scene.render.filepath=os.path.join(OUT,'auto-driver-candidate-preview.png');bpy.ops.render.render(write_still=True)
with open(os.path.join(OUT,'auto-driver-validation.json'),'w') as f:json.dump(info,f,indent=2)
print(json.dumps(info))
