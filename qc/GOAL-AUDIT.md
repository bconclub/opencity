# Active goal completion audit

Goal: upgrade the CBD look and feel, bring available vehicle models and route-following/traffic-obeying NPCs into the world, publish complete onboarding for available vehicles, and report the live version.

Previous goal turn classification: progress. Release e903ffa changed authoritative source, passed GitHub validation, and deployed v0.0.29 to www.opencity.world.

| Requirement | Evidence inspected | Status |
| --- | --- | --- |
| Upgrade the scoped CBD street scene | app.js installs district, Vidhana streets, aligned street patch and furniture; assets/streets/README.md records projection and geometric-overlap cleanup; current rendered desktop/mobile screenshots inspected | Implemented and rendered; geography/materials remain a game reconstruction |
| Bring available vehicle models into the experience | Six picker entries; model GLBs and procedural cycle/helicopter; approved Meshy Cybercab metadata and real-model thumbnails; generated daylight environment corrects black metallic rendering | Implemented; Meshy body creases/static wheels and authored-model approximations documented |
| Bring NPC vehicles into the city without uncontrolled rendering cost | npc-traffic.js shared Cybercab LOD, 20 desktop / 8 mobile, distance culling and one material draw call; browser checks on both device layouts | Verified |
| NPCs follow routes and traffic | verified OSM-only directed legal-turn cycles; fair junction admission and clear exit checks; seven mapped signal locations with simulated phases; real-road 600-second test, 20 cars, zero overlap/dead ends, all cars made progress | Verified; no claim of live municipal signal timing or server-synchronized NPCs |
| Complete onboarding for all available vehicles | qc/verify-live-onboarding.cjs uses two actual production-room clients; candidate passed name, Create / Join / Free room, mobile widths, all six ride starts and remote rendering, Resume and remembered-name reconnect | Verified on live v0.0.30 with real service workers and two production-room clients |
| Prepare the scene before asking what to do | city-loading.js waits on district/street/furniture/traffic and GLB/auto/helicopter readiness; hides name dialog until ready; failed-model/retry test passed at330px | Verified locally and on live v0.0.30 |
| Avoid first-install reload/flicker | local-cache.js preserves first controller acquisition; real service-worker lifecycle test proves first install preserves page and later release reloads exactly once | Verified |
| Take it live and report version | v0.0.29 deployment and successful GitHub run are confirmed; v0.0.30 contains final startup fixes | Verified: www.opencity.world serves v0.0.30, all live onboarding checks passed |

Final production report: qc/live-onboarding-audit.json, base https://www.opencity.world/, v0.0.30, service workers enabled, all listed checks passed with zero page errors. Release source commit f1fd503; deployment dpl_4VqjsMBNYJrXXU8Tiwhm7EVS9nAo, READY and aliased to the live domain. GitHub validation succeeded: https://github.com/bconclub/opencity/actions/runs/34523745654. No engine migration, payment implementation, city-wide expansion, or new model-generation charges were introduced.

## Completion finding

The requested current release goal is achieved: the scoped CBD has the upgraded street/vehicle presentation, circulating traffic obeys mapped routing and simulated controls, all six available player rides are reachable through working live onboarding, and the reported live version is 0.0.30. This does not claim that the broader historical wishlist or photorealistic model refinement is finished. The user selected the original Meshy approximation for this release; its remaining surface/rig limitations are preserved honestly.
