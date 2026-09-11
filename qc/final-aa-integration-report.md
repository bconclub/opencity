# Final renderer and mobile input review

**Keep the MapLibre5.7.2 repair and AA off. The isolated pause-input fix passes actual browser touch checks.** Confidence high for reproducible assertions and source identity, moderate for broader playability. No physical phone or sustained moving-camera session was measured.

## Release decisions supported

1. MapLibre5.6.1 repeatedly crashes in `_updateRetainedTiles` during FullHD helicopter preparation, including a fresh page and the proposed AA candidate. The exact previous road-to-flight sequence passes with5.7.2. Prior failures, full stacks and repaired transition receipt are preserved. `final-aa-repair-transition-receipt.json` explicitly separates its passing diagnostic from the raw two-pose file's inapplicable comparative gate.
2. Default4xAA is rejected at both tested pixel ceilings. FullHD fails all three cumulative gates;1100x760 fails close traffic by17.62%. Road/aerial-only AA approval would miss this problem. Neither AA experiment is promoted.
3. FullHD AA-off with repaired renderer passes the cumulative10% mean-frame gate at all three poses. It still has uneven frame delivery. This is not a steady60FPS or physical-mobile result.
4. Actual CDP touch events reproduce stale held analog input after pause at330/390/430px. The three proposed input files clear ground analog and helicopter held keys, reject paused touches, accept fresh input after resume and retain left-only steering. All three widths pass with those exact candidate bytes.

## Matched hardware evidence

All final hardware contexts are actual Intel UHD630 D3D11. Every default framebuffer is probed with read/draw bindings restored. Each ABBA uses a single browser/page at a time, matching fixed road/aerial cameras and identical frozen close NPC layout,20visible actors and candidate two-near/eighteen-far close traffic. Road/aerial retain live ambient simulation. Means/median/p95 use raw RAF intervals, not GPU timers; no simulation-performance claim is made for frozen close traffic.

The reference is **f1fd503 with only both MapLibre JS/CSS URLs repaired to5.7.2**, not unmodified historical source. The unrepaired reference cannot produce valid aerial results at the failing FullHD condition. Candidate base is4b79104 with exact app/sw/policy/index overrides per experiment. External dependencies are replayed by exact URL within each comparison. Room/cache bootstrap is excluded equally.

| Test | Pose | Reference mean ms | Candidate mean ms | Change | Gate |
|---|---|---:|---:|---:|---|
| FullHD AA on,240 samples/run |Road|19.3002|28.1196|+45.70%|Fail|
| |Aerial|19.2000|32.3383|+68.43%|Fail|
| |Close|23.1110|33.7390|+45.99%|Fail|
| FullHD AA off,120 samples/run |Road|19.8667|19.2142|-3.28%|Pass|
| |Aerial|19.2804|19.3925|+0.58%|Pass|
| |Close|25.1350|24.3842|-2.99%|Pass|
|1100x760 AA on,120 samples/run |Road|17.5233|17.5721|+0.28%|Pass|
| |Aerial|17.7017|17.4879|-1.21%|Pass|
| |Close|19.8475|23.3438|+17.62%|Fail|

Fresh comparisons are separate experiments, not pooled across sessions. These are cumulative source comparisons, not isolated AA-cost estimates. The FullHD off reference close repeats vary22.91 to27.36ms, which limits precision and prevents claiming an isolated speedup.

FullHD off candidate road/aerial/close p95 values are35.505/35.605/36.205ms; all exceed the33.333ms30FPS tail budget. Means correspond to52.04/51.57/41.01 delivered RAF frames per second. At1100 AA on, candidate close p95 is36.205ms and mean42.84RAF FPS, but its17.62% relative regression still fails the release rule. The earlier near60Hz measurements do not prove spare GPU capacity or supersede these newer recorded conditions.

No page errors or missing first-party files occurred in the completed repaired-renderer comparisons. Existing numeric style/glyph warnings remain. Custom draw counters exclude MapLibre draws. Per-frame NPC counts, actual model identities, geometry counters, uncompressed request-body sizes, camera values and exact source hashes are included in each JSON. Final unique first-party bodies in the rejected reduced-policy harness were16,920,313 candidate versus15,963,150 reference, including recorded test instrumentation; these are not production transfer or cache savings.

## Final AA removal and input smoke identity

Root restored app.js and sw.js to their original4b79104 behavior, verified byte-for-byte after CRLF normalization by `final-aa-final-smoke-prepare.cjs`. The experimental probe/import and SW entry are absent. This removes a startup probe while preserving the same actual AA-off rendering path measured in the FullHD off run. No new graphics optimization is claimed, and no additional timing suite was run for this removal or the input-only fix.

The final smoke uses the unchanged graphics/assets snapshot plus exactly captured app/sw originals and these isolated pause candidates:

- mobile-drive.js: `0653e653f2723a22682dea48d4ac638d6164d0daa31b4b0af087c88cff93a7ab`
- auto-mode.js: `cb7dab896b4b61c741f5fbb8f62039c84680eab6bccc9417c9a4ee3ffa3c32d4`
- flight.js: `a3c7d018f522861e4f276e757d956c10becfb8fdbfb4c0cea38ebf58534dfb14`

`final-aa-final-smoke-sources.json` records source paths, complete hashes and original app/sw normalized equality. No runtime edits or promotion were performed by this subagent.

## Mobile and software smoke

Original actual touch results at330/390/430: left throttle/steer and motion pass, pointer release passes, right touch remains inert, UI input exclusion passes, no horizontal overflow, map canvas remains visible. Pause-held clearing fails at all widths. A first harness attempt omitted opening the mobile control center and timed out on a correctly hidden picker; that invalid setup is preserved separately and is not called a product failure.

Final candidate results at all three widths: ground pause clears held analog/pointers; helicopter pause clears both mobile and flight held-key sets; touches while paused do not capture input or move the map; resume accepts fresh touch; release clears held keys; all previous checks remain passing. Input comes from CDP touch events, not synthetic DOM pointer events. The software smoke asserts actual SwiftShader, AAfalse/zero framebuffer samples, successful boot/KITT entry and pause/resume. All final cases have zero page errors and zero missing resources.

`final-aa-final-smoke.json` contains the passing results. Unhidden driving/control-center screenshot evidence was recaptured after asserting active unpaused state and hidden resume overlay, followed by200ms UI settling. The inspected330px driving capture now has no stale Resume button and retains the compact bottom HUD. This browser emulation does not establish physical-device FPS, tilt permissions, gamepad compatibility, multiplayer latency, or long-session stability.

## Evidence kept

Failed5.6attempts: `final-aa-attempts.md`, four partial result sets and exact stacks. Repaired transition: candidate-only diagnostic and explicit receipt. Failed FullHD sources/results/screenshots: `final-aa-fullhd-on-*`. Rejected small-tier sources/results: `final-aa-compact-on-*`. Passing FullHD fallback: `final-aa-fullhd-off-performance.json`. Mobile reproduction: `final-aa-smoke.json`. Exact candidate fix and final AA-off browser checks: `final-aa-final-smoke.json` and sources receipt. All browsers were closed after completed runs.
