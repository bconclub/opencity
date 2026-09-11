# Full-app street candidate review

`node qc/street-500-scene.cjs` captured eight matched before/after views at
1400 by 900 in Edge SwiftShader. The after pass intercepts only classified
street assets and the isolated companion surface data. Runtime landmarks and
traffic graph stay unchanged. The companion removes legacy surfaces covered
by the new footprint and preserves all 21 explicit zebra locations.

All eight captures completed without page errors. The actual GLTFLoader loads
the seven material batches and the ground-only sidecar indexes 9,280 triangles.
The before pass loads four batches and indexes 1,416 triangles.

Root visually inspected road, boundary and aerial images. Coverage extends
over more mapped roads and paths, but dense pale speckling remains
on some flat roads in both before and after views. It needs depth/material
diagnosis. The road-level camera is across the lawn, useful for placement but
not sufficient for wheel/kerb inspection. The known Ringwood junction gap and
boundary routing handoffs also remain unresolved. This is not visual acceptance
or a high-fidelity completion claim.

This run is not a frame-time benchmark. No performance percentage should be
derived from loading/screenshot duration. No production geometry was replaced.

Rebuild the isolated companion before rerunning screenshots:

```powershell
& 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' qc/prepare-street-500-scene.py
node qc/street-500-scene.cjs
```

The generator helper verifies production GeoJSON hashes remain unchanged. Its
temporary source/footprint copies are discarded after generation; only the two
review GeoJSON outputs and provenance are required in version control.
