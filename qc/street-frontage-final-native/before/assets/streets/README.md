# Vidhana street patch

Precomputed OSM2World geometry, converted from the audited sample in `experiments/osm2world/sample-meshes.json`. Runtime downloads only the 182,248-byte GLB and metadata, never the converter or source mesh JSON. Four material batches contain 2,130 triangles after geometric cleanup of 2,119 source triangles. Three exact duplicate triangles were removed. Coplanar faces were unioned and subtracted by material priority, then constrained-triangulated. This removes 6,345.56 square meters of redundant surface coverage without changing the footprint union. Remaining cross-material coplanar overlap is below 1e-6 square meters. Raised geometry is retained, face winding matches normals, and source sRGB colors are converted to glTF linear factors.

Input map data: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0. Retain OpenStreetMap attribution in the app. No third-party texture pack is included. OSM2World converter version and provenance are documented in `OSM2WORLD-PROBE.md` at repository root; converter MIT notice accompanies this asset.

## Integration

1. Add `"three/addons/":"https://unpkg.com/three@0.169.0/examples/jsm/"` to the existing importmap.
2. Import `installStreetPatch` from `./street-patch.js`; call once after map style load. Save the returned controller. Module caches installation per map and supports disposal and reinstallation.
3. Clip old road and sidewalk polygons against the union of `vidhana-footprint.geojson` triangles, not the broad rectangular bounds. The footprint intentionally includes all nonvertical surfaces, while preserving gaps. In Python, use `unary_union([shape(f['geometry']) for f in footprint['features']])`, then subtract this geometry from existing surface polygons. Apply the same clipping rule to drive-mode road surfaces; remove the old radius exclusion if it causes holes outside the actual footprint.
4. Ground vehicles using `patch.heightAt(lng,lat)`. It returns the highest intersecting surface height in meters, or `null` outside geometry. Use `sample ?? existingGroundHeight` so valid zero heights remain valid. For each wheelbase sample, query patch first; do not max patch height against the obsolete overlapping curb height.
5. `patch.state()` exposes ready/visible, mesh/triangle counts, last draw calls, frames and index size. `setVisible`, `contains`, `bounds`, `footprintURL` and `dispose` are also available.

The GLB is already X east, Y north, Z up. Native OSM2World X east, Y up, Z north was transformed once during preparation; winding and normals were transformed accordingly. Anchor is `[77.5907159,12.9797946]`. Map transform is translation to anchor followed by `(s,-s,s)` scale using MapLibre's meter scale. No additional model rotation is needed. Footprint coordinates use MapLibre 5.6.1's mean Earth radius (6,371,008.8 m), matching the rendered patch exactly. This differs slightly from the converter's projection radius; the prescribed MapLibre meter placement has at most approximately 0.25 m scale difference at patch edges.

## Verification

Run `node verify-street-patch-build.cjs` to reproduce assets (it invokes `verify-street-patch-clean.py` using the bundled Python runtime and Shapely 2.1), then `node verify-street-patch.cjs` for an isolated real MapLibre render, height coverage and install/dispose/reinstall checks. Verifier uses existing Playwright and Three caches; it expects a pinned MapLibre 5.6.1 runtime at `%TEMP%/street-patch-maplibre.js`. The script serves only localhost port 4196 and closes its browser and server. `verification.json`, `verification.png`, and `verification-close.png` record the passing isolated test: 4 draw calls, 2,130 triangles, all 1,416 projected triangle centroids grounded, no browser errors.

Terrain remains flat. Source geometry heights span 0 to 0.10 m and do not imply surveyed elevations or complete curb detailing. This isolated test proves rendering and sampling, not final basemap alignment or visual blending with the other live layers.
