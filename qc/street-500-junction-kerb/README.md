# Internal junction kerbs: source-linked repair candidate

Root found the stray interior kerb removal useful; exterior pointed/angular
footprint remains evident and mapped boundaries stay protected. See
`integration-proposal.md` for the combined gap/material/kerb integration scope
and unresolved routing gates. Exact new-evidence list is
`qc/street-500-junction-commit-files.txt`; it excludes generated `meshes.json`,
progress checkpoints and all duplicated old snapshot/artifact directories.

Matched native-GPU views show a substantive local improvement: the hanging
internal kerb spear and small isolated fragments disappear, and the first white
center strip follows the mapped circle-road segment. The exterior tapered kerb
tip and angular outer asphalt boundary remain. This is a bounded review candidate,
not whole500m acceptance, route qualification or runtime promotion.

## Source topology and changes

Ways52057928 and1091198031 share node428831252. Their first original source
segments define incident carriageway ribbons. Widths measured from downstream
converter lane cross-sections are3.496096m and7.092066m respectively. These are
converter-derived dimensions, not surveyed widths. A50mm inward margin protects
outer kerb boundaries from projection rounding.

Only raised triangles belonging to hash-pinned native meshes80/81 are clipped
against the union of these incident carriageway interiors. Horizontal tops retain
their original0.12m height outside the interior. Vertical triangles are clipped
in distance/height space, preserving their triangular profiles and normals.
No unrelated curb triangle is deleted merely because it is thin. Removed raised
projected area is5.523478m²; existing ground-level asphalt beneath remains intact.

Only the first two source marking triangles from mesh79 are replaced. Their
skewed initial cap is replaced by the original circle source centerline, at the
existing0.099888m strip width, beginning beyond the shared junction envelope.
That envelope combines the incident ribbon intersection with existing junction
meshes1074/1075. Replacement marking stays within existing ground. Later markings,
road outlines, mapped exterior kerbs and unrelated source meshes remain intact.

Mapped kerbed grass island338941369 is explicitly excluded and lies634.756m from
this local envelope. It belongs to the separate northern-turn issue, not this
Ringwood junction. Nearby garden38318887 also has zero overlap. Conditional
circle access remains closed; topology repair does not imply driving permission.

## CPU acceptance

- Source ground footprint symmetric difference:0m².
- Exterior raised projected geometry difference:3.88e-14m².
- Actual exported Float32 ground footprint difference:0m².
- 133 samples of formerly raised carriageway interior now correctly return0m.
- 2187 full-preview route samples: zero misses above1mm.
- 9301/9301 actual exported ground triangle centroids pass runtime indexing.
- 17 sign triangles remain rendered and excluded from ground; maximum ground
  height elsewhere remains0.12m. Origin and500m boundary checks pass.
- Nine material cases, invalid-sidecar handling, disposal and legacy fallback pass.

New GLB:985472 bytes,7 batches,11658 triangles. Ground sidecar:9301 triangles.
Exact output hashes are in `asset-hashes.json`; GLB SHA256:
`8eac82a3acc76fd2836a83cdd6327a3a8edd9207518fb6e11bded4bacdef4c4d`.
The accepted material display remains present in both paired scenes, yielding
8 scene draw calls and11652/11676 rendered triangles before/after respectively.

## Visual evidence and limits

`qc/street-500-junction-scene-{baseline,candidate}-{road,aerial}.png` contains the
matched views. `results.json` records cameras, response hashes and actual Intel
UHD630 D3D11 WebGL2 renderer. No page/shader errors or missing resources occurred.
Browser closed after four captures; GPU released. No timing benchmark ran.

The preserved outer tapered tip, small exterior end fragment and angular road
outline remain visible. These are not claimed fixed. Matching source-linked
outer boundary/kerb topology, exterior handoffs, driving behavior, remaining500m
visual issues and performance acceptance remain separate gates.

## Reproduce

If `qc/street-500-gap-export/meshes.json` is absent after checkout, regenerate it
first with the already committed `node qc/street-500-gap-export.cjs`. It is an
offline intermediate, not an additional committed copy of prior geometry.

```powershell
& 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' qc/street-500-junction-kerb.py
node verify-street-patch-build.cjs --source qc/street-500-junction-kerb/meshes.json --output qc/street-500-junction-kerb/asset --origin 77.59136000000001,12.97984615
node qc/street-500-junction-runtime-tests.cjs
node qc/street-500-junction-material-tests.cjs
& 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' qc/street-500-junction-export-tests.py
node qc/street-500-junction-scene-prepare.cjs
```

Restore original common snapshot through the committed gap-scene restore script
if absent. After root releases GPU, run
`node qc/street-500-junction-scene.cjs --run-gpu` with CDN access. All new files
stay under qc; previous source assets and immutable manifests remain unchanged.
Confidence high for topology identity, footprint preservation and bounded visual
improvement. Published observations do not imply surveyed dimensions.
