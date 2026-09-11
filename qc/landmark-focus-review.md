# Displayed landmark focus metadata

Review candidate only. No runtime module changed.

The selected Vidhana reconstruction ends at 39.8 m while its source dome
property says 46 m. The former core is omitted. Current district focus still
queries those original properties and every source building, including shapes
that were replaced and never rendered. A real-data regression reproduced the
hidden district core (`building-2086`) winning over the visible crown.

The district candidate records feature identity only when geometry is emitted.
The helper preserves source indices for stable focus IDs, filters invisible
features, applies measured `displayParts` base/top ranges, and excludes null
parts. It adds the estimated stair footprint as a separate focus target.
Original OSM properties and coordinates remain untouched. Height overrides
are described as reconstructed display geometry, not surveyed dimensions.

Verification:

- `node qc/landmark-focus-test.mjs`: valid/invalid overrides, hidden core,
  unchanged ordinary building, stable IDs, extra footprint copying and selection.
- `node qc/landmark-focus-source-test.mjs`: actual source data and selected
  emitted-geometry metadata. Crown resolves at 39.8 m, old 46 m summit does not,
  hidden district core is excluded, stair target resolves, source remains intact.
- `node qc/landmark-focus-prepare.mjs`: exact-source anchored district candidate
  with input/output/helper hashes in `qc/landmark-focus-manifest.json`.
- `node --check qc/landmark-focus-district-candidate.js`: syntax passes.

On integration, put the helper at `landmark-focus.js`, use the selected model's
live metadata, and add it to boot/cache assets. Verify actual ray hit and dwell
through turns in a browser before promotion. The source test simulates the
renderer landmark-replacement rule; it does not claim a browser raycast test.
No graphics attributes, materials, camera projection, or triangle batches change.
