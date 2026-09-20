"""Read-only Blender GLB hierarchy test, no rendering or source save."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
OUT=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT/'kitt-reference.glb'))
tags=['FL','FR','RL','RR'];wheels={t:bpy.data.objects['Wheel_'+t] for t in tags};steers={t:bpy.data.objects['Steer_'+t] for t in tags}
for o in list(wheels.values())+list(steers.values()):o.rotation_mode='QUATERNION'
bpy.context.view_layer.update();centres={t:o.matrix_world.translation.copy() for t,o in wheels.items()};rest={o.name:o.rotation_quaternion.copy() for o in list(wheels.values())+list(steers.values())}
def coords(ob):return [child.matrix_world@v.co for child in ob.children_recursive if child.type=='MESH' for v in child.data.vertices]
verts={t:coords(o) for t,o in wheels.items()};wb=(centres['FL']-centres['RL']).length;track=(centres['FL']-centres['FR']).length
angles={};radius=wb/math.tan(.35)
for t,w in wheels.items():
 w.rotation_quaternion=rest[w.name]@Quaternion((1,0,0),-math.pi/2)
 delta=math.atan(wb/(radius+(-track/2 if t=='FR' else track/2))) if t[0]=='F' else 0
 angles[t]=-delta;steers[t].rotation_quaternion=rest[steers[t].name]@Quaternion((0,0,1),-delta)
bpy.context.view_layer.update();drift=max((w.matrix_world.translation-centres[t]).length for t,w in wheels.items());travel={t:max((a-b).length for a,b in zip(verts[t],coords(w))) for t,w in wheels.items()}
assert drift<1e-6;assert all(d>.2 for d in travel.values());assert angles['FR']<angles['FL']<0;assert angles['RL']==angles['RR']==0
for o in list(wheels.values())+list(steers.values()):o.rotation_quaternion=rest[o.name]
bpy.context.view_layer.update();reset=max((a-b).length for t,w in wheels.items() for a,b in zip(verts[t],coords(w)))
assert reset<1e-6;assert abs(wb-2.5654)<1e-5
scanners=[o.name for o in bpy.context.scene.objects if o.name.startswith('Scanner_')];assert len(scanners)==8
report={'status':'PASS_CPU_GLB_RIG','wheelbase':wb,'track':track,'wheelCount':4,'pivotDriftMeters':drift,'vertexTravelDuringSpinAndSteerMeters':travel,'steerAngles':angles,'neutralResetMaxVertexErrorMeters':reset,'scannerNodes':scanners,'browserVerification':'Existing qc/verify-kitt-rig.cjs timed out waiting for window.kittWorkshop; browser closed. No new browser rig result claimed.','rendering':'None; CPU Blender import/matrix evaluation only.'}
(OUT/'shape-cpu-rig-audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
