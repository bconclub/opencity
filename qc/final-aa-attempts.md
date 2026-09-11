# Full-HD pre-fix attempts

No complete final AA gate is established by these attempts.

- Attempt 1: historical f1fd503 at 1920 x 1080 completed road then failed during helicopter preparation with repeated MapLibre 5.6.1 `undefined.key` errors. Partial result and road screenshot preserved.
- Attempt 2: full stack capture reproduced `_updateRetainedTiles` at the public MapLibre bundle, line 45 column 70997. Brief overlap with another agent's street capture makes this attempt's timing invalid; stack diagnosis remains useful. Browser closed.
- Attempt 3: explicit map/tile settling between exiting KITT and entering helicopter did not prevent the error. Full stacks preserved in `final-aa-attempt3-errors.json`. Browser closed.
- Attempt 4: independent fresh page for helicopter, with no prior KITT ride, still failed. This rules out previous KITT scene history as a necessary trigger but does not isolate every camera/source condition. Browser closed.
- Candidate transition diagnostic: same full-HD sequence on 4b79104 plus exact AA app/sw/policy overrides also failed in MapLibre 5.6.1. `final-aa-transition-errors.json` and partial diagnostic result preserve the failure. Only ten road intervals were collected; they are not accepted performance measurements. Browser closed.

Exact public bundle inspected CPU-only: `https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js`, saved as `final-aa-maplibre-reference.js`. `_updateRetainedTiles` dereferences four child `.key` values in a branch where the upstream overscaled-tile case can provide one child. Independent QA is verifying the released upstream repair and version pin; this task did not modify the dependency or runtime.

The immutable historical baseline cannot provide a valid error-free aerial timing for the failing full-HD sequence. A subsequent repaired-baseline comparison must label its renderer override explicitly; it cannot be called byte-identical historical f1fd503. Missing samples must not be replaced with zeros or silently ignored.
