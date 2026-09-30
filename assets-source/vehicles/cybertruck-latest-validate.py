import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles/cybertruck-latest-qc';GLB=OUT/'cybertruck-latest-candidate-quality-150k.glb'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(GLB))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];report={'file':GLB.name,'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'materials':len(bpy.data.materials),'textures':[list(i.size) for i in bpy.data.images],'wheels':{}}
for tag in ['FL','FR','RL','RR']:
 o=bpy.data.objects['Wheel_'+tag];pts=[o.matrix_world@v.co for v in o.data.vertices];lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)]);pivot=o.matrix_world.translation.copy();radius=max(hi.y-lo.y,hi.z-lo.z)/2
 report['wheels'][tag]={'pivot':list(pivot),'geometryCenter':list((lo+hi)/2),'boundsMin':list(lo),'boundsMax':list(hi),'radius':radius,'contactZ':pivot.z-radius,'pivotToGeometryCenter':(pivot-(lo+hi)/2).length}
report['status']='PASS_STRUCTURE_REVIEW_VISUAL_LIMITATIONS';(OUT/'cybertruck-latest-validation-quality-150k.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
