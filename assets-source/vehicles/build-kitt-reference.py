"""Reference-led KITT candidate. Original reconstruction, not Pontiac CAD.
Blender 4.5 CLI. Editable source on D:, review exports separate from live assets.
Axes: source Z up, +Y forward; glTF Y up, -Z forward.
"""
import bpy, math, json, os
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/vehicles/kitt-review'
SOURCE=Path('D:/CodexTools/Blender/projects/kitt-reference')
OUT.mkdir(parents=True,exist_ok=True); SOURCE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
WB=2.5654; FRONT=WB/2; REAR=-WB/2; TRACK=1.524; R=.321

def material(name,color,metal,rough,vertex=False):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if vertex:
  v=m.node_tree.nodes.new('ShaderNodeVertexColor');v.layer_name='Color';m.node_tree.links.new(v.outputs['Color'],p.inputs['Base Color'])
 return m
paint=material('BodyPaint',(.006,.007,.009),.035,.24)
paint.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.75
paint.node_tree.nodes.get('Principled BSDF').inputs['Coat Roughness'].default_value=.13
trim=material('RubberTrim',(.022,.023,.027),.12,.54,True)
glass=material('Glass',(.060,.088,.098),.06,.16)
glass.surface_render_method='DITHERED'
glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.58
lamps=material('Lamps',(1,1,1),.18,.22,True)
p=lamps.node_tree.nodes.get('Principled BSDF');v=next(n for n in lamps.node_tree.nodes if n.type=='VERTEX_COLOR');lamps.node_tree.links.new(v.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=1.8

def color(o,col):
 a=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
 for d in a.data:d.color=(*col,1)
 return o
def mesh(name,verts,faces,mat,smooth=False,col=None):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(mat)
 for f in d.polygons:f.use_smooth=smooth
 if col:color(o,col)
 return o
def bevel(o,width=.008,segments=2):
 m=o.modifiers.new('Edge highlight','BEVEL');m.width=width;m.segments=segments
 o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
def box(name,loc,size,mat,edge=.007,col=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 if col:color(o,col)
 if edge:bevel(o,edge)
 return o
def line(name,points,r,mat,col=None):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=0;s=c.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*p,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);c.materials.append(mat)
 bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
 if col:color(o,col)
 return o
def cylinder(name,loc,r,depth,mat,col=None,n=48):
 bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=depth,location=loc,rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=name;o.data.materials.append(mat)
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 if col:color(o,col)
 return o
def parent(o,p):o.parent=p;o.matrix_parent_inverse=p.matrix_world.inverted();return o
def empty(name,loc):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc;bpy.context.view_layer.update();return o
def surface(name,rows,mat,crown=.02):
 # Bilaterally symmetric smooth surface, widths measured at each longitudinal station.
 v=[];cols=12
 for y,w,z in rows:
  for i in range(cols+1):
   t=-1+2*i/cols;v.append((w*t,y,z+crown*(1-t*t)))
 f=[]
 for j in range(len(rows)-1):
  for i in range(cols):a=j*(cols+1)+i;f.append((a,a+1,a+cols+2,a+cols+1))
 return mesh(name,v,f,mat,True)

# Measured base-car platform. KITT nose/surface station offsets are photo estimates.
# Smooth cross sections, curved flanks, real cut-out wheel openings.
stations=[(-2.41,.79,.29,.75),(-2.28,.875,.24,.81),(-1.9,.906,.205,.835),(-1.55,.9145,.20,.855),(REAR,.9145,.20,.855),(-.94,.904,.195,.83),(-.55,.889,.19,.815),(0,.884,.19,.807),(.60,.897,.195,.807),(FRONT,.9145,.20,.806),(1.65,.904,.23,.775),(1.99,.873,.27,.707),(2.28,.82,.30,.644),(2.41,.735,.34,.608)]
dense=[]
for idx,(a,b) in enumerate(zip(stations,stations[1:])):
 prev=stations[max(0,idx-1)];nxt=stations[min(len(stations)-1,idx+2)]
 for k in range(4):
  t=k/4;row=[a[0]*(1-t)+b[0]*t]
  for j in range(1,4):row.append(.5*(2*a[j]+(-prev[j]+b[j])*t+(2*prev[j]-5*a[j]+4*b[j]-nxt[j])*t*t+(-prev[j]+3*a[j]-3*b[j]+nxt[j])*t*t*t))
  row[1]=min(.9145,row[1]);dense.append(row)
dense.append(stations[-1]);v=[]
profile=[(-.87,0),(-.99,.14),(-1,.65),(-.985,.87),(-.94,.98),(-.81,1.025),(-.45,1.045),(0,1.052),(.45,1.045),(.81,1.025),(.94,.98),(.985,.87),(1,.65),(.99,.14),(.87,0)]
for y,w,lo,hi in dense:
 for x,h in profile:v.append((x*w,y,lo+(hi-lo)*h))
n=len(profile);f=[tuple(range(n-1,-1,-1))]
for j in range(len(dense)-1):
 for k in range(n):f.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
f.append(tuple((len(dense)-1)*n+k for k in range(n)))
shell=mesh('Sculpted body shell',v,f,paint,True)
for y in [FRONT,REAR]:
 cut=cylinder('Wheel aperture cutter',(0,y,R),.358,2.5,trim,n=64)
 mod=shell.modifiers.new('True wheel opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
 bpy.context.view_layer.objects.active=shell;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
# True recessed openings in front fascia, not black panels hidden inside the body.
for s in [-1,1]:
 cut=box('Fog opening cutter',(s*.53,2.34,.447),(.52,.36,.128),trim,.022)
 bpy.context.view_layer.objects.active=cut
 for mod in list(cut.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=shell.modifiers.new('Fog lamp aperture','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
 bpy.context.view_layer.objects.active=shell;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
bevel(shell,.004,2)
shell.modifiers.remove(shell.modifiers.get('Weighted normals'))
# Recessed wheel-well liners and narrow rolled lips.
for y in [FRONT,REAR]:
 for sign in [-1,1]:
  pts=[(sign*.913,y+math.cos(a)*.363,R+math.sin(a)*.363) for a in [i*math.pi/32 for i in range(33)]]
  line('Rolled fender lip',pts,.010,paint)
  verts=[]
  for a in [i*math.pi/32 for i in range(33)]:
   for x in [.61,.90]:verts.append((sign*x,y+math.cos(a)*.35,R+math.sin(a)*.35))
  mesh('Wheel well liner',verts,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(32)],trim,True,(.012,.014,.016))

# Hood panel with long creases and the shallow offset Trans Am induction bulge.
# Bonnet is part of the original shell; no duplicate coplanar plate.
for s in [-1,1]:
 line('Bonnet panel seam',[(s*.738,.57,.833),(s*.744,.92,.838),(s*.738,1.35,.816),(s*.703,1.8,.762),(s*.64,2.12,.690)],.0028,trim,(.006,.007,.009))
line('Bonnet rear seam',[(-.738,.57,.833),(0,.57,.845),(.738,.57,.833)],.0028,trim,(.006,.007,.009))
# The small induction contour is deferred rather than leaving an intersecting overlay.
# Distinctive retractable headlight lids follow nose surface instead of floating boxes.
for s in [-1,1]:
 pts=[(s*.45,1.73,.770),(s*.78,1.71,.764),(s*.749,2.025,.713),(s*.43,2.053,.715)]
 line('Headlight panel seam',pts+[pts[0]],.0028,trim,(.004,.005,.006))

# Cabin is constructed from individual panels, not a solid blob behind glass.
surface('Roof spine',[(-.89,.07,1.232),(-.62,.07,1.258),(-.20,.065,1.253),(-.055,.06,1.232)],paint,.007)
surface('Windshield',[(-.055,.638,1.23),(.06,.665,1.172),(.24,.704,1.065),(.45,.751,.923),(.595,.77,.839)],glass,.025)
surface('Rear panoramic hatch',[(-.91,.675,1.22),(-1.12,.705,1.156),(-1.42,.735,1.055),(-1.7,.758,.948),(-1.97,.765,.847)],glass,.022)
for s in [-1,1]:
 # Glass T tops, windscreen and rear pillars have physically distinct edges.
 mesh('T top glass',[(s*.079,-.86,1.238),(s*.61,-.86,1.229),(s*.635,-.16,1.235),(s*.075,-.16,1.257)],[(0,1,2,3)],glass)
 line('Roof rail',[(s*.645,-.93,1.211),(s*.67,-.63,1.237),(s*.66,-.16,1.237),(s*.638,-.055,1.23),(s*.77,.595,.84)],.024,paint)
 line('Windscreen seal',[(s*.632,-.054,1.231),(s*.66,.06,1.174),(s*.70,.24,1.067),(s*.747,.45,.925),(s*.767,.595,.841)],.009,trim,(.010,.012,.014))
 window=[(s*.66,-.87,1.204),(s*.642,-.09,1.207),(s*.772,.552,.86),(s*.868,-.87,.849)]
 mesh('Door glass',window,[(0,1,2,3)],glass)
 line('Window weather seal',window+[window[0]],.009,trim,(.01,.012,.014))
 mesh('Rear sail pillar',[(s*.681,-.93,1.222),(s*.774,-1.97,.85),(s*.906,-1.65,.85),(s*.873,-.97,.854)],[(0,1,2,3)],paint)
 line('Hatch trim',[(s*.68,-.93,1.224),(s*.71,-1.12,1.159),(s*.741,-1.42,1.058),(s*.764,-1.7,.951),(s*.771,-1.97,.85)],.012,paint)
 # Door perimeter stays on the smooth side shell.
 line('Door shut line',[(s*.90,-.93,.817),(s*.906,-.95,.59),(s*.893,-.93,.26),(s*.883,.78,.26),(s*.907,.85,.72),(s*.899,.61,.804)],.0026,trim,(.006,.007,.009))
 line('Rocker moulding',[(s*.879,-.88,.242),(s*.889,.80,.242)],.013,trim,(.013,.016,.020))
 box('Recessed door handle',(s*.898,-.705,.758),(.018,.135,.027),trim,.009,(.011,.013,.017))
 mirror=box('Sculpted door mirror',(s*.957,.425,.886),(.149,.215,.086),paint,.035)
 box('Mirror lens',(s*.961,.316,.892),(.112,.008,.051),glass,.009)
 box('Side amber marker',(s*.878,1.946,.567),(.014,.175,.040),lamps,.004,(1,.31,.015))
 box('Rear side red marker',(s*.881,-2.1,.532),(.014,.14,.038),lamps,.004,(.45,.008,.003))
line('Front roof header',[(-.65,-.13,1.241),(0,-.13,1.264),(.65,-.13,1.241)],.018,paint)
line('Rear roof header',[(-.67,-.9,1.228),(0,-.9,1.240),(.67,-.9,1.228)],.018,paint)
# Simple visible interior provides depth behind glass at chase-camera distances.
box('Cabin floor',(0,-.38,.37),(1.49,2.25,.055),trim,.01,(.033,.024,.016))
box('Dashboard',(0,.39,.76),(1.40,.29,.16),trim,.045,(.08,.054,.031))
for s in [-1,1]:
 box('Tan seat cushion',(s*.38,-.33,.51),(.49,.48,.13),trim,.07,(.32,.205,.11))
 seat=box('Tan seat back',(s*.38,-.65,.77),(.48,.13,.55),trim,.065,(.32,.205,.11));seat.rotation_euler.x=-.14
 box('Seat headrest',(s*.38,-.685,1.005),(.27,.14,.17),trim,.035,(.32,.205,.11))
box('Centre tunnel',(0,-.21,.52),(.18,1.0,.16),trim,.04,(.08,.057,.032))
for x in [-.22,.16]:box('Dashboard display',(x,.27,.82),(.28,.01,.10),lamps,.005,(.002,.04,.045))

# Front fascia: sculpted nose lip, slim scanner, two recessed banks of fog lights.
box('Scanner black recess',(0,2.423,.600),(.74,.025,.061),trim,.015,(.003,.004,.005))
for i in range(8):
 o=box('Scanner_'+str(i),(-.301+i*.086,2.439,.603),(.065,.012,.030),lamps,.004,(.7,.001,.001));o['scannerIndex']=i
for s in [-1,1]:
 box('Fog light recess',(s*.53,2.239,.447),(.50,.035,.115),trim,.022,(.003,.004,.005))
 for i in range(3):box('Fog lamp',(s*(.38+i*.143),2.273,.443),(.117,.016,.071),lamps,.005,(.25,.28,.25))
 # Raised painted lip around the recess, compact not a race splitter.
 line('Lower nose lip',[(s*.12,2.399,.334),(s*.36,2.388,.32),(s*.67,2.354,.332),(s*.80,2.285,.375)],.026,paint)
box('Lower air opening',(0,2.345,.338),(1.39,.026,.043),trim,.007,(.005,.006,.007))
# Low rear spoiler, smoked full-width tail panel, inset plate.
surface('Rear deck',[(-1.98,.79,.84),(-2.17,.835,.83),(-2.36,.8,.803)],paint,.012)
box('Rear spoiler',(0,-2.16,.921),(1.71,.25,.048),paint,.023)
for s in [-1,1]:box('Spoiler foot',(s*.72,-2.15,.865),(.085,.19,.086),paint,.018)
box('Smoked rear lamp panel',(0,-2.413,.658),(1.55,.020,.15),glass,.02)
for s in [-1,1]:
 box('Tail light',(s*.51,-2.428,.683),(.45,.01,.034),lamps,.003,(.24,.002,.001))
 box('Tail light lower',(s*.51,-2.427,.638),(.45,.009,.018),lamps,.003,(.11,.001,.001))
box('Rear number plate recess',(0,-2.419,.48),(.32,.025,.119),trim,.008,(.016,.019,.024))
box('Plate',(0,-2.437,.48),(.27,.005,.095),trim,.003,(.56,.58,.54))
line('Rear bumper seam',[(-.78,-2.406,.537),(0,-2.43,.537),(.78,-2.406,.537)],.0035,trim,(.01,.012,.015))
box('Underbody',(0,-.03,.19),(1.25,3.70,.045),trim,.01,(.016,.018,.019))

# Four proper independent rigs. Wheel rotation local X; steering source local Z.
wheel_positions={}
for axle,y in [('F',FRONT),('R',REAR)]:
 for side,s in [('L',-1),('R',1)]:
  tag=axle+side;loc=(s*TRACK/2,y,R);steer=empty('Steer_'+tag,loc);pivot=empty('Wheel_'+tag,loc);parent(pivot,steer);wheel_positions[tag]=list(loc)
  verts=[];segments=48
  # Rounded sidewall shoulders, flattened tread band and real tyre thickness.
  cross=[(-.113,.235),(-.119,.267),(-.111,.295),(-.091,.315),(-.065,R),(.065,R),(.091,.315),(.111,.295),(.119,.267),(.113,.235)]
  for dx,r in cross:
   for k in range(segments):a=k*math.tau/segments;verts.append((loc[0]+dx,y+math.sin(a)*r,R+math.cos(a)*r))
  faces=[]
  for j in range(len(cross)-1):
   for k in range(segments):faces.append((j*segments+k,j*segments+(k+1)%segments,(j+1)*segments+(k+1)%segments,(j+1)*segments+k))
  parent(mesh('Tyre_'+tag,verts,faces,trim,True,(.014,.017,.021)),pivot)
  # Discrete tread cuts give visible wheel travel and rubber definition.
  for k in range(40):
   a=k*math.tau/40
   pts=[(loc[0]+dx,y+math.sin(a+dx*.30)*.322,R+math.cos(a+dx*.30)*.322) for dx in [-.07,0,.07]]
   parent(line('Tread groove',pts,.002,trim,(.003,.004,.005)),pivot)
  x=loc[0]+s*.117
  parent(cylinder('Rim barrel',(x,y,R),.219,.024,trim,(.22,.25,.28),64),pivot)
  # Turbocast dish: rounded black centre and silver outer ventilation slots.
  verts=[]
  for rad,depth in [(0,.027),(.075,.027),(.16,.023),(.202,.014),(.216,.004)]:
   for k in range(64):a=k*math.tau/64;verts.append((x+s*depth,y+math.sin(a)*rad,R+math.cos(a)*rad))
  faces=[(j*64+k,j*64+(k+1)%64,(j+1)*64+(k+1)%64,(j+1)*64+k) for j in range(4) for k in range(64)]
  parent(mesh('Turbocast black dish',verts,faces,paint,True),pivot)
  for k in range(24):
   a=k*math.tau/24;o=box('Rim vent',(x+s*.013,y+math.sin(a)*.208,R+math.cos(a)*.208),(.007,.013,.023),trim,0,(.31,.34,.37));o.rotation_euler.x=-a;parent(o,pivot)
  for k in range(5):
   a=k*math.tau/5;parent(cylinder('Lug well',(x+s*.029,y+math.sin(a)*.061,R+math.cos(a)*.061),.016,.005,trim,(.005,.006,.008),16),pivot)
  parent(cylinder('Centre cap',(x+s*.03,y,R),.029,.007,trim,(.026,.029,.035),24),pivot)

# Apply modifiers; merge only same-material geometry with the same rigid parent.
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
groups={}
for o in list(bpy.context.scene.objects):
 if o.type=='MESH' and not o.name.startswith('Scanner_'):groups.setdefault((o.parent.name if o.parent else '',o.data.materials[0].name),[]).append(o)
for (rig,mat),items in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in items:o.select_set(True)
 bpy.context.view_layer.objects.active=items[0]
 if len(items)>1:bpy.ops.object.join()
 items[0].name=(rig or 'Body')+'_'+mat
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
# glTF vertex colour affects base colour, but does not multiply emissive colour.
# A tiny palette texture keeps red scanner/amber markers coloured in the browser.
palette=[]
for o in meshes:
 if o.data.materials[0]!=lamps:continue
 attr=o.data.color_attributes.get('Color')
 if not attr:continue
 for face in o.data.polygons:
  c=tuple(round(v,5) for v in attr.data[face.loop_indices[0]].color[:3])
  if c not in palette:palette.append(c)
width=max(1,len(palette));im=bpy.data.images.new('Lamp colour palette',width=width,height=1,alpha=True)
im.colorspace_settings.name='Non-Color';im.pixels=[v for c in palette for v in (*c,1)];im.pack()
for o in meshes:
 if o.data.materials[0]!=lamps:continue
 for old_uv in list(o.data.uv_layers):o.data.uv_layers.remove(old_uv)
 uv=o.data.uv_layers.new(name='LampUV');attr=o.data.color_attributes.get('Color')
 for face in o.data.polygons:
  c=tuple(round(v,5) for v in attr.data[face.loop_indices[0]].color[:3]);u=(palette.index(c)+.5)/width
  for i in face.loop_indices:uv.data[i].uv=(u,.5)
 o.data.uv_layers.active=uv
 uv.active_render=True
 o.data.color_attributes.remove(attr)
p=lamps.node_tree.nodes.get('Principled BSDF');tex=lamps.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Closest'
lamps.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);lamps.node_tree.links.new(tex.outputs['Color'],p.inputs['Emission Color'])
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'kitt-reference.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
report={'wheelbase_m':WB,'wheel_radius_m':R,'track_m':TRACK,'track_status':'photo estimate; confirm exact Trans Am option','triangles':tri,'materials':4,'wheels':wheel_positions,'rig':'Steer parent around source Z, Wheel child around source X','verified':['base wheelbase 101 inches'], 'estimated':['custom KITT nose dimensions','surface station profiles','track','tyre rolling radius'], 'source':'Original Blender reconstruction from Pontiac brochure and KITT photographic references; not CAD'}
assert tri<=25000, f'Geometry budget exceeded: {tri}'
(OUT/'validation.json').write_text(json.dumps(report,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.32,.37,.45,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.35
floor=material('Studio',(.14,.16,.18),.0,.65);box('Studio floor',(0,0,-.055),(200,200,.1),floor,0)
for name,pos,power,size in [('Key',(3,2,5),1450,5),('Long softbox',(-3,0,3),1900,4),('Rear rim',(1,-5,4),1300,4)]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=2;o.rotation_euler=(Vector((0,0,.6))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(5,7,2.9));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=6;scene.camera=cam
views={'front-three-quarter':(5,7,2.9),'side':(7,0,1.05),'rear-three-quarter':(5,-7,2.9),'front':(0,8,1.1)}
for name,pos in views.items():
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.64))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(name+'.png'))
 if os.environ.get('KITT_SKIP_RENDER')!='1':bpy.ops.render.render(write_still=True)
cam.location=(5,7,2.9);cam.rotation_euler=(Vector((0,0,.64))-cam.location).to_track_quat('-Z','Y').to_euler()
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
scene['provenance']=report['source'];bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'kitt-reference.blend'))
print('KITT_REFERENCE_COMPLETE',json.dumps(report))
