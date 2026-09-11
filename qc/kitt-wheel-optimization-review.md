# KITT wheel-only optimization candidate

Status: rejected for runtime promotion after root inspected both matched wheel close-ups. Increased tyre faceting and removed tread detail conflict with the fidelity target. The accepted KITT stays unchanged; no performance benchmark is warranted for this candidate. Blender completed and shared processing slot released. Confidence: high for geometry preservation and rig checks; moderate for full-vehicle visual similarity.

Candidate: `qc/assets/kitt-wheel-review/kitt-wheel-candidate.glb`. Matched `current-full.png`, `candidate-full.png`, `current-wheel.png`, and `candidate-wheel.png` accompany it. Editable Blender scene and source script remain in `D:/CodexTools/Blender/projects/kitt-wheel-optimization/`; build output is `review-01/`.

Only four `Wheel_*_RubberTrim` index references change. Each drops from 2,436 to 1,364 triangles: remove forty 16-triangle tread tubes and collapse tyre circumference from 48 to 24 samples using existing vertices. All 932 rim-barrel, vent, lug, and cap triangles per RubberTrim wheel remain. BodyPaint rim dishes remain byte-identical.

Total: 24,512 to 20,224 triangles, saving 4,288 (17.49%). Four materials unchanged. Radius extrema remain 0.321 m; 24-sided tyre polygon sagitta is 2.746 mm, versus 0.687 mm before. Removed tread tubes protruded beyond the tyre shell. Close-up visibly loses tread lines and exposes more polygon faceting, especially lower tyre edge. Matched full-vehicle view appears substantially unchanged. This is a visible close-range tradeoff, not an unconditional fidelity pass.

To guarantee preservation, Blender's Python tool writes new index accessors into the original GLB container rather than round-tripping unaffected meshes through glTF export. Original binary payload, materials, node transforms, pivot hierarchy, image payloads, normals, UVs, and vertex buffers remain identical. Per-buffer SHA256 evidence for every unaffected mesh is in `qc/assets/kitt-wheel-review/geometry-audit.json`. Source SHA256 remains `b4247a09d36ec41fa1a550374d50e11d7006a124cafc03cc8decc4a83cc4393d`.

Unused original vertices and indices intentionally remain in the file. This reduces submitted triangles but does not claim lower vertex-buffer memory or download size. New index arrays increase file size. No performance benefit is asserted without measurement.

`qc/kitt-wheel-runtime-cpu-audit.json` passes using actual cached Three 169 GLTFLoader and unchanged runtime `bindVehicleWheelRig`: four wheels spin -90 degrees; zero pivot drift; front steering -0.318136 / -0.388600 radians; rear steering zero; reset error zero; wheelbase 2.5654 m. All eight scanner emissive bindings remain. CPU texture placeholders mean this test does not claim a WebGL scanner sweep. Blender matched renders visually retain scanner and rim alignment.

NPC separated-LOD pipeline remains prepared only. No NPC export or runtime change occurred.
