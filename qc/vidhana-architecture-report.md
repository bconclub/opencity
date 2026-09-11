# Vidhana Soudha architectural proportion candidate

Review only. The game does not import this module. No runtime or landmark-data edits.

## Evidence and interpretation

[Karnataka Legislative Council architectural account](https://kla.kar.nic.in/council/vds.htm) provides twelve 40 ft columns, 45 steps in a 204 ft wide by 70 ft deep staircase, northern wing height 63 ft 6 in, southern wing 73 ft 6 in, central wing 112 ft and overall height 150 ft. Exact metric conversions used below. These are source dimensions, not measurements from imagery.

[Moheen Reeyad's front photograph, 22 June 2019](https://commons.wikimedia.org/wiki/File:Vidhana_Soudha,_front_(01).jpg), CC BY-SA 4.0, shows moulded columns, a landing above surrounding ground, and outward-flaring stair sides. Local reference: `qc/vidhana-frontage-moheen-2019.jpg`. Eight front column positions and four returns remain the existing mapped twelve positions.

## Vertical anchors

| Component | Existing source range, m | Candidate range, m | Interpretation |
| --- | --- | --- | --- |
| Ordinary main walls | 0 to 30 | 0 to 19.3548 | Published northern roof height applied on one flat review datum |
| Noncentral upper parts | Above 30 | Original Z minus 10.6452 | Preserve their existing heights above lowered wing |
| Central drum, way/363474998 | 30 to 38 | 19.3548 to 34.1376 | Published central-wing height interpreted as dome springline; attribution remains estimated |
| Main dome, way/371511885 | 38 to 46 | 34.1376 to 45.72 | Preserve footprint and profile while reaching published overall summit |
| Central glass core, way/371511883 | 30 to 47 | 19.3548 to 34.1376 | Retain XY, enclose core below dome rather than letting an unsupported broad cylinder protrude |
| Complete column profile | Base 1.9, shaft 2.3 to 27 | 6.75 to 18.942 | Complete height exactly 12.192 m; landing is estimated |
| Portico canopy | 27 to 30 | 18.942 to 20.742 | Original mapped polygon; estimated 1.8 m canopy thickness |

All mappings are piecewise linear and independently applied to each source part. Curved normals receive the inverse vertical-scale correction. Ring orientation follows runtime's outside-CCW, courtyard-CW correction. Seven domes remain. The candidate's actual central summit is 45.720001 m in Float32 geometry.

## Stair and landing estimates

45 uniform rises of 0.15 m produce the estimated 6.75 m landing. Overall footprint spans exactly 62.1792 m at its foot and 21.336 m depth. Photograph-supported flare tapers to the mapped canopy width plus 4 m at the top, an estimated clearance. Landing extends 0.30 m beyond the mapped canopy front and behind mapped columns. Alignment derives from the canopy's longest edge. These new stair XY positions are inferred, not claimed to be surveyed OSM positions.

The official 70 ft depth may include intermediate landings; uniform treads are provisional. Southern ground/cellar level is unresolved, so the 3.048 m north/south height difference is recorded but not fabricated into terrain. Existing seven dome footprints, column centers and canopy XY are preserved. Dome profile, capital mouldings, top stairs and canopy thickness remain simplified estimates. Recessed foyer walls/doors and balustrades are not reconstructed; the portico interior remains incomplete. No sculptures, emblems, lions or monuments were invented.

## Verification

`node qc/vidhana-architecture-test.mjs` passes actual vertex measurements: 12 complete 12.192 m columns, unchanged mapped centers, 45 horizontal tread levels, 62.179199 m measured width, 21.336002 m measured depth, central drum 19.354799 to 34.137600 m, central dome 34.137600 to 45.720001 m. Source data remains unchanged; all geometry and normals finite.

Six material draws remain six. Vidhana triangles rise from 53,032 to 64,260, +11,228 (+21.17%), principally the more detailed twelve column profiles. No textures added. No runtime frame-time claim: candidate has not been integrated or benchmarked. Before/after frontage and aerial screenshots use matching cameras in `qc/vidhana-architecture-review.html` and are produced by `qc/vidhana-architecture-capture.cjs`.

Acceptance remains review-stage architectural proportion improvement, not a photogrammetric or finished high-fidelity reconstruction. Runtime placement against roads, stairs/terrain contact and performance require separate integration review.
