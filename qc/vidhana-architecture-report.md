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

The official 70 ft depth may include intermediate landings; uniform treads are provisional. Southern ground/cellar level is unresolved, so the 3.048 m north/south height difference is recorded but not fabricated into terrain. Existing seven dome footprints, column centers and canopy XY are preserved. Dome profile, capital mouldings, top stairs and canopy thickness remain simplified estimates. A restrained recessed foyer backing now closes the green void: mapped canopy rear alignment, estimated 25.3438 m stone wall span, 5.2 m entry width, 6.8 m entry height and 0.35 m recess. CPU rays through center and side strike dark entry and stone respectively. The exact door layout, carved decoration and balustrades remain unmodelled. No sculptures, emblems, lions or monuments were invented.

## Verification

`node qc/vidhana-architecture-test.mjs` passes actual vertex measurements: 12 complete 12.192 m columns, unchanged mapped centers, 45 horizontal tread levels, 62.179199 m measured width, 21.336002 m measured depth, central drum 19.354799 to 34.137600 m, central dome 34.137600 to 45.720001 m. Source data remains unchanged; all geometry and normals finite.

Six material draws remain six. Vidhana triangles rise from 53,032 to 64,276, +11,244 (+21.20%), principally the more detailed twelve column profiles. No textures added. No runtime frame-time claim: candidate has not been integrated or benchmarked. Before/after frontage and aerial screenshots use matching cameras in `qc/vidhana-architecture-review.html` and are produced by `qc/vidhana-architecture-capture.cjs`.

Acceptance remains review-stage architectural proportion improvement, not a photogrammetric or finished high-fidelity reconstruction. Runtime placement against roads, stairs/terrain contact and performance require separate integration review.

## Full-scene placement and foyer follow-up

`qc/vidhana-architecture-scene.cjs` loads the complete app twice and intercepts only the landmark module. An adapter retains every other original landmark. Matching frontage, road-level and aerial captures are `qc/vidhana-architecture-scene-{before,after}-{front,road,aerial}.png`. Six captures completed with no browser errors. The road camera's actual pitch was 87.517 degrees. This is visual testing, not a performance measurement; the wrapper does not attempt to merge candidate material groups into other landmarks.

The foyer backing removes the green void behind the columns. Stair foot meets the flat forecourt and the stairs remain inside the frontage grounds, away from Dr Ambedkar Veedhi's main carriageway. Flared sides cover portions of existing decorative/service-looking ground surfaces. Their survey accuracy is not established. Courtyards and all other landmark footprints remain present.

Stair tread/riser bands remain strongly visible in the full scene. A separate road-view request interception disabled candidate shadow reception, and the bands persisted (`qc/vidhana-architecture-shadow-diagnostic-after-road.png`). Consequently, attributing these bands to shadow bias would be incorrect. The follow-up below distinguishes expected upper-step visibility and lighting from remaining subpixel line artifacts. Those remaining artifacts prevent claiming a completely polished stair appearance.

### Stair banding diagnosis, follow-up

Actual geometry audit in `qc/vidhana-architecture-step-geometry.json` confirms 90 tread triangles at 45 heights, 90 riser triangles on 45 separate outward-facing planes, +Z tread normals, horizontal outward riser normals, and no overlapping tread interiors. There are no stacked overlapping stair boxes. A flat-material diagnostic shows uninterrupted mesh coverage (`qc/vidhana-architecture-stair-flat-after-road.png`). Doubling pixel density retains the tread/riser contrast (`qc/vidhana-architecture-stair-dpr2-after-road.png`).

The apparent dark upper ramp has a concrete explanation: the road camera is 3.5 m high, below 22 of the 45 treads. Their upward faces are hidden by their front risers. These adjacent coplanar-looking dark risers receive little direct light, while exposed horizontal treads receive much more. Raising the actual camera to 8 m above ground makes the upper tread lines appear across the entire run (`qc/vidhana-architecture-stair-raised-after-road.png`). This supports a visibility/lighting explanation for the upper solid appearance, not missing upper stairs. The remaining short discontinuities on very thin tread lines are consistent with subpixel sampling; no geometric overlap was found. A depth contribution has not been conclusively excluded, so do not call every discontinuity fixed.

No geometry hack, removed steps, shadow disable, or doubled runtime resolution was shipped. Matching the diffuse photographic light and providing an appropriate anti-aliasing strategy would improve this high-contrast appearance; the diagnostic flat material is not a proposed finished material. The reference does not support inventing painted white step stripes.

### Driving and collision implications

`qc/vidhana-architecture-collision.mjs` checks a 21 by 21 grid against current driving data: **0/441** samples lie on a mapped driveable centerline-width corridor, so current NPC/auto-roam routes do not enter these stairs. **407/441** samples have no existing building collision, so a manually driven vehicle can reach most of the stair footprint.

The existing ground-height index returns 0, null, or 0.01596 m at fifteen stair probes, while intended stair surface rises to 6.75 m. The scene geometry alone therefore does not provide correct wheel contact. `auto-mode.js:32` queries `vidhanaStreetPatch.heightAt` then street-detail surfaces; neither contains the candidate stairs. `auto-world.js` indexes existing district building rings, not new landmark geometry. Helicopter flight also does not have obstacle collisions.

Before integration, either register stairs as a non-driveable static obstacle, or add explicit stepped height and slope/traction policy to the shared driving world. A new visual mesh by itself would allow cars/cycles to pass through the steps at ground level. Do not silently add stair surfaces to NPC paths or infer that a general car should climb them. Existing building collision footprints and target-inspector height metadata also need review because they still use original source values.

### Candidate collision helper

`qc/vidhana-architecture-stair-collision.js` exports `createStairCollision(architecture, options)`. It accepts candidate metadata in the driving world's metre coordinate system and returns `collide(x, y, headingDegrees)` with the existing API's outward `{x,y}` contact normal or `null`. The default four-vertex flared stair footprint is used instead of a bounding rectangle, keeping side paths clear. Vehicle probe defaults match current auto-world dimensions; callers can supply radius and half-length.

Suggested composition after separate runtime review: `stairs.collide(x,y,heading) || existingCollision(x,y,heading)`. It intentionally does not change height queries or route data. Tests cover contact direction, unit normals, exact boundaries, both adjacent paths, invalid input and **286 nearby mapped road samples with zero blocked**.

The optional `includeLanding:true` expands to six vertices but currently blocks 14 mapped service-route samples; it must not be enabled without route/entrance review. Default stair blocking prevents ordinary manual entry from ground while preserving that existing corridor. It does not resolve vehicles independently spawned onto the elevated landing. Helper remains review-only and is not imported by runtime.
