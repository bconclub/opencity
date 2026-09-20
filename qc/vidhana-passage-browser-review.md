# Vidhana passage: browser verification

The isolated V2 composition passes functional browser checks. This is evidence for the passage/collision/focus changes, not a complete frontage release or a frame-time claim.

## Verified

- Real local HTTP fixture and local WebSocket room server, two independent browser contexts.
- Manual Cybertruck driving crosses both passage portals in each direction with zero impacts.
- Front and side approaches stop against the new stair run.
- Pausing holds vehicle position; resuming does not retain keyboard input.
- Public-road auto-roam starts; manual steering takes control.
- The actual browser manual graph remains identical to unmodified graph construction: 3,803 edges.
- The public tour graph excludes all 18 split features belonging to the three mapped passage/private-approach ways. Manual edges remain available.
- The second client renders one remote Cybertruck and receives its current passage pose.
- The actual district screen ray hits the central crown and reports 39.79999923706055 m, with reconstructed-model attribution. This V2 check is a ray check while paused, not a two-second helicopter dwell UI test.
- No application asset misses or page errors in the passing run.

Authoritative result: `vidhana-passage-browser-v2-results.json`, including the exact 111-file snapshot manifest. Selected landmark source SHA-256: `b73b26f0000790dfa30c53ffd56ab16a9b04a5230112feb30c72e972529c2989`.

## Transport diagnosis and failed attempts

The earlier harness intercepted the entire localhost document with Playwright `route.fulfill`. Edge classified that synthetic response such that its WebSocket request failed with `ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`; no request reached the room server's upgrade handler. A minimal non-WebGL diagnostic reproduced that exact error. Serving real HTTP bytes from a loopback fixture in the same process reaches the unmodified room server immediately. No security flags or permission overrides were used.

V2 first reached room creation, then failed a harness assumption of three features: road preprocessing creates 18 segments from those three source ways. The assertion now checks three unique IDs and every segment. The next run passed all gameplay checks but rejected the browser's conventional `/favicon.ico` probe as an application miss. The fixture now returns 204 for that one icon request; all application requests still require manifest entries. Failed JSON and screenshots are preserved under `attempt1` and `attempt2` names.

The V2 stair and focus screenshots include the pause overlay and are not suitable for clear geometry comparison. The production-composition browser harness is prepared separately to capture unpaused stair approaches and actual helicopter dwell UI. V2 evidence stays frozen.

## Production composition

`frontage-runtime-browser-prepare.cjs` consumes the exact nine files from `frontage-runtime-candidate`, validates their hashes, and adds the chosen landmark module. Test-only hooks establish starting positions and expose actual graphs. It uses the production `getDistrictArchitecture()` export and existing district/preload ordering, without the V2 global architecture promise.

No runtime files, deployment, room-server installation, or Git state were changed by this verification task.

## Full-body correction after V2

Inspection of the V2 stop pose found a material limitation: its generic probes stopped the Cybertruck center about1.48m from the stairs while its actual front extends2.6708m from its origin. The center stopped but the visual body could overlap the stair run. V2 must not be presented as full-body clearance evidence.

The newer isolated modules replace stair capsule probes with oriented-rectangle/convex-polygon SAT when a selected model footprint is supplied. Visible model bounds are measured before the contact shadow is added; hidden auto fallback geometry is excluded. The bounds preserve asymmetric front/rear extents. They include8cm clearance and conservative padding for0.08rad suspension pitch plus each vehicle profile's maximum lean. A cached envelope avoids mesh traversal in the physics loop.

The same selected envelope gates the passage override's lateral clearance, so an angled or oversized body cannot bypass the mapped building collider merely because its center fits. Existing unrelated building and NPC colliders remain their old generic approximations; this change does not claim to fix their body undercoverage.

`vehicle-footprint-results.json` records120 stair edge/angle approaches, independently checked by polygon clipping, and2,930 bidirectional passage samples across Cybertruck, Cybercab, Knight Rider, auto and cycle. All pass with zero model/stair overlap at the last clear position. Real ground-physics frontal stops also pass. Additional checks sample suspension/lean bounds, passage-side violations, sideways long vehicles, hidden fallback exclusion, contact-shadow exclusion and neutral-footprint caching. Four vehicle measurements derive from GLB node/accessor bounds; cycle uses its actual procedural model including rider. Browser checks of selected rendered models remain required.

`frontage-footprint-adapter.mjs` adds the measured footprint to the production review composition, shares its getter across stairs and passage, and rejects an obstructed departure without teleporting. Entry failure calls the existing exit path to restore UI/camera state. Rejected reset retains the prior pose.

## Final browser result

`frontage-runtime-browser-results.json` passes the updated production composition plus selected analytic-stair landmark module. Its112-file manifest includes ten exact production override hashes, and marks the two placement/inspection hooks separately. The landmark SHA-256 is `74ef4d3e12c737a70361386e7db9f83455b395befae5cf6ab2b4d93b9bccc110`.

The browser completes both passage drives, frontal/side stair stops, actual manual/public graph checks, public auto-roam/manual takeover, pause/resume and remote Cybertruck pose rendering. A stair-intersecting test seed is rejected with its previous pose retained. The runtime departure rollback branch is source-reviewed; that test seed is not a separate browser execution of a failed departure menu choice.

After actual helicopter entry and takeoff, the test places a stationary initial pose above the real62m flight floor. Real flight dynamics, chase camera, screen ray and untouched focus UI continue running. The two-second dwell circle reaches100%, displays Vidhana Soudha, and shows40m rounded model height derived from39.799999m geometry. An earlier final-harness attempt placed its hover pose below the62m floor, so the craft moved away from its initial ray; that setup failure is preserved as `frontage-runtime-browser-attempt1-failure.*`.

`frontage-runtime-body-audit.json` independently projects the browser-selected Cybertruck bounds with its recorded suspension pitch, lean, heading and stopped position, then polygon-clips against the stair run. Both unpaused stop poses have0m² body overlap, with59 frontal and64 side contact events. This audit supplements the center-position stop test rather than substituting it for full-body clearance.

Clear captures: `frontage-runtime-stair-front.png`, `frontage-runtime-stair-side.png`, `frontage-runtime-passage-1.png`, `frontage-runtime-passage--1.png`, `frontage-runtime-focus-dwell.png`. The latter visibly shows the completed ring and reconstructed-height card. These are visual/functional captures, not a performance benchmark or physical-phone result.

Reproduce after restoring exact source revisions and candidate files:

```powershell
node qc/frontage-runtime-browser-prepare.cjs qc/vidhana-stair-analytic-v2-shadow-on-bundle.js
node qc/frontage-runtime-browser.cjs
node qc/frontage-runtime-body-audit.mjs
```

The preparation reads unchanged baseline assets directly from Git commit733fd3337caaf98b334c174e218e00820b447216 and validates hashes. It does not depend on an old snapshot directory. The browser starts and closes its own real loopback HTTP and room servers; no production endpoint is used.

## Collision rotation follow-up

A subsequent code audit found that rejected translation could still commit the candidate heading. The root team prepared the two-line collision-pose rollback in `auto-physics-pose-candidate.js`, SHA-256 `7995ed841e7ae9295867326f54146d04bbca277b91c02335a85ab09797789c65`. The bounded follow-up fixture changes only that production file; geometry, focus, roads and other application sources remain identical to the passing full-composition fixture.

`frontage-rotation-browser-results.json` records300 right-steering and278 left-steering poses while the driver holds throttle against the stairs for5s in each case. `frontage-rotation-browser-results-body-audit.json` independently clips both animated model bounds and its conservative collision rectangle against the stair footprint. All578 poses have0m² body overlap and0m² envelope overlap.

This bounded follow-up intentionally uses one local room client. Its recorded first status string was copied from the earlier two-client harness and incorrectly says "two-client room". That label is corrected in the harness source for future runs; the original result and measured samples remain unchanged. Two-client rendering is evidenced by the preceding full-composition result, not the rotation-only follow-up.

```powershell
node qc/frontage-rotation-browser-prepare.cjs qc/auto-physics-pose-candidate.js
node qc/frontage-rotation-browser.cjs
node qc/frontage-rotation-body-audit.mjs
```
