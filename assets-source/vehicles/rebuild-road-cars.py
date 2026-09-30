"""Reference-led revision. Run in visible Blender with --python (no --background)."""
from pathlib import Path
exec(compile(Path(__file__).with_name('build-vehicles.py').read_text().split("for kind in ['cybertruck'")[0], __file__, 'exec'))
SOURCE='D:/CodexTools/Blender/projects'

def loft(name, rows, material):
 # Dense longitudinal sections and crowned shoulders, instead of flat box sides.
 dense=[]
 for i in range(len(rows)-1):
  a,b=rows[i],rows[i+1];prev=rows[max(0,i-1)];nxt=rows[min(len(rows)-1,i+2)]
  for k in range(5):
   t=k/5; dense.append([a[0]+(b[0]-a[0])*t]+[.5*((2*a[j])+(-prev[j]+b[j])*t+(2*prev[j]-5*a[j]+4*b[j]-nxt[j])*t*t+(-prev[j]+3*a[j]-3*b[j]+nxt[j])*t*t*t) for j in range(1,4)])
 dense.append(rows[-1]);verts=[]
 for y,w,low,high in dense:
  # Closed body cross-section with rolled shoulder and gently crowned bonnet.
  for x,z in [(-.83,low),(-.98,low+.065),(-1,high-.11),(-.965,high-.025),(-.84,high+.016),(-.5,high+.035),(0,high+.044),(.5,high+.035),(.84,high+.016),(.965,high-.025),(1,high-.11),(.98,low+.065),(.83,low)]:verts.append((x*w,y,z))
 n=13;faces=[tuple(range(n-1,-1,-1))]
 for j in range(len(dense)-1):
  for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 faces.append(tuple((len(dense)-1)*n+i for i in range(n)))
 ob=mesh(name,verts,faces,material)
 for p in ob.data.polygons:p.use_smooth=True
 return ob

def glass_panel(name,points):
 ob=panel(name,points,glass)
 solid=ob.modifiers.new('Glass thickness','SOLIDIFY');solid.thickness=.008
 return ob

def tire_set(front,rear,x,r,aero):
 for label,y in [('F',front),('R',rear)]:
  for side,s in [('L',-1),('R',1)]:
   bpy.ops.object.empty_add(type='PLAIN_AXES',location=(s*x,y,r));pivot=bpy.context.object;pivot.name='Wheel_'+label+side
   def parent(o):o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted();return o
   parent(cyl('Tyre_'+label+side,(s*x,y,r),r,.205,trim,48))
   cover=parent(cyl('AeroCover_'+label+side,(s*(x+.106),y,r),r*.84,.022,paint if aero else trim,48))
   if aero:
    parent(cyl('WheelCenter',(s*(x+.119),y,r),.031,.012,trim,16))
   else:
    # KITT's black turbine covers with a subtle machined perimeter.
    for a in range(24):
     ang=a*math.tau/24
     o=box('Turbine slot',(s*(x+.12),y+math.sin(ang)*r*.71,r+math.cos(ang)*r*.71),(.012,.022,.047),lamp,0)
     o.rotation_euler.x=-ang;parent(o)
    parent(cyl('Hub cap',(s*(x+.122),y,r),.07,.012,trim,24))

def finish(kind):
 objects=[o for o in bpy.context.scene.objects if o.type in ('MESH','CURVE','EMPTY')]
 for o in objects:
  if o.type=='EMPTY':continue
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
  for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,kind+'.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True)
 meshes=[o for o in objects if o.type=='MESH'];tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
 vertices=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
 report[kind]={'triangles':tri,'materials':4,'textures':0,'bounds_min':[min(v[i] for v in vertices) for i in range(3)],'bounds_max':[max(v[i] for v in vertices) for i in range(3)],'wheelbase':front-rear,'wheelRadius':r,'originalReconstruction':True}
 assert tri<=25000
 ground=mat('Studio floor',(.065,.085,.10),.0,.6);box('Studio floor',(0,0,-.07),(200,200,.1),ground,0)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.world.color=(.25,.25,.25)
 for name,pos,power,size in [('Key',(4,3,6),1600,5),('Rim',(-4,-2,5),2200,4),('Fill',(1,-6,3),1000,4)]:
  bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(6.5,8,4));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.7))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=6.3;scene.camera=cam
 for screen in bpy.data.screens:
  for area in screen.areas:
   if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
 scene['reference_notes']='Original reconstruction based on manufacturer references. Cybercab length/wheelbase are estimates; KITT custom nose is illustrative.'
 scene.render.filepath=os.path.join(OUT,kind+'-preview.png');bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,kind+'-reference-rebuild.blend'));bpy.ops.render.render(write_still=True)

for kind in ['cybercab','kitt']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 paint=mat('GoldPaint' if kind=='cybercab' else 'BodyPaint',(.54,.37,.17) if kind=='cybercab' else (.009,.012,.016),.65 if kind=='cybercab' else .3,.3 if kind=='cybercab' else .22)
 trim=mat('RubberTrim',(.008,.010,.013),.08,.68);glass=mat('Glass',(.013,.026,.035),.25,.20);lamp=mat('Lamps',(.48,.50,.51),.65,.27)
 if kind=='cybercab':
  # Tesla width 1.754 m, height 1.408 m. Length 4.45 m and wheelbase 2.70 m estimated from exterior photos.
  front,rear,x,r=1.32,-1.38,.766,.36
  body=loft('Sculpted Cybercab body',[(-2.215,.65,.22,.83),(-1.95,.81,.17,.89),(-1.38,.874,.155,.95),(-.8,.867,.145,.91),(0,.858,.145,.86),(.7,.87,.15,.84),(1.32,.877,.16,.79),(1.87,.80,.18,.66),(2.215,.63,.24,.57)],paint)
  arches(body,front,rear,x,r)
  # Solid gold fastback, sculpted separately; glass only covers windows, not entire roof.
  roof=loft('Gold roof and rear quarters',[(-1.85,.70,.78,.87),(-1.18,.733,.86,1.12),(-.63,.728,.89,1.32),(-.12,.70,.88,1.364),(.35,.68,.86,1.28),(.95,.68,.82,.94)],paint)
  glass_panel('Windshield',[(-.59,.32,1.28),(.59,.32,1.28),(.71,1.075,.868),(-.71,1.075,.868)])
  # Flush side glass follows the arched silhouette, with black quarter panel taper.
  for s in [-1,1]:
   glass_panel('Side window',[(s*.738,-1.15,.985),(s*.734,-.59,1.25),(s*.71,-.12,1.302),(s*.695,.34,1.224),(s*.745,.97,.88),(s*.844,.45,.886),(s*.853,-.63,.938)])
   curve('Door rear seam',[(s*.861,-.8,.27),(s*.87,-.86,.56),(s*.864,-.88,.91)],.0035,trim)
   curve('Door front seam',[(s*.866,.78,.24),(s*.876,.88,.5),(s*.865,.99,.83)],.0035,trim)
   curve('Sill',[(s*.84,-.78,.17),(s*.84,.72,.17)],.018,trim)
  glass_panel('Rear camera panel',[(-.51,-1.41,1.055),(.51,-1.41,1.055),(.43,-1.69,.946),(-.43,-1.69,.946)])
  lights('Front light blade',(0,2.212,.576),(1.22,.017,.018),(.82,.94,1))
  lights('Rear light blade',(0,-2.216,.80),(1.29,.022,.021),(1,.006,.002))
  box('Front valance',(0,2.17,.30),(1.24,.055,.09),trim,.025)
  tire_set(front,rear,x,r,True)
 else:
  # 1982 Firebird platform: 2.5654 m wheelbase, 1.829 m width, 1.265 m height.
  front,rear,x,r=1.26,-1.3054,.778,.32
  body=loft('Trans Am contoured body',[(-2.40,.80,.24,.77),(-1.98,.88,.20,.82),(-1.31,.9145,.19,.86),(-.7,.899,.18,.82),(0,.896,.18,.80),(.8,.907,.19,.78),(1.26,.9145,.20,.79),(1.82,.875,.22,.71),(2.40,.80,.29,.55)],paint)
  arches(body,front,rear,x,r)
  roof=loft('Trans Am roof and rear pillars',[(-1.82,.72,.77,.84),(-1.18,.738,.81,1.06),(-.67,.71,.81,1.196),(-.12,.679,.81,1.221),(.19,.66,.79,1.186),(.85,.739,.77,.81)],paint)
  glass_panel('Windshield',[(-.617,.22,1.171),(.617,.22,1.171),(.742,.874,.804),(-.742,.874,.804)])
  glass_panel('Rear hatch glass',[(-.656,-.70,1.193),(.656,-.70,1.193),(.715,-1.782,.857),(-.715,-1.782,.857)])
  for s in [-1,1]:
   glass_panel('Door window',[(s*.709,-.68,1.17),(s*.675,.15,1.18),(s*.748,.82,.81),(s*.875,-.66,.84)])
   glass_panel('T top',[(s*.05,-.61,1.247),(s*.57,-.61,1.239),(s*.546,.10,1.252),(s*.05,.10,1.263)])
   curve('Door seam',[(s*.903,-.7,.24),(s*.903,-.7,.806),(s*.902,.7,.785),(s*.90,.70,.25)],.003,trim)
   box('Flush handle',(s*.903,-.50,.746),(.018,.15,.032),trim,.009)
   box('Mirror',(s*.954,.52,.868),(.13,.20,.075),paint,.03)
   lid=box('Retracted headlight',(s*.566,1.866,.732),(.38,.34,.012),paint,.012);lid.rotation_euler.x=-.26
  box('KITT scanner recess',(0,2.405,.49),(.70,.018,.067),trim,.014)
  for j in range(8):lights('Scanner_'+str(j),(-.29+j*.083,2.418,.493),(.066,.012,.027),(1,.003,.001))
  # Low factory-style rear spoiler, not a tall race wing.
  box('Low rear spoiler',(0,-2.095,.94),(1.74,.265,.055),paint,.03)
  for s in [-1,1]:box('Spoiler foot',(s*.66,-2.10,.875),(.10,.19,.105),paint,.025)
  box('Black rear fascia',(0,-2.398,.614),(1.56,.018,.145),trim,.025)
  lights('Rear lamps',(0,-2.414,.65),(1.44,.012,.025),(.6,.002,.001))
  for s in [-1,1]:lights('Fog light',(s*.59,2.396,.363),(.27,.017,.048),(.7,.72,.6))
  tire_set(front,rear,x,r,False)
 # Shared lamp material gets vertex colours only on emissive lights.
 nodes=lamp.node_tree.nodes;p=nodes.get('Principled BSDF');attr=nodes.new('ShaderNodeVertexColor');attr.layer_name='LampColor';lamp.node_tree.links.new(attr.outputs['Color'],p.inputs['Base Color']);lamp.node_tree.links.new(attr.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=1.3
 finish(kind)
Path(OUT,'reference-rebuild-validation.json').write_text(json.dumps(report,indent=2))
print('REFERENCE_REBUILD_COMPLETE',json.dumps(report))
