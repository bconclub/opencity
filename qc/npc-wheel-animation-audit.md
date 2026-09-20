# NPC wheel animation audit

Read-only inspection, 2026-09-11. No runtime changes, rendering, or asset processing. Confidence: high for measured hierarchy and counts; proposed LOD quality remains unverified.

## Current behavior

`blender-vehicle.js:41` selects `assets/vehicles/cybercab-meshy-traffic.glb` for `loadVehicleAsset('cybercab', true)`, used by `npc-traffic.js:15`.

| Measured file | Bytes | Triangles | Meshes / nodes | Materials | Wheel pivots |
|---|---:|---:|---:|---:|---|
| cybercab-meshy-traffic.glb | 3,864,428 | 6,000 | 1 / 1 | 1 | None |
| cybercab-rigged.glb | 4,437,428 | 24,667 | 13 / 13 | 3 | FL, FR, RL, RR |

Current NPC asset has no independently transformable wheels. `npc-traffic.js:16-18` additionally bakes every mesh's world matrix into vertices and merges by material name. Even a separated source would lose wheel articulation through this path. Render updates apply one rigid car matrix to all batches. No rolling phase exists.

Current traffic costs one vehicle draw call when any cars are visible and 6,000 triangles per visible car. Limits are 20 desktop / 8 mobile; distance culling can reduce visible count. These are geometry submission counts, not performance measurements.

## Smallest existing accepted derivation source

Use current player source `assets/vehicles/cybercab-rigged.glb`. It is the smallest wheel-separated source established as accepted in the current inspected pipeline. No accepted separated traffic LOD was found. Smaller unselected procedural assets are not substitutes for the accepted appearance.

The source contains 19,867 fixed body triangles; four 672-triangle tyres; four 240-triangle rims; and four fixed 288-triangle liners. Total: 24,667. Each rim is a child of its `Wheel_*` tyre node. Three materials: original `Material_0`, separate gold rims, and rubber/liners.

GLB coordinates are Y-up, forward -Z, wheel axle X. Wheel centres in metres: FL/FR = (minus/plus 0.78, 0.365, -1.405); RL/RR = (minus/plus 0.78, 0.365, 1.367). Tyre radius is 0.365 m. Existing NPC +90-degree X rotation maps this to game Z-up, forward +Y.

## Minimal standard-instancing path

Preserve fixed and moving geometry separately during LOD creation and batching. Use four shared `InstancedMesh` draws:

| Batch | Instances for N visible cars |
|---|---:|
| Fixed textured body | N |
| Fixed dark liners | N |
| Shared canonical tyre | 4N |
| Shared canonical gold rim | 4N |

Fixed liners and moving tyres share a material but require separate geometry/transform batches. Partition by static/moving role and material identity, not material name alone. Use one right-wheel prototype with a proper 180-degree orientation rotation for the left side, preserving outward rim placement; do not use negative-scale instance matrices. Validate prototype equivalence and outward faces before export.

Compose wheel matrices from car pose, wheel-centre translation, front steering if available, axle spin, and side orientation. Maintain rolling phase per persistent car, advancing by actual travelled metres / 0.365 and freezing when stopped. Existing NPC state supplies heading and speed but no explicit steering angle; rolling alone is the minimal change. Preserve current dense visibility packing, with wheel slot `4 * visibleCarSlot + wheelIndex`. Wheel phase must not depend on that transient slot.

## Exact costs and proposed budget

| Path | Vehicle draw calls when visible | Triangles per car | Delta from current NPC |
|---|---:|---:|---|
| Current fused traffic LOD | 1 | 6,000 | Baseline |
| Direct accepted player source, four batches | 4 | 24,667 | +3 calls; +18,667 triangles/car |
| Proposed separated 6,000-triangle LOD | 4 | 6,000 target | +3 calls; zero triangle increase if target achieved |

Calls remain independent of visible car count. Direct source substitution would add 373,340 triangles at 20 visible cars or 149,336 at eight. Splitting geometry into batches itself adds zero triangles. The four-batch design writes 10N instance matrices per update versus current N.

Concrete proposed 6,000-triangle allocation: body 4,560; liners 384 total; tyres 768 total; rims 288 total. This is a budget, not an achieved export or validated visual result. Preserve the original body texture and wheel centres; simplify body and rebuild low-segment circular wheel components independently. Do not segment the current fused LOD by spatial cuts or globally merge the separated output.

Before acceptance: compare fixed and 90-degree wheel poses, outward rim placement, wheel-arch overlaps, front turns, stop/start phase, and culling re-entry. Confirm four calls and final triangle count from the exported geometry. No FPS improvement or final LOD fidelity is asserted by this audit.
