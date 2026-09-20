# Zero-blend atlas sampling candidate

## Runtime integration

Root promoted the exact tested bytes to `street-surface-coverage.js`, SHA256
`af14ada4dbf36f3b24de72061d3f68bac5fbf8ed04a28c1fdf399b35f2a00c82`.
Actual-runtime lifecycle checks, candidate equivalence, shader syntax and app
checks pass. Staging rebuilt. Vehicle assets remain unchanged; the rejected
wheel reduction was not substituted. No production deployment is implied.
The review history below describes the candidate before promotion.

Observed cumulative ABBA gate PASS: road +7.3816%, aerial -2.8058%, threshold +10%.
Current-versus-candidate visual parity and WebGL2 compilation PASS. No runtime promotion.

Review-only source: `qc/street-coverage-skip-candidate.js`; runtime
`street-surface-coverage.js` unchanged. Baseline snapshot is
`qc/street-coverage-skip-baseline.js`.

The shader evaluates XY derivatives and normalized UV gradients before the
fragment-dependent branch. Distance/ground blend is computed before the atlas
sample. When that blend is exactly zero, the atlas sample and unpremultiplication
are skipped. Otherwise `textureGrad` uses the precomputed UV gradients, then
applies the existing alpha threshold and RGB mix. No implicit texture derivatives
occur inside divergent control flow. Three169's WebGL2 program source uses GLSL
300 ES, which supports `textureGrad`. Actual Edge WebGL2 shader compilation also
passed without shader/page errors in both recorded poses.

Only the fragment injection and shader cache-key suffix differ. Optional
metadata validation, GLB/PNG hashes, fallback, material guards, callback chaining,
per-load texture isolation, retry and disposal behavior are unchanged. Existing
lifecycle checks rerun against the candidate pass. Source-contract/algebra checks
cover 330 combinations including exact blend/alpha thresholds, non-ground
fragments and near/distant scales, with zero algebra difference.

Current-versus-candidate parity used the exact previously failing cumulative road
camera and the same aerial camera. Inspected images show matching static road,
markings, sidewalks and aerial coverage; moving traffic differs. Calls/triangles
match exactly: road 67/445276, aerial 104/424476. This is visual equivalence at two
poses, not pixel identity across every possible scale. Evidence:
`street-coverage-skip-visual.json` and images
`street-coverage-skip-{0-baseline,1-candidate}-{road,aerial}.png`.

Final acceptance used complete immutable repository snapshots, baseline
`f1fd503054927bde060315c7af3121391c839956` (94 files) versus candidate
`4e4a19a7e5f768939e9ac774664a8450a0d948f8` (99 files) with only the coverage
module replaced by the QC shader. Candidate SHA256:
`af14ada4dbf36f3b24de72061d3f68bac5fbf8ed04a28c1fdf399b35f2a00c82`.
`street-coverage-skip-final-manifest.json` records every fulfilled file hash and
matches the embedded manifest in `street-coverage-skip-performance.json`.
Actual response hashes, exact cameras, readiness and eight error-free samples
were checked. Browser closed after completion; GPU released.

| Pose | Baseline mean ms | Candidate mean ms | Change | Gate |
| --- | ---: | ---: | ---: | --- |
| KITT road | 319.8608 | 343.4717 | +7.3816% | PASS |
| Helicopter aerial | 311.9458 | 303.1933 | -2.8058% | PASS |

ABBA uses fresh contexts, 60 forced-repaint frames per pose/run, 1100x760 Edge
SwiftShader. Room/cache modules are excluded equally, service workers blocked,
network cache disabled. Road baseline samples 310.555/329.167 ms and candidate
348.888/338.055 ms show meaningful run variance. This directly establishes the
observed cumulative gate on this device, not physical mobile FPS, a statistically
robust isolated shader speedup, or a causal comparison to older timing results.
The separate parity cycle is not used to infer a performance saving. A driver
may predicate the branch. Geometry/material counts, output alpha, atlas filtering
and mipmaps remain unchanged. Existing null-number console warnings were present
in both releases; no shader errors or missing required snapshot resources.
