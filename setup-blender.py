import bpy
from pathlib import Path
source=Path('C:/Users/user/Documents/ChatGPT/Z/blender-mcp-addon.py')
target=Path('D:/CodexTools/Blender/blender_mcp.py')
target.write_text(source.read_text(encoding='utf-8'),encoding='utf-8')
bpy.ops.preferences.addon_install(filepath=str(target))
bpy.ops.preferences.addon_enable(module='blender_mcp')
bpy.context.preferences.addons['blender_mcp'].preferences.telemetry_consent=False
bpy.ops.wm.save_userpref()
print('BLENDER_MCP_ADDON_READY')
