# Active goal completion audit

Goal: upgrade the CBD look and feel, bring available vehicle models and route-following/traffic-obeying NPCs into the world, publish complete onboarding for available vehicles, and report the live version.

Previous goal turn classification: progress. Release e903ffa changed authoritative source, passed GitHub validation, and deployed v0.0.29 to www.opencity.world.

| Requirement | Evidence inspected | Status |
| --- | --- | --- |
| Upgrade the scoped CBD street scene | app.js installs district, Vidhana streets, aligned street patch and furniture; assets/streets/README.md records projection and geometric-overlap cleanup; current rendered desktop/mobile screenshots inspected | Implemented and rendered; geography/materials remain a game reconstruction |
| Bring available vehicle models into the experience | Six picker entries; model GLBs and procedural cycle/helicopter; approved Meshy Cybercab metadata and real-model thumbnails; generated daylight environment corrects black metallic rendering | Implemented; Meshy body creases/static wheels and authored-model approximations documented |
| Bring NPC vehicles into the city without uncontrolled rendering cost | npc-traffic.js shared Cybercab LOD, 20 desktop / 8 mobile, distance culling and one material draw call; browser checks on both device layouts | Verified |
| NPCs follow routes and traffic | verified OSM-only directed legal-turn cycles; fair junction admission and clear exit checks; seven mapped signal locations with simulated phases; real-road 600-second test, 20 cars, zero overlap/dead ends, all cars made progress | Verified; no claim of live municipal signal timing or server-synchronized NPCs |
| Complete onboarding for all available vehicles | qc/verify-live-onboarding.cjs uses two actual production-room clients; candidate passed name, Create / Join / Free room, mobile widths, all six ride starts and remote rendering, Resume and remembered-name reconnect | Candidate verified; final live v0.0.30 check pending |
| Prepare the scene before asking what to do | city-loading.js waits on district/street/furniture/traffic and GLB/auto/helicopter readiness; hides name dialog until ready; failed-model/retry test passed at330px | Candidate verified |
| Avoid first-install reload/flicker | local-cache.js preserves first controller acquisition; real service-worker lifecycle test proves first install preserves page and later release reloads exactly once | Verified |
| Take it live and report version | v0.0.29 deployment and successful GitHub run are confirmed; v0.0.30 contains final startup fixes | v0.0.30 deployment and final verification pending |

Test report before the release metadata bump is qc/live-onboarding-audit.json (it still records v0.0.29). Final production audit will replace it after deployment. No engine migration, payment implementation, city-wide expansion, or new model-generation charges were introduced.
