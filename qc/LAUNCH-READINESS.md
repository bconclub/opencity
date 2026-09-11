# OpenCity launch readiness

11 September 2026. This board separates prepared work from production and from
the unfinished high-fidelity goal. Version 0.0.31 is the review release; latest
verified production version remains 0.0.30.

| Work | Current state | Evidence / next acceptance |
| --- | --- | --- |
| Cybercab wheel repair | Committed and review-branch CI passed | `cybercab-rig-acceptance.md`; moving wheels, local/remote driving verified. Original Meshy body artefacts remain. |
| Vidhana smooth domes and facade hierarchy | Committed `f6eb2be`, review-branch CI passed | `vidhana-landmark-performance.md`; unchanged frame cost, 21,100 fewer triangles. |
| Diagonal landmark shadow bands | Runtime correction passes local visual, geometry and performance gates | `landmark-stripe-diagnosis.md`; frame time effectively unchanged, same draw calls. Coverage is local, not all CBD. |
| Portico, stairs and coherent building heights | Review-only architecture candidate, full-scene views captured | `vidhana-architecture-report.md`; foyer closes green void, sourced dimensions separated from estimates. Candidate stair collider preserves nearby roads. Thin-line sampling and integration remain unresolved. |
| KITT shape | Revised Blender model and matching picker preview promoted locally | `kitt-runtime-acceptance.md`; two-player driving/paint/scanner checks pass. Relative full-scene frame time +7.37%, within 10% gate. Original reconstruction, not manufacturer CAD. |
| Cybertruck dimensions and lamp export | Reviewed revision2 promoted locally with matching picker preview | `cybertruck-runtime-acceptance.md`; two-client drive/paint/lamp checks and geometry-based remote steering pass. Relative frame time +2.699%. First rejected candidate preserved; details remain schematic. |
| 500 m street coverage | Classified candidate passes ground/material CPU tests and loads in full scene | 7 batches, 11,629 triangles, 983,036-byte GLB plus ground sidecar. Corrected projection scale, sign-top grounding and concrete ownership. One 0.826 m junction gap and road speckling remain. Keep isolated. |
| Source road routing | Generator safeguards tested; production graph unchanged | `street-500-route-audit.md`; private/conditional/raised routes withheld, source identities retained. 2,191 eligible samples, one gap; boundary handoffs need source verification. |
| Pale road speckling | Coverage filtering integrated into accepted small patch, locally verified | `street-coverage-report.md`; four batches unchanged, near geometry retained. Relative frame time -5.31% aerial / +4.60% near. Missing-atlas fallback and reload pass; no moving-camera or physical-phone claim. |
| Historical pedestrian lamp | Model study only | `frontage-placement-assessment.md`; none of 37 mapped lamp nodes can be confidently assigned that fixture from available photos. |
| Auto driver | Source audited, unsuitable as realistic driver | `auto-driver-source-audit.md`; supplied character is seated astronaut, current auto remains empty. |
| Physical phone performance | Unverified | Headless relative timings are not actual phone FPS. |
| Production release | Pending | Vercel authentication expired. Earlier automatic approval review rejected a default-main push; review-branch pushes remain available. |

Latest pushed review head: `aff70dc` on `codex/release-0.0.31`. Last completed
GitHub CI checked `f6eb2be` successfully. The later code has local verification,
but a new PR-description update and CI dispatch were rejected by automatic
approval review, including after repository/PR identity verification. An explicit
user approval request for those two operations is pending. Do not retry or use
another route to perform them until approval arrives. Draft text is prepared in
`qc/pr-31-description.md`; new street audit remains in
`qc/street-500-integration-audit.md` and `.json`.

Additional local commits: `db204f5` corrects classified street export/grounding;
`f2e2792` adds source routing safeguards and full-scene review;
`41b5108` records the foyer/stairs/collision candidate; `7e2396f` isolates street
marking aliasing. These commits are not pushed or deployed. KITT replacement
checks passed locally; integration is committed as `302af8b`, followed by measured
bumper clearance in `15ddec2`. Loop clearance baseline is committed as `c8c4643`.
Coverage filtering and release staging correction are committed in `27049dd`.
These commits are local, not deployed.

No claim that the full 500 m district, every vehicle, all junctions, or launch
quality is complete. Payments, city-wide expansion and engine migration remain
outside this release. Do not substitute experimental models or expanded streets
only because a file exists or a syntax check passes.

Current team responsibilities: city agent owns architecture and road-depth
diagnostics; traffic agent owns source eligibility and junction investigation;
street agent verified export/runtime tests and now audits KITT integration;
root owns export, integration and release checks. Rendering jobs run sequentially
to avoid corrupting performance comparisons; source/data work proceeds concurrently.
