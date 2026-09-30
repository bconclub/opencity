# Exact pending street integration

These are review inputs, not permission to promote before the final combined visual/behavior/performance gate.

| Runtime target | Verified QC source |
|---|---|
| `assets/streets/vidhana-streets.glb` | `qc/street-500-incoming-junction/asset/vidhana-streets.glb` |
| `assets/streets/vidhana-streets.json` | `qc/street-500-incoming-junction/asset/vidhana-streets.json` |
| `assets/streets/vidhana-ground.json` | `qc/street-500-incoming-junction/asset/vidhana-ground.json` |
| `assets/streets/vidhana-footprint.geojson` | `qc/street-500-incoming-junction/asset/vidhana-footprint.geojson` |
| `vidhana-street-data.json` | `qc/street-500-incoming-junction/shared-static-surfaces.json` |
| `assets/streets/vidhana-owned-surfaces.json` | `qc/street-500-frontage-combined/owned-runtime-surfaces.json` |
| `auto-mode.js` | Compose ownership into the latest independently verified candidate as below; do not overwrite it with the old snapshot copy. |

The current street-patch loader already reads metadata origin, supports the eligible ground sidecar and explicit material roles. Preserve its unrelated newer functionality. This candidate metadata has no `surfaceCoverage` atlas; do not assume the superseded atlas experiment is active.

Add both `./assets/streets/vidhana-ground.json` and `./assets/streets/vidhana-owned-surfaces.json` to the appropriate versioned release cache manifest if absent. Preserve all existing cache entries and apply the root release/version policy. Do not run old prepare-release scripts. Update staging only after exact combined candidate acceptance.

## Composition into a newer auto candidate

```
node qc/street-500-incoming-owned-runtime.cjs --auto-source qc/<latest-verified-auto-candidate.js> --output qc/<new-combined-candidate-directory>
```

The preparer reads the supplied auto source, verifies its authoritative road-generation statement against the current generator, and makes one contextual substitution: install compact offline geometry patches after a generated-road SHA256 check. Every other byte of that supplied source remains in the generated output. It writes `auto-mode-owned.js`, a byte-identical reference `street-detail-unchanged.js`, `owned-runtime-surfaces.json`, and `composition.json` to the explicit output directory. Do not replace runtime street-detail.js. It does not write runtime or overwrite the captured QC scene. Source data/module hashes must still match the dynamic-source receipt; regenerate ownership if the graph or source data changes.

Current snapshot has zero street-detail overlap. Final preparer asserts `detailPatches.length === 0`; street-detail.js and its existing three-argument call remain byte-identical. The earlier optional clipping branch exists only in captured QC evidence and is not part of final integration. Its original preparer is archived as `qc/street-500-incoming-owned-runtime-captured.cjs` to reproduce those screenshots without changing their source hashes.

Composition prepared against frontage input SHA256 `d1691d8edf1536d5eb1e448766f9676d04e0fbbb1a90cbfb084af71bdf80b37b` produces auto module `29ad507cf0920e093e12b4198220db92070a55d84d99380c9b2c3d1f0f6caae5` in `qc/street-500-frontage-combined`. Final compact patch asset is 51,942 bytes. This source composition still requires the cumulative final browser/performance gate.

No driving graph, route, source access restriction, vehicle ID, collision footprint, model, or room-server change is part of this street integration. The basic arc has `routingEnabled:false`. Final source hash checks and browser tests should include the newly fixed frontage/vehicle physics as the root composes them.
