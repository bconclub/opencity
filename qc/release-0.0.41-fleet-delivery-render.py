import bpy,math,json,numpy as np
from pathlib import Path
from mathutils import Vector
R=Path('C:/Users/user/Documents/ChatGPT/Z');O=R/'qc/release-0.0.41';O.mkdir(exist_ok=True,parents=True)
report={}
for kind,name,L in [('delivery','Delivery Rider.glb',1.9)]:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(Path('D:/Brands BCON/OpenCity/Models')/name));bpy.context.view_layer.update()
 obs=[o for o in bpy.context.scene.objects if o.type=='MESH'];o=obs[0];n=len(o.data.vertices);v=np.empty(n*3,dtype=np.float32);o.data.vertices.foreach_get('co',v);v=v.reshape(-1,3);m=np.array(o.matrix_world);v=v@m[:3,:3].T+m[:3,3];lo=v.min(0);hi=v.max(0);s=L/(hi[0]-lo[0]);center=(lo+hi)/2
 v=np.stack([(v[:,1]-center[1])*s,-(v[:,0]-center[0])*s,(v[:,2]-lo[2])*s],axis=1);np.save(O/f'{kind}-normalized-positions.npy',v)
 o.data.vertices.foreach_set('co',v.astype(np.float32).flatten());o.matrix_world.identity();o.data.update();bpy.context.view_layer.update()
 sc=bpy.context.scene;sc.render.engine='BLENDER_WORKBENCH';sc.render.resolution_x=1400;sc.render.resolution_y=1400;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG';sc.display.shading.light='STUDIO';sc.display.shading.studio_light='paint.sl';sc.display.shading.color_type='TEXTURE';sc.display.shading.show_shadows=False;sc.display.shading.show_cavity=False
 c=Vector((0,0,float(v[:,2].max()/2)));span=L*1.08
 bpy.ops.object.camera_add(location=c+Vector((L*2,0,0)));cam=bpy.context.object;cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span;sc.camera=cam;sc.render.filepath=str(O/f'{kind}-source-side.png');bpy.ops.render.render(write_still=True)
 report[kind]={'scale':s,'sourceBounds':[lo.tolist(),hi.tolist()],'normalizedBounds':[v.min(0).tolist(),v.max(0).tolist()],'sideImage':f'{kind}-source-side.png','sideImageWorldWidth':span,'sideImageWorldHeight':span*800/1400,'sideImageCenter':list(c),'sideImageHorizontal':'left=negative Y; right=positive Y'}
 (O/'fleet-delivery-frame.json').write_text(json.dumps(report,indent=2))


