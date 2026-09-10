# Review-only fidelity follow-up

These changes do not replace runtime vehicles or mapped street furniture.

## KITT

The Blender candidate uses thin sheet sections for the roof/A-pillars and flat
roof headers instead of tubular bars. It contains 24,212 source triangles and
four materials. The complete four-view Blender render finished successfully.
The exact source remains on D: as documented in the model README.

`node qc/verify-kitt-rig.cjs` passed against the exported GLB: four wheels,
stationary pivot centres, steering, neutral reset, and an animated eight-segment
scanner. The animation assertion waits for a state change rather than assuming
that a frame arrives within 180 ms while Blender is rendering. No page errors.

The silhouette and surface profiles remain estimated. These tests establish
rig behavior, not high-fidelity accuracy. Actual game KITT is unchanged.

## Pedestrian lamp

`assets-source/fixtures/frontage-pedestrian-lamp.js` reproduces the broad
inverted-cone head, pale fluted shaft and stepped base in the attributed 2019
Ambedkar Veedhi photograph. Geometry and browser visual checks passed:
1,740 triangles, one material, zero textures and one instanced draw call.

The review page displays the photograph beside the model. Dimensions remain
estimates. Mapped `straight_mast` tags alone do not establish which physical
fixtures use this design; no runtime substitution or placement change was made.

## Release state

Version 0.0.31 remains on the review branch/PR. This follow-up does not change
the runtime version or claim a production deployment. The saved Vercel token
was invalid and the interactive device-login wait expired without completion.
The previously blocked main-branch push has not been retried.
