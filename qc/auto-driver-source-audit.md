# Auto Driver source audit

**Verdict: supplied file is a standalone seated stylized astronaut/robot, not a realistic human auto driver or a vehicle containing an extractable driver. Current playable auto has no driver. Confidence: high.**

Audit is read-only. No rendering, mesh editing, exporting, driver insertion or runtime changes were performed. Existing previews were inspected, avoiding contention with landmark rendering.

| Asset | Bytes | Triangles | Meshes | Materials | Textures | Rig / animation |
|---|---:|---:|---:|---:|---|---|
| `D:/Brands BCON/OpenCity/Models/Auto Driver.glb` | 28,595,672 | 498,494 | 1 | 1 | 3 PNG, 2048 square | None |
| `assets/auto/auto-rickshaw.glb` | 1,463,888 | 12,604 | 1 | 2 | 3 PNG, 1024 square | None |

Both files expose a single mesh node and no skin or animation. Supplied character node is `texture_pbr_v128`; vehicle node is `User_Auto_Rickshaw`. Single-mesh status alone does not prove every surface is topologically connected, and no such connectivity claim is made here. There are no separately named head, arms, driver, wheel or steering nodes.

## What the supplied file contains

Existing source-derived preview shows an oversized helmet, dark visor, bulky suit, backpack with antennas, bent knees and hands beside thighs. It is already a whole character. There is no rickshaw to remove and no realistic human hidden inside it.

Prior optimization of this exact supplied file produced `assets/vehicles/auto-driver-candidate.glb`: 12,000 triangles, 1 material, three 1024-square textures, 4,337,840 bytes. Existing candidate preview was inspected again. The character is seated but its hands do not grip an auto handlebar. No rig or anatomical segmentation was created. That candidate is not loaded by the current playable auto.

Visual evidence: `assets/vehicles/auto-driver-candidate-preview.png`. Prior optimization source: `assets-source/vehicles/optimize-driver.py`. These pre-existing files were only read during this audit.

## Current playable auto

`auto-mode.js:24` imports `auto-model.js`; that module invokes `upgradeAuto` from `auto-asset.js`. Loader reads only `assets/auto/auto-rickshaw.glb`, hides fallback body children and inserts the imported rickshaw. It does not load or attach any driver character.

Current fallback has passenger and driver **seats**, not a human silhouette. Old `auto-model-v1.js` does contain a primitive torso/head driver, but the active path does not import that file. It must not be used as evidence that the playable auto has a driver.

Existing vehicle studio preview `D:/CodexTools/Blender/user-auto-preview.png` shows the empty cabin and handlebar area. Source provenance/build files under `assets-source/user-auto/` describe the joined vehicle mesh and static imported wheels. No separately controllable driver exists in the GLB hierarchy.

## Concrete next step

For a stylized astronaut driver, extraction is unnecessary: use the already optimized whole character in a separate review placement. Align seated pelvis with driver seat, face game +Y, inspect roof clearance and knee position, then show hand-to-handlebar gaps before considering any pose work. Do not replace the approved rickshaw.

For a realistic human driver, request/use a suitable separately supplied seated human model. Segmentation cannot turn this helmeted astronaut into a realistic person. No extraction or rigging success is claimed.

Exact hashes, node transforms, primitive attributes, image dimensions and runtime evidence are recorded in `qc/auto-driver-source-audit.json`.
