# Hardware-aware AA policy candidate

**REJECTED FOR RELEASE.** Later cumulative Intel checks failed: FullHD4xAA increased frame time45.7/68.43/45.99%;1100x760 close view increased17.6156%, exceeding10% gate. Root removed app/sw integration. Policy preserved only as `qc/render-quality-rejected.js`; original test receipts and archived source hashes remain unchanged. No AA runtime promotion.


Rejected module archive: `qc/render-quality-rejected.js`, SHA256 `2456136bf331f91c794665a88ec138dbb10d6a6a7213cad8a1979b3cc7840e23`. No app.js/sw.js edits or commit by this task.

## Integration API

Import and call synchronous `chooseRenderQuality()` before constructing MapLibre. Result is `{antialias, reason, pixels, renderer}`. Use antialias in `canvasContextAttributes`; root owns module-import failure fallback to antialias false. Pure `classifyRenderQuality(inputs)` supports deterministic tests. No preference storage or UI override.

Candidate enables AA only for fine-pointer desktop Intel UHD630 Direct3D11, WebGL2, at least4 supported samples, and physical initial viewport pixels `ceil(width*DPR)*ceil(height*DPR) <= 1100*760`. FullHD4xAA failed the actual Intel cumulative frame-time gate: road+45.7%, aerial+68.43%, close+45.99% (city agent evidence). FullHD now explicitly returns AA off without allocating a probe. The previous accepted experiment covered1100x760; reduced-budget cumulative close-view check subsequently failed, so neither tier is promoted.

Mobile user-agent/client hints, iPad desktop UA with touch, any coarse pointer, unknown renderer, software renderer, unknown dimensions, oversized viewport, unsupported sample count, context loss and probe exceptions all return AA off. Ineligible mobile/size cases skip WebGL allocation entirely.

## Probe and lifecycle

Probe uses an unattached1x1 WebGL2 canvas. Power preference is high-performance, matching [MapLibre5.7.2 map.ts](https://raw.githubusercontent.com/maplibre/maplibre-gl-js/v5.7.2/src/ui/map.ts); alpha/depth/stencil preferences also match. Finally loses probe context and discards canvas. Missing release extension falls back off; canvas is discarded but forced release cannot be guaranteed without that extension. Exceptions never escape into map boot.

Previous uncapped-policy empty-canvas smoke, preserved as historical evidence: Intel UHD630 D3D11, AA true, actual4 default-framebuffer samples. Forced-software smoke: SwiftShader, AA false, actual0 samples. Both confirmed probe context is lost before creating next context; zero page errors. `render-quality-browser-smoke.json` records exact source hash and actual context attributes. Current reduced-budget classifier/lifecycle tests pass in `render-quality-policy-test.json`. Updated browser smoke harness covers1100x760 and FullHD fallback on native/software contexts, writes a separate capped result, and has not been run by this task.

## Limits

Hardware selection remains a browser/driver hint; on hybrid systems actual map context can differ from probe even with matching preference. Final app context must be checked by release harness. Policy classifies initial viewport only; enlarging/rescaling after map creation does not renegotiate immutable antialias context attributes. FullHD gameplay4xAA was rejected; empty-canvas smoke never established performance. No physical phone GPU or unlisted hardware performance claim. All smoke browsers closed; GPU slot passed to city agent.
