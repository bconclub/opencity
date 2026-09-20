# Full-HD AA candidate rejected

Confidence high for this paired measured result. Complete ABBA, 240 intervals per run and pose, actual Intel UHD630 D3D11, 1920 x 1080 DPR1. All twelve samples had correct context AA/sample attributes and no page errors after MapLibre5.7.2 repair.

The reference is immutable f1fd503 with only both MapLibre JS/CSS URLs repaired to5.7.2. Candidate is4b79104 plus exact four source overrides archived in `final-aa-fullhd-on-sources`. This is not an unmodified historical-baseline comparison; the original5.6.1 baseline crashes at the FullHD aerial preparation and its failed attempts remain recorded.

| Pose | Repaired reference mean ms | Candidate mean ms | Regression | Candidate median / p95 ms |
|---|---:|---:|---:|---:|
| Road |19.3002|28.1196|+45.70%|35.10 /36.30|
| Aerial |19.2000|32.3383|+68.43%|35.80 /36.40|
| Close |23.1110|33.7390|+45.99%|35.90 /54.10|

All three exceed the10% cumulative frame-time gate. FullHD default4xAA must not be promoted on this evidence. Candidate close equivalent RAF rate is29.64FPS and its95th-percentile interval54.1ms. Reference close also has uneven frame delivery (p9553.12ms), so disabling AA alone does not establish smooth playability.

Actual candidate contexts report antialias true and four default framebuffer samples; references report false/zero. The comparison also contains cumulative city/model changes, so these percentages are not an isolated AA-cost measurement. Earlier1100x760 results cannot be extrapolated to this2.48-times larger pixel workload.

Candidate manifest SHA256 `1a89428052145f997aeab523a8b41fed1c67d0bb54de51f9b51b5a7587056ce2`. Repaired-reference manifest `843ca4f68b895918e61bc3cf994ea3ddc62be3764ae154f806e1ae3b62fb9172`. Exact source bytes, raw intervals, external response identities and matched screenshots preserved under `final-aa-fullhd-on-*`.

Browser closed. Reduced pixel-budget policy requires separate fresh measurements; no averages from this failed experiment should be pooled with the later tier checks.
