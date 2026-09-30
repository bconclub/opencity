# Final anti-aliasing integration acceptance plan

Preparation only. No GPU work, runtime changes or release promotion performed.

## Evidence being combined

`hardware-aa-result.json` compares identical immutable `004e1ca61aa4176687f73f808d7cf80f726aec40` runtime with antialias false/true. Actual Intel UHD630 D3D11 default framebuffer samples are zero/four. Road and aerial cadence pass the relative gate with visual edge improvement. This is an AA ablation, not the final policy or complete historical-release comparison. Traffic is frozen there.

`npc-detail-hardware-performance.json` compares full repository `f1fd503054927bde060315c7af3121391c839956` with `9e500bb48bccf2de418fdc0f9e12ee73004d7e96` and three NPC overrides, without AA. Actual Intel hardware is verified. Close p95 is 34.23 ms, exceeding the 30 FPS tail budget. It cannot establish final integrated AA close performance. The original software tests remain separate evidence and must not be replaced or interpreted as Intel performance.

## Exact final comparison

1. Wait for root's immutable commit containing accepted AA policy. Record commit plus every first-party file/model hash. Extract complete SW manifest, files.push assets and top-level runtime modules for both final commit and immutable f1fd503. No mixed working-tree overrides. Fail on missing first-party requests.
2. Generate isolated `final-aa-*` harness from the NPC hardware harness, retaining original files. Preserve equal room/cache exclusions, fresh contexts and blocked service workers. Record any benchmark instrumentation separately from source hashes.
3. Default Edge, one page at a time, ABBA baseline/candidate/candidate/baseline at 1100 x 760. Reuse exact KITT road, helicopter aerial and deterministic frozen near-traffic camera. Record full camera, actual selected model identity, loaded geometry and readiness. Road/aerial retain live NPC simulation and report actor counts/simulation timing; close resets identical layouts, freezes simulation and asserts candidate two-near/eighteen-far in every frame. No close simulation-speed claim.
4. Increase sampling from 60 to 240 delivered RAF intervals per view after 2.5 s warmup. Use generic quantile interpolation at p*(N-1), not fixed indices. Preserve each raw interval and pool 480 intervals per mode/pose. Shorter historical samples are contextual evidence, not pooled with this test.
5. Query actual game WebGL2 context outside timing windows. Assert Intel UHD630 D3D11, reject software renderer strings. Record antialias attribute, policy decision/status and default-framebuffer samples. Probe samples with read/draw framebuffer bindings saved/restored. Baseline requires AA false/zero; candidate default desktop expectation is supplied by final policy and must match actual context.
6. Record mean/median/p95/max, fraction over 16.6667 and 33.3333 ms, equivalent RAF FPS, custom draw calls/triangles, NPC detail counts and requested first-party bytes. <=10% cumulative mean regression at each pose is necessary; separately report tail behavior and cadence limits. A 60 Hz cap does not prove GPU headroom. No cross-run attribution of isolated AA cost.
7. Capture matched road/aerial/close screenshots after timings, inspect silhouettes, roof/window edges, roadway markings, missing geometry, contact shadows and labels. Preserve page errors, missing resources and console warnings separately.

Reuse the AA harness's external-response replay pattern if compatible with full baselines: fetch each public tile/style/CDN response once per exact URL, replay identical response bytes for subsequent runs, and record identity. Distinct versioned URLs stay distinct. Never replace external code with a mismatched historical version. If replay cannot preserve correct dependency identity, fail or document the specific external variance rather than silently mixing sources.

## Software fallback and mobile smoke

After the hardware browser closes, launch a separate forced-SwiftShader browser and assert the actual map renderer. Verify policy leaves AA off and default framebuffer samples zero, scene boot completes and KITT drive/pause/resume still renders. If policy changes another rendering path on software, run the full software cumulative comparison; if only the decision module differs and actual render path is unchanged, focused fallback smoke plus existing cumulative software evidence is sufficient, with that limitation stated.

At 330, 390 and 430 px portrait, emulate touch/coarse pointer and record policy decision plus actual context attributes. Test actual touch drag on left pad moves/steers, right touch rotates view without driving, UI controls do not trigger movement, release clears input, pause/resume clears held input, and viewport resize retains a nonblank map. Verify only the intended compact HUD appears, room/control overlays dismiss without blocking rides, and no horizontal overflow. Use CDP touch input rather than synthetic DOM-only events for movement checks. These are functional browser emulations, not physical-mobile performance or device-orientation permission tests.

## Policy edge cases to review after final API arrives

- Missing/blocked renderer extension and unknown GPU choose the documented safe fallback.
- Storage unavailable/corrupt preference does not stop boot.
- Explicit user preference, if present, has documented precedence and does not silently persist test setup.
- Context creation failure with requested AA retries without AA at most once and releases any failed context/canvas resources.
- Initial narrow/coarse device decision remains well-defined after orientation/resize; existing WebGL context cannot change AA in place.
- Actual status matches context attributes; detecting MAX_SAMPLES support alone is not proof that AA is active.
- Context-loss/recovery listener behavior remains unchanged or is tested if touched.

## Remaining playability gaps

This suite does not prove physical-phone sustained performance, touch ergonomics, mobile browser memory pressure, real tilt permission handling, long-session thermals, real USB gamepad input, multiplayer jitter/voice under network loss or continuously moving worst-case cameras. Existing close-tail stalls are unresolved until final integrated samples establish otherwise. AA improves edge coverage, not incorrect vehicle shape, smeared source textures, schematic architecture or traffic-route accuracy.

Await immutable candidate and explicit GPU release before running. Root retains promotion decision.
