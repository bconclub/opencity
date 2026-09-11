# Cumulative release frame-cost check

Result: **road gate failed; aerial gate passed. Do not describe this release as passing the cumulative 10% frame-time budget.**

## Scope and source identity

- Baseline: immutable repository release `f1fd503054927bde060315c7af3121391c839956`, version 0.0.30.
- Candidate: immutable repository commit `4e4a19a7e5f768939e9ac774664a8450a0d948f8`, version 0.0.31, including accepted curve-braking integration.
- Earlier `cb70fa3` records a live 0.0.30 onboarding audit, but this test does **not** establish that every baseline byte equals historical production.
- Complete first-party runtime manifests were extracted from each commit's service-worker list, including `files.push`, plus referenced runtime extras. Every response body was SHA-256 checked before serving. Missing first-party paths failed instead of falling through to working-tree files. No missing paths occurred.
- Room client and local-cache bootstrap were fulfilled empty in both versions; service workers were blocked. Fresh browser contexts and disabled network cache were used. This measures local city/vehicle rendering, excluding live multiplayer cost and cache benefits.
- Public third-party MapLibre, Three, CDN and map requests remained network requests. Their historical bytes were not reconstructed.

`release-cumulative-snapshots.json` contains full per-file hashes and sizes. The reproducible snapshot directories are local test inputs and need not be committed. Run `node qc/release-cumulative-prepare.cjs` to reconstruct the selected commits, then the benchmark with browser network access enabled.

## Method

One Edge headless browser, one page at a time, SwiftShader, 1100 x 760 pixels. ABBA order was baseline, candidate, candidate, baseline. Each page rendered a parked KITT road view, followed by paused helicopter aerial view. Each pose warmed for 2.5 seconds then sampled 60 forced repaint frame intervals.

The actual existing ride-start flow loaded the selected model before entry. KITT used Vidhana Soudha area; helicopter used Cubbon Park North, climbed to 90 m cruise altitude and paused. Model hashes and active states are included in each sample. No model fallback was accepted. Programmatic pausing/camera setup is benchmark setup, not an interaction usability test.

Map tiles, city boot, district and accepted street patch were ready before timing. KITT spawn coordinates were asserted equal across runs. Exact camera values matched:

| Pose | Map centre longitude, latitude | Zoom | Pitch | Bearing |
|---|---|---:|---:|---:|
| Road | 77.59201520065346, 12.979208045331035 | 22.673186882467544 | 77.98683450243952 | 42.970806347080725 |
| Aerial | 77.5915, 12.978200000000001 | 17.01953383999501 | 60.69266304493491 | -30.878017102205376 |

Ambient NPC simulation remained active. Every sampled frame in all eight runs reported **20 total, 20 visible** NPCs. Actor positions, stopped states and measured simulation times still varied with elapsed time and signal phase; this is a residual comparability limit, not a hidden identical-traffic claim. Per-run mean reported simulation time ranged 1.059 to 1.598 ms. No other agent GPU jobs overlapped this run.

## Measurements

| Pose | Baseline runs, ms | Candidate runs, ms | Baseline mean | Candidate mean | Change | Gate |
|---|---|---|---:|---:|---:|---|
| KITT road | 319.445, 326.110 | 363.057, 351.390 | 322.7775 | 357.2233 | **+10.6717%** | **Fail** |
| Helicopter aerial | 312.223, 313.613 | 313.058, 313.610 | 312.9183 | 313.3342 | +0.1329% | Pass |

The road excess is 0.6717 percentage points beyond the specified limit. Two repetitions per mode do not give strong statistical precision, but this measured gate is a failure. A further optimization and matched rerun are needed; individual earlier per-change passes cannot override it. Aerial difference is too small to interpret as a meaningful slowdown.

| Pose | Baseline custom calls | Candidate custom calls | Baseline custom triangles | Candidate custom triangles |
|---|---:|---:|---:|---:|
| Road | 112 | 67 | 450,916 | 445,276 |
| Aerial | 104 | 104 | 445,600 | 424,476 |

Custom counters exclude MapLibre's own basemap draws. KITT layer changes 67 calls/9,970 triangles to 22 calls/25,454 triangles, including its contact shadow. District changes 309,056 to 287,932 triangles, with 33 calls in both. Thus fewer draw calls alone did not establish lower frame cost. This whole-release test does not isolate which changed shader, geometry or material causes the road difference.

## Payload and identities

| Quantity | Baseline | Candidate | Difference |
|---|---:|---:|---:|
| Unique first-party response body bytes served | 15,962,783 | 16,908,068 | +945,285 (+5.922%) |
| First-party body bytes served including duplicate requests | 20,013,817 | 20,959,102 | +945,285 (+4.723%) |
| Complete extracted runtime manifest bytes | 16,331,939 | 17,277,408 | +945,469 |

These are uncompressed fulfilled body sizes, not internet billing or production transfer sizes. CDP encoded totals were also recorded, but some background model requests reported ERR_ABORTED and encoded totals vary; their cancellation cause was not isolated. Use exact unique first-party body sizes for the defensible asset comparison, not mixed encoded totals.

- Baseline manifest SHA-256: `8c377ec3259bec0f9ba773fce343bae5006eef0072a014d9a2581c6cd70c5bcd`.
- Candidate manifest SHA-256: `f6e8f3969f4a6938c82d4c78a0368dd4590bc68000312e9bfcbdb196ecee8cb7`.
- Baseline loaded KITT SHA-256: `498f019da73b071b7cacf54f06daa5a5ad0536a14bd27739a3df97f368ecd339`.
- Candidate loaded KITT SHA-256: `b4247a09d36ec41fa1a550374d50e11d7006a124cafc03cc8decc4a83cc4393d`.
- Helicopter source was identical in both: `362926901054cc3516097c1cdd55d52ba75b8133afbcb7481851b78653d4e6e0`; renderer/camera integration changes are covered through the complete runtime snapshot.

## Visual inspection and limits

Matched screenshots show a more recognizable KITT rear, corrected red taillights, cleaner distant street coverage and sharper city facade/window detail. The world remains schematic; no photorealistic claim. The aerial view shows the helicopter at small scale while covering the landmark, streets and surrounding district. Other newly revised vehicle meshes are loaded for boot but not all rendered in these two poses, so their individual acceptance tests remain relevant.

No page errors or missing first-party requests occurred. Map style warnings about null numeric values appeared in both snapshots; they are pre-existing and not concealed by the page-error count. The initial non-escalated attempt failed because CDN requests were denied by subprocess network policy, produced zero samples and closed its browser. Preserved in `release-cumulative-attempt1.json` and `release-cumulative-boot-failure.json/png`. The final benchmark closed its browser in `finally` and released the GPU slot. The runner now exits nonzero for a failed gate; the recorded first complete invocation wrote `passed:false` but originally returned shell status zero before this reporting correction.

Evidence: `release-cumulative-performance.json`, per-frame progress JSON, and eight `release-cumulative-{index}-{mode}-{pose}.png` screenshots. This is a relative same-device software-rendered gate, not a physical phone FPS claim.
