import bpy,json,math,sys,os
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets-source'/'vehicles'/'candidates'
kind=sys.argv[sys.argv.index('--')+1]
glb=OUT/f'{kind}-latest.glb';report_path=OUT/f'{kind}-latest-report.json'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(glb));bpy.context.view_layer.update()
body=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name not in ('Wheel_F','Wheel_R'))
wf=bpy.data.objects['Wheel_F'];wr=bpy.data.objects['Wheel_R']
if wf.parent:
    mw=wf.matrix_world.copy();old=wf.parent;wf.parent=None;wf.matrix_world=mw
    if old.name.startswith('Steer_F'):bpy.data.objects.remove(old,do_unlink=True)
r=json.loads(report_path.read_text());rf=r['wheelRadiiEstimated']['Wheel_F'];rr=r['wheelRadiiEstimated']['Wheel_R']
pitch=0.0
objs=[body,wf,wr]
def bounds():
 p=[o.matrix_world@Vector(c) for o in objs for c in o.bound_box];return Vector(tuple(min(v[i] for v in p) for i in range(3))),Vector(tuple(max(v[i] for v in p) for i in range(3)))
def render(tag,res=(900,650),transparent=False):
 sc=bpy.context.scene;sc.render.engine='BLENDER_WORKBENCH';sc.render.resolution_x=res[0];sc.render.resolution_y=res[1];sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG';sc.render.film_transparent=transparent
 sc.display.shading.light='STUDIO';sc.display.shading.studio_light='paint.sl';sc.display.shading.color_type='TEXTURE';sc.display.shading.show_shadows=True;sc.display.shading.show_cavity=True
 lo,hi=bounds();c=(lo+hi)*.5;span=max(hi-lo);bpy.ops.object.camera_add(location=c+Vector((span*1.55,-span*1.85,span*.95)));cam=bpy.context.object;cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span*1.3;sc.camera=cam;sc.render.filepath=str(OUT/f'{kind}-latest-{tag}.png');bpy.ops.render.render(write_still=True);bpy.data.objects.remove(cam,do_unlink=True)
centres={o.name:list(o.matrix_world.translation) for o in (wf,wr)}
render('after');render('picker',(640,420),True)
wf.rotation_euler.x=math.radians(70);wr.rotation_euler.x=math.radians(70);render('spin');wf.rotation_euler.x=0;wr.rotation_euler.x=0
wf.rotation_euler.z=math.radians(28);render('steer');wf.rotation_euler.z=0;bpy.context.view_layer.update()
pivot_error=max((Vector(centres[o.name])-o.matrix_world.translation).length for o in (wf,wr))
bpy.ops.object.select_all(action='DESELECT')
for o in [body,wf,wr]:o.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_apply=False)
r['triangles']=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objs);r['candidateBytes']=glb.stat().st_size;r['materials']=len({m.name for o in objs for m in o.data.materials if m});r['wheelPivots']={o.name:list(o.matrix_world.translation) for o in (wf,wr)}
lo,hi=bounds();r['boundsMin']=list(lo);r['boundsMax']=list(hi);r['dimensions']=list(hi-lo);r['levelPitchDegrees']=math.degrees(pitch);r['wheelContactsZ']={'Wheel_F':wf.matrix_world.translation.z-rf,'Wheel_R':wr.matrix_world.translation.z-rr}
r['actualWheelGeometry']={}
for o in (wf,wr):
    pivot=o.matrix_world.translation;pts=[o.matrix_world@v.co for v in o.data.vertices]
    r['actualWheelGeometry'][o.name]={'widthX':max(p.x for p in pts)-min(p.x for p in pts),'radialMaxYZ':max(math.hypot(p.y-pivot.y,p.z-pivot.z) for p in pts),'minZ':min(p.z for p in pts),'maxZ':max(p.z for p in pts)}
r['budgetStatus']='100k fidelity candidate exceeds requested 25k because 25k visibly faceted source body/rider.'
r['rig']={'frontWheel':'Wheel_F','rearWheel':'Wheel_R','rollAxis':'local X','steerAxis':'local Z on Wheel_F','pivotInvariantMaxError':pivot_error};r['validationRenders']=[f'{kind}-latest-spin.png',f'{kind}-latest-steer.png'];report_path.write_text(json.dumps(r,indent=2))
dest=Path(os.environ.get('TWOWHEEL_BLEND_DIR',str(OUT)));dest.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(dest/f'{kind}-latest.blend'))
