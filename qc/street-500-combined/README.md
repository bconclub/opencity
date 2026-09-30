# Combined street review candidate

Review only. Gap repair, source-linked interior kerb cleanup, and 18 display-only asphalt triangles now share one GLB: 986,984 bytes, 11,676 triangles, seven batches. No runtime files changed. No routes added. Invalid island turn remains disabled; separate single-car fixture does not qualify NPC circulation or external handoffs.

Ground sidecar and footprint are byte-identical to kerb candidate: 9,301 ground triangles. Display asphalt never becomes driveable ground. Exact hashes are in manifest.json. Runtime CPU checks hit all ground centroids, retain 17 elevated furniture triangles outside ground index, exercise origin shift, finite validation, and disposal. Nine material cases pass. Projection scaling is applied once upstream; this merge applies no further scale.

Regenerate with `node qc/street-500-combined-build.cjs`, then run `node qc/street-500-combined-runtime-tests.cjs` and `node qc/street-500-combined-material-tests.cjs`. Source meshes regenerate through existing gap export and junction kerb scripts; generated meshes.json is excluded from commit.

Run Python `qc/street-500-combined-surfaces.py`, then `node qc/street-500-combined-scene-prepare.cjs`. Immutable common source comes directly from git object 733fd3337caaf98b334c174e218e00820b447216 with exact byte hashes, including original line endings. No duplicated snapshot tree is needed. Preparation refuses to overwrite a differing manifest. Candidate overrides only four street assets and vidhana-street-data.json. Current runtime modules are preserved. Browser responses verify every frozen hash before load.

Static surface subtraction removes road, footpath, and lane polygons only within exported footprint; road polygons also subtract verified source asphalt display region. Boolean operations use local metres, one-micrometre precision grid, and three-micrometre boundary tolerance. Explicit zebra features remain unchanged. Auto-mode road quads and street-detail geometry remain unresolved and inactive during this review. Base-map transportation lines and district shadow receiver remain common.

After explicit GPU authorization, `node qc/street-500-combined-scene.cjs --run-gpu` captures native Edge matched road/aerial views. Baseline is immutable current small patch; candidate is combined 500m asset with static suppression. No visual acceptance or performance claim yet. Broader release requires viewport inspection, separate automatic-route gating, cache update for new ground sidecar, and performance validation. Exterior mapped angular boundaries remain preserved.

Matched junction capture is now complete; see `visual-review.md` and `results.json`. Asset rendering and CPU checks pass, but the angular near-boundary termination remains visible. Whole-area visual acceptance and frame-time validation remain pending. No runtime promotion.
