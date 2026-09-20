# Accepted-patch surface coverage prototype

The review prototype passed visual and relative frame-time checks. The parent approved production integration for the existing accepted patch only. Integration is now implemented and tested locally, not independently committed or deployed by this agent. Accepted GLB geometry remains unchanged.

## Source and ownership

`street-coverage-build.py` reads original `experiments/osm2world/sample-meshes.json`, unions coplanar polygons by original material, and applies the accepted export's highest-colour material ownership order. It integrates exact polygon area over every intersecting atlas texel. It does not antialias individual triangle boundaries, so internal triangulation edges do not enter the texture.

Source overlap proves all 108.0293 m² of accepted paint is above source concrete, rather than asphalt. A 0.0000011 m² unsupported remainder is floating-point boundary noise; the generator rejects unsupported area above 0.00001 m². Concrete, paving and asphalt retain their separate source regions. No inferred road material is applied to an unknown region.

Four integrated material areas match original clean polygon ownership to less than 0.000000001 m² before byte quantization. Exact numbers and source hash are in `street-coverage-atlas.json`.

## Representation

- One 1024 × 1024 RGBA8 linear atlas covers the accepted patch, approximately 0.430 m per texel.
- RGB holds area-premultiplied **linear diffuse colour**. A holds geometric area coverage. Shader divides filtered RGB by filtered coverage; it never sets output opacity from that alpha.
- Both paint and surrounding pavement sample the same atlas. This gives coverage outside the paint's current rasterized triangles while preserving opaque pavement in the existing paint cutouts.
- Current exact geometry and current four material batches remain unchanged. Raised kerb faces are excluded from atlas blending.
- Below 0.18 m per screen pixel the original material, grain and marking width remain unchanged. Above 0.65 m per pixel the atlas replaces diffuse colour. Between those thresholds it blends. These thresholds passed the bounded static visual review; moving-camera temporal stability remains unverified.
- Base colours match current street materials. Grain contribution uses the exact mean of existing seeded texture bytes in linear colour. The atlas is not a photographed road texture.

## Budget and tradeoffs

Atlas mipchain: 5,592,404 bytes. Existing two 256² grain mipchains: 699,048 bytes. Combined surface texture allocation: **6,291,452 bytes, just under 6 MiB**, below the 8 MiB target. PNG download: 213,359 bytes. Existing vertex/index buffers are reused. Four material batches remain four; shader adds one texture sample and derivatives per street fragment.

Far paint intentionally contributes partial pixel brightness rather than unreliable full-white fragments. Surface colour boundaries also soften at distance. Fine near lines remain exact only where the derivative threshold is below 0.18 m/pixel; an oblique road view can cross that threshold sooner along its depth axis. RGBA8 premultiplied quantization has at most 0.5/255 per-channel error before division by coverage, with larger relative errors near nearly empty outer-edge texels. No claim is made that this restores full pixel coverage outside the outer road mesh boundary; it addresses paint boundaries inside contiguous street geometry.

Six full-app comparison screenshots show distant speckles replaced by continuous faint lane lines, with no observed near-view line/kerb change or pavement cutout holes. This is a static comparison, not a completed moving-camera temporal stability study. Shader compilation produced zero errors. No MSAA, global transparency, polygon offset, triangle-edge fade or extra geometry was introduced.

## Performance gate

`street-coverage-performance.json`: one exclusive Edge SwiftShader browser, 1100 × 760, 60 forced-repaint frames per view, ABBA ordering. Each run included aerial and close-road views. Aerial baseline mean 204.1675 ms, candidate 193.3325 ms, -5.31%. Close-road baseline 154.1667 ms, candidate 161.2517 ms, +4.60%. Both pass the 10% regression threshold. All samples retained 45 custom scene draw calls and 419,822 triangles. This software-renderer relative check is not a native mobile FPS measurement or a claim of improved GPU throughput.

## Production integration

`street-surface-coverage.js` validates optional versioned metadata, exact geometry SHA-256, exact atlas SHA-256 and encoded byte count, PNG dimensions before decode, local bounds/origin, same-origin URL, supported untransformed material batches, and the texture budget. The patch fetches the GLB once and uses those same bytes for parsing and integrity checking. No atlas is enabled for a classified/source-material asset or a mismatched GLB.

The shader maths matches the visually accepted prototype. Atlas allocation belongs to each install. Disposal restores original material hooks and disposes that instance's texture once. Missing, corrupt or unsupported coverage returns the original street materials with an explicit fallback state; a later install can retry normally. The original `street-surface-materials.js` remains unchanged. `sw.js` includes the new module and atlas. The release staging tool now honors static `files.push` entries; the staged module and atlas hashes match their runtime sources.

`street-coverage-tests.json`: 10 invalid metadata cases, missing/corrupt atlas, wrong geometry, classified and unknown material cases, per-load texture isolation, repeated disposal and recovery pass. Existing `street-500-material-tests.cjs` and `street-500-runtime-tests.cjs` pass unchanged, including 9 legacy/classified material cases and 16 invalid ground-data cases.

`street-coverage-integration.json`: actual browser initial load ready, atlas 404 fallback still ready, subsequent reinstall ready. Three installs produce exactly three GLB requests. Two created atlas textures each dispose once. The street layer retains four draws and 2,130 triangles. Zero page errors. Integrated near/aerial screenshots match the approved visual treatment; the fallback screenshot restores the original speckling, confirming the fallback really uses base shading.

## Reproduction

Run the bundled Python runtime on `qc/street-coverage-build.py`. `node qc/street-coverage-stage.cjs` stages only the exact reviewed source/GLB combination and rejects an unreviewed geometry hash. After GPU coordination, run `node qc/street-coverage-review.cjs` for the historical prototype comparison or `node qc/street-coverage-integration.cjs` for production behavior. Prototype visual/performance harnesses strip production coverage metadata in both modes, assert that production coverage is disabled, assert distinct before/after prototype activation, and reject a stale base-material snapshot. This prevents a later rerun from accidentally comparing two enabled shaders. Geometry remains unchanged in all modes.
