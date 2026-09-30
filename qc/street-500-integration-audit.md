# 500 m street candidate integration audit

CPU audit, 11 September 2026. Candidate: `experiments/osm2world/coverage-500/clipped-asset`. Production assets were not changed. No GPU work, scene screenshots, runtime replacement, or deployment was performed. This is an integration plan and data audit, not acceptance of a finished 500 m streets system. Confidence: high for measured binary/data facts; moderate for inferred object identity and visual consequences.

## Measured comparison

| Measure | Accepted small patch | Circular candidate |
|---|---:|---:|
| GLB bytes | 182,248 | 986,300 |
| Material batches | 4 | 7 |
| Triangles | 2,130 | 11,673 |
| Ground-index projected triangles | 1,416 | 9,319 |
| Height range, m | 0 to 0.10 | 0 to 2 |
| Origin | 77.5907159, 12.9797946 | 77.59136, 12.97984615 |

Candidate size is 5.41 times larger; triangle count is 5.48 times larger. Seven batches remain within the requested eight-call geometry budget, but this audit does not establish actual GPU cost. Runtime currently disables mesh frustum culling, so every submitted patch frame visits every batch regardless of view.

Direct Float32 GLB decode found 11,673 triangles, zero exact duplicate triangles, and 9,319 nondegenerate XY projections, matching metadata. All 9,319 footprint triangle centroids returned a height using the production 12 m spatial-cell and barycentric-tolerance rules. Index occupied 4,283 cells, averaging 9.91 triangle references per occupied cell, with a worst cell of 121. Python centroid sampling took about 173 ms; this is a CPU audit measurement, not a browser/mobile performance estimate.

Maximum Float32 vertex radius about the intended `[77.5908,12.9798]` center is 500.000027958 m. Thirty-eight vertex records exceed exactly 500 m due to Float32 rounding; none exceeds 500.001 m. The approximately 28 micrometre excursion is negligible in practice, but documentation must not claim an exactly bounded final Float32 GLB without tolerance. The 256-sided clip boundary has a documented maximum inward chord error of 3.765 cm. All geometry classified as near-boundary here, radius greater than 499.95 m, has height between 0 and 0.12 m.

## Concrete failures and unresolved acceptance items

1. **Hardcoded origin is a release blocker.** `street-patch.js` ignores metadata.origin and uses the old exported constant for both render placement and height sampling. Replacing only the three asset files would shift the new patch approximately 70.026 m. Read and validate metadata.origin once, then use that same value for rendering, API origin, telemetry, and grounding. The selection center and projection origin are different quantities.

2. **Ground query includes non-road geometry.** Source contains a narrow approximately 0.196 by 0.572 by 2 m object, represented by gray and white batches. Its proportions suggest a sign or similar street object, not surveyed terrain; exact identity is not proven. Its three tiny horizontal top faces around `[77.59434704,12.98189590]` return height 2 m from the current highest-hit query. Other candidate projected centroids do not exceed 0.3 m. Do not label the 2 m range as street elevation. Export an explicit ground-eligible primitive/triangle designation and exclude furniture from heightAt and road replacement masks. Normal-direction filtering alone cannot exclude horizontal sign tops. No current sampled driving route crossed this top, so this is a demonstrated query defect, not a demonstrated vehicle jump.

3. **Seven colors exceed the existing four-material semantic assumptions.** Candidate adds pure-white, light-gray 0.57758-linear, and dark-red `[0.07421,0,0]` batches. `street-surface-materials.js` identifies materials using red-channel thresholds only. It would repaint the dark-red geometry as gray asphalt and treat the light-gray object as concrete. Preserve semantic material labels during preparation and explicitly map the new surfaces/objects. Existing geometry-only cleanup does not establish their intended appearance.

4. **Current routes are not a complete circular candidate integration.** `vidhana-road-network.json` has 746 features. Sampling segment endpoints and interiors at spacing no greater than 5 m gave 4,147 points inside the candidate circle; 20 have no candidate ground. Distances to the projected footprint range from 0.0196 to 1.1195 m. The largest miss is way/52057928 near `[77.59020227,12.97549160]`; the other examples and distances are in the JSON audit. Most are near route endpoints; projection-scale differences and mesh termination may contribute, but cause was not proven. A ground fallback can hide these discrepancies and does not demonstrate route/surface agreement.

5. **Boundary joins remain unresolved.** Production local-route endpoints extend only to radius 487.4566 m in the candidate's meter frame; 42 endpoint records lie between 487 and 489 m. `driving-data.js` cuts district centerlines at a separately calculated 488 m radius. Candidate geometry reaches 500 m. Keep route handoff and visual footprint clipping as explicit, separate operations: reconcile each entering/exiting OSM segment and its graph node at the selected handoff, rather than relying on nearby endpoints to snap. `auto-roads.js` uses 1.5 m rounding cells and skips intersection splitting between two verified segments, so visual continuation is not proof of connected graph topology. Test both directions across each boundary road for steering, one-way consistency, no teleport, and stable wheel heights. Near-boundary 0.12 m raised geometry can still terminate abruptly against a flat fallback.

6. **Steps/layers require eligibility checks.** Input has 11 `highway=steps` ways, seven ways with a tunnel or nonzero layer, and no bridge-tagged ways. Examples include layer=1 private service way/38542541, building-passage way/363475448, layer=-1 passage way/364604037, and layer=-1 steps way/1354825000. No bridge behavior is validated by this dataset. The production preparation code only excludes `tunnel=yes`, not every tunnel value; `tunnel=building_passage` can slip through when layer is absent. Preserve brunnel/layer/access tags in route output, exclude steps from motor routes, and retain source-contiguous topology. A 2D highest-surface query and XY-only road/building collision world cannot choose a correct deck or tunnel level when stacked surfaces are introduced. Candidate centroids showed no vertical separation above 0.25 m at overlapping projections, but that sample is not a general multi-level proof.

7. **Old visual layers need full footprint subtraction.** `prepare-vidhana-streets.py` already subtracts the installed footprint from road, footpath and lane polygons, but excludes `zebra` from this subtraction. Candidate includes mapped white geometry; remaining old zebra stripes can duplicate or conflict with it. Review zebra ownership explicitly. `auto-mode.js` uses an edge-midpoint radius flag to hide generated road quads; crossing quads in the approximately 488 to 500 m band can overlap candidate geometry. Subtract the exact ground footprint from these quads instead. A bounding box or broad circle subtraction would erase valid uncovered roads and courtyards.

## Production files and integration order

| Files | Required action |
|---|---|
| `street-patch.js` | Read metadata origin; keep transform/height sampler in one frame; ground-eligible indexing; expose radius/selection center and ground coverage telemetry. Keep install/dispose behavior. |
| `assets/streets/vidhana-streets.glb`, `vidhana-streets.json`, `vidhana-footprint.geojson`, `README.md` | Replace as one validated artifact set only after candidate approval. Footprint must reflect final Float32 ground geometry, excluding furniture. Carry provenance, selection center, radius, source origin and material semantics. |
| `verify-street-patch-build.cjs`, `verify-street-patch-clean.py` | Preserve semantic ground/material eligibility through clipping and batching; reproduce final asset set and ground footprint. Existing CLI already accepts alternate source, output and origin. |
| `street-surface-materials.js` | Replace four-color/red-channel assumptions with exported material roles; preserve red/white special objects. Verify seven batch budget after treatment. |
| `prepare-vidhana-streets.py` | Rebuild old-surface subtraction against final ground footprint; resolve zebra ownership; unify intentional route handoff definition; preserve access, layer and tunnel values. |
| `vidhana-street-data.json` | Regenerate after the final footprint, so old roads/paths/lanes/crossings have no duplicate ownership. |
| `vidhana-road-network.json` | Regenerate/reconcile centerlines and junctions from the same source selection; retain original OSM identity and legal direction/access attributes; explicit boundary connection plan. |
| `driving-data.js` | Match district/local route handoff policy, test connected joins and remove contradictory 488 m constants where policy changes. Preserve useful district graph beyond patch. |
| `auto-mode.js` | Replace midpoint road-quad masking with exact footprint clipping; keep per-wheelbase height sampling but query only ground-eligible triangles; test transition height and camera target on raised ground. |
| `auto-roads.js`, `auto-world.js` | Revalidate graph connectivity, verified-segment joins, width/collision consistency and layer eligibility. Modify where current XY-only/snap behavior fails; do not claim mesh geometry automatically updates collision. |
| `npc-traffic.js`, `traffic-simulation.js`, `auto-roam-physics.js` | Existing shared driving-data entry point means no separate route asset is needed. Revalidate retained loops, directions, mapped controls, road-relative vehicle heights and boundary behavior; change handling if regenerated graph exposes failures. |
| `assets/streets/furniture.json`, `street-furniture.js` | Compare coverage and duplication against new converter objects; reprepare only where the selected area/source or ownership changes. |
| `release.json`, `sw.js` | Advance release version only with the atomic accepted asset/code set. Existing SW list already includes the three patch assets and affected runtime/route modules. Add any new runtime metadata assets; retain old-tab isolation. |
| `app.js`, `index.html`, `local-cache.js` | Existing install order, shared patch handle, importmap and versioned SW registration already support an upgraded patch. No change inherently required. Verify installation failure handling and app loading telemetry during integration. |

Acceptance sequence: settle ground/material ownership and projection; regenerate candidate; CPU-validate footprints and route joins; prepare exact old-surface clipping; then hand off to the shared GPU queue for oblique/boundary/crossing views, driving, auto-roam/NPC loops, mobile frame cost and cache-upgrade checks. Only the CPU stage was performed here.

Machine-readable evidence: `qc/street-500-integration-audit.json`. Coordinates are longitude/latitude. Radius, cell size, coverage distance and heights use MapLibre's mean-Earth-radius meter frame. Source tags identify mapped intent, not surveyed elevation or unrestricted motor access.

## Metadata API and concrete furniture fix

Inspected local upstream source `D:/CodexTools/OSM2World/WebModule.java` and `O2WConfig.java`. `O2WMesh` exports `name()` and `materialName()` at lines 87 and 92, plus textures, colors and geometry. The current capture in `experiments/osm2world/coverage-probe.cjs` drops both names. Capture them before any cleaning/batching, preserving their values through `clip-coverage.cjs` and preparation. Check those method capabilities against the pinned web snapshot first: this audit inspected the local Java API source but did not execute another converter/browser run. The minified pinned module is not meaningfully searchable by exported names.

**OSM IDs and object roles are not exposed by the inspected O2WMesh API.** At WebModule.java lines 315 to 323, metadata-bearing scene meshes are reduced to a `List<Mesh>`, then named `Mesh_` plus an index. `name()` therefore is not an OSM identity. `keepOsmElements=true` is the source default (O2WConfig.java lines 464 to 465) and prevents merging different elements internally, but does not add an ID accessor. Do not parse an ID out of Mesh_N or infer object role from color alone.

`convertJson` accepts an options object with `filterIds` (lines 260 and 293 onward). Filtering occurs after constructing the full scene, and includes ancestors and attachment targets. This supports a targeted offline provenance investigation using the full unchanged input with filters for candidate source nodes/ways, comparing returned geometry hashes to the original groups. It does not guarantee a one-to-one mesh-to-way relationship: attached street objects can also match a parent road. Map any converter synthetic way ID back through `coverage-500/provenance.json`. A durable exporter should retain `MeshWithMetadata`/WorldObject primary-element identity and semantic class before the current reduction, exposing them as mesh metadata or an explicit sidecar; that requires an exporter/API extension rather than a property already available in O2WMesh.

The exact narrow object is isolated in original `coverage-500/meshes.json` zero-based mesh indices **970 and 971**, respectively 15 gray triangles and two white triangles. Source SHA256 is `CA8789D4181BC435398AC6EDBAB468E6C489E37EAFFBEF4155DC11C5912C1F3E`. These indices identify this immutable source only, not future conversions. Mesh 970 spans native X 323.6100769 to 323.8057251, Y 0 to 2, Z 227.6293335 to 228.2011108; mesh 971 is the upper white panel. Retain both complete groups as visible furniture. Do not delete high vertices or truncate their geometry.

Actionable preparation change: annotate those source groups as `role: furniture, groundEligible: false` in a hash-guarded classification manifest for this audited candidate, pending confirmation with materialName/filterIds. Preserve annotation through clipping; emit both groups into rendered GLB but omit their triangles from the **ground-only** index and footprint. For general regeneration, replace the immutable-index annotation with metadata-derived roles once the exporter exposes identity. All other roles also need semantic validation; steps should be `walkable` but not `motorDrivable`, and roads should retain layer/access eligibility.

This separation does not require more than seven render batches. Keep rendering merged by visual material and write a compact ground-only triangle sidecar, or ground-eligible index ranges per material primitive. When ground and furniture share a material, triangle eligibility must survive batching; a single primitive-level flag is insufficient. Runtime `street-patch.js` reads only eligible indices into its cell index, while `street-surface-materials.js` uses explicit material roles and all furniture remains visible. Add the sidecar to `sw.js` if choosing that route. Test the exact top location returns ground beneath or null, never 2 m, and verify original 17 object triangles remain rendered. Do not broadly remove raised roads or future bridge decks based on elevation.

Special source way IDs, before any synthetic remapping:

- Steps (11): 991536568, 996794018, 1266011214, 1267185573, 1267185574, 1267185576, 1267185577, 1312433834, 1354824994, 1354825000, 1368046455.
- Tunnel/nonzero-layer ways (7): 38542541, 363475448, 364604037, 1266011212, 1266011221, 1354824998, 1354825000.
- Bridge-tagged ways: none. Way 1354825000 belongs to both lists. Full tags are in the JSON report. The nearest step to the narrow object is over 84 m away and is not evidence of that object's identity.

## All twenty route-ground misses

Samples are measured in existing production route data, not accepted or repaired routes. Longitude/latitude locations and shortest projected footprint distance follow.

| OSM way | Longitude | Latitude | Radius m | Ground gap m |
|---|---:|---:|---:|---:|
| way/52057928 | 77.59020226667 | 12.97549160000 | 483.426829 | 1.119539 |
| way/670210361 | 77.59140640000 | 12.98180430000 | 232.353002 | 0.211241 |
| way/1095905523 | 77.58808410000 | 12.98138060000 | 342.767874 | 0.326971 |
| way/1095905540 | 77.58878520000 | 12.97849300000 | 262.261682 | 0.217947 |
| way/1095905541 | 77.58959350000 | 12.97776240000 | 261.580013 | 0.025668 |
| way/1095905542 | 77.58980200000 | 12.97800600000 | 226.907948 | 0.019636 |
| way/1095905548 | 77.59359250000 | 12.98016500000 | 305.288277 | 0.200424 |
| way/1095905549 | 77.59365550000 | 12.98009770000 | 311.170475 | 0.197189 |
| way/1095905550 | 77.59370160000 | 12.98003630000 | 315.495869 | 0.199495 |
| way/1095905551 | 77.59378060000 | 12.97998110000 | 323.586985 | 0.201689 |
| way/1095905552 | 77.59384740000 | 12.97991970000 | 330.465976 | 0.200579 |
| way/1096187523 | 77.58710980000 | 12.97746740000 | 476.604920 | 0.052206 |
| way/1096187524 | 77.58771430000 | 12.97678280000 | 473.651562 | 0.180934 |
| way/1096187566 | 77.59208290000 | 12.98349550000 | 433.799360 | 0.454448 |
| way/1183354865 | 77.59183400000 | 12.98144600000 | 214.596457 | 0.200996 |
| way/1257700349 | 77.58891400000 | 12.97807140000 | 280.546434 | 0.066325 |
| way/1267185581 | 77.58852900000 | 12.97669610000 | 423.875371 | 0.484247 |
| way/1354824979 | 77.58838490000 | 12.98025180000 | 266.464293 | 0.186918 |
| way/1354824980 | 77.58847740000 | 12.97990680000 | 251.942925 | 0.210553 |
| way/1371025214 | 77.58748330000 | 12.98253160000 | 470.543811 | 0.112005 |
