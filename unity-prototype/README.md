# OpenCity Unity prototype

Minimal built-in rendering pipeline scene using the original drone authored in Blender. This is a separate prototype, not a migration of the browser city or a playable drone. Scene creation and WebGL compilation must be verified with an installed Unity Editor.

Canonical working project: `D:/CodexTools/Unity/OpenCity`. Repository folder holds source scaffold only; keep Unity Library and build output on D drive. Editor version: 6000.3.23f1. Requires WebGL Build Support to build the browser target.

1. Copy this folder's `Assets`, `Packages`, and `ProjectSettings` to canonical working project.
2. Run Blender with `--background --python assets-source/export-drone-fbx.py` from repository root. This exports FBX from actual editable drone `.blend` into D drive's Unity project.
3. Generate scene: `Unity.exe -batchmode -quit -projectPath D:/CodexTools/Unity/OpenCity -executeMethod OpenCityBuild.CreateScene -logFile D:/CodexTools/Unity/create-scene.log`.
4. Build browser prototype: `Unity.exe -batchmode -quit -projectPath D:/CodexTools/Unity/OpenCity -buildTarget WebGL -executeMethod OpenCityBuild.BuildWebGL -logFile D:/CodexTools/Unity/build-webgl.log`.

Default WebGL output: `D:/CodexTools/Unity/Builds/OpenCityDrone`. Override via `OPENCITY_WEBGL_OUTPUT`. Compression disabled for easy local HTTP serving. Do not open build through file URLs. Look for `OPENCITY_SCENE_READY` and `OPENCITY_WEBGL_READY` in logs, with successful Editor exit code. No third-party GLTF package is required.

The scene imports four rotor animation clips with the FBX. This scaffold does not configure runtime input, rotor playback, multiplayer, or city streaming. Those remain separate implementation work.
