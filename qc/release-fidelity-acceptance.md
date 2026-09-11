# OpenCity fidelity release audit

## Scope and state

Review target: tomorrow's playable web release, with a convincing KITT and improved first Vidhana Soudha street scene. Unity migration is not itself acceptance evidence. Actual rendered output and input behavior determine quality.

Baseline harness: `qc/release-fidelity-baseline.cjs`. Each version receives two independent cold contexts at 1100 x 760 and two at 390 x 844, with 120 requestAnimationFrame intervals after preparation and a parked auto at the same departure. One browser, one page at a time. Cache worker and multiplayer are deliberately excluded for controlled scene timing; this does not validate online room behavior. Custom-layer telemetry excludes MapLibre's basemap. Software-renderer numbers cannot establish real-phone or hardware-GPU FPS.

Initial timing was canceled because simultaneous Blender rendering contaminated CPU measurements. No performance comparison is accepted from that interrupted run. After Blender and other renderer jobs stopped, the live MSAA ABBA experiment completed with one page at a time.

## Findings from authoritative source

1. **Shared canvas has no requested MSAA.** `app.js` constructs MapLibre without `canvasContextAttributes.antialias`. Custom Three renderers receive the existing context, so their own `antialias:true` cannot recreate it. MapLibre's official [custom-layer example](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-custom-style-layer/) enables antialias at map creation. Test this at context creation, confirm `gl.getContextAttributes().antialias`, compare wheel/window/kerb edges, and measure cost before retaining it.
2. **Touch joystick was binary, now corrected locally.** The released `mobile-drive.js` converted stick positions to four Arrow key states after a 0.25 threshold. Small drags past that threshold and full deflection sent identical throttle/steering. The candidate now exposes proportional throttle/reverse/steer with an 18% dead zone and merges those values with existing keyboard/gamepad/tilt in auto-mode. `qc/release-fidelity-mobile-input.json` proves 13 browser-fixture and actual-physics checks: moderate input produces 1.57 m/s after one second, full input 4.02 m/s. This does not establish physical-phone feel. Right-side gestures are consumed but do not control the camera, consistent with the later left-thumb-only request. Do not advertise dual-stick camera control.
3. **Cybercab wheel animation remains structurally unavailable.** `npc-traffic.js` merges complete Cybercab mesh into material instances. No wheel pivots or per-wheel transforms exist there. `blender-vehicle.js` only rigs named `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` nodes. Original Meshy Cybercab has joined wheels per accepted asset audit. A new KITT rig cannot make all vehicle wheels animated.
4. **Existing visual fidelity remains schematic.** Source buildings use generated facade geometry/textures and estimated heights. Better lighting cannot prove surveyed building accuracy. Release copy must not claim photorealistic or exact Bengaluru reconstruction.
5. **Released player scenes lack vehicle contact shadows.** The released `auto-mode.js` and `flight.js` render separate scenes with no enabled shadow map or contact-shadow mesh. Root has since added a local ground-vehicle contact-shadow candidate, pending scene inspection. District shadow receivers do not include these vehicle casters. A cheap correctly aligned footprint can improve grounding, with road/kerb checks still required.
6. **Previous 10% regression evidence is not playability proof.** `qc/release-29-lighting-performance.json` recorded 220.91 ms mean in SwiftShader, about 4.5 FPS. That may support a relative comparison only. Real-device 30 FPS remains unmeasured.

## Required acceptance gates

- KITT: matching side/front/rear/three-quarter reference comparisons, black paint under neutral lighting, correct wheelbase and stance, separate visible spinning wheels, front steering, no brown glass, no scanner or panel clipping. A dimension check alone cannot pass shape quality.
- Street scene: same-camera road and aerial before/after screenshots; no road/kerb overlap or shimmering; pavement detail remains legible at driving height; landmarks retain silhouette; lamp and crossing placement corresponds to available mapped data.
- Mobile: 330/390/430 portrait and short landscape. Ride selection and departure remain reachable; vehicle/horizon visible; no overlay intercepting the driving area; release/cancel/blur clears held input; double-tap stop/hover and boost are demonstrated, not assumed.
- Playability: steady 30 FPS target on an actual intended mobile device, measured p95 frame interval and device/GPU documented. On this software-renderer host, compare identical same-device baseline/candidate and reject greater than 10% mean frame-time regression. Avoid concurrent Blender/browser jobs.
- Multiplayer: two real clients with all available vehicle IDs, visible remote models, no `invalid_pose`, resume/rejoin, leave cleanup, remembered player name. Run separately from controlled performance harness.
- Distribution: inspect versioned live asset URLs after deployment, confirm new GLB actually loads, compare final browser screenshots, and preserve source asset provenance. No launch claim based solely on a successful upload or green unit test.

## Pending evidence

- Whole-candidate baseline/candidate comparison and physical mobile measurements remain pending. MSAA experiment is complete and rejected below.
- Candidate KITT shape and rig audit.
- Updated local street/building output.
- Physical mobile performance.

## Isolated live MSAA result

`qc/release-fidelity-msaa.json`, production 0.0.30, Edge SwiftShader, 1100 x 760, ABBA with 60 frame intervals per run:

| Context | Mean frame time per run | Pooled mean | Median per run | Actual samples |
| --- | --- | --- | --- | --- |
| MSAA off | 241.15, 227.20 ms | 234.17 ms | 233.4, 233.3 ms | 0 |
| MSAA on | 462.83, 462.46 ms | 462.64 ms | 466.7, 466.7 ms | 4 |

MSAA increases measured mean frame time approximately 97.6%. Reject enabling it globally under the 10% regression gate. It smooths diagonal edges but does not correct model shape, road materials, or vehicle grounding. Hardware performance can differ; this result must not be represented as a physical-phone benchmark.

All four samples reported 48 custom draw calls and 453,746 custom triangles: District 33 calls / 309,056 triangles; Dome 3 / 768; street patch 4 / 2,130; auto 3 / 12,800; furniture 4 / 8,992; NPCs 1 / 120,000. Basemap calls excluded. No page errors.

Screenshots: `qc/release-fidelity-msaa-0-off.png`, `qc/release-fidelity-msaa-1-on.png`, `qc/release-fidelity-msaa-2-on.png`, `qc/release-fidelity-msaa-3-off.png`. These demonstrate that live road-level Cybercabs are pale/speckled, flat tan road dominates, and player auto lacks visible ground contact shadow. Updated street and contact-shadow candidates must be compared against these exact observations.
## Local mobile changes and verification

Implementation: `mobile-drive.js` and input clauses in `auto-mode.js` now provide proportional ground-vehicle throttle, reverse and steering, with neutral/release/cancel/lost-capture/blur cleanup. `mobile-drive.css` now gives `[hidden]` HUD state precedence over shared `flight-active` layout. This removes hidden helicopter altitude text bleeding through the ground HUD.

- Input fixture plus actual physics: 13 checks pass in `qc/release-fidelity-mobile-input.json`.
- Actual local CDP touch scene: `qc/release-fidelity-mobile-scene.json` records moderate and full touch movement, cancellation, manual takeover, continued keyboard control, and fitting 56px HUD at 330/390/430 widths. No page errors. This run predates the hidden-HUD CSS fix; its screenshots explicitly exposed the ghost altitude issue.
- Hidden-HUD fixture with the actual stylesheet order: 5 checks pass at 330/390/430 portrait and 844x390 landscape, plus active helicopter HUD visibility, in `qc/release-fidelity-mobile-hud.json`.
- A first wall-clock acceleration comparison failed; its cause was not recorded. The diagnostic rerun passed with zero impacts and moderate 1.82 m/s versus full 5.46 m/s. The harness now waits for equal minimum traveled distance rather than equal wall-clock delay, avoiding frame-stall distortion, and explicitly asserts that the inactive flight HUD stays hidden. That revised scene harness awaits final execution after all candidate changes settle.
- JavaScript syntax and whitespace checks passed. No commit, deployment, physical-device performance claim, or KITT visual approval made by this QA task.
## Final functional regression after renderer changes

- First regression exposed a P0 classic-script/module mismatch: `flight.js` gained a static import while index loaded it as a classic script. Auto activation then failed with `car` unset and repeated render errors. Evidence retained in `qc/release-fidelity-mobile-scene-failure.json/png`. Root fixed this by moving the helper import into flight's existing asynchronous module preparation.
- Final actual mobile run passed after that fix: moderate input 1.995 m/s after 1.312m, full input 3.443 m/s after 1.496m, zero collision impacts in both samples. All three portrait sizes fit with one 56px HUD; inactive helicopter HUD is explicitly hidden. `qc/release-fidelity-mobile-scene.json` and 330/390/430 screenshots are final local evidence.
- Local ephemeral room-server suite passed all six vehicle IDs, remote actor creation, finite projected names, Create/Join/Free room, invite validation, resume, reconnect and remembered identity. No page errors or invalid_pose errors. `qc/release-fidelity-rooms.json` records the result. No VPS or production room mutation.
- First room screenshots contain two player vehicles occupying the same chosen departure, so do not use those images to judge single-model geometry. A spectator or different departure is needed for uncontaminated visual comparison. Shared-player collision/spawn separation was not added by this task.
- Name tags are finite and visible, but ground-car anchor remains a fixed2.7m in multiplayer-render.js. This is visibly high above low car roofs; an exact eight-pixel gap above each roof is not established.
- Whole-scene combined ABBA and network byte measurement prepared in `qc/release-fidelity-combined.cjs`; must run only after all other rendering finishes.
## Combined candidate gate, before near-tree LOD

Full-scene live/local ABBA finished with Blender CLI and other browser jobs idle. Two user-opened Blender GUI windows remained open without an active render. `qc/release-fidelity-combined.json` records two 60-frame samples per version at the same 1100x760 viewport, auto departure and camera.

- Mean: live 231.726ms, local candidate 239.456ms, **+3.34%**. Passes the relative 10% gate for this exact software-renderer scenario.
- Custom draw calls: 48 to49. Triangles:453,746 to453,724. Map basemap excluded.
- Same-origin decoded payload:20,007,391 to20,024,393 bytes, +17,002 bytes (0.085%). Both repetitions agree exactly.
- Raw encoded network transfer:11.78MB production versus20.82MB local. Those values are not directly comparable as release-size growth because production compresses resources while the local server does not. Comparable decoded payload is reported above.
- No page errors. Screenshots: `qc/release-fidelity-combined-{0,3}-baseline.png` and `{1,2}-candidate.png`.
- This result predates the proposed near-tree LOD integration. New rendering changes require a new combined result; isolated costs must not be added to infer the final frame time.

## Isolated model/observer audit

`qc/release-fidelity-observer.cjs` keeps the second real room client as a spectator, preventing same-departure vehicle overlap. All six local rides rendered to the spectator, each with exactly one projected name label and no page errors. Ground-car name anchors now use measured model height; observed Cybercab1.362m and KITT1.339m. `qc/release-fidelity-observer.json` and `qc/release-fidelity-isolated-*.png` / `qc/release-fidelity-observer-*.png` record this final local evidence.

Visual inspection confirms name tags are near the roof, the auto has ground contact shadow, and the corrected PBR camera improves vehicle surface response. It also confirms existing asset limitations remain: Meshy Cybercab has visible surface scars; live KITT retains inaccurate box shape and a white rear light bar. The separate workshop candidate was not installed or approved by this QA run. These function/performance passes are not evidence of photorealistic assets or physical-phone30FPS.
## Final color-only release delta

The proposed near-tree LOD was rejected and removed from district, loading and service-worker runtime manifests. Final source search found no near-tree runtime references. The only street-material change after the combined +3.34% result changes concrete color constants and its texture channel balance, without adding draw calls, shaders, texture dimensions or geometry. Prior combined result applies to that rendering workload; no new timing was taken during dependency installation.

Final actual mobile regression again passed with no page errors: moderate1.995m/s at1.312m versus full3.182m/s at1.274m, neutral/release/cancel/takeover/keyboard checks, and 330/390/430px single56pxHUD with hidden flight instruments. Updated mobile screenshots show gray concrete and no ghost altitude.

`qc/release-fidelity-final-road.png/json` is the final visual-only road capture (version0.0.31). Its camera and vehicle position match all four combined ABBA runs exactly. Loading cover is gone, inactive flight HUD is hidden, the road is neutral gray, and the player remains grounded. No page errors. All QA browsers closed after these checks.