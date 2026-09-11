# Runtime Vidhana Soudha refinement

11 September 2026. Changed `landmarks.js`, the module already used by `district.js`. No landmark data, coordinates, base heights, roof profiles or building-part arrangement changed.

## Changes

- Preserved primitive normals through `append()` after the nonuniform transform. Final batched `computeVertexNormals()` still supplies flat face normals for walls and slabs, then only the recorded primitive ranges receive their original curved normals. This removes triangular/striped dome shading without smoothing flat masonry.
- Replaced four identical tall semicircular window rows with a smaller low arched row, tall rectangular row, shouldered arcade row, and shorter rectangular upper gallery. Added restrained sills, rectangular-row divisions, upper-gallery parapet bars and thin storey courses.
- Preserved existing portico exclusion and compatible material batching. Added no textures or materials. No sculpture, emblem, monument or carved ornament invented.

Reference: [Moheen Reeyad's frontage photograph, 22 June 2019](https://commons.wikimedia.org/wiki/File:Vidhana_Soudha,_front_(01).jpg), and the user's supplied frontal/aerial images. The reference supports different storey treatments, rectangular openings, shouldered upper arcade shapes and pale horizontal courses. Dimensions, exact bay spacing and simplified shoulder profiles remain estimates. Applying this hierarchy to the existing repetitive facade system does not establish surveyed rear/courtyard details.

## Verification

- `node qc/vidhana-landmark-test.mjs`: passed, finite positions/normals; same source part/dome counts. On an isolated nonuniformly scaled dome, 1,728 triangles now have curved vertex normals distinct from their flat triangle plane normal, and all 1,792 tested first-vertex normals are unit length.
- Whole landmark dataset: **74,893 -> 53,793 triangles** (21,100 fewer), **12 -> 12 material draws**, 74 parts and seven domes unchanged.
- Vidhana Soudha alone: **74,132 -> 53,032 triangles**, **six -> six material draws**, 47 parts and seven domes unchanged.
- Matched same-camera front/aerial screenshots captured in `qc/vidhana-landmark-before-front.png`, `qc/vidhana-landmark-after-front.png`, `qc/vidhana-landmark-before-aerial.png`, `qc/vidhana-landmark-after-aerial.png`. Browser reported zero page errors and closed after capture.
- Initial review-only near plane of 0.1 m produced decal-depth striping at a viewing distance around 200 m in both versions. The final comparison uses a 2 m near plane for both versions. No runtime polygon-offset workaround was added.
- Separate full-scene ABBA timing assigned to the release QA agent after source freeze. No performance claim inferred from triangle reduction alone.

## Remaining fidelity limits

Existing OSM roof-height conflicts remain. Domes still use simplified profiles and lack carved moldings, railings and finials. Corner towers, central portico, stairs and parapets remain schematic. This improves the running landmark's shading and facade hierarchy; it is not a photorealistic reconstruction.

Review page: `/qc/vidhana-landmark-review.html`. Baseline module saved as `qc/vidhana-landmark-before.js`. No commit or deployment performed by this subtask.
