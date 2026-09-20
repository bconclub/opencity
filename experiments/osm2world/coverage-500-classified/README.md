# Classified 500 m street candidate

Review-only export. Production street assets have not been replaced.

Rebuild:

```powershell
node experiments/osm2world/classify-coverage.cjs
node verify-street-patch-build.cjs --source experiments/osm2world/coverage-500-classified/meshes.json --output experiments/osm2world/coverage-500-classified/asset --origin 77.59136000000001,12.97984615
node qc/street-500-runtime-tests.cjs
node qc/street-500-material-tests.cjs
```

The immutable raw conversion SHA256 is checked before assigning seven reviewed
surface profiles and excluding source mesh indices 970/971 from driving ground.
Those 17 sign-like object triangles remain visible in the GLB. Colours identify
visual treatment profiles only; the pinned web converter exposes no mesh names,
material names or OSM identity. `coverage-probe.cjs --semantics` records that
limitation without guessing semantic metadata.

[OSM2World MetricMapProjection](https://github.com/tordanik/OSM2World/blob/master/core/src/main/java/org/osm2world/math/geo/MetricMapProjection.java)
uses [MercatorProjection's circumference](https://github.com/tordanik/OSM2World/blob/master/core/src/main/java/org/osm2world/math/geo/MercatorProjection.java)
of 40,075,016.686 m. MapLibre's meter conversion uses Earth radius 6,371,008.8 m.
Native horizontal coordinates therefore receive scale 0.9988824009162848 before
clipping. Heights stay unchanged, and normals receive the inverse scale before
normalization. The 500 m boundary is clipped in the final horizontal frame.

Coplanar ownership follows explicit marking, concrete, paving, source colour,
asphalt order. Exact faces are deduplicated within each classified material and
ground-eligibility group first, so an earlier asphalt face cannot erase concrete.
The legacy unclassified export remains byte-identical to the accepted asset.

The GLB contains seven material batches with explicit `streetSurfaceRole` extras.
The ground-only JSON uses final Float32 Z-up coordinates and exactly the same
origin as metadata. The footprint also excludes sign tops. Invalid declared
sidecars fail installation rather than silently treating furniture as roads.

Current export: 11,629 render triangles, 9,280 ground triangles, 983,036-byte GLB,
1,150,824-byte sidecar, 2,204,402-byte footprint. Combined asset package is
4,339,120 bytes raw, 820,738 bytes with local gzip. These are file measurements,
not a claim that the production host enables gzip for every type. Geometry is
larger than the accepted small patch; same-device frame-time acceptance remains
required. Footprint is mainly an offline preparation asset, though the existing
service worker also precaches it.

Route validation found one remaining approximately 0.826 m ground omission at
way/52057928 source segment 0. It must be understood and resolved before this
candidate can replace runtime roads. Boundary route handoffs, source access
restrictions, overlap replacement, zebra locations and full-scene visual tests
are separate gates. No routes have been snapped to hide gaps.
