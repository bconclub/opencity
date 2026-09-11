# Controlled 500 m repair export

Review-only candidate. Baseline classified assets and production assets remain
unchanged. No GPU, runtime promotion, conditional-route activation or turn
qualification occurred.

`asset/` contains regenerated GLB, metadata, ground index and footprint. The
generator starts from classified meshes, appends the source-bounded repair once
with asphalt role, converts Z-up to builder input axes once, then runs existing
cleanup/export. Horizontal scale is1 because classified coordinates are already
in the MapLibre frame. `manifest.json` records input, repair, baseline and output
SHA256 values.

| File | Bytes | SHA256 |
| --- | ---: | --- |
| vidhana-streets.glb | 983456 | d81156a07079bbcd844b01d2f9bc9287725e1e9526178b73b99f61f086f676e0 |
| vidhana-streets.json | 858 | e48b5a7ec802b0c98314425575ca5853bae284d7506be19fc3c8b4d293807150 |
| vidhana-ground.json | 1151437 | 685b8201706df9fae34f4dbff814a2b109c71eb9dcc528645077fb10ba2a801f |
| vidhana-footprint.geojson | 2205585 | 04ebee30ab7b0e2765851f8b3cccbfa8aa7f059ce91d2bf6f646880f46ac5a71 |

Final counts:7 batches,11634 render triangles,9285 ground triangles. Appending one
triangle produces a net five-triangle increase after coplanar union and
retriangulation. Height and extent remain unchanged. All17 sign triangles remain
rendered; their tops are excluded from grounding. Maximum ground height0.12m,
maximum rendered height2m. Maximum radius500.000028m is Float32 boundary rounding.

## Reproduction

From repository root, using installed Node and bundled Python:

```powershell
node qc/street-500-gap-export.cjs
node qc/street-500-gap-runtime-tests.cjs
node qc/street-500-gap-material-tests.cjs
& 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' qc/street-500-gap-export-tests.py
```

Do not run CPU export/tests during another agent's timed GPU benchmark.
Original bounded polygon regeneration is `qc/street-500-gap-repair.py`.

## Passed CPU acceptance

- Actual GLB parsing and production-module ground indexing:9285/9285 ground
  triangle centroids found, source sign excluded, legacy fallback preserved.
  Origin shift,16 invalid-data cases, disposal and retry pass.
- Nine material cases pass. Exported concrete, paving, marking and source-color
  projected geometry is exactly unchanged. Only asphalt area changes.
- Every ground triangle is an exact Float32 face in the rendered GLB. Ground and
  footprint symmetric difference is1.19e-11m².
- Full source preview sampled at no more than5m in the exact MapLibre frame:
  2187 samples, zero misses above1mm, maximum residual0.494mm. Historical2191 count
  used a different metres-per-degree frame for spacing; this count is not a claim
  of replaying those identical fractions. The repaired known probe is covered.
- Actual export corridor checks pass for2.1m and2.6133m widths including margins.
  Added geometry has zero mapped obstacle or raised-sidewalk overlap. Original
  straight-body checks remain available in the repair report.
- Circular way1091198031 is absent from eligible route preview; current access
  classifier still rejects its conditional motor permission.
- Baseline four-file hashes remain unchanged.

## Precision and remaining gates

Actual added ground16.430919m²; removed ground0.0000234m². Rebuilding polygon union
also adds0.00000876m² at remote preexisting boundaries. Tests constrain these
remote changes to within0.1mm of old boundaries as well as tiny total area.
They are recorded Float32 retriangulation seams, not a larger gap tolerance.

See `export-tests.json`, `runtime-results.json`, `material-results.json` and
`manifest.json` for measured evidence. This candidate still needs coordinated
matched road/aerial visual acceptance, whole-scene overlap replacement, verified
boundary handoffs, broader vehicle/turn behavior and performance acceptance.
Conditional circular-road access stays closed. Surveyed local kerb dimensions
remain unknown; absence of a mapped barrier line does not establish real kerb
clearance. The previously rejected northern turn remains rejected and untouched.
