# Mobile pause input lifecycle

Confidence: high from source trace. No runtime edit or browser reproduction by this task.

`auto-mode.js:41` pause calls its local release function at line40, which clears keyboard and drag state but does not reset `mobile-drive.js`'s separate analog values or captured pointers. The auto step at line51 reads those analog values again after resume. A finger held through a second-pointer pause can therefore retain throttle/steer.

`mobile-drive.js:6` identifies active ride without considering paused state; pointerdown and pointermove at lines13-14 also lack a pause check. A new gesture while paused can acquire analog state even if pause itself clears previous state. Its line21 interval watches only changes between auto, flight and no ride, so pause never triggers mobile release. Blur and visibility handling are separate and do not cover an ordinary in-app pause.

Flight `setPaused` at `flight.js:16` clears its own key set, leaving mobile's independent held-key set populated. Repeated movement in the same direction may then skip a keydown because mobile thinks the key remains held, even though flight cleared it. This is a different consequence of the same lifecycle mismatch.

Smallest reliable change: make mobile release callable synchronously from both vehicle controllers' canonical release functions, either a named window hook with optional chaining or a single shared input-release event. This central point covers pause, resume, reset and exit regardless of whether UI, Escape or gamepad initiated the action. Add a paused-state gate before mobile pointerdown captures anything. No broad polling needed.

The existing mobile release implementation clears its pointer map before releasing capture, resets analog/held keys and gesture timers, and hides sticks. Following pointermove then has no matching tracked ID, so it cannot restore an old held gesture. Require a fresh touch after resume. Preserve keyboard/gamepad behavior and left-only touch movement.

Pending browser reproduction: hold left touch with nonzero analog, invoke pause through another action without ending first touch, inspect empty pointers/zero analog, move old pointer while paused, resume while old pointer remains down, verify zero input until a fresh touch. Also start a fresh touch while paused and verify it is ignored; check helicopter held-key state and double-tap hover after resume. City agent owns CDP touch verification.

## Prepared isolated fix

`qc/mobile-pause-prepare.cjs` generated complete request-interception copies `qc/mobile-pause-mobile-drive.js`, `qc/mobile-pause-auto-mode.js`, and `qc/mobile-pause-flight.js`. Source/candidate hashes are recorded in `qc/mobile-pause-candidates.json`. Runtime remains unchanged. All three candidates pass syntax checks; browser acceptance is pending.

Both canonical release functions dispatch synchronous window event `opencity:release-input` without payload; mobile listens and calls its existing release. Synthetic keyup listeners in auto-mode line64 and flight line92 only delete keys, so they do not redispatch the release event. Pointer capture release sees an already empty mobile pointer map.

The paused pointerdown gate runs after preventing default and stopping propagation but before allocating pointer state. This ordering is deliberate: auto-mode's existing legacy pointerdown camera handler does not check paused. An early return before stopping propagation would let paused right-side touches manipulate that camera even though mobile captured no joystick.
