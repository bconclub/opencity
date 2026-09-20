# Vidhana shadow stripe repair

2026-09-11. Integrated into two runtime files: `landmarks.js` normalizes ring winding; `district.js` concentrates its existing shadow texture on Vidhana frontage. Received and cast shadows remain enabled. No deployment performed.

## Outcome and cause

Matched frontage and aerial captures show clean tower walls while retaining dome, courtyard and ground shadows. Confirmed cause of diagonal bands is received directional-shadow sampling, high confidence: disabling only landmark receiveShadow removed bands at unchanged camera and geometry. Final fix retains received shadows.

Actual shadow projection was measured after rendering, not inferred from configuration: baseline P[0] = 0.0005263157894736842, so 2/P[0] = 3,800 m; candidate P[0] = 0.0022222222222222222, so width = 900 m. At 2,048 pixels those widths supply approximately 1.86 and 0.439 m per texel. Most mapped exterior rings also had clockwise winding, yielding inward wall normals under builder assumptions. Outer rings now normalize CCW and courtyard holes CW. Winding correction alone did not eliminate bands; do not attribute visual fix solely to normals.

## Integrated settings and tradeoff

`district.js` keeps 2,048 x 2,048 map and original bias -0.0004 / normalBias 1.2. Target is Vidhana center (77.59065,12.97973) converted through existing district coordinates; light is target + (-600,-800,1200), preserving original direction ratio. Orthographic bounds are -450 to 450 on X/Y, near 100 / far 2500. An explicit updateProjectionMatrix call initializes those bounds before renderer use. Baseline measured projection already matched its old configured bounds after render; the explicit call is not evidence of a stale-projection baseline defect.

Coverage is a fixed light-space volume, not a 900 m ground square. Objects outside retain direct lighting but lose this directional shadow coverage. This prioritizes local frontage; it is not a city-wide shadow solution. Texture allocation unchanged. No blanket shadow disabling or polygon-offset patch.

## Verification

`landmark-stripe-diagnosis-winding-test.mjs` passes both input winding directions for an outer square with courtyard hole: 16 wall triangles face exterior/courtyard, 8 roof triangles face upward, courtyard remains open. Real landmark triangle count, draw count and bounds unchanged; nonuniform dome normals identical. Results saved in corresponding JSON.

Visual evidence: `landmark-stripe-diagnosis-combined-focus900-front.png` and `landmark-stripe-diagnosis-combined-focus900-aerial.png`. These demonstrate tested frontage and aerial views, not exhaustive shadow behavior throughout volume.

Full-scene ABBA harness `landmark-stripe-diagnosis-performance.cjs` compares both runtime modules from f6eb2be with working tree. Final result **passes <=10% regression gate**: baseline249.4458 ms versus candidate248.4725 ms, **-0.3902%**, effectively unchanged within run variability. Individual means are254.1683/244.7233 ms baseline and236.9450/260.0000 ms candidate. Both cases render45 custom-layer calls and419,822 triangles. Source transfer increases836 bytes, with no new texture or model payload. Captured same-origin decoded totals19,927,636 versus19,928,472 bytes.

All four runs use identical camera,1100 x760 viewport,60 sampled rendered frames, one browser page at a time, exclusive rendering slot, and Edge SwiftShader. No physical mobile/GPU performance claim. Zero page errors. `landmark-stripe-diagnosis-performance.json` records actual shadow projection, source metadata, camera, resources and render counts. Actual runtime screenshot `landmark-stripe-diagnosis-performance-1-candidate.png` confirms clean frontage after explicit projection initialization. Earlier run without explicit initialization is retained as `landmark-stripe-diagnosis-performance-pre-projection.json` and is not final gate evidence. Browsers closed after final run.

## Diagnostic experiments

| Experiment | Observation | Decision |
|---|---|---|
| Original settings | Diagonal wall/tower bands | Reject |
| Landmark receiveShadow disabled | Bands gone, legitimate received shadows lost | Diagnostic only |
| Global bias -0.002 | Some tower improvement, facade bands remain | Reject |
| normalBias 0 or bias 0 | Bands remain | Reject |
| Correct ring winding only | Bands remain | Mesh repair, insufficient shadow fix |
| Focus 900/600 m, reduced bias -0.00015 / normalBias 0.35 | Finer visible bands | Reject |
| Correct winding + focus 900 m + original bias | Clean tested walls, architectural shadows remain | Integrated candidate |

Experiments establish combined settings, not a claim that winding correction is independently necessary once original bias is restored in focused volume. Reproduction files remain under `qc/landmark-stripe-diagnosis*`; runtime edits limited to two files above.
