"""Optimize user-supplied Cybertruck into a review candidate. Never writes live asset."""
import bpy, json, hashlib, math, os
from pathlib import Path
from mathutils import Vector

SOURCE=Path(r'D:/Brands BCON/OpenCity/Models/cYBER tRUCK.glb')
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/vehicles/cybertruck-latest-qc';OUT.mkdir(parents=True,exist_ok=True)
BUDGET=int(os.environ.get('CYBERTRUCK_LATEST_BUDGET','150000'));SUFFIX='quality-150k' if BUDGET>60000 else ('quality-60k' if BUDGET>25000 else 'budget-24k')
GLB=OUT/f'cybertruck-latest-candidate-{SUFFIX}.glb'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE))
src=next(o for o in bpy.context.scene.objects if o.type=='MESH');me=src.data
uvsrc=me.uv_layers.active.data if me.uv_layers.active else None
# Source: X longitudinal (nose negative), Y lateral, Z up. Each wheel is a
# fragmented scan region, so classify triangles by four tight wheel cylinders.
centres={'FL':(-.671,-.276,-.168),'FR':(-.671,.276,-.168),'RL':(.620,-.276,-.168),'RR':(.620,.276,-.168)}
radius=.165
groups={k:[] for k in ['Body','FL','FR','RL','RR']}
for p in me.polygons:
 c=p.center;tag=None
 if abs(c.y)>.17:
  tag=('F' if c.x<0 else 'R')+('L' if c.y<0 else 'R')
  cv=centres[tag]
  # Require every triangle vertex inside one wheel side/envelope. Centroid-only
  # selection can capture cross-car scan triangles and produces invalid pivots.
  if not all((me.vertices[v].co.x-cv[0])**2+(me.vertices[v].co.z-cv[2])**2<radius**2 and (me.vertices[v].co.y<-.17 if tag[1]=='L' else me.vertices[v].co.y>.17) for v in p.vertices):tag=None
 groups[tag or 'Body'].append(p.index)
def extract(name,polys):
 used={vi for pi in polys for vi in me.polygons[pi].vertices};imap={old:i for i,old in enumerate(sorted(used))}
 verts=[me.vertices[i].co[:] for i in sorted(used)];faces=[[imap[v] for v in me.polygons[pi].vertices] for pi in polys]
 nm=bpy.data.meshes.new(name+'Mesh');nm.from_pydata(verts,[],faces);nm.materials.append(me.materials[0])
 if uvsrc:
  uv=nm.uv_layers.new(name='UVMap')
  for nf,pi in zip(nm.polygons,polys):
   op=me.polygons[pi]
   for nl,ol in zip(nf.loop_indices,op.loop_indices):uv.data[nl].uv=uvsrc[ol].uv
 ob=bpy.data.objects.new(name,nm);bpy.context.collection.objects.link(ob)
 for f in nm.polygons:f.use_smooth=True
 return ob
parts=[extract('Body',groups['Body'])]
for tag in ['FL','FR','RL','RR']:
 ob=extract('Wheel_'+tag,groups[tag]);c=Vector(centres[tag]);ob.data.transform(__import__('mathutils').Matrix.Translation(-c));ob.location=c;parts.append(ob)
bpy.data.objects.remove(src,do_unlink=True)
# Target 24k leaves exporter triangulation safely below accepted 25k budget.
targets={'Body':BUDGET-6000,'Wheel_FL':1500,'Wheel_FR':1500,'Wheel_RL':1500,'Wheel_RR':1500}
for ob in parts:
 before=len(ob.data.polygons);target=targets[ob.name]
 if before>target:
  bpy.context.view_layer.objects.active=ob;ob.select_set(True)
  mod=ob.modifiers.new('UV preserving runtime reduction','DECIMATE');mod.ratio=target/before;mod.use_collapse_triangulate=True
  bpy.ops.object.modifier_apply(modifier=mod.name);ob.select_set(False)
# Source's positive-Y wheel scan collapses to degenerate faces. Mirror supplied
# negative-Y wheel geometry so runtime still receives four sound wheel meshes.
for right,left in [('Wheel_FR','Wheel_FL'),('Wheel_RR','Wheel_RL')]:
 ro=bpy.data.objects[right];lo=bpy.data.objects[left]
 if len(ro.data.polygons)==0:
  ro.data=lo.data.copy()
  for v in ro.data.vertices:v.co.y=-v.co.y
  ro.data.update()
# Map to OpenCity convention: Blender X lateral, Y forward, Z up; real scale.
sx=2.032/(.3804129958-(-.3771229982));sy=5.683/(.950963974-(-.952041984));sz=1.79/(.3237670064-(-.3242459893));z0=-(-.3242459893)*sz+.055
for ob in parts:
 # Bake axis map and scale into geometry while retaining wheel origins/pivots.
 oldloc=ob.location.copy();ob.location=(oldloc.y*sx,-oldloc.x*sy,oldloc.z*sz+z0)
 for v in ob.data.vertices:
  q=v.co.copy();v.co=(q.y*sx,-q.x*sy,q.z*sz)
 ob.data.update()
for image in bpy.data.images:
 if image.size[0]>1024 or image.size[1]>1024:image.scale(1024,1024)
bpy.ops.object.select_all(action='DESELECT')
for ob in parts:ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(GLB),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_image_format='AUTO')
def tri(ob):return sum(len(p.vertices)-2 for p in ob.data.polygons)
report={'status':'REVIEW_CANDIDATE','source':str(SOURCE),'sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'candidate':'assets/vehicles/cybertruck-latest-qc/cybertruck-latest-candidate.glb','candidateBytes':GLB.stat().st_size,'triangles':sum(tri(o) for o in parts),'partTriangles':{o.name:tri(o) for o in parts},'materials':len(bpy.data.materials),'textures':[{'name':i.name,'size':list(i.size)} for i in bpy.data.images],'dimensionsMeters':[2.032,5.683,1.79],'wheelPivots':{o.name:list(o.location) for o in parts if o.name.startswith('Wheel_')},'wheelContract':'Wheel_FL/FR/RL/RR; local X axle after glTF Y-up export','paintLimitation':'Body, dark glass, trim and cabin share one supplied texture atlas/material. Material retained as Material_0; no BodyPaint alias because runtime recoloring would tint glass and cabin.','segmentationLimitation':'Supplied single mesh has 1,341 disconnected scan islands. Wheel triangles were isolated by tight four-cylinder spatial envelopes; visual spin review required for small arch fragments.','method':'UV-preserving Blender Decimate; supplied atlas retained and resized from 2K to 1K; no reconstructed body geometry.'}
report['candidate']=f'assets/vehicles/cybertruck-latest-qc/{GLB.name}'
(OUT/f'cybertruck-latest-build-report-{SUFFIX}.json').write_text(json.dumps(report,indent=2)+'\n');print('CYBERTRUCK_LATEST',json.dumps(report))
