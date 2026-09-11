# Dome-only candidate, CPU stage

Current revision: 2, frozen for review. **68,630 triangles, +4,354 versus architecture baseline, five material draws.** The earlier 68,246 count is historical first-revision evidence only. No runtime promotion. The original intermediate dome source and views remain as
`vidhana-dome-candidate-attempt1.js` and `vidhana-dome-attempt1-{front,oblique}.png`.

**Capture distinction:** final refined views are `vidhana-dome-after-front.png`
and `vidhana-dome-after-oblique.png`, header **68,630 triangles**. The
`vidhana-dome-attempt1-detail-*` images are intentionally preserved **first-revision**
diagnostics, header **68,246**, and must not be judged as revised results.
Current browser results report 68,630 for the refined builder, matching CPU
geometry. Those completed captures did not record an HTTP response SHA, so
byte-level response verification cannot be claimed retrospectively. The harness
now freezes and intercepts both builder source responses and records/asserts
SHA256 and byte count for the next authorized run; syntax checked only since
city took the GPU slot.

`vidhana-dome-candidate.js` wraps the intact architecture candidate. Only central
drum, main dome and the enclosed glass core are replaced. It builds an octagonal
base with recessed bays, projecting cornice/corbels, frieze and narrow railing,
then a rounded crown and short collar. Repeated decorative counts and heights
are estimates. No inscriptions, national emblem or generic substitute sculpture
were invented. Proposal and photographs: `vidhana-dome-next-review.md`.

Actual geometry top is **39.8 m**. Published overall **45.72 m** remains reference
metadata, with the missing upper pedestal/lion emblem explicitly recorded. This
is an incomplete upper silhouette, not a finished-height reconstruction.

`node qc/vidhana-dome-test.mjs` passes: seven domes retained, all noncentral
vertices/normals byte-identical to the prior builder, input data unchanged,
finite attributes, zero degenerate added triangles and unit added normals.
Triangle count 68,630 versus 64,276, delta +4,354. Five material draws versus six:
removing the hidden glass core eliminates its otherwise unused material batch.
Test coordinates retain the existing architecture harness's 111320 m/degree
approximation so before/after equality is direct; no new georeference conversion
is introduced. Runtime integration must continue using its own shared frame.

Source architecture SHA256 is recorded in `vidhana-dome-results.json`. The
candidate uses existing stone/recess material batches. Main mapped center and
footprint orientation are retained; cornice intentionally projects beyond the
old bare drum polygon. Box-like fine relief is a limited representation of
photo-supported decoration, not a claim of faithful carving.

Prepared `vidhana-dome-capture.cjs` uses the review
page through response interception, comparing the prior architecture candidate
with this dome-only candidate at matched front and oblique views. It requires
`--run-gpu` and an explicitly released GPU slot. No runtime promotion.

## Matched visual review

Front and oblique comparisons now completed in `vidhana-dome-{before,after}-{front,oblique}.png`.
Browser closed and GPU slot released. The initial uncached module initialization
timed out; its empty capture report is preserved in `vidhana-dome-browser-attempt1.json`.
Retry used cached Three169/OrbitControls and completed all four images with zero
page errors (`vidhana-dome-browser-results.json`). Geometry was unchanged between
attempts. This isolated review is not full-scene integration or performance QA.

Visual finding: broad blank tower has been replaced by a lower layered base;
rounded crown is visibly squatter, with separate frieze, cornice and collar.
Other domes/portico/stairs appear unchanged, consistent with CPU equality checks.
The missing upper pedestal/emblem remains conspicuous and intentionally unresolved.

The candidate is an intermediate improvement, not a finished architecture pass.
Repeated tall dark recesses read as generic windows more strongly than the
reference photograph's carved pilasters and gallery shadows. Cornice/railing
details are schematic and thin line/sliver artifacts remain visible in the
oblique image. These require closer inspection before integration; neither their
complete geometric origin nor full-scene behavior has been established. Do not
claim precise carving fidelity or a complete top silhouette. A next refinement
should reduce the visual weight of dark recesses and match the gallery/frieze
rhythm directly against the saved frontal photo, within the same limited scope.

## Revision 2 refinement and verdict

The first revision's tall dark recesses were replaced with 1.22 m-high gallery
openings, solid lower walls and 24 projecting pilasters/capitals. Corbels now
descend into the gallery zone rather than remaining mostly hidden in the upper
cornice. Estimated railing count drops from 48 to 32, with 0.18 m posts and a
0.16 m high top rail, improving sampling without a runtime resolution change.
All dimensions remain estimates; collar top remains 39.8 m, missing upper
pedestal/emblem remains explicit. CPU regression checks still pass, including
byte-identical noncentral geometry and normals, five batches, seven domes,
finite/unit normals and zero added degenerate triangles.

Updated matched front/oblique images were inspected at ordinary DPR1. Short
gallery shadows no longer read as full-height generic windows; pilaster and
bracket rhythm is clearer. Railing lines are more continuous. The separate
close DPR2 diagnostic of the first revision (`vidhana-dome-attempt1-detail-after-oblique.png`)
showed no tall spike in the crown mesh. CPU screen rays through the previously
suspect left-background region (example image pixels 629,370 and 629,375) hit
the unchanged `b4c9c4` roof batch at Z=22.354799 m, not added crown geometry.
That thin background roof-edge line remains outside this dome-only replacement.
This does not prove every subpixel artifact is gone, and no such claim is made.

Verdict: gallery and railing refinement improves the bounded candidate, but
overall monument remains incomplete and background roof-edge behavior still
needs broader scene review. Precise carving, full facade, topper and whole-scene
acceptance are not achieved. Runtime is unchanged. All capture browsers closed;
GPU slot released for the next agent's whole-release ABBA.
