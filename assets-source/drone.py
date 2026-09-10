"""Original OpenCity survey drone. Run with Blender --background --python this-file.
Outputs editable .blend and animated GLB beside this script in ../assets/drone/.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector

OUT = Path('D:/CodexTools/Blender/projects/drone')
WEB = Path(__file__).resolve().parents[1] / 'assets' / 'drone'
WEB.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
def material(name, color, metal=.2, rough=.4):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
shell=material('Ceramic silver',(.73,.79,.78));carbon=material('Graphite',(.025,.043,.052),.35,.55)
orange=material('Safety orange',(.9,.22,.04));glass=material('Lens glass',(.01,.11,.16),.8,.12)
def finish(obj,name,mat):
    obj.name=name;obj.data.materials.append(mat);return obj
def cube(name,location,size,mat,bevel=.01):
    bpy.ops.mesh.primitive_cube_add(size=1,location=location);o=bpy.context.object;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Edge radius','BEVEL');m.width=bevel;m.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return finish(o,name,mat)
def sphere(name,location,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=location);o=bpy.context.object;o.scale=scale
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,name,mat)
def tube(name,a,b,r,mat):
    a,b=Vector(a),Vector(b);d=b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=r,depth=d.length,location=(a+b)/2)
    o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return finish(o,name,mat)
sphere('Aerodynamic hull',(0,0,.31),(.24,.34,.115),shell)
cube('Battery cover',(0,-.025,.424),(.17,.25,.025),carbon)
cube('Orange spine',(0,-.04,.442),(.03,.20,.01),orange,.005)
for i,(x,y) in enumerate([(-.49,.44),(.49,.44),(.49,-.44),(-.49,-.44)]):
    tube('Carbon arm %s'%i,(math.copysign(.13,x),math.copysign(.15,y),.31),(x,y,.35),.036,carbon)
    tube('Motor %s'%i,(x,y,.31),(x,y,.415),.052,shell)
    bpy.ops.object.empty_add(type='PLAIN_AXES',location=(x,y,.425));rotor=bpy.context.object;rotor.name='Propeller %s'%(i+1)
    for j in range(2):
        angle=j*math.pi
        # Swept, tapered blade with solid thickness. Local coordinates retain rotor pivot.
        vertices=[(.025,-.013,0),(.19,-.033,0),(.275,0,0),(.17,.027,0),(.025,.015,0)]
        mesh=bpy.data.meshes.new('Blade mesh');mesh.from_pydata(vertices,[],[(0,1,2,3,4)]);mesh.update()
        o=bpy.data.objects.new('Swept blade',mesh);scene.collection.objects.link(o);o.parent=rotor;o.rotation_euler.z=angle;o.data.materials.append(carbon)
        mod=o.modifiers.new('Blade thickness','SOLIDIFY');mod.thickness=.006
    hub=sphere('Orange motor cap',(x,y,.435),(.03,.03,.015),orange);hub.parent=rotor;hub.matrix_parent_inverse=rotor.matrix_world.inverted()
    rotor.rotation_euler.z=0;rotor.keyframe_insert(data_path='rotation_euler',frame=1)
    rotor.rotation_euler.z=math.tau*(1 if i%2 else -1);rotor.keyframe_insert(data_path='rotation_euler',frame=25)
    if rotor.animation_data:
        for fc in rotor.animation_data.action.fcurves:
            for key in fc.keyframe_points:key.interpolation='LINEAR'
for side in [-1,1]:
    for y in [-.18,.18]:tube('Landing strut',(side*.13,y,.28),(side*.22,y,.045),.016,carbon)
    tube('Landing skid',(side*.22,-.29,.035),(side*.22,.29,.035),.018,carbon)
tube('Gimbal mount',(0,.16,.24),(0,.16,.17),.025,carbon)
cube('Camera gimbal',(0,.17,.145),(.12,.11,.1),carbon)
tube('Camera lens',(0,.22,.145),(0,.255,.145),.035,glass)
scene.frame_end=25;scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'opencity-drone.blend'))
bpy.ops.export_scene.gltf(filepath=str(WEB/'opencity-drone.glb'),export_format='GLB',export_apply=True,export_animations=True)
# Studio camera and lights are render-only, not exported into the vehicle GLB.
bpy.ops.object.camera_add(location=(1.55,1.85,1.35));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.23))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.05;scene.camera=camera
for name,loc,power,size in [('Key',(1,1,3),180,3),('Fill',(-2,0,1),90,2)]:
    bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.name=name;l.data.energy=power;l.data.shape='DISK';l.data.size=size
    l.rotation_euler=(Vector((0,0,.2))-l.location).to_track_quat('-Z','Y').to_euler()
scene.world.color=(.25,.25,.25)
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1000;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'opencity-drone.blend'))
bpy.ops.render.render(write_still=True)
print('DRONE_ASSET_READY',OUT)

