# OpenCity parallel work

11 September 2026. Root integrates work; individual agents do not deploy independently.

| Owner | Deliverable | State |
| --- | --- | --- |
| City visuals | Verify whole-release performance with nearby detailed traffic | Software and actual Intel GPU comparisons pass. Hardware road/aerial around 60 Hz; close traffic still has slower tail frames |
| Independent review | Check traffic integration and actual-hardware anti-aliasing | Traffic checks pass. 4x MSAA experiment improves edges on Intel; hardware-aware integration remains pending |
| Blender vehicles | Preserve accepted Cybercab detail and animate nearby NPC wheels | Five shared near batches integrated locally; max two desktop / one mobile. Rejected decimated model excluded |
| Traffic behavior | Brake before sharp curves; verify queues and collision handling | Integrated; six fleet scenarios and runtime soak passed |
| Vehicle physics | Legal one-way spawning and manual/auto-roam transitions | Implemented and tested; documented in release evidence |
| Street patch | Repair 500 m junction omission without removing mapped obstacles | Rebuilt candidate closes measured gap; scene confirms local improvement. Adjacent grey geometry and kerb slivers still prevent broad promotion |
| Street furniture | Match mapped lights to reference fixture shapes | Reference gaps recorded; no unsupported placements added |
| Root | Visual acceptance, exact-file integration, staging and release | Nearby traffic committed locally as 004e1ca; isolated street-gap evidence daf95fd; pushed review head d170f22; production unchanged |

Rendering and Blender jobs use one resource slot at a time so benchmarks remain comparable. Source review, script preparation and integration planning run concurrently.

The latest review-branch push is awaiting explicit upload approval after automatic approval review rejected it. Vercel authentication is also expired. Local completion, review upload and public deployment are separate states.

Remaining quality work includes the incomplete 500 m street patch, reference-based fixtures, landmark details and physical-phone testing. Far NPC wheels remain static by design; nearby cabs now roll and steer. Passing relative performance checks does not establish high-fidelity completion or playable phone frame rates.
