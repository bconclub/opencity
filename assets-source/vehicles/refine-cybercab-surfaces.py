"""Review-only surface treatment: classify generated albedo into distinct physical materials."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles'
bpy.ops.wm.open_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-v2-review.blend')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
def mat(name,color,metal,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
paint=mat('Champagne gold satin',(.48,.31,.115),.65,.29)
glass=mat('Smoked glass',(.012,.025,.033),.5,.17)
rubber=mat('Rubber and trim',(.012,.014,.016),0,.72)
light=mat('Light lenses',(.72,.8,.85),.2,.2)
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 o.matrix_world=Matrix.Rotation(math.pi,4,'Z')@o.matrix_world;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 original=o.data.materials[0];image=next(n.image for n in original.node_tree.nodes if n.type=='TEX_IMAGE' and any(l.to_socket.name=='Base Color' for l in n.outputs['Color'].links))
 pixels=list(image.pixels);w,h=image.size;uvs=o.data.uv_layers.active.data
 o.data.materials.clear()
 for m in [paint,glass,rubber,light]:o.data.materials.append(m)
 counts=[0]*4
 for p in o.data.polygons:
  rgb=[0,0,0]
  for li in p.loop_indices:
   u,v=uvs[li].uv;i=(min(h-1,max(0,int(v*h)))*w+min(w-1,max(0,int(u*w))))*4
   for c in range(3):rgb[c]+=pixels[i+c]/len(p.loop_indices)
  r,g,b=rgb;lum=(r+g+b)/3;x,y,z=p.center
  warm=r>b*1.10 and g>b*1.04
  idx=0
  if not warm and lum<.56:idx=1 if z>.70 else 2
  if lum<.14:idx=1 if z>.75 else 2
  p.material_index=idx;counts[idx]+=1
 print('MATERIAL_FACE_COUNTS',counts,flush=True)
 if o.data.has_custom_normals:bpy.ops.mesh.customdata_custom_splitnormals_clear()
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00005);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
 for p in o.data.polygons:p.use_smooth=True
 o.data.set_sharp_from_angle(angle=.55)
 mod=o.modifiers.new('Panel normals','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=35;bpy.ops.object.modifier_apply(modifier=mod.name)
 # Small panel seams follow the actual reconstructed side surface.
 tree=BVHTree.FromObject(o,bpy.context.evaluated_depsgraph_get())
 for side in [-1,1]:
  points=[]
  path=[(.76,1.05),(1.03,.36),(.82,.29),(-.73,.29),(-.87,.40),(-.78,.92)]
  for a,b in zip(path,path[1:]):
   for step in range(12):
    t=step/12;y=a[0]*(1-t)+b[0]*t;z=a[1]*(1-t)+b[1]*t
    loc,normal,_,_=tree.ray_cast(Vector((side*3,y,z)),Vector((-side,0,0)))
    if loc is not None:points.append(loc+normal*.002)
  curve=bpy.data.curves.new('Door panel seam','CURVE');curve.dimensions='3D';curve.bevel_depth=.003;curve.bevel_resolution=0
  spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
  for p,co in zip(spline.points,points):p.co=(*co,1)
  seam=bpy.data.objects.new('Door seam',curve);bpy.context.collection.objects.link(seam);seam.data.materials.append(rubber)
scene=bpy.context.scene;scene.cycles.use_denoising=True
cam=scene.camera
for angle,pos in [('front',(6,7,3.0)),('rear',(-6,-7,3.0)),('side',(8,0,2.0))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'cybercab-refined-{angle}.png');bpy.ops.render.render(write_still=True)
cam.location=(6,7,3);cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-refined-review.blend')
print('REFINED_REVIEW_READY',flush=True)
