import bpy,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets-source'/'vehicles'/'candidates';SRC=Path('D:/Brands BCON/OpenCity/Models/Yulu.glb')
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SRC));meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.transform.rotate(value=math.pi/2,orient_axis='Z');bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);bpy.context.view_layer.update()
pts=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box];lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
red=bpy.data.materials.new('AxleMarker');red.diffuse_color=(1,.02,.02,1)
current={'F':Vector((0,.4459783,.22)),'R':Vector((0,-.4426644,.24))}
for tag,c in current.items():
 bpy.ops.mesh.primitive_torus_add(major_radius=.025,minor_radius=.008,major_segments=32,minor_segments=8,location=(.38,c.y,c.z),rotation=(0,math.pi/2,0));o=bpy.context.object;o.name='MARK_'+tag;o.data.materials.append(red)
 # crosshair bars in side plane
 for scale in ((.012,.11,.008),(.012,.008,.11)):
  bpy.ops.mesh.primitive_cube_add(location=(.38,c.y,c.z),scale=scale);bpy.context.object.data.materials.append(red)
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.render.resolution_x=1400;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.display.shading.light='STUDIO';scene.display.shading.studio_light='paint.sl';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=False;scene.display.shading.show_cavity=False
center=(lo+hi)*.5;bpy.ops.object.camera_add(location=(3.2,center.y,center.z));cam=bpy.context.object;cam.rotation_euler=(Vector((0,center.y,center.z))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=max(hi.y-lo.y,hi.z-lo.z)*1.15;scene.camera=cam;scene.render.filepath=str(OUT/'yulu-latest-source-side-axles.png');bpy.ops.render.render(write_still=True)
(OUT/'yulu-latest-side-audit.json').write_text(json.dumps({'frameBounds':{'x':list((lo.x,hi.x)),'y':list((lo.y,hi.y)),'z':list((lo.z,hi.z))},'dimensions':list(hi-lo),'markedCurrentPivots':{k:list(v) for k,v in current.items()}},indent=2))
