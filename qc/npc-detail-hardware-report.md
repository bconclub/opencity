# Verified Intel desktop hardware comparison

**Relative cumulative gate passes in all three poses. Close traffic still has uneven frame delivery.** Confidence high for the recorded hardware identity and samples; moderate for general desktop playability because these are short, headless, stationary-view tests. No physical phone was measured.

## Sources and device

Reuses the exact complete first-party snapshots in `npc-detail-cumulative-snapshots.json`: repository `f1fd503054927bde060315c7af3121391c839956` versus `9e500bb48bccf2de418fdc0f9e12ee73004d7e96` plus the three reviewed NPC overrides. No mutable runtime source was used. Candidate manifest SHA-256: `adc450e81dfdea076071f515a9076984cac0339c3417ce4cffb68eaa046a3cc9`. Exact per-file and instrumented hashes remain recorded in the result JSON. Historical production byte identity is not claimed.

Default headless Microsoft Edge `152.0.4191.66`, 1100 x 760, launched without forced software-renderer flags. Every one of the twelve samples queried the actual shared MapLibre/Three WebGL2 context and asserted this unmasked renderer:

`ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00009BC8) Direct3D11 vs_5_0 ps_5_0, D3D11)`

Actual context attributes include `antialias: false`, `powerPreference: high-performance`, depth and stencil enabled. These are hardware measurements on this desktop, unlike the preserved SwiftShader comparison. Do not combine timings from those two renderer paths.

## Method and result

ABBA order, one browser/page at a time, road then aerial then close for each mode. Scene and vehicle readiness, cameras, initial NPC layout and frozen close layout are asserted. Each run records 60 requestAnimationFrame intervals after warmup, giving 120 pooled intervals per mode/pose. Median and p95 use linear interpolation at `p * (N - 1)`.

| Pose | Baseline mean ms | Candidate mean ms | Candidate median ms | Baseline p95 ms | Candidate p95 ms | Mean change | Candidate equivalent RAF FPS |
|---|---:|---:|---:|---:|---:|---:|---:|
| KITT road | 16.6808 | 16.6792 | 16.7000 | 16.8000 | 16.8000 | -0.0100% | 59.955 |
| Helicopter aerial | 16.6817 | 16.6817 | 16.7000 | 16.8000 | 16.8000 | approximately 0% | 59.946 |
| Frozen close traffic | 21.2683 | 21.4075 | 16.7000 | 34.2250 | 34.2300 | +0.6543% | 46.713 |

All mean regressions are below the 10% cumulative gate. Road and aerial follow approximately 60 Hz cadence; they do not establish spare GPU capacity. Literal 60 FPS budget is 16.6667 ms, slightly below their measured 16.68 ms mean and 16.8 ms p95. The close view exceeds that budget, and its 34.23 ms p95 also exceeds the 33.3333 ms 30 FPS budget. Candidate close samples contain 16 of 120 intervals above 33.3333 ms, with a maximum of 50 ms. Baseline has 17 of 120 over-budget intervals and a 50.1 ms maximum. Therefore neither version demonstrates consistent 30 FPS frame delivery in this close view, despite both averaging above 30 FPS.

These are RAF delivery intervals, not GPU timer queries. Short windows, refresh cadence and two repeats per mode limit precision. Close tail stalls are observed, not attributed to a proven cause. No moving-camera, long-session, thermals or physical-mobile claim follows from these numbers.

## Matched workload and payload

Every sampled frame contains 20 visible NPCs. Hardware candidate road samples each have one near detailed car and nineteen fallback cars; aerial always has zero near cars; frozen close always has exactly two near and eighteen fallback cars. Road and aerial retain ambient simulation and can differ in signal phase. Close resets identical initial positions/headings and disables simulation equally, so close results measure rendering at the configured maximum near count for this camera, not simulation speed or every possible worst-case view.

| Pose | Baseline custom calls / triangles | Candidate custom calls / triangles |
|---|---|---|
| Road | 112 / 450,916 | 72 / 463,943 |
| Aerial | 104 / 445,600 | 104 / 424,476 |
| Close | 45 / 440,946 | 50 / 457,156 |

Counters include custom Three scenes only, excluding MapLibre basemap draws. Close NPC layer alone changes from one call / 120,000 triangles to six calls / 157,334 triangles. Source snapshots and requested payload are unchanged from the software test: unique uninstrumented first-party bytes 15,962,783 to 16,916,024, an increase of 953,241 bytes. These are uncompressed fulfilled bodies, not production transfer sizes. Room and cache bootstrap are disabled equally, fresh contexts block service workers, and third-party map/CDN responses remain external.

All model/scene readiness and matching assertions passed. No page errors or missing first-party resources occurred. Existing style/glyph warnings remain. The hardware close screenshot retains the smoother accepted NPC body and wheel outline but also exposes texture imperfections and schematic surroundings; no photorealism claim is justified.

## Evidence and reproducibility

- `npc-detail-hardware-prepare.cjs` generates the hardware variant from the unchanged software harness.
- `npc-detail-hardware-performance.cjs` runs the same snapshot interception and twelve sample sequence, asserting actual context identity before each sample.
- `npc-detail-hardware-performance.json` contains corrected per-run and pooled summaries, raw intervals, context attributes, scene counts and exact source manifests.
- `npc-detail-hardware-raw.json` preserves the original output before per-run quantile correction. Its pooled quantiles were already correct; inherited per-run `sorted[30]` / `sorted[57]` estimates were recalculated from unchanged raw intervals by `npc-detail-hardware-summarize.cjs`. No measurement was rerun or discarded.
- Twelve `npc-detail-hardware-{index}-{mode}-{pose}.png` files preserve matched views. Existing software evidence is unchanged.

Runner exited successfully and closed its browser in `finally`. GPU slot released. This audit did not modify or promote runtime code.
