import bpy,math,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/user/Documents/ChatGPT/Z');OUT=ROOT/'qc/release-0.0.40';OUT.mkdir(parents=True,exist_ok=True)
report=json.loads((OUT/'remaining-original-audit.json').read_text()) if (OUT/'remaining-original-audit.json').exists() else {}
for kind,name,angle,target in [('kitt','kNIGHT rIDER.glb',-math.pi/2,4.8),('yulu','Yulu.glb',-math.pi/2,1.9),('delivery','Delivery Rider.glb',-math.pi/2,1.9),('driver','Auto Driver.glb',math.pi,None)]:
 if '--' in sys.argv and kind != sys.argv[-1]:continue
 source=Path('D:/Brands BCON/OpenCity/Models')/name
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(source));bpy.context.view_layer.update()
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 pts=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
 lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)])
 scale=target/(hi.x-lo.x) if target else 1
 report[kind]={'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'bytes':source.stat().st_size,'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'materials':len({m.name for o in meshes for m in o.data.materials if m}),'blenderBoundsMin':list(lo),'blenderBoundsMax':list(hi),'blenderDimensions':list(hi-lo),'suggestedRotationZ':angle,'targetLength':target,'uniformScale':scale,'meshNames':[o.name for o in meshes]}
 if kind=='driver':continue
 root=bpy.data.objects.new('OriginalNormalized',None);bpy.context.collection.objects.link(root)
 for o in list(bpy.context.scene.objects):
  if o is not root and o.parent is None:o.parent=root
 root.scale=(scale,)*3;root.rotation_euler.z=angle
 center=(lo+hi)/2
 root.location=((math.sin(angle)*center.y-math.cos(angle)*center.x)*scale,(-math.sin(angle)*center.x-math.cos(angle)*center.y)*scale,-lo.z*scale)
 bpy.context.view_layer.update()
 pts=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box];lo2=Vector([min(p[i] for p in pts) for i in range(3)]);hi2=Vector([max(p[i] for p in pts) for i in range(3)]);c=(lo2+hi2)/2;span=max(hi2-lo2)
 sc=bpy.context.scene;sc.render.engine='BLENDER_WORKBENCH';sc.render.resolution_x=640;sc.render.resolution_y=420;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA';sc.render.film_transparent=True
 sc.display.shading.light='STUDIO';sc.display.shading.studio_light='paint.sl';sc.display.shading.color_type='TEXTURE';sc.display.shading.show_shadows=True;sc.display.shading.show_cavity=True;sc.display.shading.cavity_type='WORLD'
 bpy.ops.object.camera_add(location=c+Vector((-span*1.55,span*1.85,span*.95)));cam=bpy.context.object;cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span*(1.65 if kind=='delivery' else 1.3);sc.camera=cam
 sc.render.filepath=str(OUT/f'{kind}-original-picker.png');bpy.ops.render.render(write_still=True)
 (OUT/'remaining-original-audit.json').write_text(json.dumps(report,indent=2))
(OUT/'remaining-original-audit.json').write_text(json.dumps(report,indent=2))


