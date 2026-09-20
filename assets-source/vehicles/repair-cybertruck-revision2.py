"""Fix first candidate's three observed visual regressions, preserving both inputs."""
import bpy, json, math, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
DEST=Path('D:/CodexTools/Blender/projects/cybertruck-reference')
OUT=ROOT/'assets/vehicles/cybertruck-review/revision2';OUT.mkdir(parents=True,exist_ok=True)
TARGET=DEST/'cybertruck-reference-revision2.blend'
assert not TARGET.exists()
inputs=[DEST/'original-source.blend',DEST/'cybertruck-reference.blend']
hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}
bpy.ops.wm.open_mainfile(filepath=str(inputs[0]))
reference={o.name:[o.matrix_world@v.co for v in o.data.vertices] for o in bpy.context.scene.objects if o.type=='MESH' and (o.name=='Stainless wedge body' or o.name.startswith('Bed'))}
bpy.ops.wm.open_mainfile(filepath=str(inputs[1]))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.name.startswith('Studio')]
R=.43925;XS=2.0316/2.14;ZS=(1.7938-.257)/(1.99220609664917-.43);ZT=.257-ZS*.43
def longitudinal(y):
 old=[-2.865,-1.83,1.78,2.775];new=[-3.0121,-1.8425,1.7925,2.6708]
 i=0 if y<=old[1] else 1 if y<=old[2] else 2
 return new[i]+(y-old[i])*(new[i+1]-new[i])/(old[i+1]-old[i])
body=bpy.data.objects['Stainless wedge body'];inverse=body.matrix_world.inverted();arch_vertices=0
for vertex,old in zip(body.data.vertices,reference[body.name]):
 point=Vector((old.x*XS,longitudinal(old.y),ZS*old.z+ZT))
 for oldy,newy in [(1.78,1.7925),(-1.83,-1.8425)]:
  dy,dz=old.y-oldy,old.z-.47;radius=math.hypot(dy,dz)
  if .510<radius<.550:
   # Only actual pre-existing arch boundary vertices move onto the resized
   # circle. Sill and broad side-panel vertices retain coherent affine profile.
   arcRadius=radius*(R+.065)/.535
   radialZ=R+dz*(R+.065)/.535
   t=max(0,min(1,(old.z-.60)/.25));t=t*t*(3-2*t)
   point.z=point.z*(1-t)+radialZ*t
   point.y=newy+math.copysign(math.sqrt(max(0,arcRadius*arcRadius-(point.z-R)**2)),dy)
   arch_vertices+=1;break
 vertex.co=inverse@point
body.data.update()
# Raise the entire flat bed floor, rather than bending it around rear wheels.
for o in objects:
 if not o.name.startswith('Bed'):continue
 inv=o.matrix_world.inverted()
 for vertex,old in zip(o.data.vertices,reference[o.name]):
  z=.925+(old.z-.95) if o.name=='Bed liner' else .955+(old.z-.98)
  vertex.co=inv@Vector((old.x*XS,longitudinal(old.y),z))
 o.data.update()
# Wheel disks were behind solid tire sidewalls. Translate decoration vertices
# outward, preserving their origins/parent links and the tire geometry itself.
rim_offsets={}
for tag in ['FL','FR','RL','RR']:
 wheel=bpy.data.objects['Wheel_'+tag];center=wheel.matrix_world.translation.copy();sign=-1 if tag[1]=='L' else 1
 cover=bpy.data.objects['AeroCover_'+tag]
 edge=max(sign*((cover.matrix_world@v.co).x-center.x) for v in cover.data.vertices)
 delta=.149-edge;rim_offsets[tag]=delta
 descendants=list(wheel.children_recursive)
 for o in descendants:
  if o.type!='MESH':continue
  inv=o.matrix_world.inverted()
  for vertex in o.data.vertices:
   p=o.matrix_world@vertex.co;p.x+=sign*delta;vertex.co=inv@p
  o.data.update()
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'cybertruck-reference.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(TARGET))
for p,h in hashes.items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h
report={'revision':2,'status':'REQUIRES_CPU_AND_VISUAL_VALIDATION','candidateBlend':str(TARGET),'preservedInputs':hashes,'archBoundaryVerticesAdjusted':arch_vertices,'coverOuterOffset':.149,'tireOuterOffset':.1425,'decorationOutwardShift':rim_offsets,'bedFloorCenter':.925,'bedFloorMin':.9025,'tireTop':.8785,'changes':['Restrict arch correction to existing arc vertices; restore remaining sill/panel profile','Move wheel decoration faces outside solid tire sidewalls','Replace distorted bed-floor vertex heights with flat floor above rear tire tops'],'firstCandidate':'Preserved, rejected for hidden wheel faces, zigzag sill and rear bed protrusions'}
(OUT/'repair-report.json').write_text(json.dumps(report,indent=2)+'\n');print('CYBERTRUCK_REVISION2',json.dumps(report))
