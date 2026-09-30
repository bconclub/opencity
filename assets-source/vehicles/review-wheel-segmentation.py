"""Review-only segmentation of user-approved Cybercab. Never changes runtime asset."""
import bpy, json, math, os
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles/cybercab-wheel-review';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/vehicles/cybercab-meshy-approved.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
info=[]
for o in objects:
 vs=[o.matrix_world@v.co for v in o.data.vertices]
 parents=list(range(len(vs)))
 def find(a):
  while parents[a]!=a:parents[a]=parents[parents[a]];a=parents[a]
  return a
 for p in o.data.polygons:
  for a,b in zip(p.vertices,p.vertices[1:]):parents[find(a)]=find(b)
 keys={}
 for i,v in enumerate(vs):
  key=tuple(round(c,5) for c in v)
  if key in keys:parents[find(i)]=find(keys[key])
  else:keys[key]=i
 comps={}
 for i in range(len(vs)):comps.setdefault(find(i),[]).append(i)
 def bounds(ids):return {'lo':[min(vs[i][k] for i in ids) for k in range(3)],'hi':[max(vs[i][k] for i in ids) for k in range(3)]}
 info.append({'name':o.name,'vertices':len(vs),'polygons':len(o.data.polygons),'bounds':bounds(range(len(vs))),'components':sorted([dict(count=len(ids),**bounds(ids)) for ids in comps.values()],key=lambda c:-c['count'])[:30]})
(OUT/'inspection.json').write_text(json.dumps(info,indent=2));print('INSPECT',json.dumps(info),flush=True)
source=objects[0];me=source.data
# Only assign existing whole faces. No cuts, welds, smoothing, decimation or UV edits.
centers={'Wheel_FL':(-.785,1.405,.361),'Wheel_FR':(.785,1.405,.361),'Wheel_RL':(-.785,-1.367,.357),'Wheel_RR':(.785,-1.367,.357)}
groups={'Body':[]};groups.update({k:[] for k in centers})
world=[source.matrix_world@v.co for v in me.vertices]
for p in me.polygons:
 c=sum((world[i] for i in p.vertices),Vector())/len(p.vertices);label='Body'
 for name,(x,y,z) in centers.items():
  if c.x*x>0 and abs(c.x)>.63 and ((c.y-y)/.400)**2+((c.z-z)/.372)**2<1:
   label=name;break
 groups[label].append(p.index)
normals=[tuple(n.vector) for n in me.corner_normals];parts=[];audit={'originalFaces':len(me.polygons),'partFaces':{},'method':'whole original faces selected by wheel envelope; no topology cuts','normalPolicy':'copy original corner normals','uvPolicy':'copy every original UV corner','wheelPivots':centers}
for name,ids in groups.items():
 pivot=Vector(centers.get(name,(0,0,0)));used=sorted({i for pi in ids for i in me.polygons[pi].vertices});remap={old:new for new,old in enumerate(used)}
 nm=bpy.data.meshes.new(name);nm.from_pydata([world[i]-pivot for i in used],[],[[remap[i] for i in me.polygons[pi].vertices] for pi in ids]);nm.update()
 for m in me.materials:nm.materials.append(m)
 oldloops=[li for pi in ids for li in me.polygons[pi].loop_indices]
 for uv in me.uv_layers:
  nu=nm.uv_layers.new(name=uv.name)
  for nl,ol in enumerate(oldloops):nu.data[nl].uv=uv.data[ol].uv
 for p,pi in zip(nm.polygons,ids):p.use_smooth=me.polygons[pi].use_smooth;p.material_index=me.polygons[pi].material_index
 # Imported mesh coordinates already axis-aligned; rotate normals into world basis.
 normalmat=source.matrix_world.to_3x3().inverted().transposed()
 nm.normals_split_custom_set([(normalmat@Vector(normals[i])).normalized() for i in oldloops])
 ob=bpy.data.objects.new(name,nm);bpy.context.collection.objects.link(ob);ob.location=pivot;parts.append(ob);audit['partFaces'][name]=len(ids)
 audit.setdefault('maxUVError',{})[name]=max((nm.uv_layers[uv.name].data[nl].uv-uv.data[ol].uv).length for uv in me.uv_layers for nl,ol in enumerate(oldloops))
 audit.setdefault('maxCornerNormalVectorError',{})[name]=max((nm.corner_normals[nl].vector-(normalmat@Vector(normals[ol])).normalized()).length for nl,ol in enumerate(oldloops))
 audit.setdefault('maxPositionError',{})[name]=max((ob.matrix_world@nm.vertices[remap[i]].co-world[i]).length for i in used) if name=='Body' else max((nm.vertices[remap[i]].co+pivot-world[i]).length for i in used)
source.hide_render=True;source.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for ob in parts:ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'rejected-candidate.glb'),export_format='GLB',use_selection=True,export_yup=True)
audit['status']='REJECTED_FOR_RUNTIME';audit['reason']='90-degree wheel spin exposes triangular arch-edge gaps and rotates small gold/body fragments into tyre perimeter. Source physically connects wheel and body surfaces.'
audit['facesAdded']=0;audit['facesRemoved']=0;audit['faceAssignmentsPreserved']=sum(audit['partFaces'].values())==audit['originalFaces']
(OUT/'segmentation-audit.json').write_text(json.dumps(audit,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=3;scene.render.resolution_x=1200;scene.render.resolution_y=780;scene.render.resolution_percentage=100
scene.world.color=(.24,.24,.24)
for pos,power,size in [((4,4,7),1800,5),((-4,-3,4),1500,4),((0,5,2),500,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);a=bpy.context.object;a.data.energy=power;a.data.size=size;a.rotation_euler=(Vector((0,0,.6))-a.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.5;scene.camera=cam
for label,pos in [('static-side',(7,0,1)),('static-front',(4,6,2.7)),('static-rear',(-4,-6,2.7))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(label+'.png'));bpy.ops.render.render(write_still=True)
for ob in parts:
 if ob.name.startswith('Wheel_'):ob.rotation_euler.x=math.radians(90)
for label,pos in [('rotated-side',(7,0,1)),('rotated-front',(4,6,2.7)),('rotated-rear',(-4,-6,2.7))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(label+'.png'));bpy.ops.render.render(write_still=True)
for ob in parts:ob.rotation_euler.x=0
source.hide_render=False
for ob in parts:ob.hide_render=True
for label,pos in [('source-side',(7,0,1)),('source-front',(4,6,2.7)),('source-rear',(-4,-6,2.7))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(label+'.png'));bpy.ops.render.render(write_still=True)
source.hide_render=True
for ob in parts:ob.hide_render=False
scene['review_status']='REJECTED: arch gaps and attached body fragments rotate with wheels. Do not install.'
if os.environ.get('WHEEL_REVIEW_BLEND'):
 dest=Path(os.environ['WHEEL_REVIEW_BLEND']);dest.mkdir(exist_ok=True,parents=True);bpy.ops.wm.save_as_mainfile(filepath=str(dest/'cybercab-segmentation-review.blend'))
