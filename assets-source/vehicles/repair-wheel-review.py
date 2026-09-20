"""One review-only wheel repair. Original asset is read only."""
import bpy, math, json, os
from pathlib import Path
from mathutils import Vector
from mathutils.geometry import closest_point_on_tri, barycentric_transform
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles/cybercab-wheel-review'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/vehicles/cybercab-meshy-approved.glb'))
source=next(o for o in bpy.context.scene.objects if o.type=='MESH');me=source.data
world=[source.matrix_world@v.co for v in me.vertices];normalmat=source.matrix_world.to_3x3().inverted().transposed()
centers={'Wheel_FL':(-.78,1.405,.365),'Wheel_FR':(.78,1.405,.365),'Wheel_RL':(-.78,-1.367,.365),'Wheel_RR':(.78,-1.367,.365)}
keep=[];removed=[]
for p in me.polygons:
 c=sum((world[i] for i in p.vertices),Vector())/3
 # Remove only wheel cores, preserve every peripheral fender/arch face static.
 iscore=any(c.x*x>0 and abs(c.x)>.63 and (c.y-y)**2+(c.z-z)**2<.345**2 for x,y,z in centers.values())
 (removed if iscore else keep).append(p.index)
used=sorted({i for pi in keep for i in me.polygons[pi].vertices});idx={i:j for j,i in enumerate(used)}
bm=bpy.data.meshes.new('UntouchedExteriorFaces');bm.from_pydata([world[i] for i in used],[],[[idx[i] for i in me.polygons[pi].vertices] for pi in keep]);bm.update()
for m in me.materials:bm.materials.append(m)
oldloops=[li for pi in keep for li in me.polygons[pi].loop_indices]
for uv in me.uv_layers:
 nu=bm.uv_layers.new(name=uv.name)
 for nl,ol in enumerate(oldloops):nu.data[nl].uv=uv.data[ol].uv
for p,pi in zip(bm.polygons,keep):p.use_smooth=me.polygons[pi].use_smooth;p.material_index=me.polygons[pi].material_index
bm.normals_split_custom_set([(normalmat@me.corner_normals[i].vector).normalized() for i in oldloops])
body=bpy.data.objects.new('Body_FixedFenders',bm);bpy.context.collection.objects.link(body)
dark=bpy.data.materials.new('ReplacementRubberAndHiddenLiners');dark.diffuse_color=(.009,.012,.015,1);dark.use_nodes=True;bs=dark.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.009,.012,.015,1);bs.inputs['Roughness'].default_value=.62
gold=bpy.data.materials.new('ReplacementGoldRims');gold.diffuse_color=(.42,.33,.20,1);gold.use_nodes=True;gs=gold.node_tree.nodes.get('Principled BSDF');gs.inputs['Base Color'].default_value=(.42,.33,.20,1);gs.inputs['Metallic'].default_value=.8;gs.inputs['Roughness'].default_value=.32
parts=[body];wheels=[]
def lathe(name,pivot,profile,material,sign=1):
 n=48;verts=[(sign*x,r*math.sin(a*math.tau/n),r*math.cos(a*math.tau/n)) for x,r in profile for a in range(n)];faces=[]
 for k in range(len(profile)-1):
  for j in range(n):faces.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();mesh.materials.append(material)
 for p in mesh.polygons:p.use_smooth=True
 ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.location=pivot;return ob
for name,co in centers.items():
 pivot=Vector(co);sign=1 if pivot.x>0 else -1
 tyre=lathe(name,pivot,[(-.13,.302),(-.13,.335),(-.095,.359),(-.07,.365),(.075,.365),(.118,.354),(.137,.327),(.137,.300)],dark,sign);parts.append(tyre);wheels.append(tyre)
 liner=lathe('FixedLiner_'+name,pivot,[(-.15,0),(-.15,.383),(.066,.383),(.066,.363)],dark,sign);parts.append(liner)
 # Clean separate rim material applies only to new replacement geometry.
 n=48;rings=3;v=[(sign*.149,0,0)];f=[]
 for ring in range(1,rings+1):
  r=.322*ring/rings
  for j in range(n):v.append((sign*(.143+.006*(1-(r/.322)**2)),r*math.sin(j*math.tau/n),r*math.cos(j*math.tau/n)))
 for j in range(n):f.append((0,1+(j+1)%n,1+j))
 for k in range(rings-1):
  for j in range(n):f.append((1+k*n+j,1+k*n+(j+1)%n,1+(k+1)*n+(j+1)%n,1+(k+1)*n+j))
 if sign<0:f=[tuple(reversed(face)) for face in f]
 rim=bpy.data.meshes.new('RebuiltCircularDisc_'+name);rim.from_pydata(v,[],f);rim.update();rim.materials.append(gold)
 for p in rim.polygons:p.use_smooth=True
 ob=bpy.data.objects.new('Rim_'+name,rim);bpy.context.collection.objects.link(ob);ob.parent=tyre;parts.append(ob)
 # Rim explicit radial normals face outward; no changes to original body normals.
 rim.normals_split_custom_set([(sign,0,0)]*len(rim.loops))
source.hide_render=True;source.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for ob in parts:ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'repaired-candidate.glb'),export_format='GLB',use_selection=True,export_yup=True)
audit={'status':'PENDING_VISUAL_REVIEW','originalFaces':len(me.polygons),'fixedOriginalFaces':len(keep),'removedWheelCoreFaces':len(removed),'maxRetainedBodyPositionError':max((bm.vertices[idx[i]].co-world[i]).length for i in used),'maxRetainedUVError':max((bm.uv_layers[uv.name].data[nl].uv-uv.data[ol].uv).length for uv in me.uv_layers for nl,ol in enumerate(oldloops)),'materials':3,'wheelPivots':centers,'wheelRadius':.365,'rimRadius':.322,'method':'Original wheel cores removed inside radius 0.345m; all peripheral scan faces static. New circular tyres and discs, separate clean gold/rubber materials, dark fixed liners. No smoothing or recoloring of source exterior.','triangles':sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in parts)}
(OUT/'repair-audit.json').write_text(json.dumps(audit,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=3;scene.render.resolution_x=1200;scene.render.resolution_y=780;scene.render.resolution_percentage=100;scene.world.color=(.24,.24,.24)
for pos,power,size in [((4,4,7),1800,5),((-4,-3,4),1500,4),((0,5,2),500,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);a=bpy.context.object;a.data.energy=power;a.data.size=size;a.rotation_euler=(Vector((0,0,.6))-a.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.5;scene.camera=cam
for state,angle in [('static',0),('rotated',math.pi/2)]:
 for ob in wheels:ob.rotation_euler.x=angle
 for view,pos in [('side',(7,0,1)),('front',(4,6,2.7)),('rear',(-4,-6,2.7))]:
  cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'repaired-{state}-{view}.png');bpy.ops.render.render(write_still=True)
for ob in wheels:ob.rotation_euler.x=0
dest=Path(os.environ.get('WHEEL_REVIEW_BLEND','D:/CodexTools/Blender/projects/cybercab-wheel-review'));dest.mkdir(exist_ok=True,parents=True);bpy.ops.wm.save_as_mainfile(filepath=str(dest/'cybercab-repaired-review.blend'))
print('REPAIR_AUDIT',json.dumps(audit),flush=True)
