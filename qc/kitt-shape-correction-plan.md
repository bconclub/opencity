# KITT workshop: three shape corrections

Scope: `assets-source/vehicles/build-kitt-reference.py` and `assets/vehicles/kitt-review/` only. Current roof-framing pass is a workshop reconstruction, not the live KITT and not manufacturer CAD. No external Nieve model was obtained; Chrome's blocked download was not bypassed.

Assessment used existing workshop front/side/rear-three-quarter images, the source script, the existing Pontiac brochure images, and the brochure's last-page dimensions. No new GPU or Blender render was made for this assessment. The scanned PDF's existing last-page image was decoded for reading, not re-rendered in Blender.

## Verified baseline, before changing shape

The 1982 Pontiac brochure's final page lists the following **base Firebird** figures. Its footnote excludes optional equipment/accessories and warns that options can change dimensions. They are not measurements of a specific screen-used KITT.

| Base brochure figure | Metric conversion | Workshop source | Interpretation |
|---|---:|---:|---|
| Wheelbase 101.0in | 2.5654m | 2.5654m | Correct. Preserve. |
| Length 189.8in | 4.82092m | Main shell 4.820m | Shell scale already close; KITT nose/accessories remain estimates. |
| Width 72.0in | 1.8288m | Main shell maximum 1.829m | Do not globally widen/narrow body. Mirrors excluded from this comparison. |
| Height 49.8in | 1.26492m | Roof spine approximately 1.265m | Do not globally raise/lower cabin. |
| Front/rear tread 60.7/60.6in | 1.54178/1.53924m | Both 1.524m | Difference only 17.8/15.2mm. Not highest visual priority; specific KITT wheels/offsets unverified. |

The same page lists 205/70R14 tyres for standard Trans Am and a special package with 15x7 wheels and 215/65R15 tyres. These establish factory alternatives, not which configuration a particular KITT used. Nominal bead-seat diameter and visible outer rim-flange diameter are different measurements.

## 1. Replace planar rear greenhouse with wraparound glass and narrower sail surfaces

**Confidence: high that construction is too planar; moderate for proposed millimetre targets.**

Current `Rear panoramic hatch` uses five longitudinal rows with only 22mm transverse crown. Half-width grows from .675m to .765m. `Rear sail pillar` is one large flat quadrilateral on each side. Combined with the four-corner door glass, this produces a straight-sided triangular greenhouse and broad blank sail wedges in the workshop view. The brochure explicitly identifies wraparound hatch glass, and its side/upper views show rolled rear-glass shoulders instead of a large flat triangular insert.

Proposed geometry, keeping roof apex, wheelbase and cowl positions:

- Keep hatch centreline heights within 20mm of current values.
- At middle hatch stations Y=-1.12 to -1.70m, widen glass outer edge by roughly 40-70mm per side and roll it down 60-100mm relative to its current edge. These are initial photo-based trial values, not measured Pontiac dimensions.
- Keep top and bottom attachment lines nearly fixed. Replace the flat sail quad with several connected panels between the curved glass edge and the existing quarter-panel shoulder.
- Retain a distinct B-pillar and thin seals. Avoid exposing an interior hole or merely placing another pane over the old sail plane.

Acceptance: matched side/rear-three-quarter views show a continuous wrapped rear glass surface, slimmer painted sail region and unchanged overall roof height. No glass/body intersections, disconnected framing or broad flat triangular patch.

Source areas: `Rear panoramic hatch`, `Rear sail pillar`, `Hatch trim`, lines around 140-151 in the current builder.

## 2. Replace raised rectangular spoiler with a low curved aerofoil and tapered ends

**Confidence: high that the workshop part is a rectangular slab; moderate for target height.**

Current spoiler is a beveled box, 1.71m wide x .25m deep x .048m thick, centred at Z=.921m. Top is .945m. At Y=-2.16m the deck is approximately .843m including crown, so spoiler top is about 102mm above deck; the underside leaves approximately 54mm clear gap. Two box feet amplify the separate-board appearance. The brochure shows a rear-deck aero-wing whose planform, ends and supports follow the car's tapered rear quarters.

Proposed geometry:

- Preserve approximately 1.71m span and .23-.25m chord.
- Use a shallow curved foil section, 22-30mm maximum thickness, with a centre top around Z=.900m rather than .945m. Lower the centre by about 45mm as a trial.
- Taper and sweep the outer 120-180mm of each end toward the deck/quarter contour. Replace rectangular feet with compact shaped supports, maintaining a real small gap instead of intersecting the deck.
- Do not copy a modern racing wing or alter the tail-lamp panel to accommodate it.

Acceptance: side view loses the tall isolated rectangle; rear-three-quarter view shows shaped ends and a continuous aerofoil. No floating endcaps or visible support intersections. Exact KITT spoiler height remains unverified, so this needs visual review rather than a claim of dimensional accuracy.

Source areas: `Rear deck`, `Rear spoiler`, `Spoiler foot`, around lines 181-184.

## 3. Resolve the tyre/rim proportion mismatch without moving the rigs

**Confidence: high in current numerical sizes; moderate that a smaller visible rim is the better KITT match.**

Current tyre radius .321m gives .642m diameter, almost the .6426m nominal diameter of the brochure's 205/70R14 configuration. Current rim barrel radius .219m gives .438m visible diameter; black dish reaches .216m and vents sit at .208m. The apparent rim is therefore large for the retained tyre size. A .438m outer diameter must not be labelled a verified 17.2in nominal wheel because flange and bead-seat dimensions differ.

Proposed bounded correction: retain tyre radius and all pivot coordinates, and reduce only rim/dish/vent radial geometry by approximately 8-9%, moving the outer rim radius from .219m to about .200m. This is a 15in-style visual interpretation with an estimated flange allowance, **not** a certified factory tyre/wheel package. Scale dish rings and vent centres coherently; keep axle depths and black centre-cap character. Existing tread geometry and independent steering/spin hierarchy stay unchanged.

Acceptance: visibly deeper rubber sidewall, recognisable black turbocast dish and silver ventilation ring, no spoke/vent clipping, four wheel centres fixed, spin and steering reset checks pass. If matched KITT photography contradicts the smaller rim, retain the old radius rather than claiming the factory table proves a screen-car wheel size.

Source areas: `Rim barrel`, `Turbocast black dish`, `Rim vent`, `Lug well`, around lines 211-228. This is a proportion adjustment, not a wheel-rig rewrite.

## Verification and limits

Save the current workshop GLB/images before edits. Use identical cameras, lighting and image dimensions for revised front, side and rear-three-quarter views. Preserve <=25,000 triangles, <=4 materials, emissive scanner and four independently rigged wheels. Run the existing GLB rig test. Root reviews visible results before acceptance. Do not replace `assets/vehicles/kitt.glb`.

The brochure side photograph has perspective and is not a calibrated side elevation. No pixel-to-millimetre tracing is treated as ground truth. Its production Firebird nose differs from KITT's custom nose; custom scanner/fog fascia dimensions are not justified by that brochure. This pass therefore does not invent a new KITT nose profile. Missing hood-induction relief and fender extractors remain later reference-dependent work, rather than expanding this bounded pass.

References:

- [1982 Pontiac Firebird brochure](https://www.auto-brochures.com/makes/Pontiac/Firebird/Pontiac_US%20Firebird_1982.pdf), existing local `qc/pontiac-1982-reference.pdf`; final page gives dimensions/tyre options. Existing `qc/pontiac-side-reference.png` supplies body/glass/spoiler appearance. `qc/pontiac-dimensions.png` actually depicts features/interior, not the dimensions table.
- [Top Gear's Petersen KITT photo article](https://www.topgear.com/car-news/movies/knight-riders-kitt-has-be-best-car-world), already cited by the workshop, is a KITT appearance reference, not a dimensional drawing or proof of a particular screen-car specification.
- Workshop `assets/vehicles/kitt-review/README.md`, `validation.json`, `side.png`, `front-three-quarter.png`, `rear-three-quarter.png`; builder `assets-source/vehicles/build-kitt-reference.py`.
- `qc/kitt-source-audit.md` documents the unavailable original external model and blocked Nieve download. No geometry from either was inspected or used.
