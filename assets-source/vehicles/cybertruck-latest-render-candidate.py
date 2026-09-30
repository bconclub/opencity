import bpy, json, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles/cybertruck-latest-qc';GLB=OUT/'cybertruck-latest-candidate-quality-150k.glb'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(GLB))
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=640;scene.render.resolution_y=420;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.world=bpy.data.worlds.new('TransparentStudio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.055,.065,.08,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.6
for loc,energy,size in [((-4,3,7),1500,5),((4,1,4),900,4),((0,-5,2),700,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);bpy.context.object.data.energy=energy;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=size
bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,-.012));ground=bpy.context.object
mat=bpy.data.materials.new('PickerGround');mat.diffuse_color=(.11,.12,.14,1);mat.roughness=.82;ground.data.materials.append(mat)
ground.hide_render=True
bpy.ops.object.camera_add(location=(-6.9,8.6,4.7));cam=bpy.context.object;scene.camera=cam;cam.data.lens=65;cam.rotation_euler=(Vector((0,.1,.72))-cam.location).to_track_quat('-Z','Y').to_euler()
wheels=[bpy.data.objects.get('Wheel_'+t) for t in ['FL','FR','RL','RR']];assert all(wheels)
centres=[w.matrix_world.translation.copy() for w in wheels]
scene.render.filepath=str(OUT/'cybertruck-latest-picker-quality-150k-640x420.png');bpy.ops.render.render(write_still=True)
cam.location=(-7.4,0,2.65);cam.rotation_euler=(Vector((0,0,.75))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/'cybertruck-latest-side-quality-150k.png');bpy.ops.render.render(write_still=True)
cam.location=(-6.9,8.6,4.7);cam.rotation_euler=(Vector((0,.1,.72))-cam.location).to_track_quat('-Z','Y').to_euler()
for w in wheels:w.rotation_euler.x=math.pi/2
bpy.context.view_layer.update();drift=max((w.matrix_world.translation-c).length for w,c in zip(wheels,centres))
scene.render.filepath=str(OUT/'cybertruck-latest-wheel-spin90-quality-150k.png');bpy.ops.render.render(write_still=True)
(OUT/'cybertruck-latest-render-report-quality-150k.json').write_text(json.dumps({'picker':'cybertruck-latest-picker-quality-150k-640x420.png','spin90':'cybertruck-latest-wheel-spin90-quality-150k.png','wheelPivotDriftMeters':drift,'transparentFilm':True,'resolution':[640,420]},indent=2)+'\n')
