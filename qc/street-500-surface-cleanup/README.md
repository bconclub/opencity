# Source trace and recommended asphalt material candidate

Recommended next candidate: preserve the existing grey remnant's geometry and
match the explicit asphalt surface of circle way1091198031 to the neighboring
Three-rendered asphalt. No deletion or widening is justified by this trace.
GPU review now shows bounded improvement; see `../street-500-material-scene/README.md`.
No runtime file or prior snapshot manifest changed.

## Exact cause

Within18m of the repaired probe, grey road remnants come from estimated polygons
for service way52057928 (4m width, surface unknown) and circle way1091198031
(6.4m estimated width, explicitly `surface=asphalt`). Their visible residual
areas lie outside the repaired O2W ground footprint. Combined remaining overlap
across all nearby road/footpath features is only0.000001256m², a numerical seam.
The lighter remnant is drawn by MapLibre's flat `vidhana-road` fill, default
`#525956`, while adjacent O2W asphalt uses Three lighting and procedural texture.
These different render treatments produce the visible material discontinuity.

`ownership.png`, `retained-remnants.geojson` and `audit.json` show exact source
feature identities, coordinates and measured overlap. The initially emitted
`candidate-surfaces.json` is **rejected as a useful visual candidate**: its
intersection-only cleanup removes negligible area and should not be rendered
or promoted. It is retained solely as diagnostic evidence.

The tapered strips have a different source. Hash-pinned raw meshes80/81 contain
0.12m raised sidewalk/kerb bands; raw79 contains the white center strip. These
share the acute skewed cap of circle road mesh78. There are32 local raw triangles
with height above5cm and28 with projected altitude below0.16m, including vertical
faces. Thus thinness alone is not evidence of invalid or redundant triangles.
Raw cap vertices and triangle coordinates are retained in `audit.json`.
These bands are native converter geometry, not the estimated surface overlay.
Deleting or moving them needs a source-linked junction/kerb envelope; the current
snapshot does not establish a surveyed replacement. Material matching will not
fix the native tapered geometry, angular joins or every visible dark sliver.

## Concrete recommended candidate

`asphalt-material-region.geojson` contains **7.504034m²** of existing circle-road
surface within the18m window, excluding native ground. Source OSM explicitly
marks this circle asphalt. `asphalt-material-triangles.json` triangulates that
same existing area into18 triangles in the patch's local Z-up frame, height0,
with `groundEligible:false`: this is a display replacement only.

`asphalt-material-surfaces.json` removes the covered estimated road polygons
only where the same area will be rendered by the asphalt replacement. This also
removes1.170553m² of underlying duplicate service-road fill inside the verified
circle asphalt region. Unknown-surface service fragments outside that region
remain unchanged. Before/after combined road coverage has symmetric difference
below1e-8m², and the replacement has zero native-ground overlap. No road is
invented, erased or newly allowed for traffic. Ground sidecar remains unchanged.

For matched GPU review, add the display triangles to the existing street patch
scene before `prepareStreetSurfaces`, with `streetSurfaceRole: asphalt`, and use
the existing patch lighting, UV mapping and texture. Keep the declared ground
sidecar authoritative so these display triangles cannot enter heightAt. Serve
the replacement flat-surface JSON in the same variant. A same-scene injection is
preferred to an independently lit overlay. Assert the resulting height index
and metadata origin remain identical, response hashes are recorded, and total
coverage stays unchanged after final Float32 construction. This review setup is
implemented and matched GPU-tested in `qc/street-500-material-scene.cjs`.

The circle's conditional motor access stays closed. No turning envelope is
qualified. Bounded material replacement is recommended for visual testing;
broader500m promotion remains rejected. Confidence high for source polygons,
tags and overlap measurements; moderate for visual benefit until matched capture.

Reproduce CPU outputs with bundled Python running
`qc/street-500-surface-cleanup.py`. Inputs remain frozen scene evidence from
sourceHead9e500bb, preserved in commitdaf95fd; mutable runtime roads are not used.
