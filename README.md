# Bengaluru Living City: CBD study

Run `npm start`, then open http://127.0.0.1:4173/. No npm install or API key is required. Internet is required for the pinned MapLibre 5.6.1 and Three.js 0.169.0 CDN modules and map tiles.

## Current scope

Work is restricted to the captured central pilot: 77.585–77.604 E, 12.966–12.985 N. This includes Vidhana Soudha, Cubbon Park, UB City, High Court and Chinnaswamy Stadium. It does not yet include the full commonly described CBD. Seven local destinations replace city-wide destinations. Aircraft movement is bounded to this area.

## Auto

Choose a vehicle → Auto → Enter auto.

- Up arrow accelerates. Down brakes, then reverses after stopping.
- Left/right arrows steer continuously. WASD remains an alias.
- Space brakes to a stop. Escape pauses/resumes.
- Touch: hold the steering and pedal buttons. Release or cancellation clears that input.
- Reset returns to the Cubbon spawn. Exit restores the map camera, labels and controls.

The auto moves freely rather than selecting graph junctions. `auto-physics.js` integrates at up to 120 substeps per second with momentum, speed-dependent steering, grip-limited yaw, road/grass traction, reverse, and spring-damped pitch/roll. `auto-world.js` checks a two-circle vehicle footprint against ground-level mapped building polygons and CBD limits. The camera has a damped spring and speed-dependent distance. This is an arcade model, not calibrated three-wheeler dynamics. There is no traffic, pedestrian, tree or kerb collision simulation. Roads have illustrative widths; movement is not legal navigation.

## Helicopter

Choose Helicopter, a virtual Cubbon departure pad, then Enter helicopter and Take off. W/S pitches, A/D turns, Q/E strafes, up/down arrows control altitude, Space brakes, L takes off/lands, Escape pauses. Banking, world-space inertia and a spring chase camera remain. Main and tail rotors rotate independently. There are no aircraft obstacle collisions or terrain. Departure pads are fictional.

## Buildings and landmarks

`district-data.json` contains the captured OSM/OpenFreeMap district geometry. `district.js` preserves mapped building colours where available; fallback facades, rooftops and planting remain illustrative. `building-context.js` suppresses overlapping base buildings to prevent depth flicker.

`landmark-data.json` supplies 74 OSM building-part polygons for Vidhana Soudha and UB City. Vidhana Soudha includes seven shaped domes, mapped courtyards, columns and portico roof. Repeated facade bays and roof profiles are approximations. The main mapped shell is opened under the portico roof so it does not conceal the columns. This is not yet a high-fidelity replica: carving, emblem, stairs and source height discrepancies require further work. See LANDMARK-SOURCES.md for evidence, limitations and acceptance criteria. User reference images are not included as textures.

## Validation and 4K captures

- `node verify-car-physics.mjs`: acceleration, coasting, steering/lean, stop, reverse, timestep consistency, collision barrier and mapped spawn.
- `node verify-cbd-drive.cjs`: CBD/landmark loading, desktop arrow-key driving, mobile pedals, pause, exit and browser errors.
- `node verify-dynamics.mjs`: helicopter integrator checks.
- `node render-cbd-4k.cjs vidhana` (or `ub`, `cbd`): 3840×2160 PNG with attribution. Resolution does not certify fidelity.

Browser scripts use this workstation's bundled Playwright and installed Edge. Earlier city-wide browser scripts predate the CBD restriction; the CBD test supersedes them.

## Publish

Serve index.html, all app CSS files, app.js, flight.js, flight-physics.js, helicopter.js, district.js, district-data.json, building-context.js, landmarks.js, landmark-data.json, auto-mode.js, auto-model.js, auto-roads.js, auto-physics.js and auto-world.js. Keep OSM attribution and ODbL obligations for redistributed data. No Google imagery is embedded. Terrain is flat. The localhost link only works on this machine.

## Gamepad controls

Enter a vehicle, connect a USB or Bluetooth controller, press a button, then release controls to activate. HUD shows detected controller. Browser standard mapping is required; unrecognized layouts fall back to keyboard/touch.

- Auto: left stick or D-pad steers; RT/R2 accelerates; LT/L2 brakes then reverses; A/Cross stops.
- Helicopter: left stick or D-pad flies/turns; RT/R2 climbs; LT/L2 descends; A/Cross hovers; X/Square takes off or lands.
- Both: Y/Triangle cycles camera; Start/Options toggles pause.
- Stick dead zone prevents drift. Disconnect pauses vehicle. Controls remain usable alongside keyboard and touch.

Ship gamepad-controls.js alongside the existing app modules. `node verify-gamepad.cjs` checks both vehicles with a simulated standard controller. Physical controller compatibility has not been tested.
