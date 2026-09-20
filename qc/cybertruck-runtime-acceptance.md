# Cybertruck revision 2 runtime acceptance

Functional and same-device relative frame-time gates pass. Parent inspected the matched chase screenshots and accepted this as a bounded dimension, bed and tail-light improvement. It remains a schematic original reconstruction, not a high-fidelity scanned/CAD vehicle. This agent did not promote assets, edit runtime modules, commit or deploy.

## Exact comparison

Baseline preserved at `qc/cybertruck-runtime-before.glb`: 429,708 bytes, SHA-256 `0c7a5c0c48b0e5aa2df89029a6ca889b4e3dc0e1f540843affab3bd79b5b556b`.

Candidate `assets/vehicles/cybertruck-review/revision2/cybertruck-reference.glb`: 623,688 bytes, SHA-256 `e6ad2ff4ffc3b4ee4de73600f28eb264e2fc3b3fac65f31ebb0d4f50cda4fc05`.

Both contain 9,072 triangles, 55 mesh primitives and four materials. Candidate adds one embedded lamp palette image and 193,980 download bytes. Measured runtime wheelbase is 3.635000850 m, nominal wheel radius 0.439249992 m. The tiny wheelbase difference from 3.635 m is the Euclidean distance resulting from unequal front/rear track widths. Candidate tuning was intercepted to wheelbase 3.635 and radius 0.43925; baseline tuning was preserved separately for performance comparison.

## Actual app, two clients

`cybertruck-runtime-pre-fix-functional.json` and `cybertruck-runtime-inspection-results.json` preserve the full baseline/candidate functional pass using an actual temporary local room server and two fresh browser contexts. No remote production server was changed.

- Arrow-key throttle and steering work. All four local and remote wheel quaternions advance; both front steering pivots turn.
- Braking and reverse work; negative speed reaches the other client's room snapshot.
- Visible control-center auto-roam toggle moves the vehicle and returns finite ground height. The existing reset handler was invoked programmatically, not claimed as a visible reset UI test.
- Explicit stored white paint initially matches both clients. Driver blue and observer red remain independent with correct remote replication. Tests invoke the existing colour-change event, not the colour-picker UI. Empty saved-paint/default behaviour was not tested here.
- Paint changes preserve glass, trim, lamp material colours and lamp palette samples.
- Candidate loaded front lamp sample is RGBA `[191,232,255,255]`, a cool white. Tail sample is `[255,5,2,255]`, red. Both diffuse and emission maps are present on local and remote lamp materials. Baseline lamps lacked the emission palette and appeared white at the rear.
- No app page errors occurred in the completed runs. Asset response hashes were observed in both clients.

The first failed attempt is preserved in `cybertruck-runtime-attempt1.json`. It caught a harness timing race: physics steering had advanced, but the immediately sampled local wheel mesh still contained the preceding render's neutral pose. The harness now waits for actual local rendered steering pivots before sampling. The successful baseline/candidate rerun is preserved, rather than replacing the failed diagnostic without explanation.

## Remote wheelbase correction

Initial source diagnosis found remote steering inferred with hardcoded 3.3 m instead of candidate 3.635 m, reducing the tangent of steering input by 9.216% at fixed yaw/speed. Parent then added a geometry-derived `model.wheelbase` getter and used it in remote inference, retaining the old value only as preload fallback.

`cybertruck-runtime-steering-cpu.json` verifies the production getter using candidate wheel-node coordinates and evaluates the actual production inference expression for forward and reverse motion.

`cybertruck-runtime-steering.json` records ten actual remote render samples after the correction. Each uses measured 3.635000850 m, and its pre-rig input matches `atan(headingDeltaRadians / dt * wheelbase / speed)` within 1e-10. The loaded wheel rig subsequently clamps input to ±0.65 radians and applies Ackermann; this check does not claim each final wheel yaw equals the inference input. Some sampled inferred values exceed that cap during packet interpolation. That remaining motion limitation predates the wheelbase correction and is not resolved by this asset revision.

## Performance

`cybertruck-runtime-performance.json`: one exclusive Edge SwiftShader browser, one page at a time, static identical 1100 × 800 chase camera, 60 forced-repaint frames per run, ABBA sequence.

| Metric | Baseline | Candidate |
| --- | ---: | ---: |
| Mean frame time | 200.6942 ms | 206.1108 ms |
| Full custom-scene draw calls | 101 | 101 |
| Full custom-scene triangles | 349,184 | 349,184 |
| Auto layer calls, including shadow | 56 | 56 |
| Auto layer triangles, including shadow | 9,074 | 9,074 |
| Auto layer textures | 2 | 3 |

Relative frame-time increase is **2.699%**, below the 10% gate. All camera parameters match across the four runs. Zero app page errors. This is a software-renderer regression gate, not native GPU/mobile FPS or a multiplayer performance measurement.

## Visual evidence and limits

Matched before/candidate parked-driver screenshots show the lower, corrected body profile, exposed dark bed floor and red rear light. The observer screenshot establishes remote placement, but its distant view is not sufficient to judge fine panel quality. Neither this asset nor the surrounding scene should be described as photorealistic.

Root subsequently copied the exact accepted bytes into the stable runtime path, preserved the old binary under `assets/vehicles/cybertruck-review/runtime-before-promotion.glb`, matched local wheelbase/radius tuning, and regenerated only the Cybertruck picker preview. The 640 x 420 preview is 15,402 bytes, loaded the real runtime model without browser errors, and was visually inspected. No public deployment is implied.

All browsers and temporary room servers were closed before releasing the GPU slot.
