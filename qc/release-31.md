# OpenCity 0.0.31

This is an incremental quality and playability review release. It does not
complete the high-fidelity CBD goal. Latest verified production remains 0.0.30;
local changes below have not been deployed.

## Changes prepared for release

- Proportional mobile throttle and steering, clean touch release, manual takeover.
- Hidden helicopter HUD no longer overlays the car's gear display.
- Vehicle reflections use the actual camera eye, including remote vehicles.
- Local and remote ground vehicles have a shared soft contact footprint.
- Ground-car name tags use model height and the existing eight-pixel screen gap.
- Blender vehicle wheels bind mesh or empty pivots, spin, steer independently and
  use a radius measured without dependence on remote body tilt.
- More varied facade materials and two invalid inverted building heights fixed.
- Vidhana Soudha domes retain smooth primitive normals after batching, with
  distinct facade treatments across storeys. Footprint and source heights remain
  unchanged. This is a schematic refinement; the portico and stairs still need work.
- Landmark exterior/courtyard normals corrected and shadow map focused on the
  Vidhana frontage. This removes tested diagonal wall bands while retaining
  shadows. Outside the fixed local light volume, shadow coverage is reduced.
- Fine metric street grain; restrained neutral-gray concrete guided by historical
  frontage photographs. Geometry, routes and mapped crossings remain unchanged.
- Distant street markings use shared opaque surface coverage to reduce the
  tested speckling, with no extra draws or road geometry. Missing/corrupt coverage
  falls back to original materials. Relative frame-time gate passes in aerial
  and near views; physical-phone and moving-camera checks remain outstanding.
- Revised Knight Rider body, rear hatch, spoiler, lamps and wheels now use the
  reviewed 24,512-triangle Blender reconstruction, with matching picker preview.
  Default black paint matches between clients; saved colour choices remain.
  Wheelbase/radius match the model; traffic clearance covers its actual length.
  The original model is preserved for comparisons. This is not manufacturer CAD.
- Cybertruck dimensions and axle placement match the selected published specs;
  red rear emission, wheel covers and bed geometry are repaired. Two-client
  driving/paint tests and the +2.699% relative frame-time gate pass. The picker
  matches the new model. Remote steering now uses measured model wheelbase.
- Build validation catches static imports accidentally added to classic scripts.

## Validation

- Actual mobile driving, cancellation, takeover, keyboard and 330/390/430 layouts.
- Two local WebSocket clients: all six vehicle IDs, visible remote actors and names,
  room create/join/free flows, remembered identity, reconnect, resume and cleanup.
- Independent isolated player/spectator screenshots prevent overlapping spawns
  from being mistaken for a corrupt model.
- Wheel pivot/steering/reset checks on both actual KITT GLBs.
- Physics, boost, auto-roam, gamepad noise, dome and ten-minute traffic simulation.
- Multiplayer server tests and classic browser-entry syntax checks.
- Whole-scene Edge SwiftShader ABBA: 231.73 to 239.46 ms, **+3.34%**,
  48 to 49 custom draw calls. Comparable first-party payload +17,002 bytes before
  final comments and neutral concrete colour constants. Workshop files load only
  when requested and are not game precache assets. This is not a phone FPS result.

## Rejected and outstanding

Global MSAA (+97.6%) and nearby textured trees (+10.2% additional cost and poor
canopy consistency) failed the performance/visual gate. Neither is enabled.
Candidate tree code and evidence remain in the repository for further work.

The supplied Meshy Cybercab still has surface artefacts. Its playable model now
uses repaired, separately rotating tyres and gold discs; the original retained
body and textures are unchanged. The shared NPC LOD is unchanged. The wheel
repair has 24,667 triangles and three materials and is 98,468 bytes smaller.
Matched whole-scene Cybercab ABBA measured 246.82 to 243.40 ms (-1.39%); this
passes the 10% regression gate but is not evidence of a reliable speedup or a
physical-phone FPS result. Custom draw calls increase from 47 to 59 because
the wheels move independently. See the separate Cybercab rig acceptance evidence.
The revised KITT geometry remains approximate and needs further surface/shape
refinement. Landmark architecture, street fixtures and foliage require more
reference-led work; physical-phone performance remains unverified. No Unity
migration, room-server update, payments, or city-wide expansion is included.

The later Vidhana-only change was checked separately against commit c3f917f:
250.278 to 250.417 ms (+0.055%) in whole-scene ABBA, unchanged 45 custom draw
calls, 21,100 fewer triangles and 1,709 additional source bytes. See
`vidhana-landmark-performance.md`.

The subsequent shadow repair passes its own full-scene ABBA against f6eb2be:
249.446 to 248.473 ms (-0.39%, within variability), unchanged 45 custom calls and
419,822 triangles, +836 source bytes. Actual post-render shadow projection was
recorded. See `landmark-stripe-diagnosis.md` for the local-coverage tradeoff.

The promoted KITT has four materials, four tested wheel pivots and an animated
scanner. Full-app two-client driving, reverse, auto-roam, pause/resume and named
paint replication pass; a separate focused run verifies default-black matching.
Whole-scene static chase ABBA measures +7.37% frame time, 113 to 67 custom calls,
and +601,212 GLB bytes. This is below the 10% gate, not physical-phone evidence.
Four boosted contact approaches stop before the measured bumpers overlap.
See `kitt-runtime-acceptance.md` for actual checks and limits.

Review-only architecture and 500 m street candidates are stored with measured
dimensions and remaining integration limits. They are not loaded by the game.
Current launch status and pending work are in `LAUNCH-READINESS.md`.
