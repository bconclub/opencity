import bpy, math
from pathlib import Path
from mathutils import Vector
SOURCE=Path(r'D:/Brands BCON/OpenCity/Models/cYBER tRUCK.glb')
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles/cybertruck-latest-qc';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE))
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=900;scene.render.resolution_y=600;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.world=bpy.data.worlds.new('StudioWorld');scene.world.color=(.035,.035,.035)
bpy.ops.object.light_add(type='AREA',location=(2,-3,4));bpy.context.object.data.energy=1100;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.light_add(type='AREA',location=(-3,2,2));bpy.context.object.data.energy=700;bpy.context.object.data.size=4
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.lens=58
for name,loc in [('three-quarter',(2.6,-2.6,1.7)),('side',(0,-3.2,.5)),('front',(3.2,0,.5)),('top',(0,0,3.5))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'cybertruck-latest-source-{name}.png');bpy.ops.render.render(write_still=True)
