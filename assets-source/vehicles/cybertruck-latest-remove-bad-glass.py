import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];GLB=ROOT/'assets/vehicles/cybertruck-latest-qc/cybertruck-latest-candidate-quality-150k.glb'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(GLB))
for o in list(bpy.data.objects):
 if o.name.startswith('Glass_'):bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(GLB),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
