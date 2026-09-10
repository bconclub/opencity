# OpenCity authored vehicle assets

Original procedural Blender reconstructions, not manufacturer-supplied or imported licensed vehicle models. Designs simplify recognizable exterior features for real-time gameplay. No manufacturer logos or textures used.

`build-vehicles.py` runs in Blender 4.5.9 background mode and exports GLBs, studio previews, validation statistics, and editable `.blend` projects. Set `OPENCITY_BLEND_DIR=D:/CodexTools/Blender/projects` to save editable projects on the dedicated tools drive. Final source projects: `cybertruck.blend`, `cybercab.blend`, `kitt.blend`.

## Runtime contract

- Meters. Source Z-up and +Y forward. Exported GLB Y-up and -Z forward. Three.js group rotation X = +PI/2 converts exported assets to game Z-up,+Y forward.
- Wheel node names: `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR`. Each origin is wheel center, spin axle local X. Rim and hub meshes are children of wheel nodes. Front wheels at positive source Y.
- Materials: `BodyPaint` (Cybertruck/KITT) or `GoldPaint` (Cybercab), `RubberTrim`, `Glass`, `Lamps`. Keep Cybercab gold fixed. BodyPaint also used on wheel trim.
- Lamps use `COLOR_0` vertex color and emissive material. KITT scanner nodes `Scanner_0` through `Scanner_7` can be individually animated. Glass is opaque dark reflective glass, avoiding mobile transparency sorting problems.
- Each vehicle below 25,000 triangles, exactly four materials, no textures. Actual exported GLB accessor counts and bytes in `assets/vehicles/glb-audit.json`. Authored-space bounds in `asset-validation.json`.
- GLBs exclude studio floor, cameras, lights. Blender source files include these for repeatable previews.

## Driver candidate

User supplied `D:/Brands BCON/OpenCity/Models/Auto Driver.glb` is a static seated astronaut/robot, not rigged. Original: 498,494 triangles, 1 material, 3 textures at 2048 square, 28.6 MB. Source remains untouched.

`optimize-driver.py` welds duplicate vertices before decimation, preserves UVs, reduces mesh to 12,000 triangles and textures to 1024 square. Candidate `assets/vehicles/auto-driver-candidate.glb` is about 4.3 MB. A studio preview was visually checked: seated bent knees, hands beside thighs, backpack and antennas. Hands need further pose work to grip an auto handlebar. Candidate is not automatically installed as runtime driver.

Driver axes differ from authored cars: source Blender Z-up, -Y forward; exported GLB Y-up,+Z forward. Rotate X=+PI/2 then Z=PI for game +Y forward. Bounds height 1.03m, width .596m, depth .552m; game seating offset and scale require placement inspection.

## Visual references

- Tesla Cybertruck exterior and stainless-steel/angular design: https://www.tesla.com/cybertruck?redirect=no
- Tesla Cybertruck dimensions: https://www.tesla.com/ownersmanual/cybertruck/en_us/Owners_Manual.pdf
- Cybercab gold design context: https://shop.tesla.com/product/cybercab-trucker-hat
- KITT: original stylized reconstruction of recognizable 1982 Trans Am body, scanner nose, pop-up headlight lids, T-top glass and rear spoiler, authored from general design knowledge. No downloaded model or branded texture.
