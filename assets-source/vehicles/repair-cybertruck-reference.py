"""Targeted existing Cybertruck mesh repair. Background CPU, never renders/promotes."""
import bpy, json, math, hashlib, shutil
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path('D:/CodexTools/Blender/projects/cybertruck.blend')
DEST=Path('D:/CodexTools/Blender/projects/cybertruck-reference')
OUT=ROOT/'assets/vehicles/cybertruck-review'
DEST.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
TARGET=DEST/'cybertruck-reference.blend'
assert not TARGET.exists(), 'Do not overwrite an existing reviewed candidate'
original_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
backup=DEST/'original-source.blend'
if not backup.exists():shutil.copy2(SOURCE,backup)
assert hashlib.sha256(backup.read_bytes()).hexdigest()==original_hash
bpy.ops.wm.open_mainfile(filepath=str(backup))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.name.startswith('Studio')]
assert len(objects)==55, [(o.name,o.type) for o in objects]
oldworld={o:o.matrix_world.copy() for o in objects}
oldverts={o:[o.matrix_world@v.co for v in o.data.vertices] for o in objects}
material_names={o.name:tuple(m.name for m in o.data.materials) for o in objects}
R=.43925
oldcentres={'FL':Vector((-1.02,1.78,.47)),'FR':Vector((1.02,1.78,.47)),'RL':Vector((-1.02,-1.83,.47)),'RR':Vector((1.02,-1.83,.47))}
centres={tag:Vector(((-1 if tag[1]=='L' else 1)*(.8885 if tag[0]=='F' else .886),1.7925 if tag[0]=='F' else -1.8425,R)) for tag in oldcentres}
def wheel_tag(o):
 while o:
  if o.name in ['Wheel_'+tag for tag in oldcentres]:return o.name[-2:]
  o=o.parent
 return None
def linear(y):
 old=[-2.865,-1.83,1.78,2.775];new=[-3.0121,-1.8425,1.7925,2.6708]
 i=0 if y<=old[1] else 1 if y<=old[2] else 2
 return new[i]+(y-old[i])*(new[i+1]-new[i])/(old[i+1]-old[i])
# Fit non-wheel ground/body and roof bounds; arch neighborhoods override this
# affine profile so wheel openings remain circles around the new wheel centers.
ZS=(1.7938-.257)/(1.99220609664917-.43);ZT=.257-ZS*.43
XS=2.0316/2.14
def shell(v):
 result=Vector((v.x*XS,linear(v.y),ZS*v.z+ZT))
 for oldy,newy in [(1.78,1.7925),(-1.83,-1.8425)]:
  dy,dz=v.y-oldy,v.z-.47;distance=math.hypot(dy,dz)
  if distance<.88:
   t=max(0,min(1,(distance-.54)/(.88-.54)));weight=1-t*t*(3-2*t)
   radial=(R+.065)/(.47+.065)
   result.y=result.y*(1-weight)+(newy+dy*radial)*weight
   result.z=result.z*(1-weight)+(R+dz*radial)*weight
 return result
def changed(o,v):
 tag=wheel_tag(o)
 if tag:
  delta=v-oldcentres[tag]
  # Tires keep circular YZ cross-sections and nominal section width. Flatten
  # protruding rim/hub decorations separately, never rescale the whole truck.
  sx=.285/.28 if o.name=='Wheel_'+tag else .135/.1815
  return centres[tag]+Vector((delta.x*sx,delta.y*R/.47,delta.z*R/.47))
 if o.name.startswith('Side mirror'):
  sign=1 if v.x>0 else -1
  return Vector((v.x+sign*(1.09665-1.19),linear(v.y),ZS*v.z+ZT))
 return shell(v)
def depth(o):
 n=0
 while o.parent:n+=1;o=o.parent
 return n
for o in sorted(objects,key=depth):
 # Preserve independent objects, parent links and neutral rotation. Bake all
 # dimension changes into local vertices, not scale above spinning wheel nodes.
 tag=wheel_tag(o)
 matrix=oldworld[o].copy()
 matrix.translation=centres[tag] if o.name=='Wheel_'+str(tag) else changed(o,matrix.translation)
 o.matrix_world=matrix
 inverse=matrix.inverted()
 for vert,point in zip(o.data.vertices,oldverts[o]):vert.co=inverse@changed(o,point)
 o.data.update()
bpy.context.view_layer.update()
# Recalculate sharp-face normals following the vertex deformation.
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
 assert tuple(m.name for m in o.data.materials)==material_names[o.name]

# glTF vertex colors do not modulate emission. Bake existing lamp colors only.
lamp=bpy.data.materials['Lamps'];lamps=[o for o in objects if lamp in list(o.data.materials)]
palette=[]
for o in lamps:
 attr=o.data.color_attributes['LampColor']
 for face in o.data.polygons:
  color=tuple(round(v,5) for v in attr.data[face.loop_indices[0]].color[:3])
  if color not in palette:palette.append(color)
assert len(palette)==2,palette
im=bpy.data.images.new('Cybertruck lamp palette',width=len(palette),height=1,alpha=True)
im.colorspace_settings.name='Non-Color';im.pixels=[v for color in palette for v in (*color,1)];im.pack()
for o in lamps:
 for uv in list(o.data.uv_layers):o.data.uv_layers.remove(uv)
 uv=o.data.uv_layers.new(name='LampUV');attr=o.data.color_attributes['LampColor']
 for face in o.data.polygons:
  color=tuple(round(v,5) for v in attr.data[face.loop_indices[0]].color[:3])
  for i in face.loop_indices:uv.data[i].uv=((palette.index(color)+.5)/len(palette),.5)
 uv.active_render=True;o.data.color_attributes.remove(attr)
p=lamp.node_tree.nodes.get('Principled BSDF');tex=lamp.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Closest'
lamp.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);lamp.node_tree.links.new(tex.outputs['Color'],p.inputs['Emission Color'])

def bounds(items):
 points=[o.matrix_world@v.co for o in items for v in o.data.vertices]
 return {'min':[min(v[i] for v in points) for i in range(3)],'max':[max(v[i] for v in points) for i in range(3)]}
b=bounds(objects);size=[b['max'][i]-b['min'][i] for i in range(3)]
assert abs(size[0]-2.4133)<1e-5,size
assert abs(size[1]-5.6829)<1e-5,size
assert abs(size[2]-1.7938)<1e-5,size
for tag,c in centres.items():assert (bpy.data.objects['Wheel_'+tag].matrix_world.translation-c).length<1e-6
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'cybertruck-reference.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
report={'status':'CPU_GEOMETRY_CANDIDATE_NOT_VISUALLY_ACCEPTED','originalBlend':str(SOURCE),'originalBlendSHA256':original_hash,'candidateBlend':str(TARGET),'candidateGLB':'assets/vehicles/cybertruck-review/cybertruck-reference.glb','bounds':b,'size':size,'wheelCenters':{tag:list(c) for tag,c in centres.items()},'wheelbase':3.635,'frontTrack':1.777,'rearTrack':1.772,'nominalTireRadius':R,'shellWidthTarget':2.0316,'stance':'Premium AWD/Cyberbeast Medium air height target','materialsPreserved':True,'lampPalette':palette,'objects':len(objects),'limitations':['No renders or GPU checks performed','Existing approximate body contours retained with local deformations','Tire width can protrude beyond shell, consistent with option-dependent envelope; mirrors measured separately','Nominal tire radius is not loaded rolling radius','Existing wheel parents retained; no other vehicle assets modified']}
(OUT/'repair-report.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.context.scene['cybertruck_candidate_provenance']='Targeted existing OpenCity authored Cybertruck repair; no CAD/photoreal claim'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(TARGET))
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==original_hash
print('CYBERTRUCK_REPAIR_COMPLETE',json.dumps(report))
