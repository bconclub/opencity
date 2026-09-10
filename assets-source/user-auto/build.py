import bpy,json,os,math
from mathutils import Vector
root=os.path.dirname(__file__)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=os.path.join(root,'source','Auto.fbx'))
report=[]
for o in bpy.context.scene.objects:
 if o.type=='MESH':report.append({'name':o.name,'dims':list(o.dimensions),'location':list(o.location),'vertices':len(o.data.vertices),'materials':[m.name for m in o.data.materials]})
print('AUTO_REPORT '+json.dumps(report))
for m in bpy.data.materials:
 print('MATERIAL',m.name,[(n.name,n.type, n.image.filepath if n.type=='TEX_IMAGE' and n.image else '')for n in m.node_tree.nodes] if m.use_nodes else '')
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
obj.rotation_euler.x=0;obj.rotation_euler.z=math.pi
bpy.context.view_layer.update()
pts=[obj.matrix_world@Vector(c) for c in obj.bound_box]
obj.location.x-=(min(p.x for p in pts)+max(p.x for p in pts))/2
obj.location.y-=(min(p.y for p in pts)+max(p.y for p in pts))/2
obj.location.z-=min(p.z for p in pts)
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for m in obj.data.materials:
 m.use_nodes=True;nodes=m.node_tree.nodes;links=m.node_tree.links;p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
 for node in list(nodes):
  if node.type not in ['BSDF_PRINCIPLED','OUTPUT_MATERIAL']:nodes.remove(node)
 for filename,socket,normal in [('Auto_textures.png','Base Color',False),('auto_roughness.png','Roughness',False),('auto_normals.png','Normal',True)]:
  image=bpy.data.images.load(os.path.join(root,'textures',filename),check_existing=True)
  if socket!='Base Color':image.colorspace_settings.name='Non-Color'
  image.scale(1024,1024);image.pack()
  node=nodes.new('ShaderNodeTexImage');node.image=image
  if normal:
   norm=nodes.new('ShaderNodeNormalMap');norm.inputs['Strength'].default_value=.6;links.new(node.outputs['Color'],norm.inputs['Color']);links.new(norm.outputs['Normal'],p.inputs['Normal'])
  else:links.new(node.outputs['Color'],p.inputs[socket])
 p.inputs['Metallic'].default_value=.05
obj.name='User_Auto_Rickshaw'
output=os.path.abspath(os.path.join(root,'..','..','assets','auto'));os.makedirs(output,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(output,'auto-rickshaw.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False)
bpy.ops.wm.save_as_mainfile(filepath='D:/CodexTools/Blender/projects/user-auto-rickshaw.blend')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=800;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.world.color=(.35,.35,.35)
bpy.ops.object.light_add(type='AREA',location=(3,-4,6));bpy.context.object.data.energy=450;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(4,-5,3));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam;cam.data.lens=48
scene.render.filepath='D:/CodexTools/Blender/user-auto-preview.png';bpy.ops.render.render(write_still=True)



