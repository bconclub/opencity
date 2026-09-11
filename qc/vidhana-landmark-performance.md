# Vidhana Soudha runtime landmark comparison

2026-09-11. Baseline is `git show c3f917f:landmarks.js`; candidate is frozen working-tree module. No runtime edits by QA. Root and city visual agent confirmed no other rendering when test started. Browser closed on completion.

## Result

**Passes <=10% frame-time regression gate.** Full-scene ABBA gives 250.2783 ms baseline versus 250.4167 ms candidate, **+0.0553%**. This is effectively unchanged within measurement variability. These are relative desktop SwiftShader timings, not physical phone or hardware-GPU performance claims.

| Metric | Baseline | Candidate |
|---|---:|---:|
| Individual mean frame times | 254.1683, 246.3883 ms | 246.9433, 253.8900 ms |
| Custom-layer draw calls | 45 | 45 |
| Custom-layer triangles | 440,922 | 419,822 |
| District layer draw calls | 33 | 33 |
| District layer triangles | 309,032 | 287,932 |
| District textures | 18 | 18 |
| Actual module file bytes | 5,208 | 6,917 |

Source payload grows **1,709 bytes**. No new model or texture download. Captured baseline passed through PowerShell line-ending conversion and is 5,236 bytes; normalized text verified identical to Git baseline. Consequently intercepted HTTP decoded totals are 19,926,076 versus 19,927,757 bytes, a 1,681-byte test-transfer delta. Report actual source delta for release payload.

## Method

`vidhana-landmark-performance.cjs` opens one Edge headless browser page at a time, 1100 x 760, 60 sampled frames per run. Both module versions are request-intercepted. Service worker and multiplayer client are excluded consistently. Whole live scene is rendered, including district, dome, streets, furniture and 20 NPC vehicles. Each sample requests map repaint, so static idle RAF does not masquerade as a rendered frame. Every run has the exact same camera: center `[77.59064999999998,12.97972999999999]`, zoom 18.591098406597563, pitch 84.52107412193836, bearing -45.01013112444139. All four runs have zero page errors. Source SHA256 is recorded per run.

## Visual observations and limits

Matched screenshots show smoother dome shading and distinct window shapes across storeys. Same building footprint and apparent silhouette remain. Existing diagonal shadow/depth stripes are visible across walls and tower in both baseline and candidate; this test does not establish their cause or resolution. Ride picker overlays left frontage equally in both cases. This is a performance gate and bounded visual comparison, not confirmation of architectural survey fidelity or a completely clean final scene.

Evidence: `vidhana-landmark-performance.json`; `vidhana-landmark-performance-0-baseline.png`; `vidhana-landmark-performance-1-candidate.png`.
