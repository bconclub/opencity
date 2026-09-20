# Driving HUD 0.0.37

HUD-only release. Existing production vehicles retained; asset imports remain separate work.

- 13 browser fixture checks passed: speed, heading, room count, reverse, pause, boost, input release/cancel/blur, room action, altitude, camera and exit.
- Real game viewed on desktop and 330/390px portrait: car/flight HUD, pause/resume, room control, camera, helicopter climb and exit checked.
- Old landscape keypad hidden after visual review.
- Nearby-road canvas updates at 5Hz using shared road data. Observed draw cost 0.30ms on current host. No second WebGL scene or extra map requests.
- No synthetic destination, online count, trip distance, speed or altitude shown.
- Physical-phone and gamepad tests not performed. 430px and final landscape viewport could not be independently confirmed with browser viewport control.
- City geometry and rendering fidelity unchanged in this release.
