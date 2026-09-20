# Prepared full-app KITT inspection

Attempt 1 failed at the hidden legacy reset control; its exact report remains `kitt-runtime-inspection-attempt1.json`. Repaired full inspection passed both variants, preserved as `kitt-runtime-inspection-attempt2.json`. Functional paint replication passed, but the painted two-client screenshot is obscured by the Resume ride overlay, so it does not provide clear visual paint evidence.

The subsequent default-black consistency fix passed CPU tests (`kitt-runtime-default-paint-results.json`) and the focused browser run (`kitt-runtime-default-paint-browser.json`). Root inspected the final driver and observer images. Repeat only if relevant behavior changes:

```powershell
node qc/kitt-runtime-inspection.cjs --run-gpu --default-paint-only
```

This mode runs only the candidate with two fresh clients, verifies both actually loaded identical candidate bytes, checks initial local/remote BodyPaint equals legacy black `303b3e`, and checks no paint preference was stored. After functional checks it frames the observer at zoom 21.5 and hides UI using screenshot-only CSS. Outputs are separate `kitt-runtime-default-paint-browser.json` and `kitt-runtime-default-paint-driver.png` / `...-observer.png`; full driving checks and prior reports are not repeated or overwritten. Custom local hex paint remains exact locally; remote paint remains quantized to the existing six wire names.

After reserving the slot, use the existing local app server at `http://127.0.0.1:4173/` and run:

```powershell
node qc/kitt-runtime-inspection.cjs --run-gpu
```

Without `--run-gpu`, script prints preparation status and exits before browser launch. It does not start or stop the app server. It starts and closes a separate ephemeral **local** room server using the actual existing server implementation. It cannot target a public app hostname. Each variant gets two fresh isolated browser contexts with service workers blocked.

The `before` variant intercepts the stable `assets/vehicles/kitt.glb` request with current runtime bytes. The `candidate` variant intercepts that identical URL in both clients with `assets/vehicles/kitt-review/kitt-reference.glb`, keeping vehicle/server ID `kitt`. Candidate-only tuning response sets wheelbase 2.5654 and effective wheel radius 0.324. Read-only inspection hooks expose actual loaded model instances and multiplayer renderer entries; no wheel/scanner behavior is replaced. No production files are copied or edited. If runtime KITT was already replaced, specify `KITT_BASELINE_ASSET` pointing to the real old GLB; identical before/after hashes are rejected. Optional `KITT_CANDIDATE_ASSET` and local `CITY_URL` overrides are supported.

Checks use full-app onboarding, departure UI and the existing auto mode, rather than recreating standalone rig tests:

- Driver creates a real room and observer joins it. Both clients load the same selected GLB hash.
- Parked local/remote screenshots use the same view configuration, with actual pose recorded for comparison.
- Both actual render loops animate scanner intensities. Candidate remote scanner materials retain emissive textures.
- Manual throttle and steering advance local/remote wheels; remote front steering changes through the existing pose-estimation path. Reverse reaches the observer's actual network snapshot.
- Reset uses a **programmatic click of the existing hidden reset handler**, because current visible control-center settings expose pause/camera/exit but no reset action. This does not test a reset UI. Auto-roam uses the actual visible control-center toggle; pause uses the existing Settings-opening auto-pause behavior and resume uses the visible Resume ride overlay. Each control action records its method and `uiTested` flag.
- Driver blue paint reaches the remote replica without changing trim/glass/lamp base colors. Paint is applied through the existing `vehicle-color-change` event, not through color-picker UI, and is recorded as programmatic. Observer then drives a second KITT in red: both clients retain `kitt` ID and independently colored local/remote instances.
- Page errors, failed requests, asset hashes, auto/network/model snapshots, and before/candidate screenshots are saved under `qc/kitt-runtime-*`.

Outputs: `kitt-runtime-inspection-results.json`, parked driver/observer images for each variant, and two-client painted images. Success status is `PASS_REQUIRES_SCREENSHOT_REVIEW`; root still must inspect scene appearance, glass transparency, contact placement and screenshot framing. This script is not a mobile performance benchmark or a service-worker upgrade test. A failed spawn/roam/remote steering wait remains an inspection failure to diagnose, not a reason to fabricate a passing report or disable traffic/collisions.

Each stage prints a concise message and writes a JSON checkpoint. A 15-second heartbeat reports the current stage and elapsed time during slow loading. General action waits are 15 seconds; explicit control clicks are eight seconds. City navigation/onboarding retains longer loading limits with visible heartbeat progress. On failure, both pages are captured before contexts close as `kitt-runtime-<variant>-error-driver.png` and `...-observer.png`, and the report retains the failing stage and any screenshot errors.
