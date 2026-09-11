# Reproduce accepted frontage checks

Run from repository root in a disposable checkout. Required inputs are listed in `qc/frontage-reproduction-files.txt`; generated snapshot directories are deliberately excluded. These checks reproduce historical accepted compositions, not whatever files currently happen to be deployed.

## Prerequisites

- Full Git history containing `733fd3337caaf98b334c174e218e00820b447216`. Preparers recover baseline assets with `git show` and verify their recorded hashes.
- Node 22 or newer; install the locked dependencies in `multiplayer-server/` (accepted run used `ws` 8.21.3).
- Playwright 1.62.1 at `C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`, plus installed Microsoft Edge (`msedge` channel).
- Three.js 0.169.0 at `D:/CodexTools/OSM2World/three.module.js` for CPU model/ray checks. These existing absolute tool paths are explicit machine prerequisites, not bundled dependencies.
- Network access to map/CDN resources, available loopback HTTP/WebSocket ports, and exclusive GPU access for browser checks. Fixtures start and close their own local servers; they do not restart a live room server.
- Keep scoped `.gitattributes` entries. Frozen candidate bytes include original line endings; a hash failure must be investigated, not fixed by updating accepted hashes.

No runtime generator is needed. Do not rerun `prepare-frontage-runtime.mjs` against promoted runtime: its patch anchors were for the earlier baseline. Replay uses the frozen candidate files instead.

## Original accepted browser composition

```powershell
node qc/frontage-runtime-browser-prepare.cjs --replay-accepted
node qc/frontage-runtime-browser.cjs --output-dir qc/replay-frontage-original
node qc/frontage-runtime-body-audit.mjs qc/replay-frontage-original/frontage-runtime-browser-results.json
```

The preparer reads `frontage-runtime-browser-results.json` and uses its embedded `snapshot.productionFiles` as the exact allowlist. It checks candidate hashes and all final fixture entries, including placement hooks, before writing the snapshot directory. It does not consult the later mutable runtime manifest or rewrite accepted JSON.

This composition has nine production modules plus the selected landmark bundle. Physics remains the original baseline version. Checks cover both passage directions, frontal/side stair stops, invalid placement rejection, manual/tour graph separation, auto-roam takeover, two-client remote rendering, and actual helicopter focus dwell. The body audit independently checks projected model bounds against stairs. Generic building and NPC collision accuracy outside this scope is not claimed.

## Accepted held-steering follow-up

First hydrate the original fixture with the preceding preparer, then:

```powershell
node qc/frontage-rotation-browser-prepare.cjs --replay-accepted
node qc/frontage-rotation-browser.cjs --output-dir qc/replay-frontage-rotation
node qc/frontage-rotation-body-audit.mjs qc/replay-frontage-rotation/frontage-rotation-browser-results.json
```

This preserves the original fixture and changes only `auto-physics.js` to `qc/auto-physics-pose-candidate.js`, SHA-256 `7995ed841e7ae9295867326f54146d04bbca277b91c02335a85ab09797789c65`. Rejected movement also rolls back heading. The accepted rotation receipt pins the candidate and every resulting fixture entry.

The follow-up is one-client held-left/right steering near stairs, not a second full focus/multiplayer run. Its independent audit checks actual rendered body and conservative collision envelope for every recorded pose. Historical status text saying two clients in that receipt was a label error; the original full check used two clients.

Both browser scripts require a fresh `--output-dir`. New results, failures and screenshots go there; accepted evidence stays untouched. Replay timings and pose counts can vary. Compare assertions and collision outcomes, not timestamp-dependent JSON equality. These functional checks do not replace the separate performance gate.

## CPU footprint and source-focus checks

```powershell
node qc/vehicle-footprint-test.mjs
node qc/landmark-focus-test.mjs
node qc/landmark-focus-source-test.mjs
node qc/landmark-focus-ray-test.mjs
```

These use committed runtime data and the listed QC helpers/metadata. The footprint and ray scripts write their own generated result files, so run them in the disposable checkout. The ray check uses the original geometry-equivalent integration bundle, not a visual-material benchmark.

For a new unaccepted candidate, preparation requires an explicit source and unused `--output-prefix`; it never overwrites an existing snapshot receipt. Such output is not accepted replay evidence. Adapting a browser harness to that new manifest is separate review work.
