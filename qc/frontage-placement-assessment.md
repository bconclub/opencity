# Frontage pedestrian lamp placement assessment

11 September 2026. Read-only scene assessment; no GPU renderer or benchmark launched.

## Decision

Do not automatically apply `assets-source/fixtures/frontage-pedestrian-lamp.js` to any existing lamp node yet. The reconstruction matches the observed white fluted pedestrian lamp silhouette, but its exact mapped bases are not identified by the available evidence. Runtime `street-furniture.js` remains untouched.

All 37 lamp records were inspected. `qc/frontage-placement-assessment.json` records each OSM ID, exact coordinates, raw tags and decision. Counts: 28 `bent_mast`, six `straight_mast`, three unspecified. None provides surveyed height, pedestrian-purpose classification, distinctive head shape, or a photograph tied to that exact node.

## Why proximity is insufficient

The 2008 geolocated road photograph visibly contains BOTH short white pedestrian fixtures and a much taller straight multi-head road mast. The 2019 frontage photograph also contains a tall straight pole alongside the pedestrian row. Therefore `straight_mast` is not evidence that a pole should receive the short white fixture. Replacing all six straight poles would risk shrinking actual road masts.

The closest plausible candidates are `12150936425` at `[77.5908217,12.9779953]` and `12150936427` at `[77.5910083,12.9778336]`, respectively about 1.2 m from a mapped footway-area boundary and 2.8 m from a mapped sidewalk centreline. These distances are approximate planar geometry checks, not surveyed setbacks. They support sidewalk proximity only. A tall road mast can stand on a sidewalk as well.

`12538083770` at `[77.5927549,12.9802302]` is another straight pole near the frontage, about 11.4 m from the nearest mapped sidewalk centreline. It is not individually identified in either photograph. The other three straight poles lie farther east/southeast among the mixed lamp network. Their `straight_mast` tag is equally inconclusive; `ref=217` on one provides an asset number but no matching photographed number.

The three unspecified poles remain unknown. All 28 bent masts explicitly disagree with the reconstructed straight pedestrian shaft and remain excluded.

## Photographic checks

Inspected local originals referenced in `qc/VIDHANA-FRONTAGE-REFERENCES.md`:

- `ambedkar-road-2008.jpg`: geolocated camera, pedestrian lamps and taller straight multi-head mast coexist. Camera coordinate is not a pole coordinate.
- `ambedkar-veedhi-moheen-2019.jpg`: good fixture silhouette reference, but no GPS and no identified OSM base. Adjacent tall straight pole reinforces ambiguity.
- `vidhana-gate3-moheen-2019.jpg`: inverted-cone heads mounted on stone gate piers. These are not evidence for replacing free-standing poles at nearby mapped nodes.

## Smallest evidence needed for integration

One identifiable existing OSM node matched to a photograph showing its base, shaft and head, or a street-level position/heading that can be anchored to the adjacent gate, kerb and mapped pole. Then whitelist that exact node, label the photographic assignment as inferred where applicable, and instance the fixture with the shared vertex-colour material at the existing coordinate. Do not create a periodic row or infer bases from the camera location.

No runtime import, extra draw call, new coordinate, geometry swap or release-manifest change is needed for this assessment. This is a placement-evidence limit, not a missing model.
