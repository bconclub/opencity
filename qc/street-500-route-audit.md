# 500 m route and boundary audit

CPU-only audit, 11 September 2026. Production GeoJSON unchanged. Confidence high for measured gaps, source tags, topology identity and test outcomes; moderate for the converter's internal reason for the remaining junction omission.

## Root cause of the twenty missing ground samples

Nineteen samples are exact terminal OSM nodes. Their apparent 0.020–0.485 m ground gaps come from a projection scale mismatch, not absent source ways or missing route vertices. `MetricMapProjection.java` uses the OSM2World equatorial circumference, 40,075,016.686 m, scaled by cosine of origin latitude. The asset builder interprets the resulting metre coordinates using MapLibre's mean Earth radius, 6,371,008.8 m. These are different lengths.

Multiply native mesh X/Z coordinates, which become world east/north XY, by **0.9988824009162848** before final circle clipping, Float32 export and footprint generation. Leave height unchanged. Keep the independently verified projection origin. No route-point snapping is needed. The existing accepted small patch is not changed by this audit.

Reprojecting the candidate footprint with this factor reduces all nineteen terminal-node gaps below **0.000375 m**, consistent with native OSM2World millimetre snapping and Float32 representation. Sixteen of these terminal nodes also belong to `access=private` service ways and must be excluded from public NPC routes independently of their visible surface geometry.

Source evidence:

- Local `D:/CodexTools/OSM2World/MetricMapProjection.java`: constructor uses `earthCircumference(origin.lat)`; `toXZ` computes Mercator offsets and rounds to millimetres.
- [Official MercatorProjection source](https://raw.githubusercontent.com/tordanik/OSM2World/master/core/src/main/java/org/osm2world/math/geo/MercatorProjection.java): equatorial circumference and cosine scale.
- Local `verify-street-patch-build.cjs`: footprint inverse projection uses `2*Math.PI*6371008.8*Math.cos(origin[1]*Math.PI/180)`.
- Reproducible transform and before/after gap measurements: `qc/street-500-route-audit.py`, with all twenty coordinates and source tags in `qc/street-500-route-audit.json`.

### Remaining real gap

The remaining sample is on **way/52057928, original source segment 0**, at `[77.59020226666667,12.975491600004656]`. It lies 4.541 m from source node `428831252`, one-third along the first source segment toward node `663564863`. It is 483.427 m from the study center, so this is not the circular boundary seam.

The way is `highway=service`, `access=yes`, `motor_vehicle=yes`, `oneway=yes`. Both node references and the original ordered segment are present in converter input. Its gap remains **0.8263 m** after projection correction. The endpoint joins circular road `1091198031`, whose mapped conditional motor access allows specific daytime hours and excludes Sunday. That condition is presently unsupported and must not be silently treated as unrestricted access.

This is a local converter junction surface omission, not grounds to move the entire route. Inspect and repair the particular shared-node junction against source geometry, or withhold its affected motor segment until covered. Do not add a generic nearest-ground snap or increase ground sampling tolerance by a metre.

## Safe generator changes

`prepare-vidhana-streets.py` is now import-safe. Its generator runs only through `main()`, so tests cannot silently regenerate production files. Public motor route eligibility is separate from visual road/footpath generation:

- Reject steps, paths, footways, pedestrian streets and cycleways from car routing.
- Reject nonzero/invalid layers and affirmative bridge/tunnel variants, including `tunnel=building_passage`; also reject normalized `brunnel=bridge/tunnel` input.
- Respect specific `motorcar`, `motor_vehicle`, `vehicle`, then general `access` permission. Restricted private/no/destination/delivery routes are withheld. Explicit specific permission can override a general access restriction.
- Withhold conditional access and reversible/unsupported one-way routes until there is an actual time-aware routing implementation.
- Preserve `oneway=-1`, explicit overrides and roundabout defaults. `junction=circular` alone does not imply one-way.
- Preserve visible private at-grade roads and pedestrian surfaces. Excluding motor access does not erase their geometry. This work does not flatten or newly model stairways/underground passages.
- Generate segments from adjacent original OSM node references. Missing refs break connectivity instead of being filtered out and creating a false long edge.
- Carry source way, original segment index, both node IDs, clipping fractions and routing tags into future route output.

No production `vidhana-road-network.json` or `vidhana-street-data.json` was regenerated. The generator modifications are preparation for controlled integration, not a released network replacement.

## Measured candidate routing

The preview has **391 eligible source segments inside 488 m**, compared with 746 segments in the legacy network. It has 22 source-identified boundary portals, 380 source/portal nodes and 543 legally directed arcs. Ten nodes have no outgoing legal arc. Those must not become NPC reversal points; closed-loop traffic selection or stopping before unsupported boundaries remains necessary.

Across source motor ways touching the clip, exclusions are 296 private-access segments, 31 private motor-vehicle segments, 24 unsupported conditional segments, 12 nonzero-layer segments, three access=no segments and two tunnels. These counts describe all candidate source motor segments, not a subtraction solely from the 746 legacy features.

Sampling eligible preview segments every at most 5 m produces **2,191 samples**. After projection correction exactly one sample remains more than 1 mm outside ground: the junction described above. This tests centerlines, not full vehicle wheel clearance, kerb clearance or lane-width adequacy.

The final classified, scaled candidate at `experiments/osm2world/coverage-500-classified/asset` was also tested directly, without inverse-transforming the older footprint. It produces the same single remaining gap, **0.826292 m**, across all 2,191 samples. Ground-only footprint SHA256: `03676f34203016d70b73f7f883d72e8c6897b171e21c28af7cc6035589a7284d`. That junction remains an explicit candidate blocker.

## Boundary handoff proposal

Retain the **488 m routing seam inside 500 m rendered geometry** during the first integration. The extra 12 m is a visual overlap allowance; it is not an invented connecting road.

1. Build the inner and outer connector pieces from the same original legal OSM source graph. Each crossing portal is identified by `(sourceWay, originalSegmentIndex, startNode, endNode, interpolationFraction)`. Coordinates alone are insufficient identity.
2. Split each original segment exactly once at the selected 488 m crossing. The outside continuation retains that same portal and follows the adjacent original source node sequence. Preserve one-way direction on both halves. A segment with both endpoints outside can still cross the circle twice and must be split into its three ordered pieces.
3. Continue the source-based connector outside 500 m to a verified shared source node in the district network. The existing district vectors do not consistently retain those identities. Where correspondence cannot be proven, leave the connection closed and exclude it from NPC loop routing rather than merge nearby coordinates or invent a turn.
4. Replace `driving-data.js`'s coordinate-only circle splice with the shared portal result at controlled integration. Use one projection definition for the cut in generator and runtime. The current 1.5 m rounded-node graph keys are not an acceptable proof of source adjacency.
5. Test every open portal in both permitted directions, zero traversal against one-way, no connection across missing refs/private ways/layers, and wheel/ground coverage through the entire 488–500 m strip. Change routing radius to 500 m only if the entire exterior handoff is verified too.

The report includes exact 22 portal coordinates, original node pairs, source endpoints, fractions and legal directions. No boundary connection was invented or enabled by this task.

## Verification

Run the bundled Python executable against `qc/street-500-route-audit.py`. It passes 22 access/brunnel/highway eligibility cases, six one-way cases, a missing-source-node discontinuity test, a both-endpoints-outside crossing test, and clipping/source identity checks. All **442 converter pieces** exactly match contiguous slices of their original source way refs. Hash checks prove both production GeoJSON files remained unchanged during the audit.

An isolated temporary generator run also confirms that private visible roads and footpaths survive, public reverse-one-way tags survive into generated output, and a missing middle node creates two separate source segments without a fictitious connecting edge.

No browser, GPU test, runtime geometry replacement or deployment was performed here. Remaining acceptance work is the actual junction repair, source-verified exterior handoffs, wheel clearance, runtime/mobile visual checks and performance measurement.
