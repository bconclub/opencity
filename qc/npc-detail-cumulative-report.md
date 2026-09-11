# Near-NPC detail cumulative acceptance

**Pass: all three whole-release frame-time comparisons remain within the 10% budget.** No runtime promotion or git change was performed by this audit.

## Exact sources

- Baseline: complete repository `f1fd503054927bde060315c7af3121391c839956`, version 0.0.30. Historical production byte identity is not asserted.
- Candidate base: complete repository `9e500bb48bccf2de418fdc0f9e12ee73004d7e96`, plus exactly the three previously visually reviewed overrides below.
- `/npc-traffic.js`: `124fefd1754f228068286519a106848dbfd47caa9622e55f33beccf37e4b824c`.
- `/npc-detail-state.js`: `ee05258f9d3346a166c2d05009d03877f395ed46e4e3901e8d44c5aea431c1c2`.
- `/npc-detailed-batches.js`: `372e581926a24f20b2c200ced252bf29858fe9cee50a4e4d8ef48614580bf8a3`.

`npc-detail-cumulative-prepare.cjs` verifies these hashes against `npc-detail-visual.json`, extracts each commit's full first-party runtime manifest and writes immutable local snapshots. Every requested first-party file is served from the selected snapshot; missing paths fail rather than loading mutable working-tree files. Candidate manifest SHA-256 is `adc450e81dfdea076071f515a9076984cac0339c3417ce4cffb68eaa046a3cc9`. Snapshot directories are reproducible local test inputs, not additional source assets to commit.

## Method

One Edge headless SwiftShader browser, one page at a time, 1100 x 760 pixels. ABBA order: baseline, candidate, candidate, baseline. Each page samples paused KITT road, paused helicopter aerial and frozen close-traffic views, with 60 forced repaint intervals after map/asset readiness and warmup. Twelve samples total; no concurrent GPU work.

Road/aerial retain live ambient simulation. Candidate road proximity naturally varies between zero and two detailed NPCs. Aerial requires zero detailed NPCs throughout. Both modes show all 20 NPCs during every sampled frame. Signal phase, actor movement and simulation workload can still vary in these two poses.

The close view reproduces the visual harness's first-car camera: 9 m behind and 5 m sideways relative to the first car, eye height 3.2 m, target height 0.7 m. Both NPC modules receive the same small review instrumentation to capture initial car layout, reset to it and freeze simulation. This instrumentation does not freeze road/aerial simulation. Before the close view, every car is reset; candidate wheel-pose/near-selection history is cleared. Both close layouts have identical `[x,y,heading]` SHA-256 `e3cf3985c305040e1b0cfb9921c2bab480f3e31e532e50cf922e6178002a6d6a`.

Close sampling asserts **exactly two detailed plus eighteen fallback NPCs** in every candidate frame. Both close runs report simulation time zero and frozen state true. This is not a guarantee of worst-case pixel coverage across every camera. Consequently, the close measurement demonstrates render cost at the maximum allowed near count for this camera, **not traffic simulation performance**. Original and served instrumented NPC hashes are recorded separately.

All three cameras and KITT spawns match across modes. Close map camera: centre `[77.59356072548593,12.980576389929368]`, zoom `22.96830417719348`, pitch `76.3367340136591`, bearing `-166.49421270924694`. Full road/aerial values, vehicle states, model identity and readiness appear in the result JSON.

## Frame-time results

| Pose | Baseline runs, ms | Candidate runs, ms | Baseline mean | Candidate mean | Change | Gate |
|---|---|---|---:|---:|---:|---|
| KITT road, live traffic | 344.7233, 314.1683 | 352.2217, 344.1667 | 329.4458 | 348.1942 | +5.6909% | Pass |
| Helicopter aerial, live traffic | 298.3350, 303.8900 | 318.6117, 296.3883 | 301.1125 | 307.5000 | +2.1213% | Pass |
| Close, frozen maximum near detail | 316.6650, 313.6117 | 337.5000, 329.7233 | 315.1383 | 333.6117 | +5.8620% | Pass |

These are cumulative comparisons against the full repository 0.0.30 baseline. Do not interpret changes from separate earlier benchmark sessions as an isolated NPC-detail speedup or cost. Two runs per mode have limited statistical precision; physical phone performance remains unmeasured.

## Geometry and draw cost

| Pose | Baseline custom calls / triangles | Candidate custom calls / triangles |
|---|---|---|
| Road, final sampled render | 112 / 450,916 | 72 / 463,943 |
| Aerial | 104 / 445,600 | 104 / 424,476 |
| Close, fixed maximum | 45 / 440,946 | 50 / 457,156 |

Counters cover custom Three scenes, not MapLibre basemap draws. Road is dynamic: recorded near counts zero through two imply 67 to 72 custom calls and 445,276 to 482,610 custom triangles, with 463,943 in the final recorded render. This range is derived from the recorded near counts and audited per-model triangle counts, not a claim that final counters were constant throughout.

NPC layer alone: fallback uses one call and 120,000 triangles for twenty cars. The fixed two-near candidate uses six calls and 157,334 triangles. Detailed cars use 24,667 triangles each, replacing 6,000-triangle fallback instances, so maximum additional geometry is 37,334 triangles and five calls. Aerial returns to the one-call, 120,000-triangle fallback.

## Payload and observed visuals

Uninstrumented unique first-party source payload requested: **15,962,783 to 16,916,024 bytes**, +953,241 bytes. Served unique bodies include the identical 367-byte benchmark instrumentation in each mode: 15,963,150 and 16,916,391 bytes. Served bodies including duplicate requests total 20,014,184 and 20,967,425 bytes. These are uncompressed body sizes, not production internet transfer, billing or cache savings.

The room client and cache bootstrap are disabled equally, service workers blocked, and fresh contexts/network cache disabled. Public map/CDN requests remain external. Live multiplayer and cache benefits are excluded. Some background requests reported ERR_ABORTED, but all sampled scene/model readiness checks passed. No page errors or missing first-party resources occurred. Null-number map-style warnings and a high-zoom glyph-budget warning occurred in both versions.

The matched close screenshots show smoother body and wheel outlines using the accepted detailed source, while the remaining model/texture imperfections are still visible. This is an incremental fidelity improvement, not a photorealistic vehicle claim. Original fallback/optional-model failure behavior was separately verified in `npc-detail-visual.json`; this run required the detailed model to load successfully.

Evidence: `npc-detail-cumulative-performance.json`, snapshot manifest, progress JSON and twelve `npc-detail-cumulative-{index}-{mode}-{pose}.png` images. The browser closed in `finally`, the runner exited successfully and the exclusive GPU slot was released.

