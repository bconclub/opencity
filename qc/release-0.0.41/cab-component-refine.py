import os
from pathlib import Path
script=(Path(__file__).parent/'cab-audit.py').read_text()
exec(script.split('scene=bpy.context.scene;')[0])
bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
me=o.data;idx=np.empty(len(me.loops),dtype=np.int32);me.loops.foreach_get('vertex_index',idx);tri=idx.reshape(-1,3)
xyz=np.empty(len(me.vertices)*3,dtype=np.float32);me.vertices.foreach_get('co',xyz);xyz=xyz.reshape(-1,3)
import struct
raw=SOURCE.read_bytes();jslen=struct.unpack_from('<I',raw,12)[0];gltf=json.loads(raw[20:20+jslen]);binstart=28+jslen
primitive=gltf['meshes'][0]['primitives'][0]
def accessor(i):
 ac=gltf['accessors'][i];bv=gltf['bufferViews'][ac['bufferView']];dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[ac['componentType']];n={'SCALAR':1,'VEC3':3}[ac['type']]
 return np.frombuffer(raw,dtype=dtype,count=ac['count']*n,offset=binstart+bv.get('byteOffset',0)+ac.get('byteOffset',0)).reshape(ac['count'],n)
gp=accessor(primitive['attributes']['POSITION']);gi=accessor(primitive['indices']).reshape(-1,3)
# Imported glTF +Y-up becomes Blender +Z-up; corrected game yaw is -PI/2.
gv=np.column_stack([-gp[:,2],-gp[:,0],gp[:,1]])*scale+np.array(shift)
orderingError=float(np.max(np.abs(gv[gi]-xyz[tri]))) if len(gi)==len(tri) else None
print('RAW_GLTF_TRIANGLE_POSITION_ORDER_ERROR',orderingError,flush=True)
if orderingError is None or orderingError>1e-5:raise RuntimeError('Source glTF face ordering not proven, stop mask generation')
parent=list(range(len(xyz)));sizes=[1]*len(xyz)
def find(a):
 while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
 return a
def union(a,b):
 a=find(a);b=find(b)
 if a==b:return
 if sizes[a]<sizes[b]:a,b=b,a
 parent[b]=a;sizes[a]+=sizes[b]
for a,b,c in tri.tolist():union(a,b);union(a,c)
roots=np.fromiter((find(i) for i in range(len(xyz))),dtype=np.int32,count=len(xyz));faceRoots=roots[tri[:,0]];rootIds,faceComp=np.unique(faceRoots,return_inverse=True);counts=np.bincount(faceComp);centroid=xyz[tri].mean(1)
classes=np.zeros(len(tri),dtype=np.uint8);threshold=float(os.environ.get('CAB_THRESHOLD','.6'));radius=float(os.environ.get('CAB_RADIUS','.38'));width=float(os.environ.get('CAB_WIDTH','.30'));label=os.environ.get('CAB_LABEL','component-a');details={}
for n,(tag,x,y) in enumerate([('FL',-.802,1.374),('FR',.802,1.374),('RL',-.802,-1.261),('RR',.802,-1.261)],1):
 dist=(xyz[:,1]-y)**2+(xyz[:,2]-.358)**2
 broad=(np.abs(xyz[:,0]-x)<=.15)&(dist<=.38**2)
 allin=broad[tri].all(1);fraction=np.bincount(faceComp,weights=allin,minlength=len(rootIds))/counts
 envelope=(np.abs(xyz[:,0]-x)<=.20)&(dist<=.46**2)
 outsideFaces=(~envelope[tri].all(1));outsideComp=np.bincount(faceComp,weights=outsideFaces,minlength=len(rootIds))>0
 complete=(fraction>threshold)&(~outsideComp)
 centroidIn=(np.abs(centroid[:,0]-x)<=width/2)&((centroid[:,1]-y)**2+(centroid[:,2]-.358)**2<=radius**2)
 selected=complete[faceComp]|centroidIn
 classes[selected]=n;details[tag]={'completeIslands':int(complete.sum()),'completeFaces':int(counts[complete].sum()),'totalFaces':int(selected.sum())}
maskpath=OUT/f'cab-{label}-face-mask.bin';classes.tofile(maskpath)
(OUT/f'cab-{label}-mask.json').write_text(json.dumps({'sourceSHA256':report['sha256'],'faceOrder':'Verified against original GLB primitive index order by comparing all triangle vertex positions','maximumTrianglePositionErrorMeters':orderingError,'classEncoding':{'0':'body','1':'FL','2':'FR','3':'RL','4':'RR'},'triangles':len(tri),'components':len(rootIds),'threshold':threshold,'centroidRadius':radius,'centroidWidth':width,'details':details},indent=2))
remaining=classes.copy()
for n,(tag,x,y) in enumerate([('FL',-.802,1.374),('FR',.802,1.374),('RL',-.802,-1.261),('RR',.802,-1.261)],1):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 mask=remaining==n;o.data.polygons.foreach_set('select',mask);o.data.update();bpy.context.tool_settings.mesh_select_mode=(False,False,True)
 before=set(bpy.context.scene.objects);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
 wheel=next(t for t in bpy.context.scene.objects if t not in before);wheel.name='Wheel_'+tag
 remaining=remaining[~mask]
 center=Vector((x,y,.358));wheel.matrix_world=Matrix.Translation(center)@Matrix.Rotation(math.radians(20) if tag.startswith('F') else 0,4,'Z')@Matrix.Rotation(math.pi/2,4,'X')@Matrix.Translation(-center)@wheel.matrix_world
print('COMPONENT_CLASSIFICATION',json.dumps(details),flush=True)
render='scene=bpy.context.scene;'+script.split('scene=bpy.context.scene;')[1]
render=render.replace("f'cab-original-{name}.png'", "f'cab-"+label+"-{name}.png'")
render=render.replace("[('side',(8,0,.7)),('front',(0,8,.7)),('rear',(0,-8,.7))]","[('front',(0,8,.7)),('quarter',(5,6,2.7))]")
exec(render)
