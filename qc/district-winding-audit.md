# Generic district winding audit

**Conclusion: changing existing facade materials from DoubleSide to FrontSide would hide exterior walls. It is not a safe isolated material optimization.** Confidence high for source geometry; no GPU speedup was measured or claimed.

CPU-only audit of `district.js` SHA-256 `79d575ea972bf4441bff0ee564dcab7e66195189691fdd910c77180a9300f5a0`, with actual district/landmark data and Three r169. Runtime was untouched. Reproduction: `node qc/district-winding-audit.mjs`. Per-building rings and all checks are in the matching JSON.

## Geometry facts

The audit reproduces existing CBD intersection, area, deduplication and landmark-replacement filtering. Of 1,395 CBD building features, 34 are smaller than 5 square metres and 40 are replaced by landmarks. There are 1,321 generic rendered buildings, no duplicates and two corrected invalid elevated bases.

| Generic geometry | Count | Winding/normal result |
|---|---:|---|
| Outer footprint rings | 1,321 | All clockwise in local east/north XY |
| Courtyard hole rings | 27 | All counterclockwise |
| Main facade triangles | 15,214 | All inward-facing; no degenerate triangles |
| Single-plane parapet-strip triangles | 14,988 | All inward-facing |
| Roof triangles | 5,019 | All upward-facing; none downward or degenerate |

These are 35,221 generic facade, parapet and roof triangles. Counts exclude separately generated utility boxes, landmark architecture and vegetation. The wall builder's `(a,base),(b,base),(b,top)` order yields horizontal normal `(dy,-dx)`, hence requires CCW outer rings and CW holes for outward faces. Existing nonindexed `computeVertexNormals()` preserves each triangle's direction; it does not repair winding.

Main facades and roofs currently use DoubleSide, including mapped-colour facade materials. Parapets instead share material bucket 5 with utility boxes, already using default FrontSide. Parapets are zero-thickness strips, not closed solids: any blanket exterior-only change would require separate treatment.

## Custom-camera handedness

MapLibre's Mercator camera sequence includes a Y reflection; district's local-to-Mercator matrix supplies another. Their composite before perspective preserves orientation. The camera helper only factors translation out of the same combined clip matrix. Thus the district's negative scale cannot be considered alone when selecting FrontSide versus BackSide. This follows the pinned [MapLibre 5.6.1 Mercator transform source](https://raw.githubusercontent.com/maplibre/maplibre-gl-js/v5.6.1/src/geo/projection/mercator_transform.ts).

The CPU test reproduces that operation order at 16 pitch/bearing combinations. For a known outward-wound cube, signed clip-space triangle area agrees with eye-facing normals after `setMapSceneCamera`. This supports ordinary exterior CCW facing for the current Mercator path. It is a synthetic transform test, not a live WebGL or globe-projection guarantee.

Three r169 determines flipped face state from object `matrixWorld`, not an arbitrary reflection embedded in camera projection. Local district meshes have ordinary positive object transforms. Merely choosing BackSide to compensate for the apparent Mercator scale would therefore be wrong for the upward roofs and properly wound generated boxes.

## Risks and smallest future diagnostic

1. Test **roof material only** first through review interception. Roof normals already point up. Preserve existing shadow behavior explicitly during diagnosis: Three's normal shadow-side default changes when DoubleSide becomes FrontSide. Keep `shadowSide=DoubleSide` initially and compare the same stored shadow volume. No triangle count or draw-call reduction should be claimed; any benefit would come from culling/shader work.
2. Facades need corrected winding before FrontSide. Preserve each vertex's UV by swapping full position/UV vertex tuples within each emitted triangle. Reversing ring traversal and regenerating the current wall UVs would reverse horizontal texture direction, violating the no-UV-change condition. Correct face normals could also change normal-biased shadow sampling, even with shadowSide held constant, so shadow equality needs inspection rather than assurance.
3. Keep single-plane parapets outside this experiment. They are already inward FrontSide strips; changing their ring order with facade rings would alter which side is visible from roofs. Separating their material or adding thickness is a distinct architectural change.
4. Use one outside facade, one courtyard, road level, aerial roof and below an elevated building as matched views. Verify both face visibility and window orientation, focused sun shadows, and pointer ray hits. FrontSide also changes raycaster acceptance and hides roof undersides when the camera enters an open building; no building-interior geometry currently compensates for that.
5. Only after those visual checks should a same-device ABBA test evaluate cost. The newly passing cumulative release does not require this contingency experiment, so no candidate was implemented and no renderer was launched.

The complete generic building solids are not closed on their underside, and their parapets are single sheets. Exterior-only culling is feasible after narrowly correcting/classifying those surfaces, but preserving all current visual, UV and shadow behavior cannot be promised as a one-line material change.
