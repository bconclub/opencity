# Cybertruck candidate visual review

Review date: 2026-09-11. Runtime factory `createBlenderVehicle` and actual
`installVehicleEnvironment` loaded without edits. Fresh browser contexts
intercepted only Cybertruck GLB responses. Matching front, side and rear-three-
quarter cameras, fixed orthographic scale, lighting and neutral source paint.
No runtime assets were changed. Browser closed after both render passes.

## First candidate: rejected

`fde533618ee28e2a86ec4fb4c9c2d588ff8d6a507aef4afc7682819c11fdad15`
passed numerical bounds and pivot checks, but images showed three regressions:

- Covers/hubs sat behind the opaque tire sidewalls, producing plain black disks.
- Arch-blending deformation pulled the lower sill into a deep angular zigzag.
- Rear tires visibly protruded through the distorted bed floor.

Red tail emission was correctly restored. Narrower/lower overall proportions
were measurable, but did not justify acceptance. First candidate GLB, Blender
file, CPU report and `qc/cybertruck-candidate-candidate-{front,side,rear3}.png`
remain preserved. Its earlier CPU-only status is not visual acceptance.

## Revision 2: targeted regressions resolved

`e6ad2ff4ffc3b4ee4de73600f28eb264e2fc3b3fac65f31ebb0d4f50cda4fc05`
is in `assets/vehicles/cybertruck-review/revision2/cybertruck-reference.glb`.
Matched images `qc/cybertruck-candidate-candidate-revision2-{front,side,rear3}.png`
were inspected. Wheel faces are visible; side sill is continuous; bed floor
has no visible wheel protrusion. Rear bar is red and front bar remains white.
Body paint, opaque glass and tires remain visually distinct. No new detached
panels were observed in these three static views.

Revision 2 moves cover faces 6.5 mm outside tire sidewalls, restores original
non-arch lower-panel profile with narrowed dimensions, restricts arc deformation
to actual original arch-boundary vertices, and sets a flat bed floor above tire
tops. Original and failed-candidate Blender sources are hash-checked unchanged.
CPU tests additionally check visible cover-sidewall clearance and bed clearance.

This passes the bounded static regression review, not full vehicle acceptance.
The source remains conspicuously simplified: round five-spoke wheel decoration,
oversimplified door/glass divisions, tubular roof rails, sparse bumper/bed detail
and schematic stainless surfaces. Exact custom panel contours are not verified
against CAD. Raising the bed floor reduces represented bed depth. Tire envelopes
extend beyond the narrowed shell; overall mirrors are measured separately.
Dynamic steering clearance, paint changes, full-app local/remote driving,
collision-envelope alignment and performance still need integration review.
No promotion is recommended solely from these renders or dimensions.

Harness: `qc/cybertruck-candidate-render.cjs`. Revision 2 uses
`CYBERTRUCK_CANDIDATE=assets/vehicles/cybertruck-review/revision2/cybertruck-reference.glb`
and `CYBERTRUCK_REVIEW_SUFFIX=-revision2`; default invocation reproduces the
first candidate comparison. Runtime remains the original vehicle.
