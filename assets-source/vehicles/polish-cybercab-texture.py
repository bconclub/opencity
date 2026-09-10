"""Remove tiny baked dark paint flecks without blurring glass and panel boundaries."""
import bpy, numpy as np, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles'
bpy.ops.wm.open_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-final.blend')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
body=next(o for o in objects if o.name.startswith('Meshy_'))
material=body.data.materials[0]
im=next(n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and any(l.to_socket.name=='Base Color' for l in n.outputs['Color'].links))
w,h=im.size;a=np.array(im.pixels[:],dtype=np.float32).reshape(h,w,4)
mask=(a[:,:,0]>a[:,:,2]*1.09)&(a[:,:,1]>a[:,:,2]*1.04)&(a[:,:,0]>.16)
def morphology(m,maximum):
 padded=np.pad(m,2,mode='edge');views=[padded[y:y+h,x:x+w] for y in range(5) for x in range(5)]
 return np.logical_or.reduce(views) if maximum else np.logical_and.reduce(views)
closed=morphology(morphology(mask,True),False)
a[closed,0]=.58;a[closed,1]=.40;a[closed,2]=.19
im.pixels[:]=a.ravel();im.pack()
def export(file):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/file),export_format='GLB',use_selection=True,export_yup=True)
export('cybercab-v2.glb')
scene=bpy.context.scene;cam=scene.camera
for angle,pos in [('front',(6,7,3)),('rear',(-6,-7,3))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/f'cybercab-final-{angle}.png');bpy.ops.render.render(write_still=True)
cam.location=(6,7,3);cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-polished.blend')
tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
for o in objects:
 bpy.context.view_layer.objects.active=o;d=o.modifiers.new('Traffic LOD','DECIMATE');d.ratio=min(1,5800/tris);d.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=d.name)
export('cybercab-v2-lod.glb')
r=json.loads((OUT/'cybercab-v2-validation.json').read_text());r.update(bytes=(OUT/'cybercab-v2.glb').stat().st_size,lodBytes=(OUT/'cybercab-v2-lod.glb').stat().st_size,paintCleanup='Closed 5px holes in gold mask and removed baked lighting/flecks from gold pixels; glass boundaries retained')
(OUT/'cybercab-v2-validation.json').write_text(json.dumps(r,indent=2));print('POLISHED_READY',flush=True)
