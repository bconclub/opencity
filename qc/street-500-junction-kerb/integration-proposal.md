# Combined500m candidate: bounded integration proposal

Do not promote yet. Root found internal-kerb removal useful; the outer pointed
footprint remains visible and mapped boundaries must stay protected. Gap repair,
explicit-asphalt material matching and internal-kerb repair are complementary,
but together do not qualify500m driving routes or full-scene performance.

## Proposed final assembly

Use `qc/street-500-junction-kerb/meshes.json` as the geometry source: it already
includes the accepted gap triangle and native kerb/center-strip repair. Append
the18 triangles from `qc/street-500-surface-cleanup/asphalt-material-triangles.json`
as asphalt with **groundEligible:false**, converting Z-up back to builder axes
once. These are existing legacy surface coverage, not newly drivable ground.
Run existing `verify-street-patch-build.cjs` into another final review directory.
The exporter should merge display asphalt with the existing asphalt batch,
keeping7 batches rather than the current review injection's8 calls. This assembly
has not yet been exported/tested; exact triangle counts and hashes must come from
that actual artifact, not arithmetic assumptions about cleanup.

Prefer this combined GLB over copying the QC `street-patch-candidate.js` into
runtime. The latter was frozen from older source and exists solely for isolated
visual evidence. Current runtime `street-patch.js` already supports metadata
origin, ground sidecar, material extras and safe disposal. No rendering module
change is expected for the combined-asset approach. Preserve current runtime
changes rather than wholesale replacing files from an old snapshot.

## Exact asset/data changes at controlled integration

| Runtime file | Proposed change |
| --- | --- |
| `assets/streets/vidhana-streets.glb` | Replace small patch with final combined review GLB after validation |
| `assets/streets/vidhana-streets.json` | Replace with matching origin/bounds/counts and declared groundIndexURL |
| `assets/streets/vidhana-ground.json` | Add actual final ground-only sidecar; furniture/display-only triangles excluded |
| `assets/streets/vidhana-footprint.geojson` | Replace from same export; this is ground ownership, not all display asphalt |
| `vidhana-street-data.json` | Start from committed500m scene data plus asphalt-material surface replacement; regenerate/assert against final footprint and display-region mask |
| `sw.js` | Add ground JSON precache; update release cache identity so old metadata/GLB cannot mix. Remove obsolete small-patch atlas precache only if no retained consumer |

Current small-patch metadata binds `vidhana-coverage.png` to old geometry SHA and
old origin. Never copy that `surfaceCoverage` block into500m metadata. The review
candidate consistently disables that atlas. A separate matching500m atlas could
be built and validated if needed, but is not part of this accepted evidence.
`street-surface-coverage.js` itself need not change merely to load500m geometry.

`app.js`, `street-surface-materials.js`, vehicle models and multiplayer IDs need
no change for asset loading. Existing furniture asset need not move with the
street frame: it has its own georeferencing. Furniture coverage/controls still
require whole-scene review; this work does not claim a new500m furniture census.

## Projection and ground invariants

- Metadata and sidecar origin must match exactly:
  `[77.59136000000001,12.97984615]`.
- Coordinates already have O2W-to-MapLibre horizontal scale0.9988824009162848.
  Apply no second scale. Runtime uses MapLibre mean Earth radius6371008.8m.
- Render positions are X-east/Y-north/Z-up. Native builder input is X-east/Y-up/
  Z-north; swap and reverse winding once. Height is not horizontally scaled.
- Every ground face must be an exact Float32 GLB face; sign tops and display-only
  asphalt must never enter heightAt. The current kerb export indexes9301 faces,
  maximum ground height0.12m elsewhere;133 repaired interior probes return0m.
- Final ground footprint must remain identical to the accepted gap footprint.
  New display asphalt coverage must match the removed flat polygons exactly,
  without expanding driving ownership. Sidecar bytes/count may only change if
  actual equivalent triangulation changes are explicitly explained and tested.
- Runtime loading must reject malformed declared sidecars; no silent fallback
  to furniture-inclusive geometry. Test cache update and partial-load failure.

## Surface suppression required

`vidhana-road`, `vidhana-footpath` and `vidhana-lane` must use source-generated
polygons subtracted against final ground footprint. Only the explicit circle
asphalt display region additionally suppresses duplicate flat road coverage;
unknown-surface service fragments outside it remain. Explicit zebras are retained
unless independently verified duplicate marking ownership justifies a change.

Auto mode still needs actual polygon containment, not the current midpoint test:
`auto-mode.js` tags road quads by midpoint within488m and hides only those quads.
Boundary-crossing quads can therefore overlap500m ground or leave holes. Replace
that display rule with subtraction against the same ground/display masks when
building `auto-roads`. `street-detail.js` separately creates estimated walk, kerb
and paint features and its own fallback height index. Clip those against verified
ownership too, so starting auto mode cannot restore the kerbs just removed.
The scene captures intentionally kept auto mode inactive and do not test this.

Base-map transportation line layers and district's shadow receiver remained in
both captures. Their complete layer ownership is unresolved. Do not globally hide
roads or erase landcover; inspect actual overlapping line segments before a
bounded filter/clip solution. The outer angular native footprint is preserved.

## Route integration remains blocked

The separate kerbed grass island **338941369** problem remains. It is roughly635m
from this Ringwood envelope, and the earlier northern turn candidate still
crosses its required clearance margin. Our fix does not qualify that turn.
Use source connector1092049622 and source-linked junction envelopes for any
future alternative; do not reuse the rejected smooth turn mesh/path.

`vidhana-road-network.json` is not ready for blind replacement by preview data.
`driving-data.js` currently splices at488m by coordinates, while `auto-roads.js`
merges nodes with1.5m rounding. Neither proves source-identity boundary handoff.
Future changes must preserve original way/segment/node/fraction portal identities,
conditional access, one-way directions and island clearance. Existing NPC loop
selection in `npc-traffic.js`/`traffic-simulation.js` must consume only qualified
routes; never treat rendered ground coverage as legal or physically feasible turn
permission. Circle1091198031 conditional motor access remains excluded.

Player grounding in `auto-mode.js` and NPC grounding in `npc-traffic.js` already
query `vidhanaStreetPatch.heightAt` by longitude/latitude, so they inherit correct
frame without changing vehicle dimensions. Player front/center/rear sampling and
NPC center-only sampling are not proofs of wheel/body clearance. Full driving,
remote placement, turning and boundary tests remain required.

## Gates before promotion

1. Export combined asset; verify material roles, sidecar exclusion, immutable
   hashes, unchanged coverage, clipping and cache atomicity.
2. Implement/test source-qualified routes and auto-mode surface suppression.
3. Match current runtime manual/auto/NPC scene views, including exterior joins,
   crossings, boundary strip and mobile, using actual hardware renderer.
4. Run same-device cumulative release performance gate. Earlier screenshots
   and old software timings do not establish this candidate's performance.

No runtime edits, promotion or deployment performed by this proposal.
