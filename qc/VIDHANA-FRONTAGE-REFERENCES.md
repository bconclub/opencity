# Vidhana Soudha frontage surface and fixture evidence

Research only, 11 September 2026. No runtime changes. Original photographs were inspected locally, without launching a browser or GPU renderer. These references establish historical appearance; they do not verify the present 2026 road condition or survey-grade dimensions.

## Decision

Retain the OSM concrete interpretation pending newer evidence. Do not convert the entire frontage to black asphalt merely to make it look like a road. The useful visual correction is neutral medium-gray paving, visible fine surface variation and joints, contrasting footpaths, and locally appropriate kerbs. Confidence: moderate for concrete material, high for the observed historical colors and fixture forms.

Restrained renderer starting point after the measurement source freeze: replace the concrete base `#b8b7ac` with **`#a6a9ab`** (sRGB 166, 169, 171), and remove the generated concrete texture's five-level blue subtraction so grain remains neutral. This is an artistic visual match under the current renderer lighting, **not measured photometry** or a sampled real-world albedo. Keep existing geometry/markings and asphalt classification unchanged. Check a matched road-level screenshot before accepting: the intended result is medium gray with grain, not charcoal. Do not add generic slab joints without matching the source segment.

## Two viewable geolocated photographs

1. [Dr Ambedkar Road Near Vidhan Soudha, 31 May 2008](https://commons.wikimedia.org/wiki/File:Dr_Ambedkar_Road_Near_Vidhan_Soudha_5-31-2008_4-49-45_PM.JPG), Amol.Gaitonde, own work, CC BY-SA 3.0. Camera coordinates **12.981036, 77.593603**. Local reference: `qc/ambedkar-road-2008.jpg`.
   - Observed: gray public carriageway, white broken lane marking, tan footpath divided into large rectangular panels, low green fence separating sidewalk and garden, pale/green kerb edging. White decorative pedestrian lamp shafts with broad inverted-cone luminaires; a separate taller multi-head mast is visible farther along the road.
   - Location/date confidence high from photographer metadata. Current appearance confidence low because this predates later metro works. Color alone does not prove pavement composition.

2. [Gate 3 (East), Vidhana Soudha (01)](https://commons.wikimedia.org/wiki/File:Gate_3_(East),_Vidhana_Soudha_(01).jpg), Moheen Reeyad, taken **22 June 2019, 05:41:50**, own work, CC BY-SA 4.0. Camera coordinates **12.977900, 77.590450**. Local reference: `qc/vidhana-gate3-moheen-2019.jpg`.
   - Observed: gray mottled access driveway; raised **black-and-white** kerbs approaching the gate; pale interlocking footpath with red inserts. Farther right, garden kerb is **green-and-white**, so a single global kerb palette would be wrong. Cream stone gate piers carry dark broad inverted-cone lamp heads. Gate/fence is black with gold spear finials. Silver accessibility handrail is on the left.
   - This is the **gate approach**, not proof of the material on the entire through carriageway. Do not extrapolate its rougher driveway surface to Ambedkar Veedhi. Image revisions in June/July 2019 correct perspective and brightness, not capture date.

## Most useful actual carriageway view

[Dr Ambedkar Veedhi, Bengaluru (01)](https://commons.wikimedia.org/wiki/File:Dr_Ambedkar_Veedhi,_Bengaluru_(01).jpg), Moheen Reeyad, taken **22 June 2019, 06:10:06**, own work, CC BY-SA 4.0. Local reference: `qc/ambedkar-veedhi-moheen-2019.jpg`; API metadata saved in `qc/vidhana-road-reference-metadata.json`.

Photographer explicitly locates it in front of Vidhana Soudha, but this file has **no GPS coordinates**. It is an additional location-described reference, not falsely counted as GPS-tagged.

- Public road is **medium neutral gray**. Straight transverse and longitudinal seams in the near road are consistent with jointed concrete; no basis here for beige paving or uniformly black asphalt. Material identification confidence moderate.
- Broad footpath uses pale small interlocking blocks with reddish inserts. The decorative pedestrian light has a **white fluted shaft, stepped base, dark wide inverted-cone luminaire**, with the same form repeating down the sidewalk.
- Green roadside railing and **green/white kerb** run along the opposite edge/median. A curved near-side corner has **black/white kerb**. Palms occupy the planted divider; taller narrow conifer-like trees and broadleaf trees form the adjacent landscape.
- No clearly readable zebra crossing or signal head appears in this frame. It cannot establish crossing position, signal orientation, fixture dimensions or a complete junction route.

## Metadata traps and exclusions

- [Vidhana Soudha as of 8 June 2022](https://commons.wikimedia.org/wiki/File:Vidhana_Soudha_as_of_8_June_2022.jpg): current file was replaced in October 2023 and current EXIF says **16 May 2017**. Do not cite its filename as verified 2022 imagery.
- [Panorama, January 2019](https://commons.wikimedia.org/wiki/File:Panorama_of_Vidhana_Soudha,_Bengaluru_(January_2019).jpg): inspected original has an uninformative flat-gray lower region. Excluded from pavement inference.
- [Front (01), June 2019](https://commons.wikimedia.org/wiki/File:Vidhana_Soudha,_front_(01).jpg): close facade view useful for globe lamps, garden lights, fence and stonework, but public road is out of frame.
- A 2024 tender mentioning Ambedkar Veedhi from KR Circle to Gopalagowda Circle does not establish completed resurfacing or cover every frontage segment. Do not infer today's material from a tender.

Reference photos are QC evidence, not game textures or newly authored assets. Preserve named author, source and license if redistributed. No new monument geometry, traffic route or signal placement is justified by these photos alone.
