# Nearby traffic fidelity candidate

Status: integrated locally after visual, independent and cumulative performance checks. The aggressive 5,996-triangle rebuild was rejected. This implementation instead uses the accepted 24,667-triangle Cybercab unchanged near the camera, with the existing 6,000-triangle traffic model farther away.

Root inspected matched close screenshots. Near body panels, window borders and wheels are cleaner than the existing traffic model. The source still contains Meshy surface artifacts; this does not establish manufacturer-accurate geometry or complete high fidelity.

## Geometry and behavior

At most two detailed cars on desktop and one on mobile. Selection uses 3D camera distance and screen visibility, with 42 m entry / 52 m exit hysteresis and a 5 m retention preference. Very close newcomers can replace retained cars. Far and near sets partition visible traffic exactly; fleet limits remain 20 / 8.

Five shared near batches preserve original geometry and independent steering: body, fixed liners, left tyres, right tyres, rims. Left/right tyre meshes cannot be substituted using a single proper rotation without changing source normals. Five batches preserve that distinction. The far model uses one additional shared draw.

Wheel phase derives from accepted simulation `totalMoved`, which only advances after collision checks succeed. Steering derives from actual heading change over accepted path distance. Pose history is keyed by persistent car ID, maintained through culling and independent of packed rendering slots.

The near source loads asynchronously. On failure, all cars retain the current lightweight model. Source textures and geometry are cached/shared; helper disposal releases only owned clones.

This is a traffic-layer fallback, not a claim that the whole app can start without the Cybercab asset. Existing `city-loading.js` also requires this file for the player vehicle and can show its retry screen when that download fails. The normal loading gate already preloads the accepted source; the near implementation shares that cached request.

## Evidence so far

- `npc-detail-state-test.json` and independent state review cover caps, hysteresis, heading wrap, stop phase and re-entry.
- `npc-detailed-batches-validation.json` covers exact geometry transforms, independent steering, positive determinants, empty reset and source-resource ownership.
- `npc-detail-visual.json` covers matched frozen desktop scenes, two detailed plus eighteen far cars, quarter-turn phase, aerial fallback and deliberate detailed-model failure. Failure retains twenty far cars without page errors.
- Root inspected `npc-detail-candidate-close.png` against `npc-detail-baseline-close.png`.

Full cumulative comparison passed against the immutable v0.0.30 baseline: road +5.69%, aerial +2.12%, frozen maximum-detail close view +5.86%. All twelve paired samples completed. This includes earlier release changes; it is not an isolated performance-cost measurement. Unique first-party uninstrumented bytes were 15,962,783 versus 16,916,024. Existing boot preloading already requests the accepted Cybercab source.

Mobile emulation at 390 x 844 passed: eight-car fleet, one detailed car, six visible far cars at the test view and one distance-culled car. This is geometry/render validation, not physical-phone performance or a full mobile UI audit. Root inspected the close image; the intentionally tight shared test camera crops the car in portrait.

Independent lifecycle review passed. `npc-detail-promotion.json` ties the integrated modules to the measured/visual hashes; `npc-detail-stage.json` verifies all 110 staged runtime files including both new helper imports. No push or deployment occurred.
