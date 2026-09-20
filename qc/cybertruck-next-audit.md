# Cybertruck targeted improvement audit

Confidence high for measurements and export defects; moderate for proposed visual improvement until matched views are reviewed. Read-only audit, 2026-09-11. Only this report and accompanying JSON were written. No Blender, GPU, or runtime changes.

Actual `assets/vehicles/cybertruck.glb`: 429,708 bytes, SHA256 `0c7a5c0c48b0e5aa2df89029a6ca889b4e3dc0e1f540843affab3bd79b5b556b`. Measured using cached Three169/GLTFLoader and current runtime rig, after the actual X=PI/2 conversion. Source inspected: `assets-source/vehicles/build-vehicles.py`. Editable project exists at `D:/CodexTools/Blender/projects/cybertruck.blend`, but was not opened. Existing `qc/release-fidelity-isolated-cybertruck.png` supports the rear-lamp observation; it is older scene evidence, not a fresh acceptance render.

## Dimensions

Tesla dimensions distinguish mirrors and suspension settings. Owner manual track is approximate; service alignment specifies front/rear separately. [Tesla exterior dimensions](https://www.tesla.com/ownersmanual/cybertruck/en_us/GUID-12A976DD-EB60-431B-AFF1-5A37E95006DB.html), [Tesla wheel alignment](https://service.tesla.com/docs/Cybertruck/ServiceManual/en-us/GUID-AD49F177-08D6-4B6E-BE24-4361D52F44C4.html).

| Metres | Current GLB | Tesla | Difference |
|---|---:|---:|---:|
| Overall length | 5.6400 | 5.6829 | -0.0429 |
| Width including mirrors | 2.6000 | 2.4133 | +0.1867 |
| Width excluding mirrors, all remaining meshes | 2.4030 | 2.0316 | +0.3714 |
| Stainless shell alone | 2.1400 | 2.0316 exterior excluding mirrors | +0.1084 |
| Height | 1.9922 | 1.7938 Medium air | +0.1984 |
| Height | 1.9922 | 1.9438 highest Extract air | +0.0484 |
| Wheelbase | 3.6100 | 3.6350 | -0.0250 |
| Front track | 2.0400 | 1.7770 service | +0.2630 |
| Rear track | 2.0400 | 1.7720 service | +0.2680 |
| Front overhang | 0.9950 | 0.8783 | +0.1167 |
| Rear overhang | 1.0350 | 1.1696 | -0.1346 |

Folded-mirror width is 2.2007 m, not body width. Model mirrors are separate boxes. Model non-mirror maximum comes from protruding wheel hubs, not stainless panels. Do not scale the whole vehicle to the mirror-width target.

## Three fixes, in priority order

1. **Correct wide stance and oversized tires.** Source line 86 sets every wheel at X=+/-1.02 and radius .47; lines 48-59 place protruding covers/hubs outside those cylinders. Set independent front/rear wheel centers to +/-0.8885 and +/-0.886. Retain wheel parents and local-X spin. Re-center corresponding arch openings; narrow the stainless shell and attached side fixtures together to a maximum halfwidth of 1.0158. Reposition mirrors independently to outer X=+/-1.20665. Reduce excessive hub protrusion so it does not determine body width. These are local object/vertex edits, not uniform scene scaling. Tesla lists 285/65R20 tires; nominal unloaded geometric radius derives to .43925 m, versus .47 m in source. Actual rolling radius remains load-dependent. Keep existing tire material, reshape geometry and move centers to maintain ground contact. [Tesla tire specifications](https://www.tesla.com/ownersmanual/cybertruck/en_us/GUID-9284C9F2-A2F2-4604-83BF-6599F47766B7.html).

2. **Lower the exaggerated canopy and correct front/rear distribution.** Source lines 87, 93-103 define the shell, canopy, tubular roof rails and fixtures. Canopy peak is 1.9577 m; rails increase total height to 1.9922 m. Choose an explicit suspension stance, proposed Medium air, then reprofile existing canopy/rail and shell heights to 1.7938 m overall, without flattening wheels. Thin planar rail sections can replace the current .025 m-radius tubes while retaining `BodyPaint`. Preserve `Glass` slots and existing angular roof topology. For longitudinal placement, retaining axle midpoint Y=-.025 gives corrected front/rear Y=1.7925/-1.8425. Target front/rear endpoints 2.6708/-3.0121 matches published overhangs. Shift arch rings with wheel centers and deform nose/tail stations plus their attached lamps/bumper; don't stretch the whole cabin. These edits need side-view silhouette and contact verification. Exact intermediate panel contours remain estimates, not manufacturer CAD.

3. **Fix rear lamp white emission.** Source lines 68-72 and 84 connect `LampColor` to both base color and emission; line 102 supplies red. Actual GLB exports a shared `Lamps` material with white emissive factor, intensity 3, no emissive map. Vertex color affects glTF base color, not emission. The rear screenshot visibly shows a white bar. Bake only lamp colors into a tiny palette with base/emissive UVs, following the existing KITT export solution, preserving four material classes; alternatively split front/rear fixed lamp materials and accept a measured material-cost increase. Do not repaint glass, tires or body. Verify tail red/front white after export under actual renderer lighting.

## Integration constraints and verification

Current physics still uses wheelbase 3.3 and radius .43, inconsistent with existing measured 3.61/.47. After geometry acceptance, coordinate tuning and remote steering assumptions with the selected dimensions. No handling changes are made by this audit. Paint intentionally targets `BodyPaint`, including current covers; glass and rubber already remain separate. Opaque glass is an intentional documented runtime choice, not evidence of a broken transparency export.

Save a separate edited candidate from the existing Cybertruck project, preserving other cars. CPU-check individual wheel centers/radius, shell-only and mirror bounds, unchanged material assignments, lamp texture bindings and actual rig pivot invariance. Then review matched front/side/rear images and local/remote steering. The source generator loops over all three legacy cars, so running it unfiltered would overwrite unrelated approved assets. Do not use that as the edit workflow.

The saved Tesla investor deck was unsuitable for dimensional verification; official owner/service pages above were checked with parent authorization. Numeric references are vehicle/option dependent. This plan addresses measured recognizability defects, not a photoreal certification.
