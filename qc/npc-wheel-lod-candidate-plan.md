# Separated NPC Cybercab candidate plan

Status: CPU preparation only. Blender has not run; no candidate exported. No runtime changes. Confidence: high for source measurements; candidate appearance unverified.

Prepared script: `assets-source/vehicles/build-npc-cybercab-lod.py`.

After release benchmark finishes, copy script to `D:/CodexTools/Blender/projects/npc-cybercab-lod/` and execute with Blender background mode, three threads, explicit `--source C:/Users/user/Documents/ChatGPT/Z/assets/vehicles/cybercab-rigged.glb` and a fresh `--out D:/CodexTools/Blender/projects/npc-cybercab-lod/review-01` directory. No rendering occurs in this script. Source GLB remains read-only and is hash-checked.

Outputs stay on D: `npc-cybercab-separated-candidate.glb`, matching editable `.blend`, and `candidate-build-audit.json`. Workspace runtime assets remain untouched. Review acceptance and a separate explicit copy precede any runtime integration.

Script imports accepted separated source, checks all four measured wheel centres, and simplifies only its fixed textured body to roughly 4,556 triangles. It preserves body material and UV layers; decimation changes vertices and interpolates UVs, so texture fidelity is not yet proven. Existing gold/rubber materials are reused without edits. No spatial segmentation, repaint, or whole-model merge.

New shared positive-determinant prototypes: 24-segment tyres, 24-segment two-ring rims, 16-segment liners. Budget is body <=4,560 plus 768 tyre, 288 rim, and 384 liner triangles, totaling <=6,000. Export aborts if total exceeds 6,000. Triangle accounting must count every mesh node instance, since four wheels share geometry datablocks.

Four `Wheel_*` empty pivots own tyre/rim child meshes. Left-side child orientation rotates 180 degrees around Blender Z; pivot spin remains local X. Liners stay outside moving hierarchies. GLB export converts Blender Z-up/+Y-forward to Y-up/-Z-forward. Extras label `fixed_body`, `fixed_liner`, `tyre`, and `rim` batching roles.

Four planned runtime draws: fixed body N instances, fixed liners N, tyre 4N, rim 4N. Relative to current NPC: +3 calls, no triangle increase if final export meets target. Runtime batching implementation is outside this preparation task.

Next validation, after benchmark slot release: independently parse exported node hierarchy/materials/triangle count; verify four pivots and source image payloads; compare static versus 90-degree wheel poses and matched source/candidate silhouettes; inspect arches and UV distortion. Only then decide whether candidate warrants integration. No fidelity, rig, draw-call, or performance pass is claimed yet.
