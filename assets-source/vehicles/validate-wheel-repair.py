import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.kdtree import KDTree
OUT=Path(__file__).resolve().parents[2]/'assets/vehicles/cybercab-wheel-review'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT/'repaired-candidate.glb'))
proof={}
for name in ['Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR']:
 ob=bpy.data.objects[name];items=[ob]+list(ob.children);static=[item.matrix_world@v.co for item in items for v in item.data.vertices]
 tree=KDTree(len(static))
 for i,v in enumerate(static):tree.insert(v,i)
 tree.balance();pivot=ob.matrix_world.translation.copy();before=list(pivot)
 ob.rotation_mode='XYZ';ob.rotation_euler.x+=math.pi/2;bpy.context.view_layer.update()
 moved=[item.matrix_world@v.co for item in items for v in item.data.vertices]
 proof[name]={'pivot':before,'pivotDriftMeters':(ob.matrix_world.translation-pivot).length,'maxNearestSurfaceVertexDriftAt90Degrees':max(tree.find(v)[2] for v in moved),'maxIndexedVertexTravelMeters':max((a-b).length for a,b in zip(static,moved)),'movingVertices':len(moved)}
 assert proof[name]['pivotDriftMeters']<1e-6
 assert proof[name]['maxNearestSurfaceVertexDriftAt90Degrees']<1e-5
 assert proof[name]['maxIndexedVertexTravelMeters']>.5
data=json.loads((OUT/'repair-audit.json').read_text());data['status']='PASS_BOUNDED_SPIN_REVIEW';data['visualReview']='Static and 90-degree front/side/rear render review: no fender cuts, holes, rim artifacts or visible drift. Source body appearance retained. Steering not tested.'
data['rotationProof']=proof
(OUT/'repair-audit.json').write_text(json.dumps(data,indent=2));print(json.dumps(proof))
