# Shared basic arc and road-surface ownership

Review only. Native three-approach junction is unchanged from `street-500-incoming-junction/asset`. Driving graph, automatic routes, room server, and runtime files are unchanged.

The basic road band follows the complete mapped southern arc, source ways **38542917** and **1091198032**, joined at node **428831267**. It connects the two detailed-patch crossings rather than moving a dead-end cap from 500 m to an arbitrary new distance. Centerline maximum radius is about 556.7 m; including the estimated half-width, basic band reaches **560.273 m**. Detailed native street geometry remains clipped at 500 m. The band is **1,497.785 m²**, uses the existing asphalt fill treatment, and has zero overlap with the native footprint or protected garden/island polygons. Width **7.092 m** comes from the adjacent native two-lane estimate, not a surveyed width. Road access remains restricted/conditional for automatic traffic.

The unchanged authoritative driving generator produces 3,803 road polygons. Of these, 3,063 satisfy the existing visible-road filter. Offline subtraction modifies **85** polygons, removing **6,669.99 m² summed overlap** with the detailed patch/basic band. This sum counts any preexisting overlaps between original quads; it is not unique world area. The current generated street-detail set has **3,301 features and zero meaningful overlap**, so its features remain byte-identical. The helper supports clipped polygon holes for future overlap cases but this scene does not exercise that branch.

Only geometry patches are downloaded, **51,961 bytes**, instead of a 2.15 MB duplicate of all generated surfaces. The QC auto module hashes the actual generated road polygons before applying indexed replacements; a changed graph/source causes a clear failure instead of misplaced clipping. Offline patch reconstruction exactly matches the full clipped surface dataset. No node, road edge, one-way rule, route width, vehicle state, or automatic route is edited.

## Verified views

`scene-manifest.json` pins common runtime 733fd33 and both sets of overrides. `results.json` records eight matched native Intel UHD630/Direct3D11 captures: idle road/aerial and actual started-then-paused auto road/aerial, baseline and candidate. Every local response hash is checked before load. No missing local assets or page/shader errors occurred. The auto source hash check passes in browser. GPU/browser closed after capture.

Candidate aerial shows a full basic road band outside the detailed patch instead of the old thin-line termination. Active-auto candidate keeps that same band while the overlapping auto texture is removed. Detailed texture and raised kerbs still end at 500 m; their transition to simpler outer road remains visible. Existing unrelated auto road outside the arc retains its prior texture and visibility.

Images: `../street-500-shared-scene-{baseline,candidate}-{road,aerial,activeRoad,activeAerial}.png`. These poses center on the western restored junction. They do not prove the opposite end join, full southern arc visibility, driving across the boundary, entire frontage, mobile playability, or frame-time acceptance. No timing benchmark ran.

## Reproduction

1. Regenerate missing-approach native input/assets using the incoming-junction README.
2. `node qc/street-500-incoming-dynamic-source.mjs` runs unchanged road/detail generators offline.
3. Bundled Python: `qc/street-500-incoming-ownership.py` creates the basic arc and clips dynamic surface ownership.
4. `node qc/street-500-incoming-owned-runtime.cjs` creates QC modules and compact geometry patches.
5. `node qc/street-500-shared-scene-prepare.cjs` pins the scene; it refuses a differing existing manifest.
6. After root releases the shared GPU slot, `node qc/street-500-shared-scene.cjs --run-gpu` captures the eight views.

Source-alignment CPU gate is `../street-500-incoming-junction/export-tests.json`: 55 incoming samples and 2,187 existing legal-route samples have no ground miss beyond 1 mm; mapped garden/island additions are zero; zebras, signals, and memorials remain unchanged. Independently rebatched remote Float32 slivers total 0.001364 m², with zero addition/removal remaining outside a symmetric 0.1 mm tolerance. This is not a claim that every exported coordinate stays byte-identical.
