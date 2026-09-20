# Vidhana frontage integration candidate

Review candidate, not runtime promotion. Baseline is immutable repository commit `733fd3337caaf98b334c174e218e00820b447216`, with MapLibre 5.7.2 and antialiasing off. Candidate replaces only `landmarks.js`; all other first-party source/assets are served from the same complete snapshot. Room and local-cache modules are excluded equally. Source hashes and snapshot file inventory are in `vidhana-architecture-integration-manifest.json`.

## Selected geometry

`vidhana-architecture-candidate.js` provides the shorter wings, complete 12 columns, 45 flared stairs, raised landing and recessed foyer. Latest `vidhana-dome-candidate.js` revision 2 replaces the blank main drum, stretched shell and unsupported glass core with the layered drum/gallery and rounded crown. Older attempt-1 dome files are not used.

[Karnataka Legislative Council dimensions](https://kla.kar.nic.in/council/vds.htm) support the 40 ft complete column height (12.192 m), 45 steps, 204 ft stair width (62.1792 m), 70 ft depth (21.336 m), and published 150 ft overall building height (45.72 m). Mapped plan positions stay unchanged. The 6.75 m landing datum, stair flare/top width, foyer opening dimensions, intermediate drum heights and repeated carving counts are reconstruction estimates informed by the supplied frontage photograph, not surveyed dimensions.

Actual candidate summit is **39.799999 m**, not 45.72 m. Missing upper pedestal and lion emblem remain explicit. The crown has not been stretched to imitate the published total. Source OSM properties remain untouched.

## Geometry and focus metadata

CPU tests compare every position and normal against the original selected revision-2 builder, proving measurement instrumentation changes no geometry. Other landmarks' geometry remains exact. Only identical material, attribute and shadow/render-state batches are combined.

| All landmark batches | Baseline | Candidate |
|---|---:|---:|
| Triangles | 53,793 | 69,391 |
| Draw batches | 12 | 11 |
| Domes | 7 | 7 |
| Source parts | 74 | 74 |

The unchanged other-landmark contribution is 761 triangles and 27 source parts. Candidate Vidhana alone has 68,630 triangles in five batches.

Return contract `displayParts` is keyed by OSM ID. `{base,height}` records the measured emitted Float32 vertex minimum/maximum Z; `height` is the absolute model top, not height above base. `null` explicitly suppresses omitted geometry. Central drum is 19.354799 to 28.100000 m, crown 28.100000 to 39.799999 m, and removed `way/371511883` glass core is null. `siteDisplayBounds` reports actual whole Vidhana extents. `extraFocusTargets` adds the four-vertex stair footprint, 0 to 6.75 m, separately from source polygons. It is target metadata, not collision or driving height data. Full values are in `vidhana-architecture-integration-cpu.json`.

## Full-scene visual review

`node qc/vidhana-architecture-integration-scene.cjs` captures six matched views at 1400 by 900, default headless Edge. Actual map context asserted Intel UHD Graphics 630 Direct3D11, zero framebuffer samples and antialias=false. Every view reports loaded map tiles, no page errors and no missing first-party snapshot resources. All browsers close in `finally`. `vidhana-architecture-integration-scenes.json` records actual/requested cameras and all served first-party hashes.

Paired images: `vidhana-architecture-integration-{before,after}-{road,front,aerial}.png`.

Observed improvement: complete columns now stand on the broad stairs; dark recessed entry replaces the see-through entrance; main drum has layered trim, gallery openings and a more rounded crown. Lowered wings and coherent portico proportions improve the frontage silhouette. This remains a schematic reconstruction with estimated detail, not photorealistic or survey-accurate architecture.

Remaining visible limitation: narrow stair treads alias strongly from front/aerial views. At 3.5 m road-eye height, upper treads face away from the camera and the upper run appears mostly dark. Prior stair geometry checks found 45 distinct tread levels without overlapping tread faces; this integration does not introduce antialiasing or fake markings. No frame-cost claim is made from these screenshots.

## Hardware gate

After parent accepted the incremental visual improvement, `vidhana-architecture-integration-performance.cjs` ran ABBA at 1400 by 900 with 120 forced-repaint frame intervals per pose/run on the actual Intel UHD Graphics 630 Direct3D11 context. AA remained off. All 16 samples completed without page errors or missing snapshot files. Ambient traffic remained unfrozen, with exactly 20 visible and zero detailed-near actors throughout both modes. All raw frames, cameras, served hashes, NPC states and renderer metrics are preserved in `vidhana-architecture-integration-performance.json`. Recompute pooled summaries with `vidhana-architecture-integration-summarize.cjs`.

| Pose | Before mean ms | Candidate mean ms | Change |
|---|---:|---:|---:|
| Road | 19.850 | 20.295 | +2.24% |
| Front | 20.470 | 19.670 | -3.91% |
| Aerial | 20.052 | 20.226 | +0.87% |
| Close gallery/crown | 19.878 | 20.573 | +3.49% |

All four mean-frame gates pass the 10% incremental threshold. Total custom calls changed 45 to 44, total custom triangles 419,822 to 435,420. Fulfilled unique first-party response bytes changed 16,916,337 to 16,942,267, adding 25,930 bytes. These are uncompressed source/asset bodies, not total internet transfer measurements.

Pooled candidate p95 is approximately 33.40 ms for every pose. Isolated long intervals remain in the raw data, including a 200.2 ms road interval and 300.3 ms aerial interval. No samples were discarded. This establishes the bounded relative mean-frame gate, not consistently smooth 60 fps, physical mobile performance, or a diagnosis of those stalls. Candidate was not promoted by this agent.

## Collision and integration boundary

Candidate collision remains unchanged in these captures and measurements. The stair footprint needs explicit non-driveable collision; the under-canopy source way is tagged `tunnel=building_passage`, so blocking the entire landing at ground level would incorrectly close a mapped passage. The separate collision audit owns clearance and passage treatment. Do not infer cars can drive up the stairs or onto a 6.75 m landing. Parent's new focus and collision helpers are not part of the measured snapshot and need separate functional integration checks.

Parent accepted the geometry proportions and performance gate, but subsequently flagged the aerial staircase moire as a material visual issue. Promotion remains pending a bounded treatment or explicit final visual decision.

Current CPU-only stair audit (`vidhana-architecture-integration-stair-normals.mjs/json`) confirms 90 upward-facing tread triangles, 90 outward-facing riser triangles and 45 distinct tread levels. Rises are 0.15 m and going is 0.474133 m. The actual sun direction gives a direct diffuse Lambert factor of 0.7682 on treads versus 0.08360 on risers, approximately 9.19 times stronger on horizontal faces. This explains strong lit/unlit stair rhythm even without shadow mapping. Twenty-two treads are above the 3.5 m camera.

Current shadow normalBias 1.2 m equals eight riser heights; 900/2048 light-space coverage is 0.43945 m per texel, close to one tread going. Those scales can affect fine stair shadow fidelity, but the historical controlled shadow-reception-disabled capture retained the contrast. They do not prove shadow bias is the sole or principal cause of current moire. No current renderer treatment is included in the accepted mean-frame measurements. A controlled current shadow-off comparison must precede any further diagnosis or remedy.

Reconstruct snapshot/wrapper: `node qc/vidhana-architecture-integration-prepare.cjs`. CPU check: `node qc/vidhana-architecture-integration-test.mjs`. Snapshot directory is a local test input and should not be duplicated into Git history.
