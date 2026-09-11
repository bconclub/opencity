# Cybercab wheel repair

Derived from the user-selected `cybercab-meshy-approved.glb`. The original
Meshy reconstruction remains in the repository unchanged. This is a game-asset
repair, not Tesla CAD or a new claim of manufacturer-accurate body geometry.

`cybercab-rigged.glb` contains 24,667 triangles, three materials and four
independent `Wheel_FL/FR/RL/RR` pivots. Original retained body geometry and UVs
are unchanged; original embedded textures are byte-identical. Only wheel cores
were replaced with round tyres and clean gold aero discs. Fixed dark liners
cover the junction with the retained scan. Narrow scan tyre peripheries remain
hidden behind these replacements; the result is not a watertight mechanical
reconstruction. Existing body shading defects are preserved.

Source: `assets-source/vehicles/repair-wheel-review.py`.
Editable Blender: `D:/CodexTools/Blender/projects/cybercab-wheel-review/cybercab-repaired-review.blend`.
Browser rig test: `qc/verify-cybercab-repair.cjs`.
Detailed Blender preservation/spin audit: `assets/vehicles/cybercab-wheel-review/repair-audit.json`.

Wheelbase 2.772 m and rolling radius 0.365 m fit this model, not independently
verified vehicle specifications. Export uses glTF Y-up/-Z-forward; the game
converts it with parent X rotation PI/2. Wheel spin remains local X, with steering
inserted as separate parent pivots by the existing vehicle loader.

Cybercab paint remains fixed gold. NPCs retain the existing shared traffic LOD.
This file alone does not establish a production deployment or performance pass.
