import bpy
from pathlib import Path
project=Path('D:/CodexTools/Blender/projects/CBD.blend')
project.parent.mkdir(parents=True,exist_ok=True)
if project.exists():
    bpy.ops.wm.open_mainfile(filepath=str(project))
else:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.name='Bengaluru CBD'
    bpy.context.scene.unit_settings.system='METRIC'
    bpy.context.scene['geographic_origin']='77.5945 E, 12.9755 N'
    bpy.context.scene['status']='Editable CBD authoring workspace. Reconstruction is not survey-verified.'
    bpy.ops.wm.save_as_mainfile(filepath=str(project))
if 'blender_mcp' not in bpy.context.preferences.addons:
    bpy.ops.preferences.addon_enable(module='blender_mcp')
bpy.context.preferences.addons['blender_mcp'].preferences.telemetry_consent=False
bpy.context.scene.blendermcp_port=9876
bpy.ops.blendermcp.start_server()
print('CBD_BLENDER_READY_ON_LOCALHOST_9876')
