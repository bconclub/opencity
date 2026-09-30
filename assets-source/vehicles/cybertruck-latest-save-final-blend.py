import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
GLB=ROOT/'assets/vehicles/cybertruck-latest-qc/cybertruck-latest-candidate-quality-150k.glb'
BLEND=Path(r'D:/Brands BCON/OpenCity/Models/cybertruck-latest-final.blend')
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(GLB))
bpy.context.scene['source_glb']=r'D:/Brands BCON/OpenCity/Models/cYBER tRUCK.glb'
bpy.context.scene['runtime_candidate']=str(GLB)
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(BLEND));print(BLEND)
