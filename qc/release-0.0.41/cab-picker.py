"""Render unmodified latest Cyber CAB source for release picker review."""
import bpy, math
from pathlib import Path
from mathutils import Vector, Matrix

SOURCE=Path(r"D:/Brands BCON/OpenCity/Models/Cyber CAB.glb")
OUT=Path(r"C:/Users/user/Documents/ChatGPT/Z/qc/release-0.0.41/cybercab-original-picker.png")
OUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']

def bounds():
 bpy.context.view_layer.update();pts=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
 return Vector([min(p[i] for p in pts) for i in range(3)]),Vector([max(p[i] for p in pts) for i in range(3)])

lo,hi=bounds();scale=4.45/(hi.x-lo.x)
for o in objects:o.matrix_world=Matrix.Scale(scale,4)@Matrix.Rotation(-math.pi/2,4,'Z')@o.matrix_world
lo,hi=bounds();offset=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))
for o in objects:o.matrix_world=Matrix.Translation(offset)@o.matrix_world

scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.film_transparent=True
scene.render.resolution_x=640;scene.render.resolution_y=420;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
world=scene.world or bpy.data.worlds.new('World');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.025,.03,.04,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
for pos,energy,size,color in [((4.5,5.5,5.5),1350,5,(1,.86,.72)),((-4,1,3.8),850,4,(.5,.65,1)),((1,-4,3),950,3,(1,.78,.5))]:
 bpy.ops.object.light_add(type='AREA',location=pos);light=bpy.context.object;light.data.energy=energy;light.data.size=size;light.data.color=color
 light.rotation_euler=(Vector((0,0,.7))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5.6,6.8,2.65));cam=bpy.context.object;cam.data.lens=56
cam.rotation_euler=(Vector((0,0,.68))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.filepath=str(OUT);bpy.ops.render.render(write_still=True)
lo,hi=bounds();tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
print('ORIGINAL_PICKER_READY',str(OUT),'triangles',tris,'bounds',list(lo),list(hi),'dimensions',list(hi-lo),flush=True)

