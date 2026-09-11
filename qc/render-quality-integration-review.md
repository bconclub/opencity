# Render-quality integration review

**REJECTED FOR RELEASE.** Later cumulative Intel checks failed: FullHD4xAA increased frame time45.7/68.43/45.99%;1100x760 close view increased17.6156%, exceeding10% gate. Root removed app/sw integration. Policy preserved only as `qc/render-quality-rejected.js`; original test receipts and archived source hashes remain unchanged. No AA runtime promotion.


Read-only review,2026-09-11. No GPU, runtime edits or deployment.

| File | SHA256 |
|---|---|
| app.js | 3a8b356506db642bac925f10f33cba2053b9fb64e013ae6796cf3f0d60b9c1c6 |
| sw.js | 80b3d25506c217e21fa24696fb6859cc8818e81b1da885c8fd0759a48b9e92b6 |
| render-quality.js | f9637c8e4dde3c580288abd95f3785f6df5ad13c4ac72e631e223f1e39e09379 |

## Historical candidate integration behavior (removed)

`app.js` initializes antialias false before dynamic import. Import rejection, missing export or thrown policy invocation is caught before Map construction, retaining compatible rendering. Policy's own probe failures return false. App explicitly pins high-performance powerPreference, matching probe and MapLibre5.6.1 defaults. App does not add extra UI or stored preference overrides.

`sw.js` adds render-quality.js to existing first-party allowlist and atomic install cache.addAll list. Offline use can therefore resolve the policy module from installed release. A missing policy file prevents new worker install; existing worker remains available, while fresh app loading still has import fallback.

## Release gates and limits

1. **Release namespace is already distinct for first publication.** Root confirms production remains0.0.30 and candidate0.0.31 has not shipped. Keep0.0.31 for its first publication; no additional bump requested. Worker cache namespace depends only on release version, so future changed releases must not overwrite an already-published version's cache namespace.
2. **Initial-size classification is not a lifetime size cap.** A viewport/DPR increase after context creation keeps existing antialias state, potentially exceeding tested pixel budget. No resize-triggered context replacement is implemented. Final claims must describe initial eligibility, or root must add a separately tested resize strategy.
3. **Probe success is not guaranteed Map context success.** Hybrid driver choice or later allocation failure can differ despite matching power preference. Current Map constructor exception reaches generic boot failure, without an automatic AA-off retry. Root explicitly retains this behavior rather than adding untested partial-Map cleanup/recreation. Native/software smoke establishes current device behavior only. No such failure observed; actual final Map context attributes/renderer/samples must be asserted by city agent's cumulative harness.
4. FullHD and reduced-budget candidates failed their subsequent cumulative gates. This historical source review does not authorize either AA tier.

No correctness blocker found in dynamic-import fallback or manifest membership. Above limits and release actions must remain explicit in final acceptance rather than inferred away. City agent owns final hardware/fallback validation; no test results manufactured here.
