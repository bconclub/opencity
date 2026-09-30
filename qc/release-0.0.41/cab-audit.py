import bpy, math, json, hashlib
import numpy as np
from pathlib import Path
from mathutils import Matrix, Vector
OUT=Path(__file__).parent
SOURCE=Path('D:/Brands BCON/OpenCity/Models/Cyber CAB.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH')
v=np.empty(len(o.data.vertices)*3,dtype=np.float32);o.data.vertices.foreach_get('co',v);v=v.reshape(-1,3)
m=np.array(o.matrix_world);v=v@m[:3,:3].T+m[:3,3];lo=v.min(0);hi=v.max(0);scale=4.45/(hi[0]-lo[0])
o.matrix_world=Matrix.Scale(scale,4)@Matrix.Rotation(-math.pi/2,4,'Z')@o.matrix_world
bpy.context.view_layer.update();bb=np.array([o.matrix_world@Vector(c) for c in o.bound_box]);shift=Vector((-(bb[:,0].min()+bb[:,0].max())/2,-(bb[:,1].min()+bb[:,1].max())/2,-bb[:,2].min()));o.matrix_world=Matrix.Translation(shift)@o.matrix_world
game=np.column_stack([v[:,1],-v[:,0],v[:,2]])*scale+np.array(shift)
np.save(OUT/'cab-vertices-game.npy',game)
report={'source':str(SOURCE),'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'vertices':len(v),'triangles':len(o.data.polygons),'sourceBlenderBounds':[lo.tolist(),hi.tolist()],'uniformScale':scale,'candidateYaw':-math.pi/2,'normalizationShift':list(shift),'coordinates':'X lateral, Y forward, Z up','gameBounds':[game.min(0).tolist(),game.max(0).tolist()]}
(OUT/'cab-wheel-audit.json').write_text(json.dumps(report,indent=2))
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=1200;scene.render.resolution_y=700;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.world=bpy.data.worlds.new('World');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.15,.15,.15,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
for pos in [(4,5,6),(-4,1,5),(0,-5,4)]:
 bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=1800;l.data.size=5;l.rotation_euler=(Vector((0,0,.6))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=5.2
for name,pos in [('side',(8,0,.7)),('front',(0,8,.7)),('rear',(0,-8,.7))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.7))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'cab-original-{name}.png');bpy.ops.render.render(write_still=True)
print('AUDIT_READY',json.dumps(report),flush=True)
