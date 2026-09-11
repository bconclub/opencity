# OpenCity parallel work

11 September 2026. Root integrates work; individual agents do not deploy independently.

| Owner | Deliverable | State |
| --- | --- | --- |
| City visuals | Vidhana frontage geometry and staircase filtering | Revised dome/columns/stairs preserve other landmarks and pass native four-pose performance gate, worst +3.49%. Stair moire remains visibly unacceptable; isolated filtering diagnosis underway. No geometry promotion |
| Independent review | Passage clearance, stairs and automatic route access | Found mapped passage under landing blocked by old coarse collider. Isolated candidate opens58 false positives and preserves31,314 other outcomes. Browser drive-through and functional private-route exclusion underway |
| Blender vehicles | Audit supplied assets and original model links | No overlooked better supplied KITT/Cybertruck found. Original Sketchfab downloads disabled. Existing accepted rigged assets remain; source details in supplied-vehicle-inventory.md and original-sketchfab-availability.md |
| Traffic behavior | Brake before sharp curves; verify queues and collision handling | Integrated; six fleet scenarios and runtime soak passed |
| Vehicle physics | Legal one-way spawning and manual/auto-roam transitions | Implemented and tested; documented in release evidence |
| Street patch | Combine verified street geometry and qualify routes | Internal kerb spear removed without changing road footprint. Single-car island-safe source route fixture passes, not yet qualified for traffic. Final combined asset assembly underway;22 boundary handoffs unverified |
| Street furniture | Match mapped lights to reference fixture shapes | Reference gaps recorded; no unsupported placements added |
| Root | Visual acceptance, exact-file integration, staging and release | Runtime remains58c4ed4. Candidate geometry, junction and focus evidence saved locally680fe7a. Focus tests remove hidden source geometry from selection and use measured model heights. Latest pushed review head remains d170f22; production unchanged |

Rendering and Blender jobs use one resource slot at a time so benchmarks remain comparable. Source review, script preparation and integration planning run concurrently.

The latest review-branch push is awaiting explicit upload approval after automatic approval review rejected it. Vercel authentication is also expired. Local completion, review upload and public deployment are separate states.

Remaining quality work includes the incomplete 500 m street patch, reference-based fixtures, landmark details and physical-phone testing. Far NPC wheels remain static by design; nearby cabs now roll and steer. Passing relative performance checks does not establish high-fidelity completion or playable phone frame rates.
