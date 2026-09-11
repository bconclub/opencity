# OpenCity launch readiness

11 September 2026. This board separates prepared work from production and from
the unfinished high-fidelity goal. Version 0.0.31 is the review release; latest
verified production version remains 0.0.30.

| Work | Current state | Evidence / next acceptance |
| --- | --- | --- |
| Cybercab wheel repair | Committed and review-branch CI passed | `cybercab-rig-acceptance.md`; moving wheels, local/remote driving verified. Original Meshy body artefacts remain. |
| Vidhana smooth domes and facade hierarchy | Committed `f6eb2be`, review-branch CI passed | `vidhana-landmark-performance.md`; unchanged frame cost, 21,100 fewer triangles. |
| Diagonal landmark shadow bands | Runtime correction passes local visual, geometry and performance gates | `landmark-stripe-diagnosis.md`; frame time effectively unchanged, same draw calls. Coverage is local, not all CBD. |
| Generic facade shading and culling | Integrated locally after independent and visual review | `district-winding-candidate-review.md`; 30,202 inward triangles corrected, position/UV associations retained. Hoisted construction code produces identical geometry/materials; thin parapets remain single sheets. |
| Portico, stairs and coherent building heights | Review-only architecture candidate, full-scene views captured | `vidhana-architecture-report.md`; foyer closes green void, sourced dimensions separated from estimates. Candidate stair collider preserves nearby roads. Thin-line sampling and integration remain unresolved. |
| KITT shape | Revised Blender model and matching picker preview promoted locally | `kitt-runtime-acceptance.md`; two-player driving/paint/scanner checks pass. Relative full-scene frame time +7.37%, within 10% gate. Original reconstruction, not manufacturer CAD. |
| Cybertruck dimensions and lamp export | Reviewed revision2 promoted locally with matching picker preview | `cybertruck-runtime-acceptance.md`; two-client drive/paint/lamp checks and geometry-based remote steering pass. Relative frame time +2.699%. First rejected candidate preserved; details remain schematic. |
| 500 m street coverage | Repaired candidate passes CPU checks and locally improves scene; broad scene not accepted | `street-500-gap-export/README.md`; 7 batches, 11,634 triangles, 983,456-byte GLB. Known gap closed; 2,187 route samples within 1 mm. Adjacent grey remnants, kerb/marking slivers, boundary handoffs and turns remain. Keep isolated. |
| Source road routing | Generator safeguards tested; production graph unchanged | `street-500-route-audit.md`; private/conditional/raised routes withheld, source identities retained. 2,191 eligible samples, one gap; boundary handoffs need source verification. |
| Ambient traffic cornering | Integrated and review-pushed in `4e4a19a` | `npc-curve-candidate-review.md`; advance braking reduces the reproduced bend entry from 7 to 1.93 m/s. Six fleet scenarios and actual-runtime soak pass without overlaps; ordinary maximum queue wait increases from 34.45 to 40 s. |
| Ambient traffic wheels | Animated detailed cabs nearby, lightweight static wheels farther away; integrated locally | `npc-detail-review.md`; unchanged accepted source, max two detailed desktop / one mobile. Rejected 5,996-triangle rebuild stays excluded. Five shared near batches plus one far batch preserve all fleet members. |
| Pale road speckling | Coverage filtering integrated into accepted small patch, locally verified | `street-coverage-report.md`; four batches unchanged, near geometry retained. Relative frame time -5.31% aerial / +4.60% near. Missing-atlas fallback and reload pass; no moving-camera or physical-phone claim. |
| Historical pedestrian lamp | Model study only | `frontage-placement-assessment.md`; none of 37 mapped lamp nodes can be confidently assigned that fixture from available photos. |
| Auto driver | Source audited, unsuitable as realistic driver | `auto-driver-source-audit.md`; supplied character is seated astronaut, current auto remains empty. |
| Physical phone performance | Unverified | Headless relative timings are not actual phone FPS. |
| Actual desktop GPU | Verified Intel UHD 630 D3D11 | `npc-detail-hardware-report.md`; candidate road/aerial around 16.68 ms per frame, close 21.41 ms mean / 34.23 ms p95. Relative regressions pass, but close-view stutter remains and 60 Hz cadence does not reveal GPU headroom. |
| Edge anti-aliasing | Hardware experiment passes; not integrated | `hardware-aa-review.md`; actual 4x MSAA improves edges, road +0.415%, aerial unchanged on Intel. Earlier software-renderer rejection remains valid. Hardware-aware integration, fallback/mobile checks and final cumulative verification remain. |
| Cumulative release performance | Nearby cab detail included; all three observed gates pass | `npc-detail-cumulative-report.md`: whole v0.0.30 versus `9e500bb` plus exact NPC modules, road +5.69%, aerial +2.12%, frozen max-detail close +5.86%. Earlier passes and road +10.67% failure remain preserved. Physical-phone performance remains unverified. |
| Production release | Pending | Vercel authentication expired. Automatic approval review has also blocked the latest review-branch push; explicit approval is pending. |

Latest verified pushed code/audit head: `d170f22` on `codex/release-0.0.31`.
The accepted shader is committed locally as `334a146`; the facade correction is
`14d7fbf`, nearby animated traffic is `004e1ca`, and isolated street-gap evidence
is `daf95fd`. The attempted upload through `3bc0d85` of 43 prepared source, model-review
and QC files to the same review branch was rejected twice by automatic approval
review, including after destination and file checks. The reviewer requires explicit
approval for this exact repository upload. An approval request covering through
`3bc0d85` is pending. Do not retry or use another route while it remains unanswered.
The earlier successful push completed using the existing `bconclub` account explicitly selected;
the earlier credential-manager wait did not require a new account. Last completed
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
marking aliasing. These commits are now pushed for review, not deployed. KITT replacement
checks passed locally; integration is committed as `302af8b`, followed by measured
bumper clearance in `15ddec2`. Loop clearance baseline is committed as `c8c4643`.
Coverage filtering and release staging correction are committed in `27049dd`.
Cybertruck integration is committed as `1d11f02`; refreshed staging hashes are
committed as `628bbad`; NPC corner braking is `4e4a19a`. These commits are pushed
for review, not deployed. `release-31-staging-final.json` and `npc-detail-stage.json`
confirm all 110 staged runtime files match, including both new NPC helper modules.
The receipt records the prior committed base; the nearby-NPC integration is
committed as `004e1ca`. The facade change is committed as `14d7fbf`.

No claim that the full 500 m district, every vehicle, all junctions, or launch
quality is complete. Payments, city-wide expansion and engine migration remain
outside this release. Do not substitute experimental models or expanded streets
only because a file exists or a syntax check passes.

Current team responsibilities: city agent tests the isolated generic-facade
winding correction against the full release baseline; review agent independently
checks geometry and targeting effects; root reviews visuals and owns integration.
Vehicle and traffic agents have delivered their recorded checks. Rendering jobs run sequentially
to avoid corrupting performance comparisons; source/data work proceeds concurrently.
