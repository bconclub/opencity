# Matched repair views: bounded improvement, broader scene incomplete

Inspected both variants at matched low-road and local aerial cameras. The bounded
repair visibly replaces the broad lighter flat-road wedge with textured asphalt
continuous with the neighboring O2W surface. The repaired probe now has ground
height0; baseline returned null. This supports the local repair as a visual
improvement, not acceptance of the entire500m street scene.

Final captures:

- `qc/street-500-gap-scene-baseline-road.png`
- `qc/street-500-gap-scene-candidate-road.png`
- `qc/street-500-gap-scene-baseline-aerial.png`
- `qc/street-500-gap-scene-candidate-aerial.png`

The first attempt used the app's zoom20 limit, moving the intended road camera
back into trees. It is invalid for low-road acceptance and remains preserved as
`*-attempt1.png` with `attempt1-results.json`. The corrected harness sets review
maxZoom24 before computing the same eye/target poses. It changes no frozen scene
asset. Final road view clearly exposes the repair at requested2.3m eye height.

## Observed limits

An adjacent lighter grey surface remnant remains to the right of the repaired
ribbon. It is outside this bounded additive repair; filling every visual wedge
would require new source ownership and obstacle review. The low-road view also
shows thin tapered kerb/marking fragments and tiny dark triangles at the circular
road edge. These are present in both variants and were not fixed by this task.
The surrounding circular-road mesh has visibly angular/tapered junction geometry.
No claim of complete kerb correctness, absent overlap artifacts across500m, or
photographic road fidelity is supported.

The baseline's apparent flat ground at the probe came from estimated source-road
polygons52057928 and1091198031, not O2W ground. The candidate's matching local
subtraction removes those layers under its repaired triangle. This distinction
explains why baseline looked paved while its ground index returned null.
Base-map lines and shared district shadow plane still remain and are recorded
in telemetry; this comparison does not establish their full ownership cleanup.

## Verification and scope

Four final captures completed with exact matched cameras, no page/shader errors
and no missing frozen first-party resources. Both render and ground use origin
`[77.59136000000001,12.97984615]`. Ground source is sidecar in both. Baseline has
11629 render/9280 ground triangles; candidate11634/9285. Both use7 draw calls and
2 surface textures, with atlas coverage disabled consistently. Final response
hashes are recorded per viewport in `results.json` under the same immutable
manifest SHA256 `b2fc22b888b792535e671f6a731acef3b3ef6a308e326e4e82f72405e41b2794`.

Browser closed after final capture; GPU released. No performance measurement,
runtime promotion, driving test, boundary connection or turn qualification was
performed. Conditional circular-road routing remains closed. Confidence high
for the bounded visual improvement and remaining visible artifacts; real surveyed
kerb layout remains unknown.
