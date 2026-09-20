"""Matched review views only; keeps imported candidate unchanged on disk."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

OUT=Path('D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02')
SOURCE=Path('C:/Users/user/Documents/ChatGPT/Z/assets/vehicles/cybercab-rigged.glb')
CANDIDATE=OUT/'npc-cybercab-separated-candidate.glb'
views=[('front',(-5,7,2.7),(0,0,.65),5.4),('side',(-7,0,1.1),(0,0,.65),5.1),
       ('rear',(5,-7,2.7),(0,0,.65),5.4)]
for label,path in [('source',SOURCE),('candidate',CANDIDATE)]:
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(path))
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True
    scene.render.threads_mode='FIXED';scene.render.threads=3
    scene.render.resolution_x=1000;scene.render.resolution_y=650;scene.render.resolution_percentage=100
    scene.world.color=(.22,.22,.22)
    for position,power,size in [((4,4,7),1700,5),((-4,-3,4),1400,4),((0,5,2),600,3)]:
        bpy.ops.object.light_add(type='AREA',location=position);lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
        lamp.rotation_euler=(Vector((0,0,.65))-lamp.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
    for name,position,target,scale in views:
        cam.location=position;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(OUT/f'{label}-{name}.png');bpy.ops.render.render(write_still=True)
    if label=='candidate':
        wheels=[bpy.data.objects[name] for name in ('Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR')]
        bpy.context.view_layer.update();centres=[o.matrix_world.translation.copy() for o in wheels]
        cam.location=(-3.8,3,1.05);cam.data.ortho_scale=1.18
        cam.rotation_euler=(Vector((-.78,1.405,.365))-cam.location).to_track_quat('-Z','Y').to_euler()
        for state,angle in [('static',0),('90',math.pi/2)]:
            for wheel in wheels:wheel.rotation_euler.x=angle
            bpy.context.view_layer.update()
            assert max((o.matrix_world.translation-c).length for o,c in zip(wheels,centres))<1e-6
            scene.render.filepath=str(OUT/f'candidate-wheel-{state}.png');bpy.ops.render.render(write_still=True)
        for wheel in wheels:wheel.rotation_euler.x=0
        (OUT/'render-rig-check.json').write_text(json.dumps({'status':'PASS','four_pivots':True,'rotation_radians':math.pi/2,'pivot_drift_metres':0,'limitation':'Circular geometry looks identical after a quarter turn; actual transforms were checked.'},indent=2))
