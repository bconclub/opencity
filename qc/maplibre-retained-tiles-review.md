# MapLibre retained-tile crash

Confidence: high. Source-only investigation; no runtime files changed and no browser launched.

## Recommendation

Pin both MapLibre JS and CSS in `index.html` from 5.6.1 to **5.7.2**, the first release containing the exact fix. Then rerun the original FullHD road-to-aerial transition, followed by the cumulative AA, software fallback and mobile checks. Do not suppress the exception or reduce road zoom merely to avoid its trigger. Runtime compatibility and performance of 5.7.2 remain unverified until those checks pass.

## Evidence

- `qc/final-aa-attempt3-errors.json` reproduces `Cannot read properties of undefined (reading 'key')` in 5.6.1 `_updateRetainedTiles`, including the baseline with AA off. This is not evidence that AA caused the defect.
- [Official issue5616](https://github.com/maplibre/maplibre-gl-js/issues/5616) reports the same missing-child access with high zoom and OpenMapTiles.
- [Official PR6388](https://github.com/maplibre/maplibre-gl-js/pull/6388) adds the guard and a regression test. Its complete patch is preserved in `qc/maplibre-retained-tiles-upstream.patch`.
- [Official5.7.2 release](https://github.com/maplibre/maplibre-gl-js/releases/tag/v5.7.2) lists this fix. Its version-pinned `source_cache.ts` was independently retrieved for local inspection; the released branch matches the patch. The downloaded inspection copy is not versioned. Its upstream URL and hash are recorded in `qc/render-quality-rejected-manifest.json`.

## Exact failure and fix

The old branch chooses between overzoomed-child lookup and four-child lookup using the covering zoom. That zoom need not equal an individual ideal tile's overscaled zoom. `tileID.children(sourceMaxZoom)` can therefore return one overscaled child inside the branch which assumes four. If that child is already retained, the next array access reads `undefined.key`.

Upstream correction checks `children.length === 4` before four-child accesses, then independently accepts `children.length === 1` when its only child is retained. The latter matters: merely guarding indexes prevents the exception but does not preserve intended retained coverage as explicitly as the upstream fix.

Upstream regression uses source maxzoom3, an errored ideal tile `(overscaledZ3, wrap0, canonicalZ3, x1, y2)`, a loaded child `(4,0,3,1,2)`, and covering zoom2. Expected retain set includes both. This test was inspected, not executed locally. Existing upstream tests cover the other branch according to PR review.

## Application scope

`auto-mode.js` raises map maxZoom to24 for road camera; `flight.js` uses22. These are map camera bounds, not source availability bounds. Overscaling beyond source maxzoom is supported behavior. Upstream test demonstrates the invariant failure even with source maxzoom3, so there is no source evidence that our valid camera cap itself is misuse. FullHD changes camera framing and timing, exposing this defect; precise failing tile IDs in our scene have not been captured.

The smallest maintained-release remedy is5.7.2 rather than a major upgrade or a custom minified-vendor patch. Preserve original failing traces and immutable5.6.1 baseline. If AA comparison uses5.7.2 only on the candidate, describe the result as a combined library-plus-AA delta rather than isolated AA cost.
