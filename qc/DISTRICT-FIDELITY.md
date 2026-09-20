# District material and camera audit

Scope: district.js and shared map-scene-camera.js. This is a procedural visual upgrade of existing mapped footprints, not a photogrammetric city reconstruction.

## Final changes

- Four facade families now use 512 px, 4 x 4 atlases. Sixteen glazing/blind variations break the identical-window pattern.
- Roughness is packed into diffuse alpha and reused from the same shader sample. Glass and masonry have different surface responses without extra roughness texture fetches. Recesses and sill shadows are baked into colour; there is no runtime bump/displacement mapping in the final candidate.
- Window rows and bays fit whole counts. Mapped building colours colour masonry, not the glass pixels.
- A small generated daylight reflection field affects curtain walls only, aligned to the scene's Z-up coordinates. Roofs use finer concrete texture. No added image downloads or per-frame procedural generation.
- Reduced flat ambient illumination, neutral daylight and ACES tone mapping.
- Existing footprint count, tree instance count and batched draw calls retained.

## PBR camera correction

The previous custom Three camera stayed at the district origin while MapLibre's combined projection moved the view. map-scene-camera.js factors the true perspective eye into the Three camera while preserving the exact world-to-clip transform. Specular calculations now use the actual eye position. District raycasts retain the original combined view-projection matrix.

qc/test-map-scene-camera.mjs verified six oblique/off-centre poses, 24 clip points, maximum clip-coordinate error zero, eye error below 0.000001 m, and an orthographic fallback. Visual comparison confirms unchanged geometric projection and sky-lit curtain walls instead of fixed-origin black reflections.

## Contradictory source heights

Four input features report render_min_height >= render_height. Two are inside the rendered district. One at [77.59673595428467, 12.972954305849427] reports a 120 m base and a 5 m top, creating an inverted 115 m solid. Display now retains the stated top and uses ground as the base where tags contradict. Picking uses the same rule. This conservative display fallback is not a surveyed building height; reference modelling remains necessary. districtState().invalidElevatedBases reports 2.

## Visual evidence

Final matched comparison:
- qc/district-benchmark-before.png
- qc/district-benchmark-after.png

Earlier overview captures are retained as iteration evidence, not the final optimized material candidate:
- qc/district-before-street.png and qc/district-after-street.png
- qc/district-before-aerial.png and qc/district-after-aerial.png

Final screenshot inspection: facade textures render, mapped colours remain varied, geometry is not displaced, and the spurious inverted tower is gone. Syntax and diff checks pass.

## Measured performance

Same Windows host, Edge headless SwiftShader, 1100 x 760, identical fixed city camera, A/B/B/A of 60 frames each. This is a software-renderer comparison, not a claim about phone/GPU frame rate.

The first unoptimized implementation used independent bump and roughness maps and regressed approximately 18%. It was rejected. Evidence: qc/district-fidelity-unoptimized-performance.json.

Final optimized evidence: qc/district-fidelity-performance.json.
- Pooled mean: 208.842 ms before, 212.694 ms after, +1.845%.
- Decisive uncontended final pair: 211.070 ms before, 215.553 ms after, +2.124%, within the 10% gate.
- District draw calls: 33 before and after.
- District triangles: 309,056 before, 309,032 after.
- District resident textures: 6 before, 18 after. Extra memory buys varied facade atlases and one reflection field; no extra draw groups.
- A short CSS-only QA fixture may have overlapped the first candidate sample. The final candidate/baseline pair had no other browser or Blender workload.

## Remaining fidelity limits

Vidhana Soudha and UB City landmarks remain schematic. Generic facades remain illustrative. Trees retain low-poly instanced geometry. Reference-built landmarks and realistic foliage assets are still needed for a photographic visual target. This pass must not be described as photorealistic or as completing the entire high-fidelity city request.
