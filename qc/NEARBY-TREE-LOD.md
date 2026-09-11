# Nearby tree LOD, rejected release candidate

`nearby-tree-lod.js` remains a candidate module only. Integration was tested and then removed after failing visual and performance gates. It is not imported by `district.js`, included in the worker manifest, or awaited during production boot. The current release keeps original vegetation.

## Tested integration, not active

Add the import:

```js
import {createNearbyTreeLOD} from './nearby-tree-lod.js';
```

After the existing trunk/crowns are attached to `vegetation`:

```js
const nearTrees=createNearbyTreeLOD(T,{
  parent:vegetation,positions:treePositions,trunk,crowns,
  radius:80,maxDesktop:32,maxMobile:16,
  onChange:()=>map.triggerRepaint()
});
```

Inside district `render`, before `renderer.render`:

```js
const ride=window.autoState?.();
const focus=ride?.active&&ride.position?xy(ride.position):null;
nearTrees.update(focus
  ?{active:treesVisible,x:focus[0],y:focus[1],now:performance.now()}
  :{active:false,now:performance.now()});
```

Add `nearTrees.dispose()` to layer `onRemove`. Include `nearTrees:nearTrees.state()` in `districtState()` for QA. Add the module and single GLB to the service-worker release manifest if this integration is accepted. The GLB remains in its reviewed source location under `assets/trees/review`; moving it requires passing `assetURL` or updating the module default.

This first integration activates only for an active ground vehicle. It deliberately does not upgrade every tree in an aerial/overview view. A low ground-camera mode can pass another verified district-local focus later; the module does not guess geographic coordinates.

## Behaviour and budget

- Retains all planting coordinates and existing `z` ground heights, defaulting to the current district's zero ground level.
- Retains the existing cheap distant trunk/crowns. Selected original instance matrices are hidden by zero scale, then restored byte-for-byte when a tree leaves the near set or the controller is disposed.
- Uses three shared instanced meshes, not a mesh/material/renderer per tree.
- Up to 32 near desktop trees / 16 near mobile or coarse-pointer trees.
- New trees enter below 72 m; retained trees exit at 80 m. A small incumbent preference reduces churn under the cap.
- Selection runs at most every 250 ms. No matrix upload occurs when selected IDs are unchanged. Turning the mode off restores immediately.
- Geometry adds at most 20,672 near triangles on desktop / 10,336 mobile and three draw calls. Hidden old instances still exist in their draw buffers, so their vertex submissions are not subtracted from those totals.
- Source textures are shared. Leaves use reviewed alpha-test 0.3, depth writing, alpha-to-coverage where supported and subtle ambient texture fill.
- Reuses the district's renderer/lighting. No extra animation loop, timer, renderer, or shadow refresh loop. Existing shadow refresh policy is unchanged, so cached coarse tree shadows may remain until the district next regenerates its shadow map.
- Load failure leaves original vegetation visible. Disposal during loading is safe. Source geometry/materials and generated instances are disposed; original district geometry is never disposed by this controller.

## Verified, and still pending

`node qc/verify-nearby-tree-lod.mjs` passes pure structural tests for limits, three shared batches, selected/unselected matrix slots, exact restoration, ground height, throttling, load failure, disposal during pending load and hysteresis. It uses real Three.js math/geometry with a small synthetic source, no browser/GPU and no timing claim.

The actual 646-triangle source and alpha texture decode were separately verified by `qc/verify-tree-review.cjs`.

## Actual district result, 2026-09-11

`qc/benchmark-near-trees.cjs` compared a stationary auto at Cubbon Park South, Edge headless SwiftShader 1100 by 760, A/B/B/A with 120 frames each. This intentionally exercised real near-tree selection rather than an aerial view with zero detailed trees. All other rendering agents and Blender CLI were idle. The baseline is the combined pre-tree candidate, not the earlier live release.

- Pre-LOD mean 227.22 ms; candidate 250.39 ms; regression **10.20% additional**. Failed the 10% total release budget.
- District 33 to 36 draws, 309,032 to 329,704 triangles, 18 to 21 textures. Actual near count 32, 96 far primitive instances hidden. No page errors.
- Exiting auto restored near count and hidden-far count to zero; aerial screenshot confirms distant geometry remains.
- `near-tree-ground-before.png`, `near-tree-ground-after.png`, `near-tree-aerial.png`, and `near-tree-performance.json` preserve evidence.
- Software-GPU frame rates here are slow and do not establish real-device playability. Real mobile GPU performance remains unverified; no mobile release claim.

The road view had sparkling pale foliage edges, and mixed botanical/coarse canopies looked inconsistent. A follow-up browser diagnostic changed materials only in memory. Disabling alpha-to-coverage removed the pale sparkle (`near-tree-edge-no-a2c.png`); matte and Lambert variants were also captured. This supports a shared-context/MSAA alpha-coverage issue rather than opaque texture backgrounds, but exact driver behavior was not isolated. These diagnostic variants were not benchmarked or accepted. The candidate module retains the tested configuration so the failed benchmark stays reproducible.

`district-before-near-trees.js` and `district-near-trees-candidate.js` are QC snapshots routed by the benchmark. Production district, loading gate and worker manifest were restored without reverting other agent changes. Any future attempt must use coverage compatible with the map context, resolve near/far silhouette consistency, and pass the full release budget before integration.
