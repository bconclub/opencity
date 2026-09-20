# Vidhana stair sampling investigation

Review only. No runtime promotion or performance claim.

The preserved staircase contains45 physical steps,92 horizontal triangles including landing,90 riser triangles and180 side triangles. CPU equality tests preserve every position/normal buffer and all other landmark metadata.

## Why the previous filter failed

The first filter used projected full-step pitch. At the requested aerial view, a CPU perspective estimate gives2.28px pitch but only0.55px riser width. The pitch passes the old2px threshold while the alternating riser remains undersampled. The original screenshot consequently has broken dark bands across the stairs.

The revised minimum-feature normal filter compiles and renders on native Intel UHD630D3D11 with AA disabled and zero samples. It removes those bands, but normal averaging toward the physical slope changes brightness and makes the staircase resemble a ramp. Reject as final visual treatment.

Fixed central screenshot rectangles show the problem: aerial mean luminance166.58 becomes194.55, standard deviation50.84 becomes0; front mean121.61 becomes194.63. These are local contrast diagnostics, not full-image fidelity or temporal quality metrics. See `vidhana-stair-feature-filter-pixel-diagnostic.json`.

## Next isolated candidates

- A12% original normal-contrast floor provides a bounded fallback comparison. It may retain aliasing and still alter mean light.
- Analytic coverage integrates the physical step's periodic riser/tread phase over a pixel footprint. It evaluates standard material lighting for each face direction independently and blends linear-light results by coverage. This avoids normalizing an averaged normal, which caused the prior brightness shift. All45physical steps remain.

Analytic CPU tests cover175 duty-cycle/phase/filter-width cases, including negative phases and whole-period footprints. Maximum error against numerical integration is0.000078. GPU visuals and performance are still required. Stair shadow reception remains disabled in these diagnostics, matching the earlier shadowOff experiment; restoration of external shadows needs separate validation before accepting a final material.

## Analytic GPU review

The first analytic candidate compiled without shader errors on Intel UHD630D3D11,1400x900, zero AA samples. Paired front/aerial views retain clean, continuous step edges. A12% normal-contrast floor still resembles the rejected bright ramp and is not preferred.

The analytic aerial central rectangle has luminance standard deviation16.22 versus50.84 for the untreated staircase. Across five small camera offsets, the rectangle's mean range falls from1.35 to0.74. Front-view standard deviation remains38.88 versus55.50, preserving visible stair articulation. These are fixed-rectangle sampling diagnostics, not motion-compensated metrics or a frame-time gate. Raw values are in `vidhana-stair-analytic-pixel-diagnostic.json`.

The first analytic low-road screenshot revealed a new error: absolute projected tread width includes self-occluded treads and invents bright lines. Signed-visibility revision2 assigns zero tread coverage when its projection overlaps the riser. It also shares a viewport uniform updated before first shader compilation, avoiding a wrong-width first frame on narrow screens. CPU tests now cover210 analytic integration cases including fully occluded treads, plus330-to430px uniform resizing before/after compile. Revision2 visuals and the full-scene four-pose performance gate remain pending.

## Signed revision2 with shadows

Road/front/aerial screenshots now pass the visual review: hidden upper treads stop producing false highlights, while visible steps retain continuous edges. Restoring staircase shadow reception preserves the portico shadow without restoring the old broken stair bands. The preferred bundle keeps both staircase shadow casting and reception enabled. No other object's shadow settings change.

Preferred source: `vidhana-stair-analytic-v2-shadow-on-bundle.js`, SHA256 `74ef4d3e12c737a70361386e7db9f83455b395befae5cf6ab2b4d93b9bccc110`.

Native1400x900 Intel UHD630D3D11, AA disabled, four-pose ABBA120 frames per pose against immutable733fd33 passes the relative10% gate:

|Pose|Baseline mean ms|Candidate mean ms|Change|
|---|---:|---:|---:|
|Road|17.65|17.51|-0.78%|
|Front|18.49|19.67|+6.40%|
|Aerial|17.58|17.51|-0.39%|
|Close|19.32|19.60|+1.44%|

Custom draw calls remain45. Custom triangles increase419,822 to435,420 for the entire revised landmark, not just the material. First-party unique response bytes increase16,916,337 to16,946,936 (+30,599). These count full uncompressed fetched responses, not wire transfer/compression. Raw frame intervals, NPC states, source hashes, draw counts and errors appear in `vidhana-stair-analytic-v2-performance.json`. No shader/page errors or missing assets occurred. This is neither a physical-phone benchmark nor a guaranteed FPS claim; p95 reaches34.33ms.

Timing limitation: baseline front repeats20.29 and16.68ms show material drift. Another agent's4.85s CPU geometry test ended07:30:23UTC; the first timed road screenshot/progress file was created07:30:31UTC after2.2185s of recorded frame intervals. The gap makes overlap unlikely, but this harness lacks exact sampling-start UTC timestamps. Preserve that limitation rather than asserting precise isolation or a speedup.

Reproduce candidate bytes with `node qc/vidhana-stair-analytic-v2-test.mjs`, then `node qc/vidhana-stair-analytic-v2-shadow-prepare.cjs`. The second command restores the shadow-on manifest entry. The candidate is still review-only; runtime integration belongs to the parent task.
