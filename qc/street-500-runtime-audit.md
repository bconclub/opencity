# Classified 500 m candidate: CPU runtime audit

Passed with `node qc/street-500-runtime-tests.cjs`. No browser or GPU context was created. Production runtime module was exercised with real Three.js math and geometry, an injected CPU renderer/network loader, and binary accessors decoded from the actual classified GLB. This verifies installation, indexing, coordinate transforms and disposal; it does not substitute for GLTFLoader/browser/material or GPU visual acceptance.

Actual candidate directory: `experiments/osm2world/coverage-500-classified/asset`. Exact tested hashes and measurements are in `street-500-runtime-results.json`.

- Metadata origin `[77.59136000000001,12.97984615]` drives the render matrix, public API and height-query frame. No extra native-to-MapLibre scaling is applied at runtime; the exporter owns final XY units.
- Full GLB: 983,036 bytes, seven mesh batches, 11,629 triangles. All 17 triangles belonging to geometry above 0.3 m remain submitted by the CPU renderer; maximum render height is 2 m.
- Ground sidecar: 1,150,824 bytes, 9,280 triangles. Every coordinate is finite and exactly Float32-rounded; sidecar origin matches metadata. All 9,280 triangle centroids return ground from the production sampler.
- Maximum ground height is 0.1199999973 m. Three horizontal sign-top centroids return no ground from the classified sidecar, while the same full GLB without a sidecar returns 2 m there. Furniture is retained, not deleted or flattened.
- Maximum final vertex radius, for both render and ground geometry, is 500.000027958 m. This passes the explicit 1 mm Float32 boundary tolerance. It is not a claim of mathematically exact containment below 500 m.
- Runtime validation tests also cover the approximately 70.0258 m old/new-origin displacement, relative sidecar URL resolution, 16 malformed/extreme input cases, failure cleanup, same-map caching, disposal, retries and legacy mesh indexing when the optional URL is absent.

No production asset was replaced during this test. Route alignment remains a separate acceptance check: the known native OSM2World versus MapLibre meter-scale discrepancy belongs in export preparation and must be resolved consistently in GLB, sidecar and footprint before final route validation. Re-run this test after any export change; it reads current files and records their new hashes.

Cleaner regression also passes: `qc/street-500-cleaner-test.py` tests ten source orderings across controlled overlapping materials and the actual known mesh pair, same-material deduplication, and distinct grounding eligibility. Both formerly misclassified triangle centroids now resolve exclusively to concrete in the final GLB, restoring 1.0012245385 square metres of concrete ownership. Temporary rebuild of the legacy input reproduces SHA256 `87fe720941fc52856fd04f8ffa47f16df1bd363c56017530af65e6436a46b0dc` and does not enable a ground sidecar. Evidence: `street-500-runtime-cleaner-results.json`.
