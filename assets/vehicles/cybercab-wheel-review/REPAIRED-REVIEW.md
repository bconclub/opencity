# Repaired wheel candidate: passes bounded spin review

`repaired-candidate.glb` is review-only. Approved runtime asset remains unchanged. The earlier `rejected-candidate.glb` still fails its separate segmentation review.

## Result

- 24,667 triangles, 3 materials, 4,437,428 bytes.
- Independent `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` nodes. Local X axle, circular tyres radius 0.365m, gold discs radius 0.322m. `Rim_Wheel_*` nodes are children. Fixed liners remain attached to body space.
- Original exterior: 19,867 original faces retained, coordinate error 0m and UV error 0. Original material and all three texture payloads unchanged; SHA-256 evidence in `repair-texture-audit.json`.
- 4,981 wheel-core faces removed. Peripheral scan faces, including gold fender boundaries, stay static. New rubber tyres, separate clean gold rims and hidden dark liners fill the wheel openings. New wheel materials do not affect original body.
- Source texture scratches are deliberately retained on body. New discs use clean gold material, avoiding warped atlas projection and artificial black hub dots.

## Checks

Visually compared `repaired-static-{front,side,rear}.png` against `repaired-rotated-{front,side,rear}.png`, with all four wheels rotated 90 degrees. No newly exposed fender gaps, moving gold fragments, centre dots or visible wheel drift.

Exported GLB reimport test confirms actual vertex movement of 0.516188m during 90-degree spin, pivot displacement 0m, and maximum nearest static-surface vertex distance 0.000000134m. This confirms rotation occurred while circular wheel silhouette stayed fixed. Data in `repair-audit.json`.

The circular gold discs are rotationally symmetric, so their static and rotated renders intentionally look nearly identical. Three-quarter tyre shapes and fender boundaries remain aligned. No steering clearance or in-game rendering claim is made by this Blender review.

## Limits

This is a visual game-asset repair using hidden overlaps and liners, not a watertight mechanical reconstruction. Narrow peripheral parts of original scan tyres remain static behind the replacement. Existing source-body shading irregularities are preserved. New smooth tyre/disc surfaces are deliberately more regular than the scanned rims. Retained body normals were copied through Blender custom-normal storage, which has small quantization error; no body smoothing was applied.

GLB Y-up,-Z forward. For game Z-up,+Y forward, parent X rotation is PI/2. Wheel pivot coordinates in Blender source meters: FL/FR X = -/+0.78, Y=1.405, Z=.365; RL/RR X=-/+0.78, Y=-1.367, Z=.365.

Editable file: `D:/CodexTools/Blender/projects/cybercab-wheel-review/cybercab-repaired-review.blend`. Script: `assets-source/vehicles/repair-wheel-review.py`. Numeric validator: `assets-source/vehicles/validate-wheel-repair.py`. Render threads: 3.
