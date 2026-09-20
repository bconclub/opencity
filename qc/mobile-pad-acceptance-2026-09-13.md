# Floating left movement pad

User requested one movement pad on the left, appearing wherever touched, without the conflicting controls. Implementation in mobile-drive.js creates exactly one pad; right-side map touches do not drive or rotate the camera. One touch owns movement through release, even across the midpoint. A fresh touch sets a fresh origin. Release, cancellation, pause, menu opening, focus loss and resize clear all input. Initial ride/timer synchronization avoids cancelling the first touch.

Flight reads the same proportional touch values as ground driving. It no longer receives full-lock arrow events from thumb motion. Forward thumb movement on a parked helicopter starts takeoff through the existing button. Double tap retains stop/hover and two upward swipes retain temporary boost. Desktop mouse steering/orbit remains active, with touch excluded from those handlers.

Touch mode hides legacy keypads regardless of portrait, landscape or wide touch viewport. Right pad styling removed. Existing menu controls are retained; map touches do not intercept menu buttons.

Browser fixture: `qc/mobile-pad-review.html` with actual mobile-drive.js and styles, including legacy mobile-controls.css loaded last. Twenty checks passed at 390x844 and 844x390. Coverage: one pad, initial position, analog diagonal/reverse values, first-drag timer, second-finger ownership, cross-midpoint continuation, release, relocation, cancel, ignored right touch, proportional flight, pause, menu, blur, resize, hidden old keypads, double tap, boost gesture and gesture release. Transparent left pad screenshot inspected in portrait.

These are browser-dispatched PointerEvent tests with mocked ride status, not physical-phone or full-city flight testing. Real pointer-capture hardware behavior and physical-phone performance are not claimed. Syntax/entry checks passed. Initial test harness exact string comparison failed on CSS float serialization; changed to a 0.01px comparison tolerance, then reran both viewports successfully.

Prepared for user-authorized release 0.0.32 together with the wheel/tyre changes. Publication status must be verified separately.
