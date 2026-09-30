# Vidhana stairs and mapped passage integration audit

**Conditional CPU acceptance, no runtime promotion.** The stair run needs a collider. The raised landing must not become a solid2D building blocker: a source-mapped building passage runs beneath it. The current coarse Vidhana building collider already wrongly closes that passage. The isolated candidate opens only this corridor in that one collider, preserves other obstacles, and adds the stair-run collider.

## Exact coordinates and source semantics

Both `district.js` and `auto-roads.js` use origin `[77.5945,12.9755]`,111320 metres/degree and longitude multiplier `cos(12.9755 degrees)=0.9744661660477517`. No projection conversion or offset is needed. Stair foot centre is `[77.59126130208446,12.979143715513187]`. Selected architecture metadata in `qc/vidhana-architecture-integration-cpu.json` matches prior stairPlacement, columnCenters, foyer and landingZ exactly. Selected full-module hash at audit: `b73b26f0000790dfa30c53ffd56ab16a9b04a5230112feb30c72e972529c2989`.

Source snapshots `vidhana-streets.osm` and `vidhana-osm.xml` agree:

| Way | Source tags | Relevant coordinates |
|---|---|---|
|363475448|highway=service; tunnel=building_passage|[77.5909934,12.9792403] to[77.5911489,12.9794086]|
|38542545|highway=service; access=private|approach ending at first passage endpoint|
|363475450|highway=service; access=private|approach beginning at second passage endpoint|

Passage endpoints coincide with mapped canopy vertices. This is intentional building-passage topology, not evidence of an inactive road. No passage elevation or clearance is tagged. Generated `vidhana-road-network.json` omits tunnel and access tags and estimates4m width. Retain these semantics in any later network regeneration. This change does not create a public route; `VIDHANA_PASSAGE_SOURCE.publicRouteEligible` is false and both private approach tags are preserved. Existing NPC/auto-roam use of this generated network needs a separate access-filter review, not a new route addition here.

## Geometry and collision evidence

The previous286 count was nearby sample points, not286 roads. Current road network has746 features and740 drivable graph edges. Half-metre centreline sampling covers31,372 points. Stair run alone blocks0; treating whole landing as solid blocks68 on3 edges.

Current world blocks58 of those68 passage/approach points, including all52 central passage points. Culprit is district feature2023, the unnamed full Vidhana footprint with base0 and height30. The isolated lookup selects the unique building containing passage midpoint by object identity, not unstable feature index. A future ambiguous overlap fails closed.

Candidate emitted geometry gives a real opening below the landing: columns and foyer begin at6.75m. Conservatively combining loaded Cybertruck, Cybercab, KITT and auto GLB bounds produces a5.983m long,2.713m wide,3.2m high envelope including margins. At groundZ0.05m it has3.50m additional ceiling clearance. All68 road positions have zero envelope intersections against emitted low-level triangles of the selected full architecture. This proves clearance in the candidate model, not a surveyed real-world tunnel dimension. Static bounds exclude suspension dynamics and arbitrary vehicle poses.

- Plan geometry and14 source samples: `qc/vidhana-landing-route-diagram.svg`, `qc/vidhana-landing-route-samples.json`.
- Section with45-step profile: `qc/vidhana-passage-section.svg`.
- Model envelope receipt: `qc/vidhana-passage-clearance-results.json`.

## Isolated implementation

1. `qc/vidhana-building-passage-candidate.js` finds exactly one containing coarse building and exposes a narrow passage exemption. Corridor uses existing4m estimated width,4m endpoint extension and .78m collision-radius inset. Exemption only applies to that exact feature object; all other colliders remain active.
2. `qc/vidhana-passage-auto-world.js` changes only building grid metadata and the optional per-building exemption check. Boundaries, nearest-wall normals, roads and all other collision logic remain unchanged. Reproducible generator: `qc/vidhana-passage-world-prepare.cjs`.
3. `qc/vidhana-driving-world-candidate.js` composes the existing world with `qc/vidhana-architecture-stair-collision.js`, `includeLanding:false`. Existing building/boundary contacts retain precedence. This helper alone does not repair the coarse passage blocker; use both pieces together.

Exact proposed runtime composition, with runtime import paths adjusted on promotion:

```js
const passage=createVidhanaPassageOverride(drivingData);
const base=createDrivingWorld(drivingData,graph,{passage});
const world=withVidhanaStairCollision(base,architecture);
// Existing NPC collision wrapper remains outside this static-world composition.
```

Obtain `architecture` from the same selected landmark builder's output, passed explicitly after landmark readiness, or extract its pure placement derivation into a shared module. Do not hardcode a stale QC JSON snapshot or silently skip stairs when metadata is absent. Geometry construction and collision must share stairPlacement. Preserve returned `onRoad` and all other world methods.

Ground-level actors already within the mapped passage can leave either direction without teleportation. A deliberately invalid spawn inside stair solid still cannot move through it; reject such new spawns against composed static collision rather than injecting displacement into collision queries. This is not a walking-on-landing system: no actor is moved to6.75m or given an invented ramp.

## Verification completed and remaining

`qc/vidhana-passage-world-test.mjs` passes:293 longitudinal samples in both directions, fresh ground actor exiting both ways, side-wall negatives, rotated front/rear collision probes, stairs blocked, independent obstacle retained inside corridor, ambiguous containing footprint rejected. It opens58 old false-positive centreline collisions, preserves31,314 remaining outcomes, and adds0 newly blocked road samples. `qc/vidhana-driving-world-test.mjs` separately proves additive stair composition and origin round-trip correctness.

No GPU or runtime mutation in this audit. Before promotion: actual road-level player drive-through both directions, collision at stair front and sides, NPC/private-route inspection, a camera below landing showing a true opening, and unchanged remote vehicle rendering. Do not claim measured real-world clearance from this model check.
