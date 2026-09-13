# Supplied vehicle release 0.0.40

Adds exact original Knight Rider, Yulu and delivery scooter GLBs. Cybertruck and Cybercab originals from 0.0.39 remain. Existing auto and helicopter retained. Cycle removed from picker, legacy multiplayer Cycle IDs still supported.

No decimation, remeshing, wheel replacement, tint overlays or texture resizing. Runtime uses uniform scale, grounding and heading only. Original full-model previews rendered in Blender. All five source byte comparisons and geometry/grounding checks passed (original-validation.json). Fused original wheels remain static; independent wheel animation and tyre contact effects remain pending for these originals. Auto's existing three-wheel rig remains.

GLBs cache on demand and are excluded from startup precache. Shared source geometry/textures are reused across players. Existing lower-detail NPC assets are unchanged.

Verified: staged browser script syntax, six multiplayer server tests, live room server accepts Yulu/delivery IDs. Browser model fixture loaded Yulu, delivery and KITT with original ~1.9M triangles each, 27 total fixture draw calls. Yulu/delivery frame averages ~17.7/17.85 ms on desktop; no physical-phone performance claim. KITT 22.81 ms while a second city tab was rendering, not a controlled comparison.

Picker has seven rides and retains Free roam onboarding. Local full-city room connection failed; final ride entry checks must use production origin, which the room service accepts.

Auto Driver.glb is a separate seated astronaut character, not a replacement vehicle; not part of this seven-vehicle release. Older Cybercab versions and rejected reconstruction candidates are not published as extra vehicles.
