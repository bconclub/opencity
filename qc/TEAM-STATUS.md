# OpenCity parallel work

11 September 2026. Root integrates work; individual agents do not deploy independently.

| Owner | Deliverable | State |
| --- | --- | --- |
| City visuals | Correct generic facade and parapet winding; verify full-release frame cost | Integrated locally; cumulative road +2.69%, aerial +4.53% versus release baseline |
| Independent review | Check geometry, UVs, targeting and candidate integration | No blocking defect found; startup loop cleanup verified to preserve exact rendered geometry/materials |
| Blender vehicles | Build a separate NPC Cybercab LOD with four wheel pivots | Blender exported 5,996 triangles with intact image payloads and pivots; root rejected visible windshield/body degradation. Runtime unchanged |
| Traffic behavior | Brake before sharp curves; verify queues and collision handling | Integrated; six fleet scenarios and runtime soak passed |
| Vehicle physics | Legal one-way spawning and manual/auto-roam transitions | Implemented and tested; documented in release evidence |
| Street patch | Preserve near-road detail while reducing unnecessary shader sampling | Integrated locally; cumulative road +7.38%, aerial -2.81% versus release baseline |
| Street furniture | Match mapped lights to reference fixture shapes | Reference gaps recorded; no unsupported placements added |
| Root | Visual acceptance, exact-file integration, staging and release | Facade integration committed locally as 14d7fbf; pushed review head d170f22; production unchanged |

Rendering and Blender jobs use one resource slot at a time so benchmarks remain comparable. Source review, script preparation and integration planning run concurrently.

The latest review-branch push is awaiting explicit upload approval after automatic approval review rejected it. Vercel authentication is also expired. Local completion, review upload and public deployment are separate states.

Remaining quality work includes static NPC wheels, the incomplete 500 m street patch, reference-based fixtures, landmark details and physical-phone testing. Passing relative performance checks does not establish high-fidelity completion or playable phone frame rates.
