# Current traffic routing and collision audit

Confidence high for these deterministic local-code scenarios. No persistent deadlock, immediate reversal, vehicle overlap, illegal one-way traversal or route termination reproduced. No runtime change made.

## Reproduction

Run `node qc/traffic-production-audit.mjs` from the project directory. The script imports current `traffic-simulation.js`, `auto-roads.js` and `loadDrivingData()`, replacing fetch with local file reads only. It uses the production verified-OSM filter, CBD ellipse, directed-loop pruning and spawn ordering from `npc-traffic.js`. Current merged data contains 9,197 features, of which 746 pass the verified filter. These are currently enabled routes, not the isolated/rejected 500 m candidates.

Each scenario runs 600 simulated seconds. Controls are current mapped furniture with simulated signal phases. Source SHA256 hashes, individual vehicle trajectories summarized in 60-second progress windows, exact peak-turn records and all outcomes are in `qc/traffic-production-audit.json`.

| Fleet | Player obstruction | Step | Signal offset | Minimum vehicle distance | Longest stop |
|---|---|---|---|---|---|
| 20 desktop | None | 0.05 s | 0 s | 1,234.09 m | 34.45 s |
| 8 mobile | None | 0.05 s | 0 s | 2,294.15 m | 34.40 s |
| 20 desktop | 30 to 90 s | 0.05 s | 0 s | 1,234.09 m | 56.70 s |
| 8 mobile | 30 to 90 s | 0.05 s | 0 s | 2,083.39 m | 56.70 s |
| 20 desktop | 30 to 90 s | 0.10 s | 23 s | 1,234.08 m | 56.70 s |
| 8 mobile | 30 to 90 s | 0.10 s | 23 s | 2,002.14 m | 56.70 s |

All six fleets reached their requested population. Across all six: zero overlap frames between NPCs or with the player, zero illegal directions, zero ended routes, and zero complete 60-second windows without progress for any vehicle.

The obstruction is a stationary 5.7 x 2.1 m player body placed perpendicular to a valid lane, 15 route metres ahead of an NPC at 30 s, after ensuring the body does not appear overlapping another car. At 90 s it is removed. The targeted NPC stopped for 56.7 s, then moved over 5 cm within 0.1 to 0.2 s after removal and travelled another 1,565 to 2,001 m. This tests queue release explicitly rather than accepting a permanent block as a legitimate stop.

## Separate sharp-turn observation

The largest sampled heading change is on current edge 511 near longitude 77.590735, latitude 12.977854. The car is already on a turn curve, travelling at its 7 m/s cruise. Heading changes 13.29 degrees over 0.05 s, or up to 25.23 degrees over 0.10 s in the slower-step scenario. No immediate reversal occurs, but this is a fast-looking tight turn. The sampled yaw rate implies roughly 1.5 to 1.6 m centre-path radius and about 31 to 32 m/s² lateral acceleration if interpreted as physical motion.

The cause is visible in `tickTraffic`: target speed is limited by cruise, obstacle distance, controls and reservations, but not by route curvature. A narrow potential follow-up is to preview route curvature and cap turn speed using a lateral-acceleration bound, with advance braking before the curve. That can improve presentation without changing graph connectivity, adding roads, reversing cars or weakening collision checks. Any follow-up must rerun this same queue/progress suite, because slower junction clearance changes reservation timing. No runtime fix has been applied or required for the tested deadlock/reversal cases.

## Limits

This is a CPU audit of the checked-in runtime and data, not a network assertion that every deployed file is identical. It does not render the models, validate wheel/kerb clearance, prove every possible signal phase or dynamically placed player obstruction, or qualify the rejected 500 m road candidates. Fleet collision tests use the actual production collision dimensions and algorithms. The blocker is removed cleanly; an indefinitely obstructing player is expected to hold traffic.
