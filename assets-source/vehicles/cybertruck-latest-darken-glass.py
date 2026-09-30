import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];GLB=ROOT/'assets/vehicles/cybertruck-latest-qc/cybertruck-latest-candidate-quality-150k.glb'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(GLB))
m=bpy.data.materials['Glass'];m.diffuse_color=(.001,.002,.003,1);m.metallic=0;m.roughness=.52
if m.use_nodes:
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.001,.002,.003,1);p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.52
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(GLB),export_format='GLB',use_selection=True,export_yup=True,export_extras=True)
