# OpenCity parallel work

11 September 2026. Root integrates work; individual agents do not deploy independently.

| Owner | Deliverable | State |
| --- | --- | --- |
| City visuals | Vidhana frontage geometry and staircase filtering | Analytic stair shading accepted with shadows,45physical steps retained. Final native four-pose gate passes, worst +6.40%; timing drift documented. Independent integration audit found rejected rotation retained by physics, fix underway before promotion |
| Independent review | Passage clearance, stairs and automatic route access | Actual two-client browser checks pass passage both ways, full-body front/side stair stops, private-route exclusion, pause/resume, remote rendering and real helicopter dwell. New steering-near-stair regression added after independent audit |
| Blender vehicles | Audit supplied assets and original model links | No overlooked better supplied KITT/Cybertruck found. Original Sketchfab downloads disabled. Existing accepted rigged assets remain; source details in supplied-vehicle-inventory.md and original-sketchfab-availability.md |
| Traffic behavior | Brake before sharp curves; verify queues and collision handling | Integrated; six fleet scenarios and runtime soak passed |
| Vehicle physics | Legal one-way spawning and manual/auto-roam transitions | Implemented and tested; documented in release evidence |
| Street patch | Combine verified street geometry and qualify routes | Missing source way1091198032 restored, native three-arm junction replaces malformed cap. Basic source-contiguous road arc extends to560.273m including width; detail stays500m.85 overlapping auto-road surfaces clipped, graph unchanged. Idle/active visual checks pass; southern join and cumulative timing remain |
| Street furniture | Match mapped lights to reference fixture shapes | Reference gaps recorded; no unsupported placements added |
| Root | Visual acceptance, exact-file integration, staging and release | Frontage, focus, full-body stairs/passage and rejected-heading rollback integrated locally9df5546. Browser two-client checks and578 steering poses pass. Street composition receives final cumulative review next. Latest pushed review head remains d170f22; production unchanged |

Rendering and Blender jobs use one resource slot at a time so benchmarks remain comparable. Source review, script preparation and integration planning run concurrently.

The latest review-branch push is awaiting explicit upload approval after automatic approval review rejected it. Vercel authentication is also expired. Local completion, review upload and public deployment are separate states.

Remaining quality work includes the incomplete 500 m street patch, reference-based fixtures, landmark details and physical-phone testing. Far NPC wheels remain static by design; nearby cabs now roll and steer. Passing relative performance checks does not establish high-fidelity completion or playable phone frame rates.
