import bpy, math, json, numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
R=Path('C:/Users/user/Documents/ChatGPT/Z'); O=R/'qc/release-0.0.41';report={}
cfg={
'cybertruck':[(x,y,.45,.44,.45,t) for x,t0 in [(-.91,'L'),(.91,'R')] for y,t in [(1.955,'F'+t0),(-1.714,'R'+t0)]],
'kitt':[(x,y,.323,r,.29,t) for x,t0 in [(-.78,'L'),(.78,'R')] for y,r,t in [(1.218,.317,'F'+t0),(-1.418,.326,'R'+t0)]],
'yulu':[(0,.715,.254,.233,.086,'F'),(0,-.573,.254,.240,.086,'R')],
'delivery':[(0,.7123,.2358,.236,.11,'F'),(0,-.6537,.2343,.236,.122,'R')]}
for kind,name,L in [('cybertruck','cYBER tRUCK.glb',5.683),('kitt','kNIGHT rIDER.glb',4.8),('yulu','Yulu.glb',1.9),('delivery','Delivery Rider.glb',1.9)]:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(Path('D:/Brands BCON/OpenCity/Models')/name));bpy.context.view_layer.update()
 obs=[o for o in bpy.context.scene.objects if o.type=='MESH']; allv=[]
 for o in obs:
  a=np.empty(len(o.data.vertices)*3,dtype=np.float32);o.data.vertices.foreach_get('co',a);a=a.reshape(-1,3);m=np.array(o.matrix_world);allv.append(a@m[:3,:3].T+m[:3,3])
 va=np.concatenate(allv);lo=va.min(0);hi=va.max(0);s=L/(hi[0]-lo[0]);center=(lo+hi)/2;counts={}
 for o,v in zip(obs,allv):
  v=np.stack([(v[:,1]-center[1])*s,-(v[:,0]-center[0])*s,(v[:,2]-lo[2])*s],axis=1);me=o.data;me.calc_loop_triangles();tri=np.array([t.vertices[:] for t in me.loop_triangles]);loops=np.array([t.loops[:] for t in me.loop_triangles]);polys=np.array([t.polygon_index for t in me.loop_triangles]);indices=tri.copy();newv=[v];cursor=len(v)
  for x,y,z,r,w,tag in cfg[kind]:
   c=np.array([x,y,z]);mask=(np.abs(v[:,0]-x)<=w/2)&(((v[:,1]-y)**2+(v[:,2]-z)**2)<=r*r);sel=np.all(mask[tri],axis=1);ids=np.unique(tri[sel]);counts[tag]=counts.get(tag,0)+int(sel.sum());mp=np.zeros(len(v),dtype=int);mp[ids]=np.arange(cursor,cursor+len(ids));indices[sel]=mp[tri[sel]];rot=np.array(Matrix.Rotation(-math.pi/2,3,'X'))
   if tag.startswith('F'):rot=np.array(Matrix.Rotation(-math.radians(20),3,'Z'))@rot
   newv.append((v[ids]-c)@rot.T+c);cursor+=len(ids)
  dest=bpy.data.meshes.new('SpunOriginal');dest.from_pydata(np.concatenate(newv).tolist(),[],indices.tolist());dest.update()
  for mat in me.materials:dest.materials.append(mat)
  pm=np.array([p.material_index for p in me.polygons]);dest.polygons.foreach_set('material_index',pm[polys]);dest.polygons.foreach_set('use_smooth',[True]*len(indices))
  for uv in me.uv_layers:
   a=np.empty(len(uv.data)*2,dtype=np.float32);uv.data.foreach_get('uv',a);dest.uv_layers.new(name=uv.name).data.foreach_set('uv',a.reshape(-1,2)[loops].flatten())
  o.data=dest;o.matrix_world.identity()
 sc=bpy.context.scene;sc.render.engine='BLENDER_WORKBENCH';sc.render.resolution_x=1400;sc.render.resolution_y=800;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG';sc.display.shading.light='STUDIO';sc.display.shading.studio_light='paint.sl';sc.display.shading.color_type='TEXTURE';sc.display.shading.show_shadows=False;sc.display.shading.show_cavity=False
 c=Vector((0,0,float((hi[2]-lo[2])*s/2)));bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';sc.camera=cam
 for view,off,span in [('side',(L*2,0,0),L*1.1),('front',(0,L*2,0),max((hi[1]-lo[1])*s,(hi[2]-lo[2])*s*1.75)*1.15)]:
  cam.location=c+Vector(off);cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=span;sc.render.filepath=str(O/f'{kind}-cylinder-spin-{view}.png');bpy.ops.render.render(write_still=True)
 report[kind]=counts;(O/'fleet-cylinder-spin-counts.json').write_text(json.dumps(report,indent=2));print('COMPLETED',kind,counts,flush=True)
