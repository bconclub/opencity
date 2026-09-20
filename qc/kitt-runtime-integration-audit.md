# KITT workshop candidate: runtime integration audit

CPU/read-only audit, 11 September 2026. No Blender rebuild, runtime edit, asset replacement, preview generation or GPU run was performed. Confidence: high for binary/runtime measurements and code paths; visual acceptance remains the release owner's decision.

## Candidate identity and measured differences

| Measure | Current runtime `assets/vehicles/kitt.glb` | Workshop `assets/vehicles/kitt-review/kitt-reference.glb` |
|---|---:|---:|
| Bytes | 473,028 | 1,074,240 |
| Triangles | 9,970 | 24,512 |
| Mesh primitives | 67 | 20 |
| Materials | 4 | 4 |
| Visual wheelbase | 2.77999997 m | 2.56539989 m |
| Track | 1.72000003 m | 1.52400005 m |
| Embedded images | 0 | 1 PNG lamp palette |

Current runtime SHA256: `498f019da73b071b7cacf54f06daa5a5ad0536a14bd27739a3df97f368ecd339`.

Candidate SHA256: `b4247a09d36ec41fa1a550374d50e11d7006a124cafc03cc8decc4a83cc4393d`.

Fresh CPU loading with cached Three revision 169, GLTFLoader and the existing runtime rig binder measured candidate game-space bounds X `[-1.031499982,1.031499982]`, Y `[-2.439500093,2.444999891]`, Z `[-0.0030000005,1.264999986]`. Total size is 2.063 by 4.8845 by 1.268 m, including mirrors and tread details.

**Effective runtime wheel radius is 0.323999991 m**, not the source nominal 0.321 m. `bindVehicleWheelRig` measures wheel-subtree bounds, including the approximately 3 mm tread extension. The candidate's source report correctly describes nominal tire radius; the runtime getter correctly describes its bounding radius. Use 0.324 m when matching the existing runtime roll-distance calculation, or explicitly redesign that calculation around a separately declared nominal rolling radius. Do not update tuning to 0.321 while assuming the loader returns the same number.

The candidate increases triangle count approximately 2.46 times but reduces primitive count from 67 to 20. Neither figure alone establishes frame cost, especially with remote copies and transparent glass. Candidate glass uses alpha blending; old glass is opaque. Actual renderer validation remains necessary.

## Existing compatibility already established

`blender-vehicle.js` uses `loadVehicleAsset('kitt')`, resolving `./assets/vehicles/kitt.glb`. The candidate has the expected Y-up/-Z-forward GLB axes; the existing single `root.rotation.x = Math.PI/2` conversion remains correct. Do not bake another rotation or flatten the steering hierarchy.

The candidate retains exact `BodyPaint` naming, four `Wheel_FL/FR/RL/RR` pivots, four `Steer_FL/FR/RL/RR` parents, and eight `Scanner_0` through `Scanner_7` nodes. `createBlenderVehicle` clones materials per instance, registers BodyPaint for selected paint, and separately clones each scanner material. Candidate lamp base-color and emissive textures reference its embedded palette; keeping the complete GLB preserves red scanner color and the separate lamp colors. The current scanner update changes emissive intensity per segment and needs no model-specific rewrite.

Previously passed work should be reused: `assets/vehicles/kitt-review/shape-runtime-cpu-audit.json`, `shape-cpu-rig-audit.json`, `qc/kitt-rig-audit.json` and `qc/kitt-rig-diagnostics.json` already demonstrate four independent wheel spins, zero pivot drift, correct inner/outer steering, neutral reset, eight scanner bindings, and the successful browser workshop retry with no page errors. This audit did not redo those animation passes. The earlier browser timeout is superseded by that documented successful retry, not an outstanding blocker.

Remote players already use `createBlenderVehicle(T,'kitt')`; their paint calls `setPaint`, wheel angle integrates speed using the model's measured radius, and `updateDrive` handles steering and scanner animation. The remote steering estimate already uses 2.5654 m for KITT. No new remote model ID, protocol field or server change is needed. `multiplayer-server/server.mjs` already accepts `kitt`; keep that exact ID. Existing `supercar` behavior is a different compatibility path and need not change.

Contact shadows and `visualHeight` are derived from loaded geometry after `ready` for both local and remote vehicles. They need no hardcoded candidate height edit. The measured 3 mm tread penetration relative to the asset origin is smaller than the existing local model's 20 mm lift; inspect contact appearance in the release scene rather than translating the source arbitrarily.

## Exact integration edits

| File | Action |
|---|---|
| `assets/vehicles/kitt.glb` | After visual approval, replace bytes with the exact candidate hash above. Keep stable runtime filename and vehicle ID. Do not strip its embedded PNG or node/material names. |
| `vehicle-tuning.js` | Set KITT wheelbase from 2.57 to **2.5654**. Set radius default from 0.34 to **0.324** to match the current loader's measured effective radius. Preserve acceleration, boost and other handling choices unless deliberately retuned. `auto-mode.js` already overwrites radius after `ready`, but does not overwrite wheelbase. |
| `blender-vehicle.js` | Optionally align the KITT pre-ready radius fallback from 0.34 to **0.324**. No loading-path, rig, paint, scanner or axis-conversion change is required. An alternative generalized wheelbase getter/profile synchronization is possible, but unnecessary for this bounded replacement. |
| `assets/vehicles/previews/kitt.webp` | Regenerate only the KITT card from the promoted runtime asset, with the existing 640 by 420 framing/lighting. `qc/render-vehicle-previews.html` already supports `renderVehiclePreview('kitt')`; the batch script loops every vehicle, so avoid unintentionally refreshing unrelated cards. |
| `assets/vehicles/asset-validation.json` | Update stale KITT runtime counts, bounds and texture count from the promoted file. Preserve workshop/source validation separately. |
| `assets/vehicles/kitt-review/README.md`, `shape-review.md` | After actual promotion, update statements that the workshop model is not used by the game. Preserve source/provenance, estimated-shape limits and before-correction history. |
| `release.json` | Advance the release version with the atomic asset/tuning/preview change so existing installations do not retain old GLB bytes under the stable URL. |
| `sw.js` | Current allowlist already contains `assets/vehicles/kitt.glb`, `assets/vehicles/previews/kitt.webp`, `vehicle-tuning.js` and `blender-vehicle.js`. No new asset path is required; preserve versioned cache isolation. |

No inherent edits are needed in `vehicle-shell.js`, `index.html`, `vehicle-colors.js`, `auto-mode.js`, `multiplayer-client.js`, `multiplayer-render.js` or the multiplayer server for this candidate. Their current IDs, loader calls, color transport and animation hooks already support it. `loadVehicleAsset` caches templates in memory by `kitt`; tests of replacement bytes must use a fresh app context, not an already-loaded template.

## Remaining release checks and actual mismatches

1. **Asset selection and stale preview/cache are the primary unfinished integration steps.** The runtime URL still points at the old hash, and the existing preview represents that runtime model. Workshop screenshots are not evidence that the production URL or an installed service worker has updated.
2. **Physics wheelbase must match the candidate.** Local physics/ground wheelbase sampling comes from `vehicleProfile`, while visual Ackermann steering reads the mesh pivots. Candidate promotion without the 2.5654 m tuning update leaves those frames slightly different. The current 2.57 versus 2.5654 difference is small, but the requested exact value is straightforward and the candidate fixes the much larger old visual 2.78 m mismatch.
3. **Collision bounds remain an existing approximation.** `npc-traffic.js` defaults KITT to length 4.6 m and width 1.9 m, versus candidate rendered length 4.8845 m and width 2.063 m including mirrors. This is not a new regression, since the old car is larger still. Test bumper separation with NPCs before claiming geometry-exact contact. If visual bumper overlap remains, add a KITT-specific length close to 4.8845 m; choose body-versus-mirror width deliberately instead of treating the whole render bounds as a mandatory rigid collision box. Building collision in `auto-world.js` is also an arcade proxy, not the GLB surface.
4. **Targeted production smoke, not another rig rebuild:** from a fresh app/cache context, enter KITT from its new card, drive and reverse, steer both directions, pause/resume, and verify contact height. Change paint on one local instance and one remote instance; body should change while glass/trim/lamp palette and the other instance remain independent. Watch the scanner through both clients while remote wheels spin and front wheels steer. Verify body and transparent hatch glass under actual map lighting, then compare vehicle and multiplayer render timing on desktop/mobile. These checks cover the actual loader/cache/material environment that differs from the passed workshop.

No candidate-specific broken rig, missing paint material, missing scanner node, wrong server ID or required protocol migration was found. Shape fidelity/approval is still a visual decision; existing workshop docs describe contour estimates rather than certified KITT CAD.
