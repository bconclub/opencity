# Combined 500 m street candidate: junction visual review

11 September 2026. Review only. No runtime promotion, route edits, server changes, or deployment.

The immutable `733fd3337caaf98b334c174e218e00820b447216` scene was compared against five asset/data overrides listed in `scene-manifest.json`. Every local response was hash-verified before browser load. Candidate GLB SHA256 is `cbaf1a003892fdd9b35bd28b9767b00a338cca0357b711c368f7fad83cdb5d5f`. Capture used native Edge with Intel UHD Graphics 630 / Direct3D11 at 1400 by 900. Both modes share identical camera poses. No page/shader errors or missing immutable local assets occurred. Browser closed after capture.

| Measured runtime value | Small-patch baseline | Combined candidate |
|---|---:|---:|
| Street draw calls | 4 | 7 |
| Render triangles | 2,130 | 11,676 |
| Ground-index triangles | 1,416 | 9,301 |
| Height at repaired junction probe | null | 0 m |

Both road and aerial captures agree with metadata. CPU installer tests hit every candidate ground centroid, preserve 17 elevated furniture triangles outside the ground index, and pass 16 invalid-data/disposal cases. Nine material cases pass. These checks verify asset integration, not complete driving behavior.

## Visible result

Asphalt now has a consistent dark textured surface at the junction, and raised kerb bands are distinguishable. The previously repaired interior kerb spear is absent. The source-linked display asphalt is merged into the existing material batch rather than adding a separate call.

The result is **not visually accepted as the finished 500 m scene**. The outer junction/patch outline remains conspicuously angular, with a pointed near-boundary termination visible in both captures. Straight legacy footpath bands remain around the junction. The views target the repaired junction near 483 m radius, not the Vidhana Soudha frontage or every crossing. They cannot prove whole-area quality, smooth boundary joins, correct signal placement, or active vehicle/kerb clearance.

Do not infer frame-time or download performance from this run. No timing samples were collected. The seven calls are the patch renderer's counters, not total scene draw calls. Browser cache was disabled for repeatable asset loading, but transferred-byte totals were not measured.

## Evidence

- `../street-500-combined-scene-baseline-road.png`
- `../street-500-combined-scene-candidate-road.png`
- `../street-500-combined-scene-baseline-aerial.png`
- `../street-500-combined-scene-candidate-aerial.png`
- `results.json`, with full poses, GPU identity, requests, counters, and manifest hash.
- `runtime-results.json` and `material-results.json`, refreshed against current runtime modules.

Next integration gate must inspect the frontage, explicit crossings, and boundary handoffs; resolve active auto-road/street-detail surface ownership; then run matched frame-time measurements on the same device. The disabled island route and 22 unverified external handoffs remain unqualified. Do not enable them based on these screenshots.
