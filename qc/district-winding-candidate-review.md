# Generic facade winding candidate

Review-only candidate based on complete accepted runtime commit `334a146`. Runtime `district.js` has not been replaced.

Candidate SHA-256: `e96864f35666e75bb20d011db0f4ef61e587d45dbc57e506e93c93cb3d3dc276`.

The change swaps the second and third complete position/UV tuples of each inward-wound generic facade and parapet triangle. Ring order remains untouched. Corrected solid facade materials use FrontSide with explicit DoubleSide shadow casting; roofs retain DoubleSide because some elevated buildings have no bottom cap. Parapets retain their existing FrontSide utility material.

## CPU checks

`district-winding-candidate-test.json` passes:

- 54,937 generic bucket triangles retained: 30,202 winding reversals, 24,735 untouched triangles.
- Every original triangle's complete position/UV tuples preserved. Only triangle order changes.
- Every bucket count and extent unchanged. Roof position/UV arrays identical.
- Both CW and CCW courtyard fixtures face outside the building solid, including courtyard walls: 32 tested facade triangles.
- Facade material sides and explicit shadow side verified. Roof remains DoubleSide.

This includes rooftop utility-box triangles as an unchanged control; separately generated landmarks and trees remain outside the modified builder.

## Actual browser checks

`district-winding-review.cjs` served all first-party files from immutable `334a146`, changing only the reviewed district module. It captured matched ground, aerial and facade closeup screenshots in one browser at a time. The browser closed after all six captures. No page errors or missing first-party resources occurred. This was not a timing benchmark.

Actual per-mesh WebGL inspection confirms:

- Baseline facade buckets: culling disabled, DoubleSide shader define present.
- Candidate facade buckets: culling enabled, CCW front face, BACK cull mode, DoubleSide shader define absent.
- Candidate roof bucket: culling remains disabled, DoubleSide shader define remains present.
- Per-bucket triangle counts unchanged across modes.

All three matched views were inspected. Ground-level generic facades lose dark streaked shading and show clean masonry/glazing. Window and blind direction remains unchanged in the closeup. Previously inward-facing parapets now show from the exterior. Aerial generic facade shading changes consistently with corrected outward normals. No missing exterior walls were visible in those views.

This is **not exact shadow-image parity**: corrected receive normals change normal-biased shadow sampling; the former dark artifacts were part of the bug. Explicit DoubleSide shadow casting limits unrelated caster-side changes. Inside-building/backface behavior changes with FrontSide, and thin parapets remain single sheets. No new interior modelling is claimed.

## Whole-release performance gate

The complete `f1fd503054927bde060315c7af3121391c839956` repository runtime was compared with complete `334a1469d4342f4436a89711c4817e3ce4e6a931` plus this exact hashed district candidate. All first-party resources came from immutable extracted snapshots; there was no mutable working-tree fallback. Candidate manifest explicitly records the district override.

One Edge headless SwiftShader browser, one page at a time, 1100 x 760, ABBA, 60 forced repaint intervals per pose/run after readiness and warmup. KITT used an identical paused road spawn/camera; helicopter climbed to the same 90 m then used an identical paused aerial camera. All 20 NPCs remained visible in every sampled frame. Simulation remained active and positions/phases varied, a residual comparability limit. No other GPU jobs overlapped.

| Pose | Baseline runs, ms | Candidate runs, ms | Baseline mean | Candidate mean | Change | Gate |
|---|---|---|---:|---:|---:|---|
| KITT road | 331.9433, 349.7233 | 354.1683, 345.8333 | 340.8333 | 350.0008 | +2.6897% | Pass |
| Helicopter aerial | 308.6117, 304.1667 | 320.8333, 319.7217 | 306.3892 | 320.2775 | +4.5329% | Pass |

Road custom calls/triangles: 112 / 450,916 to 67 / 445,276. Aerial: 104 / 445,600 to 104 / 424,476. These counters exclude MapLibre's basemap. They represent the whole release difference, not an isolated winding ablation.

Unique uncompressed first-party served bodies: 15,962,783 to 16,908,793 bytes (+946,010). Including duplicate requests: 20,013,817 to 20,959,827 bytes. Actual internet transfer/compression and cache behavior are not established by these fulfilled body sizes. Room client and cache bootstrap were disabled equally; live multiplayer cost and cache benefits are excluded.

Both poses pass the requested 10% cumulative threshold. **Do not infer an isolated winding speedup from earlier sessions' numbers.** This is a relative software-rendered device gate, not physical phone FPS. Per-frame NPC timing, exact cameras, selected model hashes, resource hashes and readiness are recorded in `district-winding-cumulative-performance.json` and its snapshot manifest. Eight screenshot outputs were captured; final candidate road/aerial were inspected with the actual vehicles active. No missing resources or page errors occurred. Null-number map-style warnings remain in both versions.

Candidate cumulative manifest SHA-256: `b40f4f6a373781d7b36ca32dc8b1a5d421bf2daace3e3b8cbb7bedade7c3642b`. The benchmark browser closed and GPU was released. Runtime promotion remains the parent's decision; this task did not replace runtime files or commit.
