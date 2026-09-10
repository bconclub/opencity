"""Final game export from the cleaned Meshy mesh with restrained colour and panel details."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles'
bpy.ops.wm.open_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-v2-clean.blend')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
o=objects[0];bpy.context.view_layer.objects.active=o
m=o.data.materials[0];p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=.50;p.inputs['Roughness'].default_value=.31
im=next(n.image for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and any(l.to_socket.name=='Base Color' for l in n.outputs['Color'].links))
px=list(im.pixels)
for i in range(0,len(px),4):
 r,g,b=px[i:i+3]
 if r>b*1.06 and g>b*1.02 and r>.2:
  px[i]=r*.9;px[i+1]=g*.79;px[i+2]=b*.60
im.pixels[:]=px;im.pack()
def material(name,col,metal=0,rough=.5,emission=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*col,1);p.inputs['Emission Strength'].default_value=1.2
 return m
trim=material('Panel seam',(.018,.018,.018),.1,.55)
white=material('Front light',(.85,.93,1),.1,.2,True);red=material('Rear light',(.7,.006,.003),.1,.2,True)
tree=BVHTree.FromObject(o,bpy.context.evaluated_depsgraph_get())
def curve(name,points,r,mat):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=0
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for p,co in zip(s.points,points):p.co=(*co,1)
 ob=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat);return ob
for side in [-1,1]:
 points=[];path=[(.76,1.05),(1.03,.36),(.82,.29),(-.73,.29),(-.87,.40),(-.78,.92)]
 for a,b in zip(path,path[1:]):
  for step in range(8):
   t=step/8;y=a[0]*(1-t)+b[0]*t;z=a[1]*(1-t)+b[1]*t
   loc,n,_,_=tree.ray_cast(Vector((side*3,y,z)),Vector((-side,0,0)))
   if loc is not None:points.append(loc+n*.002)
 curve('Door seam',points,.0025,trim)
for name,side,z,mat in [('Front light',1,.53,white),('Rear light',-1,.79,red)]:
 pts=[]
 for i in range(33):
  x=-.79+i*1.58/32;loc,n,_,_=tree.ray_cast(Vector((x,side*3,z)),Vector((0,-side,0)))
  if loc is not None:pts.append(loc+n*.004)
 curve(name,pts,.007,mat)
# Convert detail curves and cap the complete player asset below 25,000 triangles.
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.context.scene.objects:
 if ob.type=='CURVE':ob.select_set(True);bpy.context.view_layer.objects.active=ob
bpy.ops.object.convert(target='MESH')
objects=[ob for ob in bpy.context.scene.objects if ob.type=='MESH']
detail=sum(len(ob.data.polygons)*2 for ob in objects if ob!=o)
bpy.context.view_layer.objects.active=o
mod=o.modifiers.new('Game budget','DECIMATE');mod.ratio=(24700-detail)/24848;mod.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=mod.name)
def export(name):
 bpy.ops.object.select_all(action='DESELECT')
 for ob in objects:ob.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True,export_yup=True)
export('cybercab-v2.glb')
scene=bpy.context.scene;cam=scene.camera
for angle,pos in [('front',(6,7,3.0)),('rear',(-6,-7,3.0))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'cybercab-final-{angle}.png');bpy.ops.render.render(write_still=True)
cam.location=(6,7,3);cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-final.blend')
triangles=sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in objects)
for ob in objects:
 bpy.context.view_layer.objects.active=ob
 d=ob.modifiers.new('Traffic LOD','DECIMATE');d.ratio=min(1,5800/triangles);d.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=d.name)
export('cybercab-v2-lod.glb')
report=json.loads((OUT/'cybercab-v2-validation.json').read_text());report.update(triangles=triangles,bytes=(OUT/'cybercab-v2.glb').stat().st_size,materials=4,lodBytes=(OUT/'cybercab-v2-lod.glb').stat().st_size,lodTriangles=sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in objects),finish='Cleaned Meshy geometry, gold colour correction, fine door seams and light strips; not manufacturer CAD')
(OUT/'cybercab-v2-validation.json').write_text(json.dumps(report,indent=2));print('FINAL_READY',json.dumps(report),flush=True)
