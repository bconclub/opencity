# Tool storage

User requirement: install large tools and keep their downloads, caches and generated assets on D:, not C:.

- Blender: D:/CodexTools/Blender/blender-4.5.9-windows-x64/blender.exe
- Blender models: D:/CodexTools/Blender/
- Unity Editor target: D:/CodexTools/Unity/Editors/
- Unity prototype: D:/CodexTools/Unity/OpenCity/

Before resuming Unity installation, redirect its download cache from the default
C:/Users/user/AppData/Roaming/UnityHub/downloads to D: using supported configuration.
The previous attempt filled the system drive; recovered downloads were moved to
D:/CodexTools/Unity/RecoveredDownloads/. Do not restart that download with the old cache path.

No new tool installations were needed for the multiplayer/mobile release.

Hugging Face cache migrated and SHA256-verified on 2026-09-10: D:/CodexTools/ModelCache/huggingface. User HF_HOME, HF_HUB_CACHE and HF_XET_CACHE point there. Original C:/Users/user/.cache/huggingface is a junction to D: for older/running tools. Restart tools to pick up new environment variables.
