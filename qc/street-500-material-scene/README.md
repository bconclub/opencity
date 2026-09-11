# Explicit-asphalt material replacement: visual improvement

Exact evidence commit list: `qc/street-500-material-commit-files.txt` (22 files).
It excludes disposable common/baseline/candidate snapshot directories,
`progress.json`, and the rejected numerical-only cleanup surface JSON. Existing
committed gap-scene restore inputs and repaired GLB assets remain dependencies;
they need not be duplicated. No git operation was performed by this task.

Root visually accepts the bounded material improvement in the matched road pair.
Overall500m candidate remains unaccepted because native kerb slivers and acute
joins persist. Future geometry work should test intersection-internal kerbs
against source-linked incident road union topology; a converter-internal artifact
does not automatically require new surveyed dimensions to diagnose or repair.
No runtime promotion is authorized by this bounded visual verdict.

Matched road and aerial captures support this bounded material candidate. The
previous grey circle-road wedge now blends with neighboring textured asphalt.
The underlying road coverage and all9285 ground-index triangles remain unchanged.
This is visual-only evidence, not full500m integration or performance acceptance.

Evidence:

- `qc/street-500-material-scene-baseline-road.png`
- `qc/street-500-material-scene-candidate-road.png`
- `qc/street-500-material-scene-baseline-aerial.png`
- `qc/street-500-material-scene-candidate-aerial.png`
- `results.json`: matched cameras, actual renderer, ground state and response hashes.
- `manifest.json`, `cpu-contract.json`, `float32-test.json`: exact inputs and CPU checks.

Candidate adds18 display-only triangles representing7.504034m² of already
existing estimated circle asphalt. They are injected into the same Three scene
after ground-sidecar indexing and before material preparation. Therefore they
share patch lighting, procedural texture and UV scale without gaining driving
ground ownership. The corresponding flat polygons are removed only beneath the
same display geometry. Native GLB and ground sidecar files are identical between
variants. Circle1091198031 explicitly carries `surface=asphalt`; unknown service
fragments outside its region remain unchanged.

Measured state: baseline7 calls/11634 render triangles; candidate8 calls/11652.
Both index9285 ground triangles and return height0 at the repaired probe. All
four captures report actual renderer:

`ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00009BC8) Direct3D11 vs_5_0 ps_5_0, D3D11)`

No page/shader errors or missing frozen resources occurred. Final Float32 display
region differs from ideal polygon by0.000074965m². Original ground/coverage and
prior gap-scene manifests are unchanged.

## Remaining defects and scope

Native tapered kerb bands, white center-strip taper and small dark triangles
remain. Material matching does not correct the acute converter cap. A narrow
unknown-service surface remnant also remains beside grass; it was deliberately
not relabeled asphalt. Angular circular-road geometry persists. These require
separate source-backed geometry/kerb work. No driving turn, boundary handoff,
conditional access or broader500m route qualification is established here.

The run followed root's GPU release, but city diagnostic had already launched
before that handoff message propagated. Brief overlap was reported immediately
when discovered; this run collected screenshots only and makes no timing claim.
Browser closed after four captures and GPU released.

## Reproduce

First restore the prior immutable scene common files with
`node qc/street-500-gap-scene-restore.cjs --restore` if needed. Prepare only from
those restored bytes with `node qc/street-500-material-scene-prepare.cjs`.
After exclusive GPU release, run
`node qc/street-500-material-scene.cjs --run-gpu` with existing CDN/network access.
Default native Edge is used; actual GPU identity is recorded. No runtime edits
or promotion were performed. Confidence high for bounded visual improvement.
