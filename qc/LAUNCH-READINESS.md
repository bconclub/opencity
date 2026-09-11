# OpenCity launch readiness

11 September 2026. This board separates prepared work from production and from
the unfinished high-fidelity goal. Version 0.0.31 is the review release; latest
verified production version remains 0.0.30.

| Work | Current state | Evidence / next acceptance |
| --- | --- | --- |
| Cybercab wheel repair | Committed and review-branch CI passed | `cybercab-rig-acceptance.md`; moving wheels, local/remote driving verified. Original Meshy body artefacts remain. |
| Vidhana smooth domes and facade hierarchy | Committed `f6eb2be`, review-branch CI passed | `vidhana-landmark-performance.md`; unchanged frame cost, 21,100 fewer triangles. |
| Diagonal landmark shadow bands | Runtime correction passes local visual, geometry and performance gates | `landmark-stripe-diagnosis.md`; frame time effectively unchanged, same draw calls. Coverage is local, not all CBD. |
| Portico, stairs and coherent building heights | Review-only architecture candidate | `vidhana-architecture-report.md`; published dimensions separated from estimated datum and component interpretation. Needs full-scene integration checks. |
| KITT shape | Revised Blender workshop, not runtime replacement | `kitt-shape-correction-plan.md`; matched renders, CPU and browser rig checks pass. Still original reconstruction, not manufacturer CAD. |
| 500 m street coverage | Converted and clipped; integration defects identified | 7 batches, 11,673 triangles, 986,300-byte candidate. CPU audit found sign tops treated as ground, route gaps and an unsuitable material heuristic. Keep isolated until corrected. |
| Historical pedestrian lamp | Model study only | `frontage-placement-assessment.md`; none of 37 mapped lamp nodes can be confidently assigned that fixture from available photos. |
| Auto driver | Source audited, unsuitable as realistic driver | `auto-driver-source-audit.md`; supplied character is seated astronaut, current auto remains empty. |
| Physical phone performance | Unverified | Headless relative timings are not actual phone FPS. |
| Production release | Pending | Vercel authentication expired. Earlier automatic approval review rejected a default-main push; review-branch pushes remain available. |

No claim that the full 500 m district, every vehicle, all junctions, or launch
quality is complete. Payments, city-wide expansion and engine migration remain
outside this release. Do not substitute experimental models or expanded streets
only because a file exists or a syntax check passes.

Current team responsibilities: vehicle agent owns Blender workshop geometry;
city agent owns the architecture review; release agent owns shadow diagnosis and
controlled performance testing; root owns integration, street coverage, review
branch and release checks. Rendering jobs run sequentially to avoid corrupting
performance comparisons; independent source/data work proceeds concurrently.
