# Pedal cycle asset

Original OpenCity geometry, distinct from Yulu. No external model or photo textures used.

`cycle-model.js` exports `createCycle(THREE)`, returning `group`, `body`, `wheels`, `front`/`steering`, `frontWheel`, `rearWheel`, `pedals`, and `wheelRadius` (0.34 m). Coordinates: X right, Y forward, Z up. Animate wheel and crank rotations around local X; steering rotates around local Z. No rider, drivetrain simulation, or playable integration included.

Validation: `node verify-cycle-asset.cjs` against the local server. Verified dimensions 0.660 x 1.780 x 1.112 m, two wheels, parented front steering, 4,976 rendered triangles and 41 draw calls in isolated Three rendering. Visual preview inspected. This is geometry verification, not an FPS benchmark.

Generated artifacts are stored on D: because the system drive is full:

- `D:/CodexTools/Blender/cycle-asset-preview.png`
- `D:/CodexTools/Blender/cycle-mesh.json`
- `D:/CodexTools/Blender/cycle.blend`

`assets-source/cycle.py` imports the verified geometry into Blender with editable object hierarchy, steering and crank groups. Run Blender with `--background --python assets-source/cycle.py` after regenerating mesh JSON. Blender 4.5.9 successfully saved 47 objects. Spokes use mesh edges in Blender; give them bevelled curve geometry if required for offline renders. The browser asset renders spokes as lines.
