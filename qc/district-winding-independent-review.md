# Independent district winding review

Reviewed candidate SHA256 `e96864f35666e75bb20d011db0f4ef61e587d45dbc57e506e93c93cb3d3dc276` against `qc/district-winding-baseline.js`. Read-only source review and a small scalar UV assertion; no browser, renderer, Blender or runtime edits.

## Actionable finding

**P3: Calculate signed area once per ring, outside the edge loop.** Candidate lines110-111 recompute the complete ring reduction for every edge, turning this added initialization work from O(n) into O(n²) per ring. Raw building data contains13,660 vertices across2,557 rings: repeated reductions would visit114,948 terms before candidate's runtime filtering, versus13,660 when calculated once. Actual accepted-building work is lower; no frame-time or measured startup regression claimed. Move signedArea and flip into an outer ring block, then retain the existing edge loop and unchanged wall calls. This is straightforward low-risk cleanup before integration.

No blocking correctness issue identified in the requested scope. Outer clockwise and hole counterclockwise cases correctly flip to exterior-facing and courtyard-facing normals. Vertex-associated UV values remain identical after triangle reordering, confirmed with an extracted wall helper assertion. Footprint ordering, facade hash and roof triangulation stay unchanged. Explicit DoubleSide shadow casting preserves prior caster behavior while FrontSide surface rendering/raycasting rejects backfaces; correctly wound exterior and courtyard rays remain front-facing. Raycaster does use these materials, so intentional inability to select walls from inside a solid building is a behavioral consequence, not a discovered exterior regression. Final exterior screenshots and cumulative performance gate remain owned by city agent.
