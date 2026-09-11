# 500 m street conversion candidate

Offline candidate only, 11 September 2026. Nothing here replaces the accepted
runtime street GLB, road collision surface, auto-roam paths or NPC routes.

The existing street converter selected ways near a 180 m radius and produced
roughly 423 by 439 m of geometry. This experiment selects every complete highway
segment touching a 500 m circle around `[77.5908, 12.9798]` from the existing
`vidhana-streets.osm` snapshot. It uses the same cached official OSM2World web
build described in `OSM2WORLD-PROBE.md`; no city-wide download or runtime
converter is introduced.

Selection retains contiguous source segments and complete mapped areas. A road
that crosses the circle with both endpoints outside is included. A way that
leaves and reenters is split into separate source-contiguous pieces; no shortcut
is fabricated between selected nodes. `provenance.json` maps converter way IDs
back to original source ways and node ranges. Selection regression tests cover
these cases and missing node references.

This is **not an exact circular mesh clip**. Adjacent source endpoints and whole
mapped pedestrian areas extend outside 500 m. Geometry bounds are approximately
1,226 by 1,041 m. Exact boundary clipping and review of joins at the boundary
remain required before integration.

## Conversion and batching

- 441 source ways become 442 contiguous converter ways, referencing 1,822 nodes.
- Verified input-bounds projection origin: `[77.59136, 12.97984615]`.
  Do not reuse the smaller patch's different origin.
- Converter: 1,163 meshes / 11,874 triangles, no external texture pack.
- Prepared candidate: **7 material batches / 11,615 triangles / 981,492 GLB bytes**.
- Eight duplicate faces removed. Coplanar cleanup removes redundant overlaps
  while preserving the source footprint union (zero area difference).
- Remaining coplanar cross-material overlap: about `1.1e-12` square metres.
- Heights span 0 to 2 m. These are converter geometry, not surveyed elevation.
- No rendered visual check, GPU performance result or final street-fidelity
  acceptance is claimed. Projection alignment, sidewalk/road boundaries, signals,
  zebra crossings and legal junction routes still need comparison in the scene.

## Reproduce

```powershell
node experiments/osm2world/verify-select-coverage.cjs
node experiments/osm2world/coverage-probe.cjs
node verify-street-patch-build.cjs --source experiments/osm2world/coverage-500/meshes.json --output experiments/osm2world/coverage-500/asset --origin 77.59136,12.97984615
```

The first conversion capture reports one generic HTTP 404 warning, caused by the
browser's favicon request. The local probe now serves that request with 204.
No converter or page exception occurred. The stored results remain the original
capture rather than silently deleting its warning.

Map data: OpenStreetMap contributors, ODbL 1.0. OSM2World: MIT, see the existing
converter provenance and license under `assets/streets/`. Preserve attribution.
