# Hardware anti-aliasing experiment

**REJECTED FOR RELEASE.** Later cumulative Intel checks failed: FullHD4xAA increased frame time45.7/68.43/45.99%;1100x760 close view increased17.6156%, exceeding10% gate. Root removed app/sw integration. Policy preserved only as `qc/render-quality-rejected.js`; original test receipts and archived source hashes remain unchanged. No AA runtime promotion.


2026-09-11. **Passes the requested <=10% delivered-frame-time regression gate on tested Intel UHD Graphics630 / D3D11 hardware.** No runtime changes or deployment. Earlier SwiftShader failure evidence retained unchanged.

## Controlled result

| View | AA off mean | AA on mean | Change | Custom calls / triangles |
|---|---:|---:|---:|---:|
| Knight Rider road | 16.6808 ms | 16.7500 ms | +0.415% | 72 /482,610 in both |
| Helicopter aerial | 16.6808 ms | 16.6804 ms | -0.0025% | 104 /424,476 in both |

Individual-run95th-percentile intervals are approximately16.8 ms throughout. Browser is default headless Edge on actual `ANGLE (Intel, Intel(R) UHD Graphics630 (0x00009BC8) Direct3D11 vs_5_0 ps_5_0, D3D11)`. Each context was asserted as hardware, rejecting SwiftShader/llvmpipe/software renderers. Requested antialias flag matches actual context attributes; **default-framebuffer samples are0 off and4 on**. Framebuffer bindings are restored after probing.

This approximately60 Hz RAF ceiling measures delivered cadence at tested load, not isolated GPU execution cost or remaining GPU headroom. It does not establish physical-phone performance or negate the earlier software-renderer regression.

## Visual result

Matched screenshots show cleaner edges on KITT silhouette, road boundaries, distant window grids and aerial building roofs. No new blank geometry or rendering errors observed. Material detail and polygonal tree shapes are unchanged; MSAA improves edge coverage, not asset fidelity.

Road: `hardware-aa-0-off-road.png` versus `hardware-aa-1-on-road.png`.
Aerial: `hardware-aa-0-off-aerial.png` versus `hardware-aa-1-on-aerial.png`.

## Reproducibility

- Complete first-party snapshot pinned to004e1ca61aa4176687f73f808d7cf80f726aec40, version0.0.31;107 files,17,305,519 bytes. Manifest SHA256 `c5c223a0ee07b74780b74eb89242df61674f16c6bc59e537ec86b168aa80116d`.
- Every first-party request resolves to hash-verified snapshot bytes; unknown paths fail instead of reading mutable working tree. No missing resources or page errors in any run.
- Both modes use same source/assets. Only treatment difference is Map constructor `canvasContextAttributes.antialias` true/false.
- Identical instrumentation freezes NPC layout and pauses helicopter exactly at cruise altitude; no traffic simulation-performance claim. Position, camera, custom calls and triangle counts assert equal across modes.
- External responses fetch once and then replay across runs; response identities recorded. Service worker and room/cache bootstraps excluded equally.
-1100 x760 viewport,120 forced rendered frames per view per run, off/on/on/off order; one page at a time, exclusive rendering slot. All browsers closed after run.
- No new model/texture bytes. Unique served first-party response bodies differ by one byte because literal `true` is shorter than `false`.

Evidence: `hardware-aa-snapshot.json`, `hardware-aa-result.json`, `hardware-aa-progress.json`, and prepared scripts `hardware-aa-prepare.cjs` / `hardware-aa-experiment.cjs`. Adoption decision remains with root; no runtime antialias flag changed by this task.
