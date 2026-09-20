# Pause clears mobile controls

Holding a touch joystick while pausing previously left the mobile analog state
and captured pointer alive. Resuming could reuse that input. Helicopter key
tracking could also disagree with the cleared vehicle key set.

The canonical ground and flight release functions now emit the synchronous
`opencity:release-input` event. Mobile controls respond by releasing captured
pointers, clearing analog values and held keys, and cancelling gesture timers.
Touch starts while paused are consumed before they reach legacy camera handlers.
Key-up handlers only remove keys, so the reset does not recursively emit itself.

Actual browser CDP touch reproduced the bug at330,390 and430px. The exact three
candidate files then passed ground motion, steering, release, pause clearing,
helicopter held-key reset, ignored paused touches, fresh input after resume,
right-side inactivity and UI exclusion. No horizontal overflow or page errors
occurred. SwiftShader boot and pause/resume also passed. These checks do not
establish physical-phone performance, tilt permission or multiplayer latency.

Root reviewed unhidden driving and control-center screenshots. The active view
keeps the map visible with a compact bottom HUD; a stale Resume overlay in an
earlier capture was corrected by waiting for its existing100ms UI sync.

`final-aa-final-smoke.json` records source hashes and checks.
`mobile-pause-candidates.json` records before/candidate identities.
`promote-mobile-pause.mjs` checks those identities and test results before copying
the three reviewed files; `mobile-pause-promotion.json` records the promotion.
No rendering change or new multiplayer vehicle identifier is introduced.
