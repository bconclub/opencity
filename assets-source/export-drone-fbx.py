"""Export actual editable Blender drone as FBX for Unity's built-in importer."""
from pathlib import Path
import bpy

source=Path('D:/CodexTools/Blender/projects/drone/opencity-drone.blend')
target=Path('D:/CodexTools/Unity/OpenCity/Assets/Models/Drone/opencity-drone.fbx')
target.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source))
# Studio lights and camera remain in .blend but never enter vehicle asset.
bpy.ops.export_scene.fbx(filepath=str(target),object_types={'MESH','EMPTY'},
    apply_unit_scale=True,axis_forward='-Z',axis_up='Y',
    bake_anim=True,bake_anim_use_all_actions=True,add_leaf_bones=False)
print('OPENCITY_DRONE_FBX_READY',target,target.stat().st_size)
