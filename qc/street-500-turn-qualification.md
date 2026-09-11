# Refined turn qualification: rejected, ownership still unverified

The refined curve must **not** be enabled for NPC traffic. Existing exported asphalt contains the curve, but the required0.1m vehicle margin crosses an explicitly mapped kerbed grass island. The90poses outside original source ribbons cannot all be assigned to a verified same-source junction polygon from this snapshot.

This supersedes any interpretation of the earlier geometric feasibility result as a safe or legally qualified route. It does not alter that earlier measurement: the rendered asphalt mesh contains the candidate. The additional source barrier and route-identity checks reveal why mesh containment alone was insufficient.

## Rejected: mapped kerbed island338941369

OSM way **338941369** is a closed polygon tagged `barrier=kerb`, `landuse=grass`. The full4.6m-by2.1m envelope, including the requested side margins, intersects this polygon in **57poses**, indices788–844 of1,644dense samples.

- Swept overlap: **0.0088098m²**.
- Maximum measured vertex penetration: **0.01420m**, approximately1.42cm.
- Representative vehicle-center position: `[77.58866847,12.98115218]`.
- Nearby responsible island vertices include **3461278345** at `[77.5886621,12.9811296]` and **3461278338** at `[77.5886586,12.9810963]`.
- The bare1.9m-wide vehicle body does not intersect the polygon in this sample. The failure is specifically the required0.1m clearance margin, which cannot be relaxed silently to qualify the path.

All island refs, contact positions and overlap measurements are recorded in `street-500-turn-qualification.json`. The grass/kerb polygon must be a routing obstacle even where the converter's asphalt footprint overlaps it. Do not expand source road ribbons, erase the island or relabel the asphalt overlap as permission to drive there.

## Unknown: ownership of all90out-of-ribbon poses

All90poses occur around the northern turnaround. Their nearest source lines divide into two groups:

| Poses | Nearest source way | Count | Position range | Maximum center distance from that line |
|---|---|---:|---|---:|
| 174–206 | 338941361 | 33 | `[77.58850677,12.98162355]` to `[77.58853233,12.98163698]` | 5.163m |
| 207–263 | 1092049622 | 57 | `[77.58853324,12.98163713]` to `[77.58857884,12.98161914]` | 5.242m |

Proximity is reported as evidence, not used as an ownership assignment. There is no explicitly mapped junction-area polygon here that establishes these90vehicle envelopes as a permitted widened turn on the original loop2. None can therefore be marked source-owned with high confidence from this snapshot alone.

The second group exposes a topology issue in the earlier geometric interpretation. **Way1092049622 is an existing mapped cross-connector**, absent from original loop2 but present in alternative loop3. It runs from east node **3461278368** to west node **10001492588**, through **12113879976**, **12113879975** and **12113879974**. It is `highway=tertiary`, with no restrictive access or one-way tag in this snapshot.

Original loop2 turns at the farther north shared node **3461288196**, connecting338941361to763048421. The geometric candidate turns earlier, near the cross-connector. It therefore cannot simply inherit loop2's junction identity. Alternative loop3 provides an existing legal-direction source connection, so no new road needs invention, but merely relabeling the current candidate as loop3 is also insufficient: **201poses** exceed loop3's estimated-width ribbons. Actual source-linked junction envelopes are still required.

## Verified source directions and access

- **338941361**, Devaraj Urs Road / Race Course Road: `highway=tertiary`, `lanes=3`, `oneway=yes`, `surface=asphalt`. Loop traversal follows source order northward.
- **763048421**, same road: `highway=tertiary`, `lanes=3`, `oneway=yes`, `surface=asphalt`. Loop traversal follows source order southward. `parking:both:restriction=no_stopping` is a parking restriction, not permission to ignore traffic-control stops.
- **358318638**, southern connector: `highway=tertiary`, `surface=asphalt`. No one-way or restrictive access tag in this snapshot. The loop follows source order from3461278331to3461278332.
- **1092049622**, northern cross-connector: no restrictive access/one-way tag. Alternative loop3 traverses west-to-east, reverse source order, which the current tags permit.

These statements verify consistency with the cached tags, not current municipal road rules.

## Restrictions, stops, crossings and other areas

The snapshot contains four turn-restriction relations: **15515601**, **15515602**, **15519215**, **21110637**. None references the four relevant road ways. No mapped stop, give-way or traffic-signal node lies within40m of the candidate in this snapshot. Absence in the snapshot is not proof that no real-world restriction or signal exists.

Nearby mapped crossings remain separate from the candidate:

- Zebra nodes **12538083606** and **3461278326**: swept-body distance13.07m and19.88m respectively.
- Uncontrolled crossing node **11760270700**:24.27m from swept body.
- Explicit zebra crossing way **1266011217**:20.00m from swept body.
- Crossing way **1354824989**:13.06m from swept body.

The candidate does not intersect these source crossing geometries. No new zebra or stop line should be inferred at the earlier turnaround.

Nearby garden/park polygons38871254,38871258,1354824983, grass polygon366246823 and building373266001 have zero swept-body overlap. The specific positive obstacle overlap is338941369.

## Bounded next action

The source-based correction is to investigate **alternative loop3 using actual cross-connector1092049622**, with its four source segments and real incident nodes. Build a constrained turn zone from reviewed geometry explicitly owned by those incident source ways. Treat grass/kerb338941369 as a hard obstacle with the full requested margin. Then rerun direction, obstacle, radius and body-envelope checks. Any missing junction width or turn permission remains unknown until verified through suitable reference imagery or mapped geometry.

A small path adjustment may restore the lost1.42cm clearance, but this task did not change the candidate. That alone would not resolve the northern junction ownership issue. Current candidate remains rejected.

## Reproduction and provenance

Run `qc/street-500-turn-qualification.py`. It writes only its qualification JSON, reads existing source nodes/ways/relations directly and does not execute earlier audit scripts or alter their outputs. Per-pose evidence and exact original node IDs are retained.

OSM snapshot SHA256: `9d4e23f03a19cf4f819d0ca49e42c8a79f9b28458d7e2f76b57a2c75262c0ac8`.

No runtime, network, geometry or vehicle changes were made. No GPU was used. Confidence high for source IDs, cached tags and measured overlap; junction ownership remains unknown.
