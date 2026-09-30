import bpy, math
from pathlib import Path
from mathutils import Vector

SOURCE=Path(r'D:/Brands BCON/OpenCity/Models/cYBER tRUCK.glb')
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'qc/release-0.0.39';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
pts=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)])
scale=5.683/(hi.x-lo.x);cx=(lo.x+hi.x)/2;cy=(lo.y+hi.y)/2
root=bpy.data.objects.new('CybertruckOriginalNormalized',None);bpy.context.collection.objects.link(root)
for o in list(bpy.context.scene.objects):
 if o is not root and o.parent is None:o.parent=root
root.scale=(scale,scale,scale);root.rotation_euler.z=-math.pi/2
# After -90deg: new X=old Y, new Y=-old X. Center X/Y and ground Z.
root.location=(-cy*scale,cx*scale,-lo.z*scale)
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=640;scene.render.resolution_y=420;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=2
scene.eevee.taa_render_samples=16
scene.render.image_settings.compression=25;scene.render.fps=24;scene.render.resolution_percentage=100
scene.render.filepath=str(OUT/'cybertruck-original-picker.png')
scene.world=bpy.data.worlds.new('PickerWorld');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.025,.03,.04,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.42
for loc,energy,size in [((-4,4,7),1250,5),((5,2,3),650,4),((0,-5,3),500,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object;lamp.data.energy=energy;lamp.data.shape='DISK';lamp.data.size=size
bpy.ops.object.camera_add(location=(-7.4,8.9,4.6));cam=bpy.context.object;scene.camera=cam;cam.data.lens=66;cam.rotation_euler=(Vector((0,.05,.82))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'cybertruck-original-picker.png');bpy.ops.render.render(write_still=True)
print('ORIGINAL_PICKER',OUT/'cybertruck-original-picker.png','scale',scale)
