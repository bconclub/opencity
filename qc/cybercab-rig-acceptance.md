# Cybercab wheel-rig candidate acceptance

2026-09-11. Local v0.0.31 scene; candidate asset selected by current player/remote loader. NPC traffic asset unchanged.

## Controlled whole-scene comparison

`cybercab-rig-benchmark.cjs` ran baseline/candidate/candidate/baseline, 60 animation frames per run, Edge headless SwiftShader, 1100 x 760, one page at a time. Root confirmed no concurrent rendering. Baseline request interception uses exact pre-switch `cybercab-rig-baseline-loader.js`. Both cases use same local HTTP server, blocked service worker and multiplayer client. Every run has exactly equal map camera, player position, 20 visible NPCs, and non-player layer counts. No page errors.

| Measurement | Original Cybercab | Rigged Cybercab |
|---|---:|---:|
| Mean frame time, pooled two runs | 246.8175 ms | 243.3950 ms |
| Individual means | 242.4267, 251.2083 ms | 247.3333, 239.4567 ms |
| Custom-layer draw calls | 47 | 59 |
| Custom-layer triangles | 465,772 | 465,591 |
| Player layer draw calls | 2 | 14 |
| Player layer triangles including contact shadow | 24,850 | 24,669 |
| Same-origin decoded resources | 20,024,508 bytes | 19,926,032 bytes |
| Player GLB | 4,535,896 bytes | 4,437,428 bytes |

Frame-time delta **-1.39%**, passes requested <=10% regression gate. Difference is within run variability, so this establishes no measured regression, not a speed improvement. Physical mobile/hardware-GPU performance is not established by SwiftShader. Draw calls increase because independent wheel parts now render separately. All non-player render counts remain identical.

Candidate GLB is 98,468 bytes smaller (2.17%). Baseline and candidate load identical NPC GLB. Exact asset hashes saved in `cybercab-rig-asset-check.json`.

Evidence: `cybercab-rig-abba.json`, `cybercab-rig-abba-0-baseline.png`, `cybercab-rig-abba-1-candidate.png`. Pre-switch baseline repetitions also saved separately in `cybercab-rig-baseline.json`.

## In-scene motion and visual check

`cybercab-rig-driving.cjs` exercised real keyboard acceleration and steering, then braking. Side camera orbits 70 degrees using existing camera controls. Moving-turn sample: 3.71 m travelled, speed 6.02 m/s, wheel rotation 10.16 radians, steering 0.312 radians, zero impacts at sample. Screenshot shows attached wheels seated in arches without the previous deformed embedded tire surfaces. Body retains original Meshy texture scratches and irregular panel edges; this is a wheel repair, not a high-fidelity body reconstruction.

After braking speed reaches effectively zero, but four collision contacts occur between moving sample and stop. Therefore this run does not isolate brake stopping distance from traffic contact. No JavaScript errors. Rig spin/Ackermann/no-drift geometry tests were run separately by root in `verify-cybercab-repair.cjs`.

Evidence: `cybercab-rig-driving.json`, `cybercab-rig-driving-parked.png`, `cybercab-rig-driving-turn.png`. Wheel clearance assessed at tested pose only; no exhaustive suspension/kerb envelope claim. This check stubs multiplayer, so newly rigged remote vehicle rendering requires root's room regression.

## Independent room regression

Root subsequently ran `node qc/cybercab-rig-remote.cjs` against two real local
WebSocket clients with service workers disabled. Room creation/join, Cybercab
selection, remote actor and name tag, and movement synchronization passed.
The remote actor reported 0.922 m/s and 1.558 radians of accumulated wheel
rotation; one remote actor and one visible driver label were present. No page
errors. `cybercab-rig-remote.json` and paired local/observer screenshots preserve
the results. Actual geometry spin/Ackermann checks are in
`cybercab-repair-rig.json`; this room screenshot is not a close-up wheel study.
