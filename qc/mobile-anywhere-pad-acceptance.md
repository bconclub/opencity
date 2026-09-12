# Full-map floating movement pad, v0.0.34

Removed the left-half admission check. A first touch anywhere on the map canvas anchors the single movement pad to that exact point. Further touches cannot steal ownership. Menus and buttons retain normal interaction. Right-side map touches now drive rather than being ignored. Updated the introductory hint and its saved revision.

Browser-dispatched touch checks passed at 390x844 and 844x390: 26 checks each. Includes right-origin analog driving, centre and corner anchors, secondary touches, menu exclusion, flight input, cancellation, pause, blur, resize, double tap and boost gestures. These use the actual mobile-drive.js with mocked ride state, not physical phone hardware. Entry/syntax checks and diff whitespace checks passed.
