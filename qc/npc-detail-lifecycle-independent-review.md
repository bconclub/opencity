# Near-NPC candidate lifecycle review

No blocking or actionable defect found for current accepted Cybercab asset and existing map lifecycle. Read-only review of `npc-detail-candidate.js`, `npc-detailed-batches.js`, and `verify-npc-detailed-batches.mjs`; no runtime edits, browser, GPU or heavy validation run.

Checked invariants:

- Each shown car enters either detail rows or far instances, exclusively. Far counts reset every frame; detail update receives empty rows when none selected, hiding every detail batch. Async load failure keeps every shown car in far LOD.
- Pose history is keyed by stable car ID and updated for all simulated cars, including distance/screen-culled cars. Slot reassignment therefore retains absolute wheel phase and recent steering. Detail matrices reuse existing clockwise heading convention and wheel rig.
- Late detail-load success checks removed before constructing/attaching anything. Normal removal disposes detail meshes, owned cloned geometries/materials and instancing resources, then far resources/environment/renderer. Shared source textures and template resources are not disposed. Helper disposal is idempotent. Cached shared GLTF remains owned by existing global asset loader intentionally.
- Body/liner instances apply positive-determinant glTF-to-map rotation; wheel instances use actual rig matrices. Left rim adjustment is a rotation, not negative scale. Existing recorded helper tests cover independent two-car transforms, steering, spin, empty reset and zero source disposal, with maximum matrix error7.46e-7.
- Additional lightweight source-accessor check confirms front/rear left tire POSITION/NORMAL arrays identical, and front/rear right arrays identical. Reusing front tire geometry for rear instances introduces no geometry difference. Actual glTF wheel-center coordinates imply2.772 m wheelbase and0.365 m center height, consistent with state defaults.

Review limits: existing CPU matrix tests establish transform equivalence, while root visual review establishes appearance. This review does not replace city agent's rendering/performance gate. No new constructor-failure handling requested for deliberately rejected, incompatible future assets; current accepted source validates before integration.
