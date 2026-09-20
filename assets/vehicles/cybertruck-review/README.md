# Cybertruck dimension and lamp candidate

First candidate below was rejected in subsequent matched browser review: buried
wheel faces, zigzag sill and bed-wheel protrusions. It is preserved as failed
evidence. `revision2/cybertruck-reference.glb` fixes those three regressions and
passes bounded matched static review; it remains unpromoted. See
`qc/cybertruck-candidate-visual-review.md` and revision 2 CPU/repair reports.

Review only. Runtime `assets/vehicles/cybertruck.glb` remains unchanged.
Original authored source was copied and edited in background Blender 4.5.9,
with no renders. This improves measured proportions; it is not a CAD or
photorealism claim. Existing approximate body contours remain.

- Editable candidate: `D:/CodexTools/Blender/projects/cybertruck-reference/cybertruck-reference.blend`.
- Untouched copied source: same directory, `original-source.blend`.
- Repair script: `assets-source/vehicles/repair-cybertruck-reference.py`.
- Candidate: `cybertruck-reference.glb`, 623,020 bytes, 9,072 triangles, four materials.
- SHA256: `fde533618ee28e2a86ec4fb4c9c2d588ff8d6a507aef4afc7682819c11fdad15`.
- Overall dimensions: width including mirrors 2.4133 m, length 5.6829 m, height 1.7938 m (selected Medium air stance).
- Longitudinal wheelbase 3.635 m, front track 1.777 m, rear track 1.772 m.
- Tire radius .43925 m derives from nominal 285/65R20. It is not a loaded rolling-radius claim.

The existing shell/roof vertices were reprofiled, mirrors placed independently,
and arch neighborhoods reshaped around corrected wheel centers. Circular tires
and existing wheel-parent relationships remain; dimension changes are baked into
vertices, avoiding scales above spinning wheel pivots. BodyPaint, Glass and
RubberTrim assignments remain separate. A two-pixel lamp palette preserves red
rear and white front emission through glTF export. No other vehicle was rebuilt.

`repair-report.json` records source hashes and Blender bounds.
`cpu-validation.json` records actual exported GLB dimensions, current runtime rig
results, zero pivot drift/reset error, 144 tire-envelope shell-ray checks with
zero intersections, and lamp bindings. Embedded palette pixel/UV decoding also
confirms red tail and white front entries. These checks do not replace future
matched side/front/rear visual review, material review, steering clearance or
full-app local/remote driving. No runtime promotion or preview refresh occurred.

Sources and mirror/suspension distinctions: `qc/cybertruck-next-audit.md`.
Re-running the repair script refuses to overwrite an existing candidate Blender
file. Validation can be rerun with `node assets/vehicles/cybertruck-review/validate-cpu.mjs`.
