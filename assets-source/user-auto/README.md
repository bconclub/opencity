# User-supplied auto rickshaw

Source supplied by project owner: `D:/Brands BCON/OpenCity/Models/auto-rickshaw.zip`.
Archive contains `source/Auto.fbx` and three PNG textures. No author or license file was included. Attribution and redistribution license are unverified; no open-source license is claimed. Original archive remains unchanged.

`build.py` imports the FBX using Blender 4.5.9, reconnects the supplied base-color, roughness and normal textures, resizes textures to 1024 square, centers the vehicle at ground level and exports `assets/auto/auto-rickshaw.glb`. The editable result is saved at `D:/CodexTools/Blender/projects/user-auto-rickshaw.blend`.

Vehicle faces +Y and uses Z-up in the game; GLB stores standard Y-up coordinates. Source design is yellow with a black canopy. Runtime color customization masks yellow body paint and preserves canopy, tyres and decals. This is a single joined source mesh with no supplied wheel/steering rig; imported wheels are currently static. Existing procedural model remains as a loading/failure fallback.
