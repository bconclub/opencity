# Camera and dome QC, v0.0.10

2026-09-09. Headless Edge, 1440 x 900, SwiftShader. Fresh browser context, service workers blocked so checks use current local files. Automated checks pass with zero page errors. GPU/FPS results from this software-rendered environment do not represent physical user hardware.

## Passed

- Auto entered using `[data-ride=auto]`.
- Canvas drag changed orbit yaw from 0 to -87.5 degrees and elevation from 12 to 34.5 degrees. Actual map bearing changed from 167.65 to 80.15 degrees and pitch from 70 to 55.47 degrees.
- Orbit remained identical after release, 600 ms of animation, and subsequent forward driving. No snap back to default.
- Wheel scroll reduced orbit radius from 13 to 9.07 m, increasing zoom from 22.917 to 23.436. Drag also works while paused.
- Dome layer is loaded and renders cyan shell/grid arcs. Screenshot inspected.
- Static pointer alignment is consistent: CSS dot at viewport 50% X / 36% Y (`focus-pointer.css:2`) maps to NDC X=0/Y=.28 used by raycast (`district.js:103`). Pointer is deliberately helicopter-chase-only (`focus-pointer.js:8`), not active for auto. Actual flight target dwell identification was not exercised by this camera test.

## Defects found and now fixed

1. **Full dome does not fit overview.** `cbd-dome.js:15` requests zoom 14.4 but `app.js:29` maxBounds clamps actual overview to 15.70 at this viewport. Screenshot shows cyan arcs crossing screen rather than complete hemisphere and circular rim. Temporarily loosen map bounds for overview or configure wider overview bounds, then restore driving limits independently.
2. **Back to ride does not return camera while auto paused.** `cbd-dome.js:18` restores saved camera only if no vehicle is active; `auto-mode.js:33` updates chase camera only when unpaused. Reproduced: after toggling overview off, overview state false but actual bearing -25, pitch55 and zoom15.70 unchanged. Explicitly apply vehicle camera when exiting overview, including paused states.
3. **Overview button becomes stale after drag/scroll.** `auto-mode.js:39` and `auto-mode.js:42` set `domeOverview=false` without updating button text/ARIA. Reproduced: actual chase resumed and state false, but `#dome-view-toggle` still has `aria-pressed=true` and text "Back to ride". Use one shared overview setter for state and UI.
4. **Low chase elevation is clamped by map pitch.** Initial requested elevation12 implies pitch near78, but `app.js:29` maxPitch70 clamps actual view. Orbit clamp permits elevation4 (`auto-mode.js:40`), which cannot be represented with current pitch limit. This partially explains road-facing appearance. Align elevation minimum with pitch maximum, or deliberately support higher maxPitch after rendering checks.

## Reproduce

Run `node verify-camera-qc.cjs` while server is available at localhost:4173. Main drag/zoom assertions fail hard; known dome defects are emitted as state comparisons so fixes can be verified separately.

Artifacts: `D:/CodexTools/Blender/camera-qc-dome.png`, `D:/CodexTools/Blender/camera-qc-orbit.png`. No shared app code changed.

## Fix verification

All four defects above fixed locally in app.js, cbd-dome.js and auto-mode.js. Browser rerun confirms overview zoom14.4, complete hemisphere and rim visibly framed, paused return zoom23.44, drag/scroll button ARIA false, initial chase pitch77.99. Shared setDomeOverview helper synchronizes overview state, camera-only bounds and UI. Leaving overview restores prior maxBounds; physical vehicle world bounds and domeLimit unchanged. Auto orbit minimum elevation6 with maxPitch85 keeps camera above ground and avoids pitch90. Test now hard-asserts these fixes. Initial scene intentionally enters overview; flight entry should call the shared setter false before normal chase, coordinated with parent agent.
