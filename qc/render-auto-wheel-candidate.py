import bpy,math,pathlib
from mathutils import Vector,Quaternion
folder=pathlib.Path('qc/auto-wheel-candidate').resolve();bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(folder/'auto-rickshaw-rigged.glb'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16
scene.render.resolution_x=1000;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.color=(.3,.3,.3);scene.view_settings.view_transform='AgX'
bpy.ops.object.light_add(type='AREA',location=(1,3,5));bpy.context.object.data.energy=500;bpy.context.object.data.size=5
bpy.ops.object.light_add(type='AREA',location=(-3,-2,3));bpy.context.object.data.energy=250;bpy.context.object.data.size=4
bpy.ops.mesh.primitive_plane_add(size=200);plane=bpy.context.object;plane.name='Ground';plane.location.z=-.02
m=bpy.data.materials.new('Ground');m.diffuse_color=(.14,.17,.19,1);plane.data.materials.append(m)
bpy.ops.object.camera_add(location=(3.2,4,2));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.85))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=50;scene.camera=cam
for label,angle,steer in [('straight',0,0),('turned',1.1,.4)]:
 for name in ['Wheel_F','Wheel_RL','Wheel_RR']:
  o=bpy.data.objects[name];o.rotation_mode='QUATERNION';o.rotation_quaternion=Quaternion((1,0,0),-angle)
 pivot=bpy.data.objects['Steer_F'];pivot.rotation_mode='QUATERNION';pivot.rotation_quaternion=Quaternion((0,0,1),-steer)
 scene.render.filepath=str(folder/(label+'.png'));bpy.ops.render.render(write_still=True)
