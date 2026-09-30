import bpy, json, math
from pathlib import Path
from mathutils import Vector

ROOT=Path(r"C:/Users/user/Documents/ChatGPT/Z");QC=ROOT/'qc/cybercab-latest'
results={}
for label,path,budget in [('player',ROOT/'assets/vehicles/cybercab-latest-candidate.glb',25000),('traffic',ROOT/'assets/vehicles/cybercab-latest-traffic.glb',6000)]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(path));objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
 by={o.name:o for o in objs};names=['Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR'];missing=[n for n in names if n not in by]
 triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objs)
 # Rotating one pivot must change only that wheel matrix, not body or sibling pivots.
 before={n:by[n].matrix_world.copy() for n in names if n in by};body_before=by['Body'].matrix_world.copy()
 if not missing:by['Wheel_FL'].rotation_mode='XYZ';by['Wheel_FL'].rotation_euler.x=.5;bpy.context.view_layer.update()
 def delta(a,b):return max(abs(a[r][c]-b[r][c]) for r in range(4) for c in range(4))
 isolation=(not missing and delta(by['Wheel_FL'].matrix_world,before['Wheel_FL'])>1e-4 and delta(by['Wheel_FR'].matrix_world,before['Wheel_FR'])<1e-8 and delta(by['Body'].matrix_world,body_before)<1e-8)
 results[label]={'path':str(path),'bytes':path.stat().st_size,'triangles':triangles,'budget':budget,'budgetPass':triangles<=budget,
  'meshNodes':[o.name for o in objs],'missingWheelNodes':missing,'wheelIsolationPass':isolation,
  'wheelOrigins':{n:list(by[n].matrix_world.translation) for n in names if n in by},
  'materials':sorted({m.name for o in objs for m in o.data.materials if m}),
  'images':[{'name':i.name,'size':list(i.size)} for i in bpy.data.images if i.type=='IMAGE']}
results['status']='PASS' if all(v['budgetPass'] and not v['missingWheelNodes'] and v['wheelIsolationPass'] for k,v in results.items() if isinstance(v,dict)) else 'FAIL'
(QC/'cybercab-latest-validation.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2),flush=True)
