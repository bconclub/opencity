# Separated NPC Cybercab LOD review

**REJECTED by root after matched front-image inspection.** Windshield gains a white patch; bonnet, doors, roof and wheel arches become jagged; rear panels show obvious faceting. The numeric 6,000-triangle target was reached, but this candidate fails the fidelity requirement. No further variants, runtime changes, promotion, git or push. GPU/processing slot released after Blender exited.

Confidence: high for rejection, measured geometry and texture checks. This bounded method failed; it does not establish that every possible 6,000-triangle retopology is impossible.

## Evidence

All binaries, editable Blender scene and eight matched renders remain on D under `D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/`:

- [Source front](D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/source-front.png) and [candidate front](D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/candidate-front.png).
- [Source side](D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/source-side.png) and [candidate side](D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/candidate-side.png).
- [Source rear](D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/source-rear.png) and [candidate rear](D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/candidate-rear.png).
- [Static wheel](D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/candidate-wheel-static.png) and [90-degree wheel](D:/CodexTools/Blender/projects/npc-cybercab-lod/review-02/candidate-wheel-90.png).

## Measured checks

Export: `npc-cybercab-separated-candidate.glb`, 3,808,780 bytes, 5,996 triangles counted across mesh-node instances, three materials, four shared geometry prototypes and 17 nodes. Body contributes 4,556 triangles; four tyres 768, rims 288 and liners 384. Four intended shared runtime batches remain an architectural plan, not a measured runtime draw-call result.

Exactly four named `Wheel_FL/FR/RL/RR` pivots. Source GLB Y-up centres remain (+/-0.78, 0.365, -1.405) front and (+/-0.78, 0.365, 1.367) rear. Exported pivot error is zero. Exported surface bounds match the candidate Blender surface exactly. Source-to-candidate body bounds change by up to 12.748 mm; these are different checks. Initial `review-01` export stopped because its bounds check included loose decimation vertices. The corrected check measures polygon-referenced vertices. Geometry settings were unchanged for `review-02`.

All three original 1024 x 1024 embedded images retain identical SHA256 payloads. Body UV coordinates are interpolated by decimation, so identical image bytes do not imply identical texture appearance. Matched images demonstrate this limitation directly.

Accepted source `assets/vehicles/cybercab-rigged.glb` remains unchanged. SHA256: `d22c94990893c5d807248cb7717ac643fccf2d532ad55519f57f3f8de65bbc1a`. Existing NPC runtime asset `cybercab-meshy-traffic.glb` was not changed.

Actual cached Three 169 GLTFLoader and unchanged runtime `bindVehicleWheelRig` pass CPU checks: four independent wheels, radius 0.365 m, wheelbase 2.772 m, track 1.56 m, zero pivot drift at 90-degree spin plus steering, front steering -0.319674 / -0.386367 radians, rear steering zero, reset passes. Blender separately verifies 90-degree pivot stability. Circular 24-segment wheels look identical after 90 degrees; transform assertions provide motion evidence. CPU tests use placeholder textures and claim no WebGL performance result.

Workspace evidence: `qc/npc-cybercab-candidate-build-audit.json`, `qc/npc-cybercab-runtime-rig-audit.json`, and `qc/validate-npc-cybercab-runtime-rig.mjs`. Build/render scripts remain under `assets-source/vehicles/` with copies on D. No candidate binary copied into runtime or workspace.
