# Independent near-NPC state review

No actionable defect found for current valid traffic data. Read-only review of `npc-detail-state.mjs` (SHA256 ee05258f9d3346a166c2d05009d03877f395ed46e4e3901e8d44c5aea431c1c2) and `verify-npc-detail-state.mjs` (5151201b117cefafde87a3d361bb4ee93f3277477cab98c1e6df03244df91583). Existing pure state tests rerun successfully. No GPU, Blender or runtime changes.

Confirmed against existing runtime contracts:

- `traffic-simulation.js` increments totalMoved only after accepted movement; collision rollback does not advance it. Deriving spin directly from totalMoved preserves phase across detail-slot reuse, stops and culling. Modulo 2pi is quaternion-equivalent for the existing rig and avoids unbounded angle growth.
- Heading is normalized clockwise degrees from north. Positive wrapped heading delta produces positive steer, matching auto-physics and bindVehicleWheelRig, which negates that angle in its glTF Y-axis rotation. Positive wheel angle similarly matches rig's negative X-axis spin. No sign inversion found.
- Previous-detail IDs get52 m exit threshold versus42 m entry threshold, and5 m ranking preference. This suppresses boundary churn while permitting a materially nearer car to replace retained detail under2 desktop /1 mobile caps. Numeric stable IDs match current NPC IDs.
- Three-dimensional eye distance intentionally drops expensive nearby meshes in aerial view. This does not itself control far-LOD visibility; renderer must use the same visible-car set and hide exactly one representation per selected ID.

Integration contracts to preserve, not defects in these pure helpers: pass actual rig radius/wheelbase when available; keep prior pose keyed by car ID rather than detail slot; update prior pose as simulation progresses even when its detail mesh is absent, or expect first re-entry steering to initialize straight while wheel phase remains correct. State tests do not establish rendered wheel clearance, LOD transition appearance or frame-time cost; those remain render acceptance work.
