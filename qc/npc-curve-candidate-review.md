# Isolated NPC bend-speed candidate

Root reviewed and accepted the exact patch. It is now integrated into `traffic-simulation.js`. No graph, geometry, control phase, route selection or collision priority changed.

Original traffic implementation is preserved in `qc/npc-curve-baseline.mjs` with only its relative import adjusted. Comparison/build harnesses are pinned to that baseline. Earlier fixture/report results are retained as `*-before-integration.*`; the earlier six-scenario and CPU results remain unchanged. Focused fixtures now import actual production code and write `qc/npc-curve-integrated-fixtures.json`. Regenerating the candidate from the preserved baseline exactly matches normalized production code. Hashes and verification receipt: `qc/npc-curve-integration.json`.

Post-integration checks passed: focused hard-bend/cache/degenerate/immutability fixtures, `verify-auto-roam.mjs`, and `verify-traffic-simulation.mjs`. The latter includes signals, stops, four-way reservation fairness, player collisions and a600-second20-NPC real-road soak: zero overlaps, minimum1,125.78 m per NPC, maximum40 s stop. No git operations or deployment performed.

## Exact change

`qc/npc-curve-runtime.patch` contains the complete proposed diff for `traffic-simulation.js`: one target-speed expression calls `npcCurveSpeed` instead of using cruise alone; the helper is appended. `qc/npc-curve-candidate.mjs` is an executable isolated copy with its relative import adjusted to run inside qc. `qc/npc-curve-speed-helper.txt` contains only the added helper. Rebuild with `node qc/npc-curve-candidate-build.mjs`.

The helper walks a clone of the already-selected route far enough ahead to brake from cruise. For each encountered existing quadratic turn, it computes exact peak curvature from the quadratic derivative, then caches that curve's speed cap by incoming/outgoing directed edge pair on its graph. It does not generate new centre lines or numerically sample curvature every tick. Existing route walker supplies turn geometry; no route or visit-count mutation escapes the cloned preview.

Simulation tuning: lateral-acceleration target 2.5 m/s², preview braking 2.8 m/s², 1.5 m anticipation margin. These are chosen game feel values, not measured vehicle specifications. Braking preview uses `sqrt(bendSpeed² + 2 * 2.8 * availableDistance)`. Existing 1.8 m/s² acceleration and 4 m/s² braking integration remain unchanged. Signals, stop signs, reservations and vehicle/player obstruction still impose tighter limits when needed.

## Independently reproduced hard bend

Fixture follows actual legal edges 391 -> 511 -> 195, with an earlier visit to straight branch285 so the existing least-visited route selector takes the observed bend. It checks the selected next edge explicitly. This avoids accidentally testing the much gentler straight branch. It measures heading changes from actual positions/headings returned by `tickTraffic`; it does not assert that the helper repeats its own formula.

At the offending bend near 77.590735,12.977854:

| Measurement | Baseline | Candidate |
|---|---|---|
| Bend entry speed | 7.00 m/s | 1.93 m/s |
| Peak heading rate at 0.05 s | 266.27 degrees/s | 74.08 degrees/s |
| Sampled lateral estimate at 0.05 s | 32.53 m/s² | 2.50 m/s² |
| Peak heading rate at 0.10 s | 260.60 degrees/s | 73.92 degrees/s |
| Sampled lateral estimate at 0.10 s | 31.84 m/s² | 2.49 m/s² |

Braking occurs before bend entry. Maximum observed deceleration is 2.98 m/s², below the unchanged 4 m/s² integration bound. Every fixture step verifies no speed snap, and preview does not mutate the live path. Straight cruise remains unchanged. The fixture uses the same `loadDrivingData()` merged source and verified OSM filter as production, with exact edge geometry included in its report. Run `node qc/npc-curve-fixtures.mjs`; details are in `qc/npc-curve-fixtures.json`.

Focused checks also pass for collinear and zero-length degenerate curves, cached versus uncached immutable previews, and different vehicle cruise speeds using the same cached curve. The cache depends on fixed graph geometry and directed incoming/outgoing edges. Current runtime graphs are immutable after construction; any future geometry edits must create a new graph or explicitly invalidate the cache.

## Current-route regression suite

Run `node qc/npc-curve-candidate-audit.mjs`. All six baseline scenarios passed again after curvature caching: 20/8 NPCs, no player or cross-lane player stopped from30 to90 s, 0.05/0.10 s steps, and signal offsets0/23 s. Each runs600 s using current production graph/data and the same spawn rules.

- Zero NPC/player overlap frames, illegal directions or ended routes.
- Every NPC travels at least1,125 m; no starvation assertion fails.
- Longest ordinary stop40.0 s versus34.45 s baseline, reflecting slower junction clearance.
- Deliberate player obstruction causes56.7 s stop in both implementations. Queue resumes within0.1 to0.2 s after player removal.
- Maximum full-fleet heading step falls from13.29 to3.70 degrees at0.05 s, and25.23 to7.39 degrees at0.10 s.

## CPU cost

`node qc/npc-curve-cpu.mjs`: six alternating runs, three per implementation,20 NPCs,200 warmup then1,400 measured ticks each. Mean per-tick CPU time is0.8642 ms baseline and0.8684 ms candidate, +0.0042 ms (+0.49%). Mean run median is0.8158 versus0.8218 ms; mean run p95 is1.2619 versus1.2991 ms. Raw results are in `qc/npc-curve-cpu.json`.

This is a same-machine CPU comparison, not a GPU frame-time benchmark. Moving fleets diverge after braking, so the small measured difference includes changed proximity/collision work and timing noise. Browser appearance and frame-time checks remain with the parent's visual/performance work. Runtime integration followed explicit parent approval after candidate review.
