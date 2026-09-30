# Devaraj Urs Road: user photo reference

Status: reference captured; exact photographed segment and crossing coordinate awaiting Maps share link. No production road geometry changed.

User supplied Photo 1.jpg and Photo 2.jpg on 13 September 2026. Both screenshots identify 106 Devaraj Urs Rd and Google imagery dated February 2026. Use their visible design as a modelling reference, not as a texture atlas or a surveyed measurement.

## Visible features to reproduce

- Two apparent through lanes on the photographed carriageway, divided by a worn white dashed line. Parked vehicles occupy the outer edge; do not automatically count that strip as another through lane.
- Raised paved central divider, trees in individual square raised surrounds, with the opposite carriageway visible beyond it.
- Alternating light and dark painted kerb segments. Dark paint appears greenish in these images; exact colour and dimensions are estimates until verified.
- Grey asphalt with restrained grain, worn markings, leaf litter and local patches. Avoid the current uniform flat surface.
- Second image shows a faded red-toned crossing area with pale transverse stripes. Position, construction and whether raised cannot be established precisely from the screenshots alone.
- Pedestrian paving and boundary fence along the outer edge, with trees and slender lighting poles. Preserve road clearance around trunks and planters.

## Existing local map evidence

`vidhana-road-network.json` contains 58 Devaraj Urs Road segments across seven OSM ways. Every stored width is estimated. The opposed one-way pair `way/338941361` and `way/763048421` is labelled three lanes and 9.6 m wide, between approximately [77.5875011,12.9790803] and [77.5885515,12.9817666]. These are candidate divided-road ways, not a verified match to address 106 or the shown crossing.

Other ways include two-way two-lane segments and ways without lane counts. Do not overwrite the whole named road with one cross-section. First resolve the exact photo position, heading and limits.

## Implementation acceptance

1. Confirm photograph location against mapped carriageways, crossings and divider openings.
2. Build a bounded replacement of that stretch, with separately defined through lanes, parking edge, kerb, pavement and central divider. Record estimated dimensions.
3. Remove overlapping current surfaces within the replacement footprint. Keep junction openings clear; no floating or duplicate paint.
4. Use the same road footprint and raised-surface height data for vehicles, tyre marks, auto-roam and NPC routing. Route NPCs around the divider, not across it.
5. Compare road-level and aerial views to both photos. Check wheel contact, crossing alignment, turn continuity and mobile frame time before deployment.

The existing 500 m Vidhana Soudha refinement remains separate. These photos are not evidence to apply the same geometry to unrelated roads.
