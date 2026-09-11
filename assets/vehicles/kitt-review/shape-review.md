# Workshop shape pass for visual review

This pass changes only the workshop reconstruction. Live `assets/vehicles/kitt.glb` is untouched. It is not a downloaded model, Pontiac CAD or a claim of screen-car dimensional accuracy.

| Change | Before | Revised |
|---|---|---|
| Rear hatch | Shallow 22mm crown, large flat sail quad | Centreline heights retained; wider rolled glass shoulders and contoured sail panels |
| Spoiler | Rectangular board, top Z=.945m | Swept/tapered aerofoil, centre top Z=.900m |
| Visible rim radius | .219m | .200m, tyre radius .321m and pivots unchanged |
| Triangles | 24,212 | 24,512 |
| Materials | 4 | 4 |

The revised contour dimensions are estimates. Base Firebird dimensions and tyre options supplied the scale/checking context, not exact KITT CAD. The 15in-style rim interpretation remains subject to photographic review; visible outer flange size is not nominal bead-seat size.

## Matched visual evidence

Same camera positions, orthographic scale, lighting, 1440x900 resolution and 32-sample Cycles configuration:

| View | Before | Revised |
|---|---|---|
| Front | `before-corrections/front.png` | `front.png` |
| Side | `before-corrections/side.png` | `side.png` |
| Rear three-quarter | `before-corrections/rear-three-quarter.png` | `rear-three-quarter.png` |
| Front three-quarter | `before-corrections/front-three-quarter.png` | `front-three-quarter.png` |

Visual inspection shows a continuous wrapped rear hatch, a lower shaped spoiler and deeper rubber sidewalls. No new obvious wheel/body intersections or detached hatch panels were seen. Source-body generality, custom nose accuracy and material appearance remain separate limitations. These images support root's visible review, not automatic acceptance as a high-fidelity final KITT.

`shape-glb-audit.json` verifies GLB budgets, four wheel pivots, four steering parents and eight scanner indices.

`shape-runtime-cpu-audit.json` passes using the actual exported GLB, cached Three revision 169/GLTFLoader and the unmodified current `bindVehicleWheelRig` function: four spins -PI/2, pivot drift 0, correct inner/outer front steering, rear steering 0 and neutral reset 0. All eight scanner materials retain emissive maps and intensity 1.8. Only image decoding uses CPU placeholder textures; this is not a WebGL appearance or animated-scanner-sweep test. Independent Blender import/matrix verification also passes in `shape-cpu-rig-audit.json`.

The first browser attempt timed out waiting for `window.kittWorkshop` and closed.
Root then reran the instrumented harness with network access and a fresh context
that blocks service workers. This retry passed: four wheels, zero pivot drift,
correct inner/outer steering, neutral reset, and animated eight-segment scanner.
`qc/kitt-rig-audit.json`, `qc/kitt-rig-diagnostics.json` and the browser screenshots
now record the revised asset. Zero page errors or failed requests occurred in
that retry. The earlier timeout's cause was not isolated.

Source: `assets-source/vehicles/build-kitt-reference.py`. Revised editable file: `D:/CodexTools/Blender/projects/kitt-reference/kitt-reference.blend`. Prior editable file: `D:/CodexTools/Blender/projects/kitt-reference/kitt-before-shape-corrections.blend`. The previous builder and GLB are also in `before-corrections/`.

Reference basis, proposed targets and uncertainty: `qc/kitt-shape-correction-plan.md`.
