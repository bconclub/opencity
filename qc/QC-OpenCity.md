# OpenCity active QC

No Google Sheet supplied. This local tracker covers the current four UI/control checks; REQUESTS.md retains the broader backlog.

4 given · 3 fixed locally · 1 left. Fixed does not mean deployed.

| ID | Category | Finding | Device | Status | Fixed In | Dev Notes |
| --- | --- | --- | --- | --- | --- | --- |
| OC-01 | UX | Heavy mobile HUD should become bottom gauges | Mobile | Fixed | 0.0.7 local | Reviewed rendered auto at 390×844. Speed gauge and compact actions sit at bottom; controller settings collapsed. Other phone dimensions still need coverage. |
| OC-02 | Feature | Actual rendering performance numbers | All | Fixed | 0.0.7 local | Rendered panel showed live map FPS, frame intervals, custom draw calls/triangles and CPU submission time. Scope excludes basemap draw calls and GPU utilization. |
| OC-03 | UX | Reticle should sit ahead of helicopter | All | In Progress | | Reticle and ray moved to 36% viewport height. Flight screenshot and dwell targeting still need verification. |
| OC-04 | Feature | Vehicle movement needs boost | All | Fixed | 0.0.7 local | Shift, touch Boost and RB/R1 wired to both vehicles. Integrator tests proved increased speed and brake priority. Touch button verified on rendered mobile auto; physical gamepad remains unverified. |
