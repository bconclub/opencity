# Vidhana frontage integrated locally

Accepted runtime commit: `9df5546`. This is a local integration, not a public deployment.

The revised building retains45 physical steps,12 portico columns and separate reconstructed dome geometry. Analytic tread/riser coverage removes broken stair bands while retaining external shadows. The modeled summit is39.8m; the missing upper pedestal and emblem remain unfinished. This is an original reconstruction, not a surveyed or photorealistic replica.

Focus selection now follows emitted geometry. Hidden source footprints cannot override the visible dome. A real hovering helicopter, using the unchanged focus UI, completed the dwell and displayed rounded40m model height.

Ground vehicles use measured body bounds plus conservative pitch/lean allowance at the frontage stairs. A rejected move now restores heading as well as position. The mapped passage remains manually traversable; its known private approaches are excluded from public automatic routes. Generic building and NPC collision behavior is outside this bounded correction.

## Verification

- Native Intel UHD630,1400x900, AA disabled: four-pose ABBA gate passes, worst mean frame-time regression6.40%. Baseline timing drift and sampling limitations are recorded in `vidhana-stair-filter-review.md`; this does not establish physical-phone FPS.
- Actual two-client local room: manual passage in both directions, full-body front/side stair stops, pause/resume, manual takeover and remote Cybertruck rendering pass.
- Independent projected-body audit:578 held-steering poses have zero body and safety-envelope overlap with stairs.
- CPU geometry:120 approach angles across five vehicle bounds,2,930 passage samples, and600 unobstructed physics frames equivalent to the original.
- Exact source hashes and receipts are retained in `frontage-runtime-promotion.json`. New dependencies are included in the service-worker cache list.

The street geometry extension has separate source, ownership, visual and cumulative performance acceptance. Production remains0.0.30; this local release remains0.0.31. GitHub upload is still blocked by automatic approval review pending the previously requested explicit approval. No room-server change was made.
