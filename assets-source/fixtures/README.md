# Vidhana Soudha frontage fixture study

`frontage-pedestrian-lamp.js` is an original procedural reconstruction of the pedestrian lamp visible in Moheen Reeyad's 22 June 2019 photograph, [Dr Ambedkar Veedhi, Bengaluru (01)](https://commons.wikimedia.org/wiki/File:Dr_Ambedkar_Veedhi,_Bengaluru_(01).jpg), CC BY-SA 4.0. The photograph is reference material; no photograph is embedded in the geometry or used as a texture.

The shape reproduces the stepped pale base, tapered white fluted shaft, dark neck, broad six-sided inverted-cone diffuser, dark ribs and shallow cap. Head segmentation and all dimensions are visual estimates, not survey measurements or manufacturer CAD. Nominal height 4.6 m, cap diameter 1.04 m. The historical source does not verify current 2026 fixtures.

## Contract

- Three.js namespace is supplied by the caller. Coordinates use Z-up metres.
- `createFrontageLampGeometry(T)` returns one vertex-colored geometry with part ranges in `userData.parts`.
- `createFrontageLampBatch(T, placements)` returns `{mesh, state, dispose}`. Every placement requires finite Cartesian `x`, `y`, `z`, with optional rotation `heading` in radians.
- Placement values are used exactly, without height offsets or inferred coordinates. No source OSM file is modified or fetched. The calling integration must separately decide which mapped lamp is this pedestrian fixture.
- 1,740 triangles per fixture, 187,920 geometry bytes, one shared Lambert material, no textures, one instanced draw for a nonempty batch. No transparent layers, per-lamp light sources or animated effects.
- `dispose()` releases the instance buffer, geometry and material owned by the batch.

## Separate road lighting

The references show a much taller multi-head road-light mast as well as pedestrian lamps. Its exact head count, mounting layout, height and location cannot be read reliably in the distant photo. It is deliberately not reconstructed or substituted with this model. Existing bent road lamps and signals remain untouched.

## Review

Open `/qc/frontage-fixture-review.html` on the local server. Front, three-quarter and head-detail cameras support silhouette inspection; mouse/touch orbit remains available. Reference photo attribution and estimated dimensions are shown beside the model. Rendering is demand-driven, not an ongoing animation loop.

CPU validation: `node qc/test-frontage-fixture.mjs`. Visual capture: `node qc/capture-frontage-fixture.cjs` after coordinating the browser slot. This is review-only work. No runtime placement replacement or deployment is included.
