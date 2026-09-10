"""Original OpenCity vehicle reconstructions. Run with Blender 4.5 background."""
import bpy, math, json, os
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
OUT=os.path.join(ROOT,'assets','vehicles')
SOURCE=os.environ.get('OPENCITY_BLEND_DIR',os.path.join(ROOT,'assets-source','vehicles'))
os.makedirs(SOURCE,exist_ok=True)
report={}

def mat(name,col,metal=0,rough=.3):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
def mesh(name,verts,faces,m,bevel=0):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(m)
 if bevel:
  mod=ob.modifiers.new('Crafted edge highlights','BEVEL');mod.width=bevel;mod.segments=2
  mod=ob.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
 return ob
def box(name,loc,scale,m,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  mod=o.modifiers.new('Edge bevel','BEVEL');mod.width=bevel;mod.segments=2;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o
def section(name,rows,m,bevel=.02):
 # rows: y, halfwidth, bottom, shoulder. 8-point chamfered section
 v=[]
 for y,w,z,t in rows:
  c=min(.065,(t-z)*.23)
  v.extend([(-w*.85,y,z),(-w,y,z+c),(-w,y,t-c),(-w*.88,y,t),(w*.88,y,t),(w,y,t-c),(w,y,z+c),(w*.85,y,z)])
 f=[tuple(range(7,-1,-1))]
 for j in range(len(rows)-1):
  for i in range(8):f.append((j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i))
 f.append(tuple((len(rows)-1)*8+i for i in range(8)))
 return mesh(name,v,f,m,bevel)
def panel(name,pts,m):return mesh(name,pts,[tuple(range(len(pts)))],m)
def curve(name,pts,r,m):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=1;s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,co in zip(s.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def cyl(name,loc,r,depth,m,vertices=40):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc,rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=name;o.data.materials.append(m)
 b=o.modifiers.new('Soft machined edge','BEVEL');b.width=.018;b.segments=2;o.modifiers.new('Normals','WEIGHTED_NORMAL');return o
def wheelset(front,rear,x,r,paint,trim,aero=False):
 for label,y in [('F',front),('R',rear)]:
  for side,sign in [('L',-1),('R',1)]:
   o=cyl('Wheel_'+label+side,(sign*x,y,r),r,.28,trim,32)
   # apply orientation so runtime local X remains axle
   bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
   h=cyl('AeroCover_'+label+side,(sign*(x+.145),y,r),r*(.81 if aero else .64),.028,paint,32)
   h.parent=o;h.matrix_parent_inverse=o.matrix_world.inverted()
   if not aero:
    hub=cyl('Hub_'+label+side,(sign*(x+.169),y,r),r*.22,.025,trim,16);hub.parent=o;hub.matrix_parent_inverse=o.matrix_world.inverted()
    for a in range(5):
     an=2*math.pi*a/5
     p=box('Wheel spoke',(sign*(x+.167),y+math.sin(an)*r*.36,r+math.cos(an)*r*.36),(.02,r*.14,r*.42),trim,.008);p.rotation_euler.x=-an;p.parent=o;p.matrix_parent_inverse=o.matrix_world.inverted()
def arches(body,front,rear,x,r):
 for y in [front,rear]:
  cutter=cyl('temporary wheel opening',(0,y,r),r+.065,3,trim,32)
  # bevel cutter is deliberately unapplied, boolean uses base cylinder
  bpy.context.view_layer.objects.active=body
  mod=body.modifiers.new('Actual wheel opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
  bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
def lights(name,loc,size,color):
 o=box(name,loc,size,lamp,.012)
 attr=o.data.color_attributes.new(name='LampColor',type='FLOAT_COLOR',domain='CORNER')
 for c in attr.data:c.color=(*color,1)
 return o
def canopy(name,rows):
 # broad tinted glass canopy, polygon cross sections
 v=[]
 for y,w,z,top in rows:v.extend([(-w,y,z),(-w*.79,y,top),(w*.79,y,top),(w,y,z)])
 f=[(3,2,1,0)]
 for j in range(len(rows)-1):
  for i in range(3):f.append((j*4+i,j*4+i+1,(j+1)*4+i+1,(j+1)*4+i))
 f.append(tuple((len(rows)-1)*4+i for i in range(4)))
 return mesh(name,v,f,glass,.009)

for kind in ['cybertruck','cybercab','kitt']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for m in list(bpy.data.materials):bpy.data.materials.remove(m)
 paint=mat('GoldPaint' if kind=='cybercab' else 'BodyPaint', {'cybertruck':(.49,.54,.57),'cybercab':(.62,.39,.12),'kitt':(.012,.015,.021)}[kind],.82,.26 if kind!='kitt' else .18)
 trim=mat('RubberTrim',(.013,.017,.022),.05,.48);glass=mat('Glass',(.022,.057,.080),.48,.12)
 lamp=mat('Lamps',(1,1,1),.2,.18);nodes=lamp.node_tree.nodes;p=nodes.get('Principled BSDF');a=nodes.new('ShaderNodeVertexColor');a.layer_name='LampColor';lamp.node_tree.links.new(a.outputs['Color'],p.inputs['Base Color']);lamp.node_tree.links.new(a.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=3
 if kind=='cybertruck':
  front,rear,x,r=1.78,-1.83,1.02,.47
  body=section('Stainless wedge body',[(-2.84,1.00,.43,1.37),(-1.8,1.06,.44,1.50),(-.6,1.07,.46,1.63),(1.35,1.07,.48,1.29),(2.72,.99,.52,1.06)],paint,.012)
  arches(body,front,rear,x,r)
  # open cargo cavity cut into rear shell
  cut=box('temporary bed cavity',(0,-1.97,1.65),(1.75,1.57,1.5),trim,0);bpy.context.view_layer.objects.active=body;bo=body.modifiers.new('Open pickup bed','BOOLEAN');bo.operation='DIFFERENCE';bo.object=cut;bpy.ops.object.modifier_apply(modifier=bo.name);bpy.data.objects.remove(cut,do_unlink=True)
  box('Bed liner',(0,-1.98,.95),(1.71,1.53,.045),trim)
  for i in range(9):box('Bed rib',(-.72+i*.18,-1.98,.98),(.025,1.46,.024),trim,.004)
  canopy('Angular armored canopy',[(-1.15,.94,1.48,1.50),(-.45,.98,1.64,1.96),(1.35,.94,1.29,1.32)])
  for s in [-1,1]:
   curve('Canopy roof rail',[(s*.94,-1.15,1.5),(s*.775,-.45,1.97),(s*.94,1.35,1.32)],.025,paint)
   curve('Door seam',[(s*1.074,-.46,.56),(s*1.074,-.46,1.58),(s*.79,-.46,1.94)],.008,trim)
   box('Flush door handle',(s*1.075,.08,1.4),(.015,.24,.034),trim,.004)
   box('Side mirror',(s*1.19,1.0,1.4),(.22,.22,.11),trim)
  box('Front bumper',(0,2.73,.63),(1.94,.09,.17),trim)
  lights('Front light bar',(0,2.735,1.035),(1.82,.026,.045),(.75,.91,1))
  lights('Tail light bar',(0,-2.85,1.33),(1.8,.03,.045),(1,.018,.006))
  wheelset(front,rear,x,r,paint,trim)
 elif kind=='cybercab':
  front,rear,x,r=1.26,-1.35,.89,.36
  body=section('Flowing gold coupe',[(-2.24,.65,.43,.75),(-1.92,.88,.34,.90),(-1.25,.98,.28,1.03),(0,.99,.29,1.01),(1.24,.96,.33,.84),(2.12,.82,.40,.68),(2.24,.66,.46,.62)],paint,.07)
  arches(body,front,rear,x,r)
  canopy('Teardrop glass roof',[(-1.74,.76,.91,.95),(-1.1,.84,1.03,1.30),(-.45,.86,1.03,1.44),(.28,.84,1.00,1.40),(1.20,.74,.85,.88)])
  for s in [-1,1]:
   curve('Gold canopy rail',[(s*.76,-1.74,.95),(s*.664,-1.1,1.31),(s*.68,-.45,1.45),(s*.665,.28,1.41),(s*.74,1.20,.88)],.022,paint)
   curve('Butterfly door perimeter',[(s*.972,-.92,.44),(s*1.00,-.88,.91),(s*.86,-.80,1.24),(s*.84,.29,1.35),(s*.97,.88,.79),(s*.99,.83,.43),(s*.972,-.92,.44)],.008,trim)
   box('Door flush handle',(s*.995,-.65,.88),(.016,.17,.025),trim,.004)
  lights('Continuous front blade',(0,2.14,.68),(1.53,.045,.033),(.82,.92,1))
  box('Front lower intake',(0,2.12,.47),(1.38,.055,.06),trim)
  lights('Rear blade',(0,-2.23,.76),(1.19,.028,.035),(1,.018,.003))
  wheelset(front,rear,x,r,paint,trim,True)
 else:
  front,rear,x,r=1.40,-1.38,.86,.34
  body=section('Trans Am long wedge shell',[(-2.45,.84,.35,.78),(-1.7,.95,.29,.85),(-.7,.95,.27,.83),(.8,.94,.29,.83),(1.70,.93,.33,.84),(2.43,.84,.39,.59)],paint,.025)
  arches(body,front,rear,x,r)
  canopy('Fastback greenhouse',[(-1.76,.78,.83,.85),(-.72,.81,.84,1.26),(.11,.80,.83,1.28),(.92,.80,.77,.79)])
  for s in [-1,1]:
   curve('T top outer frame',[(s*.78,-1.76,.86),(s*.64,-.72,1.28),(s*.64,.11,1.30),(s*.80,.92,.8)],.027,paint)
   curve('Window divider',[(s*.81,-.74,.85),(s*.64,-.72,1.27)],.022,paint)
   curve('Door shut line',[(s*.953,-.71,.35),(s*.958,-.71,.81),(s*.949,.7,.76),(s*.948,.72,.36)],.006,trim)
   box('Mirror',(s*1.015,.54,.89),(.19,.23,.1),paint)
   box('Recessed handle',(s*.96,-.5,.76),(.025,.17,.035),trim,.006)
   ob=box('Pop up headlight outline',(s*.60,1.90,.772),(.41,.40,.018),trim,.008);ob.rotation_euler.x=-.33
   ob=box('Pop up headlight lid',(s*.60,1.90,.782),(.37,.36,.012),paint,.006);ob.rotation_euler.x=-.33
   box('Hood vent',(s*.37,.92,.841),(.22,.32,.012),trim,.004)
  curve('T top central spine',[(0,-.74,1.29),(0,.13,1.31)],.033,paint)
  box('Scanner nose recess',(0,2.435,.49),(1.02,.045,.125),trim,.008)
  for j in range(8):lights('Scanner_'+str(j),(-.40+j*.115,2.466,.51),(.083,.024,.043),(1,.006,.003))
  box('Front air dam',(0,2.25,.34),(1.63,.31,.10),trim)
  for s in [-1,1]:lights('Fog lamp',(s*.64,2.424,.435),(.22,.025,.044),(.9,.92,.72))
  lights('Rear lamp panel',(0,-2.466,.66),(1.50,.022,.078),(.6,.013,.01))
  box('Rear wing',(0,-2.11,.99),(1.91,.31,.06),paint)
  for s in [-1,1]:box('Wing pedestal',(s*.65,-2.1,.87),(.055,.19,.23),paint)
  wheelset(front,rear,x,r,paint,trim)
 # Finish model: convert bevel/curve results, preserve separate wheels and material names.
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.convert(target='MESH')
 objects=list(bpy.context.scene.objects)
 for o in objects:
  if o.type=='MESH':
   bpy.context.view_layer.objects.active=o
   for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
   # Ensure authored normals after mesh boolean operations.
   bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,kind+'.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True)
 verts=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
 tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
 report[kind]={'triangles':tri,'materials':4,'objects':len(objects),'bounds_min':[min(v[i] for v in verts) for i in range(3)],'bounds_max':[max(v[i] for v in verts) for i in range(3)],'glb_up':'+Y','glb_forward':'-Z','source_up':'+Z','source_forward':'+Y','wheel_axle':'local X','textures':0}
 assert tri<25000
 # Editable source and studio preview; floor/lights excluded from previously exported GLB.
 ground=mat('Studio floor',(.045,.057,.070),.1,.48);box('Studio ground',(0,0,-.05),(200,200,.08),ground,0)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1280;scene.render.resolution_y=900;scene.render.resolution_percentage=100
 scene.world.color=(.22,.22,.22)
 for name,pos,power,size in [('Key',(4,3,7),1900,5),('Rim',(-4,-2,5),2200,4),('Fill',(1,-6,3),1200,4)]:
  bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(6.5,8,4.7));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=7.7 if kind=='cybertruck' else 6.5;scene.camera=cam
 scene.render.filepath=os.path.join(OUT,kind+'-preview.png');bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,kind+'.blend'));bpy.ops.render.render(write_still=True)
with open(os.path.join(OUT,'asset-validation.json'),'w') as f:json.dump(report,f,indent=2)
print('OPENCITY_VALIDATION',json.dumps(report))
