# Wheel movement and tyre marks, local implementation

## Changes

- Current Cybertruck, Cybercab and Knight Rider rigs roll with signed road distance and steer their front wheels. Optional accumulated launch slip spins rear wheels only. Existing remote/NPC callers retain zero-slip defaults.
- Imported auto formerly hid its animated fallback wheels. The new `assets/auto/auto-rickshaw-rigged.glb` separates its three original wheel islands without remeshing. Its front mudguard and lamp follow steering, without rolling. Original supplied asset is retained.
- `tyre-effects.js` emits road-contact strips during hard powered launches, hard braking and high lateral demand. Straight coasting, stationary poses and grass do not emit marks. Geometry/height discontinuities and reset/pause break trails.
- `auto-mode.js` supplies actual drive input and motion, offsets the fixed world-space marks into the moving vehicle render frame, and applies launch slip to the visible wheel rig. Tracks fade after 14 seconds and disappear at 24 seconds of simulation time; pause freezes simulation.
- One fixed mesh: 768 segments desktop, 384 mobile. At most 1,536/768 extra triangles respectively, no downloaded texture. Mark history is local to the ride, not broadcast to multiplayer peers.
- New module and rigged auto filename are in the service-worker manifest. No deployment or release version increment in this change.

## Verified

- `npm run check`, syntax checks for auto-asset/blender-vehicle/sw, and selected `git diff --check` passed.
- `node qc/test-tyre-effects.mjs`: actual driving-physics launch and braking, coasting distinction, turn-slip detection, fixed capacity, road heights, off-road rejection, step rejection, reset/teleport trail breaks and reverse braking passed.
- `node qc/test-wheel-driving-behavior.mjs`: four runtime GLBs, signed rolling, stop, steering, pivot stability, rear-only slip and contact positions passed. Details in `wheel-driving-behavior-results.json`.
- `node verify-vehicle-physics.mjs`: existing distinct speeds, boost reserve and frame-rate behavior passed.
- Blender straight/turned auto renders inspected. See `auto-wheel-candidate/README.md` for exact geometry preservation evidence and source scripts.
- In-app browser tested `http://127.0.0.1:4175/qc/tyre-effects-review.html`, using the actual GLB loader, wheel rig, driving physics and effects module with cached Three.js. Cybertruck launch/brake and turn produced visible contact trails; same held turn pose had 81 draw calls with marks and 80 with marks hidden. Cybercab reversed with negative wheel angle and no unwanted marks. Imported auto turn showed three wheel contacts and coherent front wheel/fender. Knight Rider launch/brake reached rest with retained marks. Browser error log empty.

## Remaining scope

The three high-poly files uploaded on D: are still source assets, not the models in this preview. Their optimization and wheel segmentation are separate unfinished work. Browser test uses a test road; full map surface alignment, remote auto rendering, physical-phone performance and complete-city frame-time comparison remain release checks. Do not describe this as published or as a production performance acceptance.

Run the review with `node qc/tyre-effects-review-server.mjs`. Review scenarios freeze their final pose for inspection; normal gameplay continues fading marks. Original vehicle models are reused here to validate movement, not to claim the new high-detail models have been imported.
