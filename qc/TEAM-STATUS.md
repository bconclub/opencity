# OpenCity parallel work

11 September 2026. Root integrates work; individual agents do not deploy independently.

| Owner | Deliverable | State |
| --- | --- | --- |
| City visuals | Verify renderer repair and mobile input | Complete. MapLibre5.7.2 fixes reproduced transition; full-HD AA-off comparison passes. Both AA-on tiers rejected. Actual touch tests pass at330/390/430 after pause-input correction |
| Independent review | Trace renderer error and pause lifecycle | Exact upstream tile fix identified; input reset candidate reviewed. Root integrated the three verified pause files; AA policy archived and removed from runtime |
| Blender vehicles | Audit supplied assets and original model links | No overlooked better supplied KITT/Cybertruck found. Original Sketchfab downloads disabled. Existing accepted rigged assets remain; source details in supplied-vehicle-inventory.md and original-sketchfab-availability.md |
| Traffic behavior | Brake before sharp curves; verify queues and collision handling | Integrated; six fleet scenarios and runtime soak passed |
| Vehicle physics | Legal one-way spawning and manual/auto-roam transitions | Implemented and tested; documented in release evidence |
| Street patch | Repair 500 m junction omission and asphalt mismatch | Rebuilt candidate closes measured gap. Matched native-GPU views accept a bounded 7.50 square metre asphalt material repair; native kerb slivers and joins still prevent broad promotion |
| Street furniture | Match mapped lights to reference fixture shapes | Reference gaps recorded; no unsupported placements added |
| Root | Visual acceptance, exact-file integration, staging and release | Renderer and mobile input fixes integrated; all110 staged files match. Asphalt material evidence committed a9ab537, AA rejection65e4fc0. Latest pushed review head remains d170f22; production unchanged |

Rendering and Blender jobs use one resource slot at a time so benchmarks remain comparable. Source review, script preparation and integration planning run concurrently.

The latest review-branch push is awaiting explicit upload approval after automatic approval review rejected it. Vercel authentication is also expired. Local completion, review upload and public deployment are separate states.

Remaining quality work includes the incomplete 500 m street patch, reference-based fixtures, landmark details and physical-phone testing. Far NPC wheels remain static by design; nearby cabs now roll and steer. Passing relative performance checks does not establish high-fidelity completion or playable phone frame rates.
