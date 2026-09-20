# Accepted Cybercab near-NPC feasibility

Confidence: high. CPU inspection only; no model edits or render jobs.

Use accepted `cybercab-rigged.glb` unchanged for at most two near desktop NPCs or one near mobile NPC. Keep existing fused 6,000-triangle asset for remaining cars. The detailed source is 24,667 triangles: body 19,867; four tyres 2,688; four rims 960; four liners 1,152.

**Five near batches preserve source geometry and independent steering:** body N; fixed merged four-liner set N; left tyre 2N; right tyre 2N; shared rim 4N. Plus one far batch gives at most six vehicle draw calls when both tiers are visible. All source materials are opaque and double-sided; preserve their existing normals and winding. No shader/material correction is part of this path.

FL/RL and FR/RR tyre POSITION, NORMAL and index arrays are exactly equal. The same holds for corresponding same-side liners and rims. Left/right tyre sharing under a proper 180-degree Y rotation is invalid: vertex sets coincide, but triangle diagonals differ and normals oppose (minimum dot -1). Liners exhibit the same normal/winding asymmetry. Keep tyre side prototypes separate and bake all four original liners into one fixed set without retriangulation or recomputed normals.

Gold rims do share under rigid rotation: use FR as prototype, identity for right wheels and `Ry(pi)` for left. Oriented triangle/normal matching succeeds; maximum measured transformed-position error is below 1e-16 m (floating-point rotation roundoff). No negative scale is needed. Comparison keys use 1e-5 quantization, with maximum actual matched errors recorded separately.

GLB coordinates: Y-up, forward -Z, axle X. Centres: FL/FR = (+/-0.78,0.365,-1.405), RL/RR = (+/-0.78,0.365,1.367). Source-to-game conversion is `Rx(pi/2)`; caller supplies game Z-up car matrix C. Fixed geometry uses `C * Rx(pi/2)`. Wheel transforms use the actual unchanged `bindVehicleWheelRig` result, including translated pivots, independent front steering and local-X spin. A canonical left rim additionally uses `Ry(pi)` after its wheel matrix. This avoids assuming steering sign/order independently of runtime code.

At maximum occupancy: desktop 2 detailed + 18 far = 157,334 triangles versus 120,000 current (+37,334, 31.11%); mobile 1 detailed + 7 far = 66,667 versus 48,000 (+18,667, 38.89%). General submission cost is `6000 * visibleCars + 18667 * nearCars`. These are exact geometry counts, not measured performance. Tier selection needs stable car identity/rolling phase and hysteresis; root owns that utility.

Reproducible evidence: `qc/audit-cybercab-shared-prototypes.mjs` and `qc/cybercab-shared-prototype-audit.json`. Source textures are loaded as CPU placeholders only for this structural audit. Helper preparation is isolated under `qc/`; runtime remains unchanged until root integrates and validates a candidate.

## Prepared helper

`qc/npc-detailed-batches.js` exports `createDetailedTraffic(T, source, maxNear)` with `{meshes, trianglesPerVehicle, update(rows), dispose()}`. Rows are `{matrix, angle, steer}` with a game Z-up car matrix. Capacity is one or two. Root's harness serves this file at `/npc-detailed-batches.js`; its imports intentionally resolve from that root route.

Five InstancedMeshes own cloned geometries and three identity-keyed material clones. Source textures remain shared and are never disposed. Independent source hierarchy clones run the unchanged wheel rig for each near slot. Source is not mutated. Empty row updates clear all counts. No vertex welding, resampling, normal recomputation or asset export occurs.

`qc/verify-npc-detailed-batches.mjs` passes CPU verification: empty/rest/two independent car poses with different steering and spin/empty reset; one-car mobile capacity; five batches; 24,667 triangles per car; positive instance determinants; maximum instance-matrix rounding error 7.458e-7; zero source-resource disposals including repeat disposal. Evidence is `qc/npc-detailed-batches-validation.json`. WebGL appearance and timing remain for root's isolated integration review.
