# Vehicle rendering integration review

Reviewed current changes in auto-mode.js, flight.js, npc-traffic.js, multiplayer-render.js, blender-vehicle.js and vehicle-contact-shadow.js. Static code/actual GLB node inspection plus matrix tests only. No browser or benchmark launched during this review.

## Result

No newly introduced blocking loading, projection, steering-sign or contact-shadow disposal issue found in the reviewed diff.

- flight.js is still a classic script. Camera helper is correctly obtained from dynamic Promise.all import index 8 inside buildLayer; no top-level static import remains.
- auto, flight and NPC pass camera.projectionMatrix as both input and output. The helper safely copies its inverse before mutating projection. Added tests for this exact alias, including Three's updateMatrixWorld(true). Six camera poses / 24 points: zero clip-coordinate error, finite correct eyes.
- Multiplayer names continue using untouched combined viewProjection. They are not accidentally projected with the factorized camera-only projection.
- Current KITT and review-candidate GLB wheel/steering nodes have identity rotation and Y-up transforms. X-axis negative rolling rotation, Y-axis negative steering rotation and right-inner Ackermann selection agree with +Y world forward and clockwise positive game heading.
- The new front dummy group is empty for GLB cars, so legacy model.front steering does not double-steer the independently rigged GLB wheels.
- Contact footprint is attached to the stable vehicle group, not pitched body, and is cached per vehicle. Remote dispose removes its mesh/material before generic asset traversal, preserving the shared cached contact texture. Repeated starts do not add repeated shadows.
- The scanner has eight numbered nodes, matching animation's 0..7 range. Current exported Lamps material includes its red emissive texture.

## Remaining limits, not new regressions

Cybercab Meshy asset still has fused wheels and no Wheel_FL/FR/RL/RR nodes. It receives updateDrive but its wheel rig is empty. Do not describe all six vehicle wheels as animated; separating/rebuilding that asset remains needed.

Minor robustness follow-up: rig wheelRadius is measured from a world-space AABB after the GLB attaches to body. If an asynchronously loaded remote body is already pitched/rolled, measured Z extent is slightly pose-dependent. Measure in an unposed local frame or use verified per-asset wheel radius metadata to make rolling calibration invariant. Local new-car initialization is unposed, so the normal local start is not affected.

Tests: qc/test-map-scene-camera.mjs now additionally covers aliased projection input and forced Three camera matrix update. Passed on pinned Three 0.169.0.
