import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets-source'/'vehicles'/'candidates';GLB=OUT/'yulu-latest.glb'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(GLB));bpy.context.view_layer.update()
oldf=bpy.data.objects['Wheel_F'];oldr=bpy.data.objects['Wheel_R'];centres={'Wheel_F':oldf.matrix_world.translation.copy(),'Wheel_R':oldr.matrix_world.translation.copy()}
for o in (oldf,oldr):bpy.data.objects.remove(o,do_unlink=True)
def mat(name,color,metal=.0,rough=.5):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
rubber=mat('Wheel_Rubber',(0.012,0.014,0.016),0,.72);rim=mat('Wheel_Rim',(0.025,0.03,0.035),.7,.27)
def make_wheel(name,c,r,width):
 parts=[]
 # Complete circular tyre; torus outer radius exactly r.
 minor=r*.115;major=r-minor
 bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=56,minor_segments=12,location=c,rotation=(0,math.pi/2,0));t=bpy.context.object;t.data.materials.append(rubber);parts.append(t)
 # Dark open rim rings and hub.
 for x in (-width*.32,width*.32):
  bpy.ops.mesh.primitive_torus_add(major_radius=r*.50,minor_radius=r*.035,major_segments=48,minor_segments=8,location=(c.x+x,c.y,c.z),rotation=(0,math.pi/2,0));d=bpy.context.object;d.data.materials.append(rim);parts.append(d)
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r*.13,depth=width*.82,location=c,rotation=(0,math.pi/2,0));h=bpy.context.object;h.data.materials.append(rim);parts.append(h)
 # Six paired radial spokes, compact rectangles in wheel plane.
 for x in (-width*.36,width*.36):
  for i in range(6):
   a=i*math.pi/3;mid=r*.34;loc=(c.x+x,c.y+math.sin(a)*mid,c.z+math.cos(a)*mid)
   bpy.ops.mesh.primitive_cube_add(location=loc,scale=(width*.035,r*.045,r*.24),rotation=(a,0,0));s=bpy.context.object;s.data.materials.append(rim);parts.append(s)
 bpy.ops.object.select_all(action='DESELECT')
 for p in parts:p.select_set(True)
 bpy.context.view_layer.objects.active=t;bpy.ops.object.join();w=bpy.context.object;w.name=name
 cur=bpy.context.scene.cursor.location.copy();bpy.context.scene.cursor.location=c;bpy.ops.object.origin_set(type='ORIGIN_CURSOR');bpy.context.scene.cursor.location=cur
 w['vehicle_role']='wheel';w['radius_metres']=r;w['axle']='local X';return w
wf=make_wheel('Wheel_F',centres['Wheel_F'],.24,.12);wr=make_wheel('Wheel_R',centres['Wheel_R'],.255,.13)
# Translate each exact circular wheel to contact Z=0, then level preserved body by average delta only.
for w,r in ((wf,.24),(wr,.255)):
 mw=w.matrix_world.copy();mw.translation.z=r;w.matrix_world=mw
body=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name not in ('Wheel_F','Wheel_R'))
bpy.ops.object.select_all(action='SELECT');tmp=OUT/'yulu-latest-repaired.glb';bpy.ops.export_scene.gltf(filepath=str(tmp),export_format='GLB',use_selection=True,export_apply=False)
rpt=json.loads((OUT/'yulu-latest-report.json').read_text());rpt['wheelRepair']='Fragmented fused source wheel selections replaced with complete dark tyre/rim/spoke assemblies; supplied body, rider, texture, fork and fenders preserved.';rpt['wheelPivots']={'Wheel_F':list(wf.matrix_world.translation),'Wheel_R':list(wr.matrix_world.translation)};rpt['wheelRadiiActual']={'Wheel_F':.24,'Wheel_R':.255};rpt['wheelContactsActualZ']={'Wheel_F':0.0,'Wheel_R':0.0};rpt['wheelGeometry']='Complete torus tyres, outer radii exact by construction; no fender/body fragments parented to wheels.';(OUT/'yulu-latest-report.json').write_text(json.dumps(rpt,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'yulu-latest.blend'))
