# OpenCity 0.0.28

## Live server repair

Production room server previously rejected cybercab, kitt and cybertruck IDs. Patched only that allowlist, backed up the previous server.mjs and rebuilt the rooms Docker service. Real production WebSocket probes accepted all three IDs plus auto. Local regression test checks snapshots to another peer. Voice configuration was retained.

## Gameplay

- NPC traffic uses smooth lane turns, queues and body collisions. Manual driving and auto-roam stop against NPC vehicles.
- Seven mapped signal heads use shared simulated48-second phases. NPCs obey those phases. These are game timings, not a live traffic-control feed. No stop signs were present in the retained mapped dataset; stop-sign behavior is implemented and tested, but no locations were invented.
- Restored320 mapped one-way segments. NPCs use loop routes and do not reverse instantly at dead ends.
- Distinct arcade acceleration, steering, braking and speeds for each selectable vehicle. Manual boost starts empty, fills from actual movement and drains during use. A blocked or stationary vehicle cannot farm charge.
- Auto-roam uses sustained boosted straight-line targets, anticipates corners and checks collisions in0.4m steps. It preserves the manual reserve. Helicopter automatic flight banks/slows toward route turns. NPC cruise speeds are unchanged.
- Mobile boost indicator stays inside existing instruments. Browser checks at330/390/430px pass.
- Shared GLB geometry and textures are retained when a remote player leaves; only that player's cloned materials are disposed.

## Model quality finding

One Meshy7 job used three generated views and30 credits. All supplied files remained untouched. Blender sources and raw model are on D:.

Three versions are published only at /vehicle-review.html. None passed the requested clean hard-surface quality target. Raw Meshy output has uneven surface shading; smoothing loses panel definition; recolouring damages window boundaries. The main game retains its existing vehicle models. The new geometry-first pipeline requires a reviewed geometry hash and visual evidence before submitting a texture job. No further paid jobs were started.

## Verification

- verify-traffic-simulation.mjs:120seconds,20NPCs, zero overlaps/dead ends; red/green, stop wait, queues, oneway and player contact pass.
- verify-vehicle-physics.mjs: distinct speeds, reserve limits, blocked/idle charging, depletion and frame-rate independence pass.
- verify-auto-roam.mjs: boosted60m/s straight target, corner braking, queue/resume, continuous lane entry and helicopter turn slowdown pass.
- Desktop/mobile world checks and boost browser checks: no page errors;20desktop/8mobile traffic limits.
- Three-model review page: all exports load, synchronized orbit/reset work, no browser errors.
- Same-host Edge SwiftShader comparison (software rendering,1100x760): two-run average median191.7ms baseline versus199.95ms candidate (+4.3%); mean196.82ms versus196.36ms. Both paths are slow on this software renderer. This does not establish phone or hardware-GPU FPS. Traffic remains four draw calls; active signal lenses add one instanced call.

The benchmark preceded the final auto-roam speed change and used the rejected candidate's slightly heavier NPC LOD. The final game retains the lighter prior vehicle assets. The new auto-roam path is separately verified by deterministic and browser checks.

## Still unfinished

Production-quality Cybercab, Cybertruck and Knight Rider replacements with clean panel topology and separate wheel rigs. No claim that the full visual asset backlog is complete.
