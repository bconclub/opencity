# Prepared immutable 500 m comparison

Matched browser captures complete; browser closed and GPU released. See
`visual-review.md`: bounded repair improves continuity, surrounding artifacts
remain. Root must release GPU before any further run.

Run from repository root:

```powershell
node qc/street-500-gap-scene.cjs --run-gpu
```

Use network-enabled execution for existing browser CDN/map requests. Do not run
`--prepare` again unless deliberately creating a new evidence snapshot.
The harness now rejects `--prepare` when this manifest exists.

Disposable `snapshot/`, `baseline/` and `candidate/` directories need not be
committed. Recover them before browser runs:

```powershell
node qc/street-500-gap-scene-restore.cjs
node qc/street-500-gap-scene-restore.cjs --restore
```

The first command checks recovery without writing those directories. Both read
common files through `git show 9e500bb48bccf2de418fdc0f9e12ee73004d7e96:path`,
then require exact manifest byte lengths and SHA256 hashes.31 common files need
recorded mixed LF/CRLF reconstruction from `restore-hints.json`; no source code
content changes are accepted. Two originally untracked common inventory files
are retained under `recovery-extras/`: `auto-model-v1.js` (3218 bytes) and
`auto-model-v2.js` (8559 bytes). Neither was requested by the captured scene, but
both remain required by the unchanged original manifest.

Keep both surface JSONs, manifest, restore hints, recovery extras, four exported
repair assets and the existing classified baseline assets. Variant directories
are restored only from those exact hash-matched sources. Recovery validates all
107 common files and ten variant entries before any disposable directory writes.
Missing/different bytes fail; mutable runtime worktree files are never fallback
sources. The original manifest is checked unchanged. `restore-audit.json` records
the passing read-only audit; no browser or snapshot restore ran during that audit.
Manifest SHA256:
`b2fc22b888b792535e671f6a731acef3b3ef6a308e326e4e82f72405e41b2794`.
107 common first-party files are frozen from the current worktree. Every served
response is hash-checked; missing local files fail instead of falling through to
changing runtime files. Remote map tiles/CDNs are outside the immutable manifest.
No runtime asset is overwritten.

Baseline is classified500m geometry, not accepted small runtime patch. Candidate
is repaired500m geometry. Each variant serves its matching GLB, ground index,
metadata and footprint from frozen buffers. Ground/render origin is asserted,
including actual indexed triangle count. Same exact road and aerial cameras are
used in both variants. Road eye height2.3m targets repaired probe; aerial height70m
shows local junction. Main repair location is `[77.59020226666667,12.975491600004656]`.

## Existing surface ownership

Baseline flat surfaces reuse `qc/street-500-scene-data/vidhana-street-data.json`.
Its provenance is checked against classified baseline footprint hash. At the
probe, **two legacy estimated-width road polygons cover the missing O2W ground**:
source ways52057928 and1091198031. Therefore the baseline viewport need not show
an empty hole even though baseline `heightAt` has no ground there.

Candidate clips only road/footpath/lane features against the repaired exported
footprint within the patch neighborhood. Six features change; source-controlled
zebras and other details remain intact. No legacy road polygon covers the probe
after subtraction. The small neighborhood pad is1e-8degrees, approximately1mm,
to contain Float32 edge differences. Full clipping provenance is recorded in
`surface-provenance.json`.

Base-map transportation layers and common district shadow receiver remain.
They are enumerated in capture telemetry but are not source-owned polygon
subtraction evidence. Auto mode is never entered and is asserted inactive, so
its separate estimated road surfaces are not added. NPCs may still use the
existing runtime graph; this harness does not claim new route integration.
Conditional circular-road access remains unqualified and no turns are enabled.

On completion, inspect four saved viewports, compare material/kerb joins, and
report visible defects. Syntax, snapshot and CPU clipping preparation pass;
GPU compile and corrected camera framing passed. Bounded visual verdict is in
`visual-review.md`; broader scene acceptance remains incomplete. Progress
checkpoints, source hashes and failure screenshot are built in.
