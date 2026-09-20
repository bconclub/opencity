# Release0.0.31 staging audit

**No concrete staging blockers found.** Read-only filesystem inspection of the existing `public-release` output. No staging, deletion, deployment, runtime edit, network request or GPU work was performed.

## Manifest and source agreement

- Service-worker initial list:91paths.
- Static additions: `street-detail.js`, `street-surface-coverage.js`, `assets/streets/vidhana-coverage.png`.
- Full staging manifest:108unique source files, plus generated `vercel.json`.
- All108source files are present in output and have matching SHA256 hashes.
- Generated Vercel configuration matches the staging script, including no-store release discovery and no-cache service-worker headers.
-175direct dependency references checked. No missing local dependency or hash mismatch was found.

Dependency checks cover static imports and requests, HTML/CSS references, local asset literals, helper-loaded road JSON, service-worker registration, street metadata atlas URL, all current dynamic vehicle-model loader outcomes, six current picker preview images and external-resource references inside GLBs. Remote CDN, map and room-server availability was not tested by this offline audit.

## Unexpected staged names

There are114files in the output versus109expected source/generated files. These five additional names are present:

- `.gitignore`
- `.vercel/README.txt`
- `.vercel/project.json`
- `assets/vehicles/cybercab-meshy-approved.glb`
- `assets/vehicles/cybercab.glb`

The last two are stale non-manifest model assets, unreferenced by the current runtime and service-worker list. They do not cause the current build to load an old vehicle, but demonstrate that the staging script copies over an existing output rather than making an exact clean mirror. The first three are local tool metadata names. Their contents were not read or reproduced. No unexpected file was deleted or modified.

## KITT workshop integrity

The workshop still references two separate files:

| Purpose | Path | SHA256 prefix |
|---|---|---|
| Previous model | `assets/vehicles/kitt-review/runtime-before-promotion.glb` | `498f019da73b071b` |
| Revised model | `assets/vehicles/kitt-review/kitt-reference.glb` | `b4247a09d36ec41f` |

Paths and bytes are distinct. Both staged assets match their source files. Runtime `assets/vehicles/kitt.glb` matches the revised model, while the workshop's previous model remains independently preserved.

Complete per-file hashes, dependency paths and name-only unexpected-file inventory are in `qc/release-31-staging-audit.json`. No credential values or local tool metadata contents are included. Confidence high for the inspected output snapshot.
