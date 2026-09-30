import bpy, json, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(r"C:/Users/user/Documents/ChatGPT/Z");QC=ROOT/'qc/cybercab-latest';OUT=ROOT/'assets/vehicles/cybercab-latest-final.glb'
bpy.ops.wm.open_mainfile(filepath=r"D:/CodexTools/Blender/projects/cybercab-latest-fidelity.blend")
body=bpy.data.objects['Body']
for n in ['Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR']:
 o=bpy.data.objects.get(n)
 if o:bpy.data.objects.remove(o,do_unlink=True)
rubber=bpy.data.materials.get('RubberTrim') or bpy.data.materials.new('RubberTrim');rubber.diffuse_color=(.018,.02,.022,1);rubber.metallic=.05;rubber.roughness=.45
disc=bpy.data.materials.get('WheelCover') or bpy.data.materials.new('WheelCover');disc.diffuse_color=(.22,.23,.23,1);disc.metallic=.8;disc.roughness=.28
centres={'Wheel_FL':(-.8185,1.3564,.3508),'Wheel_FR':(.8185,1.3564,.3508),'Wheel_RL':(-.8185,-1.3564,.3508),'Wheel_RR':(.8185,-1.3564,.3508)}
wheels=[]
for name,c in centres.items():
 root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root);root.location=c;wheels.append(root)
 bpy.ops.mesh.primitive_torus_add(major_radius=.295,minor_radius=.067,major_segments=48,minor_segments=10,location=c,rotation=(0,math.pi/2,0));t=bpy.context.object;t.name=name+'_Tyre';t.parent=root;t.matrix_parent_inverse=root.matrix_world.inverted();t.data.materials.append(rubber)
 side=-.128 if c[0]<0 else .128
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.306,depth=.016,location=(c[0]+side,c[1],c[2]),rotation=(0,math.pi/2,0));d=bpy.context.object;d.name=name+'_Cover';d.parent=root;d.matrix_parent_inverse=root.matrix_world.inverted();d.data.materials.append(disc)
 for p in t.data.polygons:p.use_smooth=True
 for p in d.data.polygons:p.use_smooth=True
objects=[body]+wheels
bpy.ops.object.select_all(action='DESELECT');body.select_set(True)
for r in wheels:
 r.select_set(True)
 for child in r.children:child.select_set(True)
for child in body.children:child.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=r"D:/CodexTools/Blender/projects/cybercab-latest-final.blend")
tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
report={'candidate':str(OUT),'bytes':OUT.stat().st_size,'triangles':tris,'materials':3,'textures':'3 x 1024 supplied body textures',
 'wheelPivots':centres,'wheelNodes':list(centres),'wheelRepair':'Original fragmented wheel regions replaced with smooth dark tyres and metallic wheel covers. Body geometry, UVs, finish, windows, and textures retained.',
 'sideGlass':'Not added. Supplied source side apertures remain open; attempted fitted panels failed visual placement review and were removed.',
 'limitation':'Wheel geometry is reconstructed because supplied single mesh could not be separated without rotating body shards.'}
(QC/'cybercab-latest-final-report.json').write_text(json.dumps(report,indent=2));print('FINAL_WHEEL_REPAIR',json.dumps(report),flush=True)
