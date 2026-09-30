"""Build review-only optimized Cyber CAB from latest user-supplied GLB."""
import bpy, bmesh, json, math, hashlib, os
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(r"C:/Users/user/Documents/ChatGPT/Z")
SOURCE=Path(r"D:/Brands BCON/OpenCity/Models/Cyber CAB.glb")
PROFILE=os.environ.get('OPENCITY_CYBERCAB_PROFILE','candidate')
GLB=ROOT/f'assets/vehicles/cybercab-latest-{PROFILE}.glb'
QC=ROOT/'qc/cybercab-latest'
BLEND=Path(f'D:/CodexTools/Blender/projects/cybercab-latest-{PROFILE}.blend')
QC.mkdir(parents=True,exist_ok=True); GLB.parent.mkdir(parents=True,exist_ok=True); BLEND.parent.mkdir(parents=True,exist_ok=True)

def tris(o): return sum(len(p.vertices)-2 for p in o.data.polygons)
def bounds(objects):
 bpy.context.view_layer.update(); vs=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
 return Vector([min(v[i] for v in vs) for i in range(3)]),Vector([max(v[i] for v in vs) for i in range(3)])
def activate(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
def render(path,objects):
 scene=bpy.context.scene
 for o in scene.objects:
  if o.type in {'CAMERA','LIGHT'}: bpy.data.objects.remove(o,do_unlink=True)
 bpy.ops.mesh.primitive_plane_add(size=20,location=(0,0,-.012)); floor=bpy.context.object;floor.name='QC_Floor'
 mat=bpy.data.materials.new('QC_Floor');mat.diffuse_color=(.035,.04,.05,1);mat.use_nodes=True
 mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.035,.04,.05,1);mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.72;floor.data.materials.append(mat)
 world=scene.world or bpy.data.worlds.new('World');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.025,.03,.04,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
 for pos,energy,size,color in [((4,5,6),1300,5,(1,.82,.68)),((-4,1,4),900,4,(.45,.62,1)),((0,-5,3),1100,3,(1,.75,.35))]:
  bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=energy;l.data.shape='DISK';l.data.size=size;l.data.color=color;l.rotation_euler=(Vector((0,0,.65))-l.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(5.8,6.6,3.1));cam=bpy.context.object;cam.data.lens=58;cam.rotation_euler=(Vector((0,0,.7))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
 scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=1000;scene.render.resolution_y=700;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False;scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)
 bpy.data.objects.remove(floor,do_unlink=True)

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
body=next(o for o in bpy.context.scene.objects if o.type=='MESH');body.name='Body'
source_tris=tris(body); source_lo,source_hi=bounds([body])
# Latest source uses X length, Y width. Convert to authored Z-up, +Y front and 4.45m length.
scale=4.45/(source_hi.x-source_lo.x)
body.matrix_world=Matrix.Scale(scale,4)@Matrix.Rotation(math.pi/2,4,'Z')@body.matrix_world
lo,hi=bounds([body]);body.matrix_world=Matrix.Translation(Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z)))@body.matrix_world
activate(body);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
scaled_lo,scaled_hi=bounds([body])
if not (QC/'cybercab-latest-source.png').exists(): render(QC/'cybercab-latest-source.png',[body])

# Conservative wheel envelopes. Only faces wholly represented by wheel-area centroids move.
centres={'Wheel_FL':(-.35*scale,.58*scale,.150*scale), 'Wheel_FR':(.35*scale,.58*scale,.150*scale),
         'Wheel_RL':(-.35*scale,-.58*scale,.150*scale), 'Wheel_RR':(.35*scale,-.58*scale,.150*scale)}
wheels=[]
source_mesh=body.data.copy();me=source_mesh;n=len(me.vertices);parent=list(range(n));sz=[1]*n
def find(a):
 while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
 return a
def union(a,b):
 a=find(a);b=find(b)
 if a==b:return
 if sz[a]<sz[b]:a,b=b,a
 parent[b]=a;sz[a]+=sz[b]
for p in me.polygons:
 for v in p.vertices[1:]:union(p.vertices[0],v)
component_vertices={}
for v in me.vertices:component_vertices.setdefault(find(v.index),[]).append(v.co.copy())
wheel_roots={name:set() for name in centres}
for root,vs in component_vertices.items():
 for name,c in centres.items():
  mean=Vector((sum(v.x for v in vs)/len(vs),sum(v.y for v in vs)/len(vs),sum(v.z for v in vs)/len(vs)))
  extent=(max(v.x for v in vs)-min(v.x for v in vs),max(v.y for v in vs)-min(v.y for v in vs),max(v.z for v in vs)-min(v.z for v in vs))
  if abs(mean.x-c[0])<.28 and math.hypot(mean.y-c[1],mean.z-c[2])<.34 and mean.z<.43 and max(extent)<.75:
   wheel_roots[name].add(root);break
for name,roots in wheel_roots.items():
 if not roots:raise RuntimeError(f'{name}: no connected wheel islands')
 selected=[v for r in roots for v in component_vertices[r]];c=centres[name]
 w=body.copy();w.data=source_mesh.copy();bpy.context.collection.objects.link(w);w.name=name
 bm=bmesh.new();bm.from_mesh(w.data);bm.verts.ensure_lookup_table()
 bmesh.ops.delete(bm,geom=[f for f in bm.faces if find(f.verts[0].index) not in roots],context='FACES')
 bm.to_mesh(w.data);bm.free();w.data.update()
 world=Vector(c); local=w.matrix_world.inverted()@world
 for v in w.data.vertices:v.co-=local
 w.location=world
 wheels.append(w)
# Remove wheel-region faces from fixed body.
bm=bmesh.new();bm.from_mesh(body.data)
bm.verts.ensure_lookup_table();all_wheel_roots=set().union(*wheel_roots.values())
bmesh.ops.delete(bm,geom=[f for f in bm.faces if find(f.verts[0].index) in all_wheel_roots],context='FACES')
bm.to_mesh(body.data);bm.free();body.data.update();bpy.data.meshes.remove(source_mesh)

targets={'candidate':(18400,1600),'quality':(47800,3000),'fidelity':(125800,6000)}[PROFILE]
for o,target in [(body,targets[0])]+[(w,targets[1]) for w in wheels]:
 before=tris(o)
 if before>target:
  activate(o);mod=o.modifiers.new('Game Decimate','DECIMATE');mod.decimate_type='COLLAPSE';mod.ratio=target/before;mod.use_collapse_triangulate=True
  bpy.ops.object.modifier_apply(modifier=mod.name)
 # Rebuild smooth shading after topology collapse. Preserve hard creases as sharp edges.
 for p in o.data.polygons:p.use_smooth=True
 bm=bmesh.new();bm.from_mesh(o.data)
 for e in bm.edges:
  e.smooth=not (len(e.link_faces)==2 and e.calc_face_angle(0.0)>math.radians(35))
 bm.to_mesh(o.data);bm.free();o.data.update()

for image in bpy.data.images:
 if image.type=='IMAGE' and image.size[0] and max(image.size)>1024:
  f=1024/max(image.size);image.scale(max(1,round(image.size[0]*f)),max(1,round(image.size[1]*f)));image.pack()

objects=[body]+wheels
for o in objects:o['provenance']=str(SOURCE)
activate(body)
for o in wheels:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(GLB),export_format='GLB',use_selection=True,export_yup=True,export_apply=False)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
render(QC/f'cybercab-latest-{PROFILE}.png',objects)

final_lo,final_hi=bounds(objects)
report={'status':'review_candidate','source':str(SOURCE),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'sourceBytes':SOURCE.stat().st_size,'sourceTriangles':source_tris,'sourceBounds':[list(source_lo),list(source_hi)],
 'candidate':str(GLB),'candidateBytes':GLB.stat().st_size,'triangles':sum(tris(o) for o in objects),
 'triangleBreakdown':{o.name:tris(o) for o in objects},'materials':len({m.name for o in objects for m in o.data.materials if m}),
 'textures':[{'name':i.name,'size':list(i.size)} for i in bpy.data.images if i.type=='IMAGE'],
 'boundsMin':list(final_lo),'boundsMax':list(final_hi),'dimensions':list(final_hi-final_lo),
 'wheelPivots':{w.name:list(w.location) for w in wheels},'wheelAxis':'local X','frontDirection':'+Y',
 'appearancePolicy':'Original material, UVs, and textures retained; textures downscaled to 1024. No blanket smoothing or recolouring.',
 'wheelLimitation':'Wheel faces are separated by conservative spatial envelopes from a single fragmented source mesh. Pivots function, but envelopes may include nearby arch/liner fragments or omit wheel fragments; visual review required.',
 'renders':[str(QC/'cybercab-latest-source.png'),str(QC/f'cybercab-latest-{PROFILE}.png')], 'editableBlend':str(BLEND)}
(QC/f'cybercab-latest-{PROFILE}-report.json').write_text(json.dumps(report,indent=2))
print('CYBERCAB_LATEST_READY',json.dumps(report),flush=True)
