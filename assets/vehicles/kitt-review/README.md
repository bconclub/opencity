# KITT workshop candidate

Original, reference-led Blender reconstruction. Not manufacturer CAD, a scan,
or a downloaded licensed replica. This candidate is now copied into the local
game's `assets/vehicles/kitt.glb` after full-app and two-client visual review.
It is an improvement, not a photorealism claim. Custom nose and body contours
remain estimates. Public deployment is a separate release action.

- Builder: `assets-source/vehicles/build-kitt-reference.py`.
- Editable source: `D:/CodexTools/Blender/projects/kitt-reference/kitt-reference.blend`.
- Browser comparison: `/kitt-workshop.html`.
- Platform wheelbase: 101 inches, 2.5654 metres.
- 24,512 source triangles, four materials, one tiny embedded lamp palette.
- Separate `Steer_FL/FR/RL/RR` and `Wheel_FL/FR/RL/RR` nodes.
- Source axes Z-up / +Y forward; exported GLB Y-up / -Z forward.
- Paint, glass, trim and lamps remain separate. Scanner segments animate independently.

References:

- [1982 Pontiac Firebird brochure](https://www.auto-brochures.com/makes/Pontiac/Firebird/Pontiac_US%20Firebird_1982.pdf), platform dimensions.
- [Top Gear museum KITT photographs](https://www.topgear.com/car-news/movies/knight-riders-kitt-has-be-best-car-world), custom body appearance.

`validation.json` distinguishes verified wheelbase from estimated measurements.
Studio PNGs show the geometry in Blender. The browser workshop is the authority
for the latest glTF material appearance. Emissive vertex colours do not survive
as coloured emission in standard glTF, so the export uses explicit palette UVs.

QA: `qc/verify-kitt-rig.cjs` checks actual GLBs for four independent wheels,
stationary pivot centres during spin/steer, Ackermann steering and neutral reset.
It does not certify shape fidelity.

The second framing pass replaces round roof/A-pillar tubes with thin sheet
sections and flat roof headers. Body contours still require refinement. This
change is included in the locally promoted vehicle.

The shape-correction pass adds a wrapped rear hatch with contoured sail panels,
a lower swept spoiler, and a smaller visible turbocast rim radius (.200m versus
.219m) while keeping tyre size and all wheel pivots fixed. These contour/rim
targets are photo-led estimates, not certified KITT dimensions. The source
brochure dimensions describe the base Firebird and exclude optional equipment.

Before-pass GLB, source and matched camera renders are preserved in
`before-corrections/`. Current front, side and rear-three-quarter PNGs use the
same cameras and lighting. Proposed changes and evidence limits are in
`qc/kitt-shape-correction-plan.md`. Editable before/after Blender files remain
on D in `projects/kitt-reference/`.

The former runtime GLB is preserved as `runtime-before-promotion.glb`
(SHA256 `498f019da73b071b7cacf54f06daa5a5ad0536a14bd27739a3df97f368ecd339`).
Promoted bytes exactly match `kitt-reference.glb`
(SHA256 `b4247a09d36ec41fa1a550374d50e11d7006a124cafc03cc8decc4a83cc4393d`).
Runtime wheelbase is 2.5654 m and effective wheel radius is 0.324 m, including
3 mm tread beyond the source tyre radius. Other handling remains unchanged.
The picker preview was regenerated from the promoted runtime path and visually
reviewed. No public deployment is claimed by this local promotion.
