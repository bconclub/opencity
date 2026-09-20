# Ringwood segment0: one-triangle review candidate

CPU candidate closes the remaining measured gap without widening the original
service-road ribbon or intersecting mapped grass/kerb/raised sidewalk surfaces.
No production geometry, route, rejected northern turn, or runtime code changed.
Confidence high for measured geometry and cached topology; moderate for inferred
converter mesh ownership; real surveyed width and kerb arrangement remain unknown.

## Cause and source ownership

Original way **52057928**, segment0, connects shared node **428831252** to
**663564863**. Shared node also belongs to circular road **1091198031**.
Raw service mesh323 triangles0/1 start with a cross-section whose midpoint is
**2.159395m away from the mapped shared node**. Its far cap is only0.246253m
from the next node, consistent with a footway-junction trim. The start-cap shift
skews the service strip away from its centerline. Raw junction mesh1074 shares
both start-cap vertices but does not fill the resulting acute-angle wedge.
Thus the raw converter already omits ground along4.675m of the source segment;
classification and projection are not the source of this omission.

Ownership is checked geometrically against the hash-pinned snapshot: the far
cap is perpendicular to this exact segment within0.111mm, the following cap
matches the same way's third node within1mm, and both first-cap vertices occur
in junction1074. The converter supplies no per-mesh OSM IDs, so these are explicit
geometric attribution checks rather than fabricated semantic metadata.

Exact-frame gap is0.825364m. The older0.826292m value uses a slightly different
metres-per-degree reporting frame; it describes the same omission.

## Bounded candidate

The downstream converter cross-section measures **3.496096m**, after the already
validated MapLibre scale conversion. This is a converter-derived width, not a
surveyed dimension. Buffer only the original first segment by half that width,
with flat endpoint caps. Subtract existing classified ground, then retain only
the connected missing polygon containing the failed probe.

Result: **one triangle, 16.430859m²**, height0 matching surrounding asphalt.
Its output uses final Float32 Z-up coordinates in the classified asset's local
frame. No generic nearest-ground snapping, broad junction hull, grass deletion,
or inferred crossing markings are involved.

Files:

- `street-500-gap-repair.py`: reproducible generator and assertions.
- `street-500-gap-repair.json`: hashes, source IDs, dimensions, obstacles and tests.
- `street-500-gap-repair.geojson`: review polygon with source ownership fields.
- `street-500-gap-repair-triangles.json`: additive review triangle, **not a replacement ground sidecar**.
- `street-500-gap-repair.png`: inspected CPU plan view, orange is the proposed fill.

## Containment results

Known probe becomes covered. Whole original segment has only3.862micrometres of
uncovered length from Float32 edge rounding. Full corridor widths1.9m,2.1m and
2.4133m pass, with residual areas below0.00001m². Dense straight-body tests cover
4.6m by2.1m and5.6829m by2.6133m rectangles, including the larger vehicle's0.1m
side margins. These poses remain within the original straight segment.

Mapped grass/garden/building/kerb polygons and raw raised sidewalk triangles
show **zero overlap** with the repair. The nearest relevant mapped garden polygon,
38318887, is8.568914m from the patch. No explicit barrier line occurs within the
30m search window, so the line test does not verify an unmapped real kerb.
Body tests also show zero obstacle or raised-sidewalk overlap. Negative controls confirm the missing
ground and a synthetic obstacle at the probe would fail the checks.

Float32 rounding creates0.0000291m² overlap with existing ground and0.0000167m²
excursion beyond the ideal source ribbon. Total symmetric difference is0.0000796m².
These are explicitly recorded numerical seams, not metre-scale gap tolerances.
Do not place a raised overlay over old asphalt to conceal them. Any integrated
export should process the additive triangle with the same coplanar ownership
cleanup and regenerate the GLB, ground index and footprint together.

## Remaining acceptance

This is a precise data-derived repair candidate, not proof of surveyed kerb
layout. The incident circular road has conditional motor access; this repair
does not authorize unrestricted NPC entry. No turn envelope onto that road,
boundary handoff or driving behavior is qualified here. Those restrictions remain.

For a controlled next export, transform the additive Z-up triangle to the
builder's X-east/Y-up/Z-north input convention exactly once, keep the existing
asphalt role and height0, and apply **no second horizontal scale**. Rebuild in a
new review directory; preserve the current classified candidate. Rerun height,
road containment, material ownership and whole-route samples against the actual
new Float32 outputs. Then obtain coordinated matched scene/ground-level visual
acceptance before considering promotion. No GPU or network job ran in this task.
