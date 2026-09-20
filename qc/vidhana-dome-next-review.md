# Vidhana Soudha main dome and drum, next review

CPU/read-only review, 2026-09-11. No geometry, runtime or GPU changes. Confidence high for identified missing forms and source-code mappings; moderate for silhouette interpretation; proposed intermediate heights are estimates.

## Evidence and actual dimensions

The [Karnataka Legislative Council account](https://kla.kar.nic.in/council/vds.htm), checked during this review, gives the central dome diameter as **60 ft = 18.288 m**, eight supporting pillars, central-wing height **112 ft = 34.1376 m**, and overall height to central-dome top **150 ft = 45.72 m**. It does **not** identify 112 ft as the dome's springline, establish a drum height, or distinguish crown shell, pedestal and emblem heights. The existing candidate's interpretation of 34.1376 m as springline is therefore not a sourced geometric constraint.

Actual mapped features, converted with the existing mean-Earth-radius metre frame:

| Feature | Mapped horizontal bounds | Current candidate vertical range |
|---|---|---|
| Main drum, `way/363474998` | Eight-vertex footprint; axis-aligned bounds 20.0455 x 20.0374 m | 19.3548 to 34.1376 m, height 14.7828 m |
| Main dome, `way/371511885` | 18.0409 x 18.0470 m | 34.1376 to 45.72 m, height 11.5824 m |
| Enclosed core, `way/371511883` | About 6.4904 x 6.4938 m | 19.3548 to 34.1376 m |

These are model measurements, not a survey. Dome width is already within about 0.25 m of the published diameter; increasing width substantially would address the wrong problem. Current dome height/width ratio is approximately **0.642**, while the generic crown includes the full bulb and top nub. Current blank drum height/width is approximately **0.738**. These ratios describe the model and are not perspective-correct comparisons with photographs.

## Inspected photographs and views

- [Moheen front photograph, local full resolution](C:/Users/user/Documents/ChatGPT/Z/qc/vidhana-frontage-moheen-2019.jpg), 3872 x 2574. Existing attribution: [Commons source](https://commons.wikimedia.org/wiki/File:Vidhana_Soudha,_front_(01).jpg), Moheen Reeyad, 22 June 2019, CC BY-SA 4.0. Useful main-tower ROI in original pixels: approximately x=1400..2360, y=240..1280. This is a suggested viewing crop, not a newly generated or measured architectural drawing.
- [Panorama, local](C:/Users/user/Documents/ChatGPT/Z/qc/vidhana-frontage-panorama-2019.jpg), 7330 x 2939. Main-tower ROI approximately x=3050..4050, y=120..1100. Wider context confirms a low, horizontally layered tower base behind the portico and a separate tall emblem/pedestal silhouette. Panorama distortion precludes exact metric inference.
- [Current candidate front scene](C:/Users/user/Documents/ChatGPT/Z/qc/vidhana-architecture-scene-after-front.png) and [aerial view](C:/Users/user/Documents/ChatGPT/Z/qc/vidhana-architecture-after-aerial.png).

## Supported mismatches

1. **Blank vertical drum instead of layered tower.** Both photographs show a faceted central base broken by narrow vertical pilaster/recess rhythms, a deep projecting cornice, closely spaced brackets, an upper walk/railing, and a dense frieze directly under the rounded shell. Current octagonal extrusion has none of these interruptions, leaving a broad blank wall from portico to dome. Its apparent exposed height dominates the front render. The architectural source's eight structural pillars must not be mistaken for a count of every visible small bracket or decorative pier.

2. **Bulging generic onion silhouette.** Photo crown has a broad rounded shoulder and comparatively squat shell above a pronounced decorated base. Its upper silhouette continues through a distinct narrow dark collar, ornamented pedestal and lion emblem. Current generic profile expands again at normalized height .30-.43, then forms an elongated neck and closes in a tiny nub. It absorbs the overall height into the smooth shell and substitutes that nub for the separate upper composition. The missing emblem is visible in the reference; its detailed reconstruction is outside this dome/drum-only edit.

3. **Missing facade depth and correct decoration scale.** Main tower has visible projecting cornice edges, shadows between brackets, a narrow balustraded ring and large cardinal cartouche/crest forms against the dome. Candidate has only a small smooth basal ring. Photographs also show detailed portico parapets, floral roundels, emblems and column mouldings, but those facade changes fall outside this proposal. Do not apply the generic wing-window grid to this tower: the photo's central decorative rhythm differs from the ordinary wing facade.

## One scoped geometry proposal

Replace only the main drum/dome branch with a **layered octagonal base, bracketed cornice, narrow frieze and rounded crown**, preserving mapped center, eight-sided orientation and other six domes. Use one shared local parameter block with all non-published values explicitly marked estimated.

Provisional first visual-fit anchors, in the candidate's existing flat-ground datum:

| Part | Proposed initial anchor | Status |
|---|---|---|
| Drum base | Keep 19.3548 m | Existing provisional datum |
| Main cornice top | 28.1 m | Photo-led starting estimate |
| Frieze / crown springline | 31.4 m | Photo-led starting estimate |
| Rounded crown top | 38.0 m | Photo-led starting estimate |
| Short top collar | 39.8 m | Photo-led starting estimate |
| Published overall top | Retain 45.72 m as reference metadata | Source gives overall value; remaining pedestal/emblem contribution unresolved |

The broad shell must **not** be stretched to 45.72 m merely to make a bounds test pass. This bounded edit deliberately leaves the upper pedestal/emblem unresolved and must report that difference. If unchanged geometric summit is required, that conflicts with this scope until the actual upper composition is modelled. No unsupported tall cylinder, spire or generic lion should fill the gap.

Keep footprint scale initially, using published 18.288 m diameter as a comparison rather than silently moving OSM vertices. Break the drum's exposed face into restrained pilaster/recess bays and two shallow moulded courses. Add an outward-projecting octagonal cornice and repeated tapered underside brackets; choose count from the visible photo rhythm after matched-camera review, not the eight structural-pillar statement. A narrow ring railing and alternating light/shadow frieze forms supply depth without pretending to recreate carvings. Reuse stone and dark-recess batches; do not add lettering, coats of arms or copied sculpture approximations.

Use a main-dome-specific radius profile: broad base/shoulder, monotonic narrowing above the shoulder, no second onion bulge, then a separate collar. Estimate shallow cardinal cartouche outlines only if their silhouette can be matched; otherwise reserve them explicitly. Keep fine carving deferred. All ornament depths, bay counts and intermediate Z anchors are design estimates, not verified dimensions.

## Exact source scope and acceptance

- `qc/vidhana-architecture-candidate.js:4`: separate published overall/central-wing values from estimated `drumCorniceZ`, `crownSpringlineZ`, `crownTopZ` and `collarTopZ`. Stop presenting central-wing height as verified springline.
- `:20`: special-case `way/363474998` before generic blank extrusion; construct its wall bands, recesses and cornice once.
- `:21`: existing facade embellishment applies only to `relation/5284317`; it never decorates the main drum. Add a dedicated drum treatment rather than widening this wing branch.
- `:47`: dispatch `way/371511885` to the new rounded main-crown profile. Leave the generic profile unchanged for six smaller domes.
- `:52-56`: replace the three independent vertical remaps for drum/dome/core with the explicit shared anchor block; cap the hidden core below the new crown springline. Avoid remapping already placed ornament a second time.

CPU checks should retain mapped center/orientation, keep all six other dome meshes and portico/stairs unchanged, verify finite outward normals and no overlapping solid bands, and record actual crown/collar top independently from published overall-height metadata. Keep six material draws if existing batches suffice and report triangle delta. Subsequent matched front and oblique views should demonstrate shorter exposed blank wall, coherent cornice depth, a squat rounded crown, and no newly floating rings or core poking through the shell. This proposal is ready for a separate bounded candidate edit; it is not geometry acceptance.
