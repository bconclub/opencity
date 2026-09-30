# Island-safe source loop: single-vehicle fixture passes

A165.639m isolated curve follows existing source loop3 using cross-connector
1092049622. Full4.6m-long vehicle envelope,2.1m wide including0.1m side margins,
stays on existing ground, inside source-road corridors and outside kerbed island
338941369. This replaces the rejected curve only in a review fixture. Runtime
graph and auto-roam remain unchanged; multi-vehicle activation is not qualified.

## Source route and fixture

Ten directed source segments connect338941361 northbound,1092049622 west-to-east,
763048421 southbound and358318638 east-to-west. Original source node adjacency,
segment indices and one-way orientation are asserted. The two connector ways
are bidirectional; traversing them in this selected direction is permitted.
No nearby coordinates are merged and no new road is drawn. This is an actual
loop3 connection, not the old loop2 curve relabeled with different way IDs.

Candidate is constructed from that original closed source polyline, with0.5m
outward offset and6m rolling-circle rounding. Measured minimum turning radius
across0.2m neighborhoods is5.836m. Source widths remain estimates already carried
by the route dataset:9.6m on the three-lane roads,6m on connectors. Every complete
vehicle pose stays inside those original ribbons, without invented junction hulls.

The test samples1657 poses at less than0.1m spacing, joins successive full body
rectangles by convex hull and adds another2mm swept margin. Results:

- Off actual Float32 ground:0m².
- Outside original source-road corridors:0m².
- Mapped island and other nearby obstacle overlap:0m².
- Raised kerb overlap:0m².
- Minimum island clearance:3.204m.
- Source progression never reverses; all ten legal directed transitions remain.

The old curve's known island contact is recomputed as a negative control and
still fails. Its previously measured0.0088098m² swept overlap remains rejected.
An initial5.5m-radius preliminary curve passed coarse body samples but failed
the denser conservative sweep by0.0004099m² off ground; it was not accepted.
The6m candidate passes without enlarging ground or relaxing containment.

## Connectivity and traffic limits

Original isolated source graph has316 directed states and five topological
cycles. Fixture selects one ten-state closed cycle; it does not change the
original graph or claim the other cycles safe. The old rejected curve stays
disabled in `graph-fixture.json`.

This is **single-vehicle qualification**. A0.5m offset is not proof that two
opposing vehicles can occupy connector lanes simultaneously. Multi-NPC use needs
exclusive connector occupancy or independently qualified separated trajectories
and stop/yield behavior. Current fixture explicitly disables multi-vehicle use.
Larger vehicle envelopes are not qualified. Runtime steering/speed integration
and actual driving capture remain necessary; no browser or GPU ran here.

## Independent488m handoff blocker

All22 external portals stay closed. Current district vectors contain2086
transportation features and **zero** sourceWay/sourceNodes provenance pairs.
The existing488m geometric splice plus1.5m node rounding therefore cannot prove
matching source connections. A fixture verifies matching source identities join
and equal coordinates with different node identities do not. This loop is fully
internal and requires no external portal. See `splice-audit.json`.

## Files and reproduction

`candidate.geojson` is the review curve. `graph-fixture.json` preserves source
arcs and disabled modes. `report.json` contains all measurements and source hashes.
`fixture.png` is a CPU plan diagram, not a rendered/driving test.

Run bundled Python against `qc/street-500-island-route.py`. It reads committed
source helpers without executing their old audit side effects, and uses the
latest junction-repaired ground. All outputs remain within this QC directory.
No runtime routes, road geometry, direction tags, access rules or mapped islands
were modified. Confidence high for bounded geometric and source-topology checks.
