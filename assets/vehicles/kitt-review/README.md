# KITT workshop candidate

Original, reference-led Blender reconstruction. Not manufacturer CAD, a scan,
or a downloaded licensed replica. It is **not the vehicle currently used by the
game**. The custom nose and body contours remain estimates and need visual
refinement before replacing the live model.

- Builder: `assets-source/vehicles/build-kitt-reference.py`.
- Editable source: `D:/CodexTools/Blender/projects/kitt-reference/kitt-reference.blend`.
- Browser comparison: `/kitt-workshop.html`.
- Platform wheelbase: 101 inches, 2.5654 metres.
- 24,212 source triangles, four materials, one tiny embedded lamp palette.
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
change is confined to the workshop candidate; the live vehicle is unchanged.
