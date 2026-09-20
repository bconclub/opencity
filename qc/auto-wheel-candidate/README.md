# Actual auto wheel rig

Local integration, pending combined game/browser acceptance. New high-poly D: car source models are not part of this change.

The previous imported auto hid all animated fallback children and loaded a single static mesh. Geometry connectivity confirms three separate wheel islands despite that fused object hierarchy. `build-auto-wheel-candidate.py` splits those islands into named axle pivots without remeshing or removing triangles. A separate front mudguard and lamp follow `Steer_F`; they do not rotate with the tyre. Rear fenders remain fixed.

- Three imported tyres roll, reverse and stop through the same physics-distance angle used by the cars.
- One front wheel turns along steering input. Four-wheel vehicles retain Ackermann steering.
- Optional accumulated slip angle affects only rear tyres. Default zero preserves previous NPC/remote rolling behavior.
- Contact positions are vehicle-local metres, game +Y forward and +Z up. This enables skid marks under actual tyres.
- Source textures and unmodified body vertex buffers remain byte-identical. Total remains 12,604 triangles. New file: 1,626,016 bytes, up 162,128 bytes. Draw calls: 7 primitives instead of 2, before shadow.
- Source rear tyres already sit 16.9 mm above the front tyre's ground plane. Split preserves original shape and positions; no claim of suspension/surface conformance improvement.

Checks: `node qc/test-wheel-driving-behavior.mjs` passes all four runtime rigs for signed rolling, stopped wheels, steering, fixed axle pivots, rear-only launch slip and tyre contacts. Existing KITT and NPC runtime CPU rig checks pass. These use CPU texture placeholders, not rendering.

Blender 4.5.9 CPU renders `straight.png` and `turned.png` visually inspected. Front tyre, mudguard and lamp steer together; body and rear arches stay intact. Browser forward/reverse, manual/auto-roam and remote rendering remain part of combined parent-task verification.

Reproduce geometry with cached Python: `qc/build-auto-wheel-candidate.py`. Reproduce stills with Blender CLI: `--background --factory-startup --threads 2 --python qc/render-auto-wheel-candidate.py`.
