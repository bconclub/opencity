# Wheel segmentation review: REJECTED

Do not install `rejected-candidate.glb` in runtime. Approved `../cybercab-meshy-approved.glb` was only read and remains untouched.

Blender inspection found 24,848 triangles in one textured mesh. A connectivity test that groups coincident positions (without changing the mesh) shows wheels connected to the body, rather than four loose wheel objects. Separate whole faces were assigned to `Body`, `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, and `Wheel_RR` using conservative spatial wheel envelopes.

## Evidence

Compare `source-{front,side,rear}.png`, `static-{front,side,rear}.png` and `rotated-{front,side,rear}.png`. Static partition preserves shape. Wheels rotated 90 degrees about their local X pivots expose triangular arch-edge gaps and move narrow gold/body fragments into the tyre perimeter. These are visible defects, so the result fails the requested acceptance test.

## Preservation audit

- 24,848 original triangles retained exactly once. Zero triangles added or removed. No cuts, welds, smoothing, decimation, paint changes or texture changes applied.
- Body: 14,559 faces. FL: 2,664. FR: 2,671. RL: 2,513. RR: 2,441.
- Maximum rest-position coordinate error measured in Blender: 0.0m, for body and all wheels.
- Every UV corner copied; maximum measured UV error: 0.0.
- All three embedded texture payloads byte-identical to approved asset by SHA-256. One original material shared by all five parts.
- Original corner normals copied through Blender custom-normal storage. Storage quantization produces maximum normal vector difference 0.000484 (roughly 0.028 degrees); normals are therefore not claimed bit-identical.
- Full numerical details: `segmentation-audit.json`, `texture-audit.json`, `inspection.json`.

## Limits and next step

Rest-pose geometry preservation does not establish correct semantic separation. Spatial classification cannot identify all fused tyre/arch attachment surfaces. The tyre silhouette is also not perfectly rotationally symmetric. Do not treat these independent pivots as production-ready wheels.

Accurate movable tyres need deliberate wheel/body boundary retopology and hidden arch reconstruction, or an accurately modeled replacement wheel fitted to a repaired opening. That would change geometry and needs its own reference-backed visual review. No such body reconstruction was attempted here.

Editable review project: `D:/CodexTools/Blender/projects/cybercab-wheel-review/cybercab-segmentation-review.blend`. Original mesh retained hidden alongside candidate parts. Wheel pivots use Blender Z-up,+Y forward with local X axle; exported GLB is Y-up,-Z forward. Review script: `assets-source/vehicles/review-wheel-segmentation.py`. Render thread count: 3.
