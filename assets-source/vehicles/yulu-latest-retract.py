import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets-source'/'vehicles'/'candidates';GLB=OUT/'yulu-latest.glb'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'yulu-latest.blend'));bpy.context.view_layer.update()
body=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name not in ('Wheel_F','Wheel_R'))
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
for v in body.data.vertices:
    w=body.matrix_world@v.co;v.select=(w.z<.13)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.delete(type='VERT');bpy.ops.object.mode_set(mode='OBJECT');body.data.update()
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'yulu-latest-retracted.glb'),export_format='GLB',use_selection=True,export_apply=False)
r=json.loads((OUT/'yulu-latest-report.json').read_text());r['ridingState']='Kickstand geometry below Z=0 removed from central underside; no wheel geometry changed.';r['bodyActualMinZ']=min((body.matrix_world@v.co).z for v in body.data.vertices);(OUT/'yulu-latest-report.json').write_text(json.dumps(r,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'yulu-latest.blend'))
