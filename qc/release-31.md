# OpenCity 0.0.31

This is an incremental quality and playability release. It does not complete
the high-fidelity CBD goal or replace the live KITT with the workshop candidate.

## Changes prepared for release

- Proportional mobile throttle and steering, clean touch release, manual takeover.
- Hidden helicopter HUD no longer overlays the car's gear display.
- Vehicle reflections use the actual camera eye, including remote vehicles.
- Local and remote ground vehicles have a shared soft contact footprint.
- Ground-car name tags use model height and the existing eight-pixel screen gap.
- Blender vehicle wheels bind mesh or empty pivots, spin, steer independently and
  use a radius measured without dependence on remote body tilt.
- More varied facade materials and two invalid inverted building heights fixed.
- Fine metric street grain; restrained neutral-gray concrete guided by historical
  frontage photographs. Geometry, routes and mapped crossings remain unchanged.
- A separate `/kitt-workshop.html` compares the current model and a 24,212-triangle
  original Blender reconstruction. It is a work in progress, not manufacturer CAD.
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
The live KITT geometry remains approximate. The separate new candidate also needs
shape refinement. Landmark architecture, street fixtures and foliage require more
reference-led work; physical-phone performance remains unverified. No Unity
migration, room-server update, payments, or city-wide expansion is included.
