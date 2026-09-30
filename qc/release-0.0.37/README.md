# OpenCity 0.0.37 release checks

Status: preparing, not deployed.

## Scope

- New supplied Cybercab, Cybertruck, Yulu DeX and delivery scooter GLBs.
- Cycle removed from selection; saved Cycle choice migrates to Yulu. Legacy Cycle rendering remains for older room clients.
- Existing Auto, Helicopter and Knight Rider retained.
- Compact driving compass, nearby-road minimap, speed/gear/altitude gauge, boost, pause, view and exit controls. Helicopter climb/descend reused next to gauge.
- Actual model previews replace outdated illustrations for changed vehicles.

## Evidence already checked

- HUD browser fixture: 13 interaction checks passed after final input dispatch fix.
- Real game: desktop and 330/390px layouts viewed; helicopter climb, pause/resume, room opening, camera and exit exercised. Final imported-asset UI pass remains pending.
- Live room service accepts Cybertruck, Cybercab, Yulu and delivery poses. Private QA room closed after test. No server change required.
- Local multiplayer server: six tests pass, including both new vehicle IDs.
- Baseline rendering numbers in baseline.json. These are single-vehicle fixtures on current host, not physical-phone or full-city performance measurements.

## Fidelity and provenance

Original uploads stay on D:. Supplied models are not original OpenCity body reconstructions. Wheel repairs and window additions, where applicable, must be identified in final asset manifest.

Player model budget increased from earlier 25K target to approximately 100K-150K to avoid severe body/texture damage from reduction. Three 1K texture maps retained per supplied model. Traffic uses a separate lightweight shared asset and existing count/distance limits.

Imported baked atlases include body, trim, glass and rider together. Their original finish is retained; color picker disabled for these models rather than recoloring every surface. Saved paint choice for other vehicles remains intact.

## Pending before release

- Final GLB visual/spin checks and wheel contact tests.
- Updated picker previews, real browser entry for all four imported vehicles.
- NPC shared-batch tests, model download/frame/draw-call comparison.
- Production staging manifest, commit/release branch push, Vercel deploy, production asset hash checks.

No claim of completed photorealistic city, reference-road reconstruction, physical phone validation, or new Knight Rider source conversion in this release.
