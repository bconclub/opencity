# High-fidelity release goal, 11 September 2026

User wants a convincing, easily playable launch tomorrow, not another nominally complete release with rough vehicles. This goal remains active. The v0.0.30 release is the deployed baseline, not evidence that the new quality bar has been achieved.

## Workstreams

- Root: reference-led KITT Blender reconstruction, wheel pivots and steering, local/remote vehicle contact shadows, integration and release.
- city_visual_fidelity: varied facade atlases, separate wall/glass roughness, invalid height correction, correct PBR camera position.
- street_visual_fidelity: metric street textures while preserving verified geometry and crossing positions.
- release_quality_audit: independent renderer/playability audit, MSAA experiment, proportional mobile controls and acceptance evidence.

## Evidence so far

- Original KITT source wheelbase was 2.78m. Pontiac brochure states base-platform 101in = 2.5654m. Candidate uses that axle spacing. Custom nose dimensions and body sections remain photo estimates. Original reference: https://www.auto-brochures.com/makes/Pontiac/Firebird/Pontiac_US%20Firebird_1982.pdf . Museum photographic reference: https://www.topgear.com/car-news/movies/knight-riders-kitt-has-be-best-car-world .
- Candidate source: `assets-source/vehicles/build-kitt-reference.py`. Editable Blender source: D:/CodexTools/Blender/projects/kitt-reference/kitt-reference.blend. Review assets are separate from live kitt.glb. First candidate rejected for floating panels and occluded fog lamps; second still requires silhouette/surface refinement. Do not call it a completed high-fidelity replica.
- Rig loader previously ignored non-mesh wheel pivots and directed steering at an empty group. New rig binds both empty and mesh wheel nodes with independent steering/spin. Actual candidate and live KITT GLBs pass four-wheel spin, no pivot drift, Ackermann steering and reset checks in `qc/kitt-rig-audit.json`. Radius measurement uses local wheel bounds so asynchronously loaded remote body tilt does not alter tyre speed.
- Street material isolated ABBA passed +2.62%, same four draw calls and 2,130 triangles. This is not full-scene or mobile-device timing. See STREET-SURFACE-FIDELITY.md.
- Mobile analog input passed 13 browser-fixture/actual physics checks. It no longer sends identical full throttle for moderate and full thumb movement.
- Global four-sample MSAA rejected: same-device ABBA was +97.57% mean frame time. Do not enable it globally based only on prettier edges.
- Perspective camera reconstruction mathematically preserves clip coordinates while correcting PBR eye position. Aliased input matrices and forced matrix updates also pass. Independent integration review found no blocking camera/axis/resource bug. The actual browser audit caught a classic-script/static-import error in flight.js; it was fixed by loading the helper through the existing dynamic import path.

## Integrated checks

- KITT candidate iteration three: 24,076 triangles, four materials, separate wheel/steering pivots. It remains review-only because custom body proportions and surface quality are not fully faithful. Blender source is on D:. `kitt-workshop.html` compares it with the current live model.
- glTF cannot use vertex colours for emissive tint. A tiny lamp palette texture preserves red scanner, amber markers and pale fog lamps; the builder now exports the lamp UV explicitly instead of silently producing white lights.
- Actual mobile scene: proportional motion, release, manual takeover and keyboard pass, no page errors. Widths 330/390/430 have no overflow and a 56px instrument strip. Hidden helicopter altitude no longer overlaps the car HUD.
- Two-client local room test: all six vehicle IDs, remote actor rendering, projected names, create/join/free room, reconnect, resume and cleanup pass without changing the production room server. Isolated player/spectator screenshots confirm car tags now sit above actual model roofs, with no second vehicle contaminating the view.
- CC0 Shapespark tree candidate is available in a separate review: 1.56MB, 646 triangles, three materials. Leaf cards improve the canopy silhouette but are visible side-on. It is not yet installed, and species fidelity is unverified.
- Combined full-scene baseline/candidate benchmark before nearby trees: 231.73 to 239.46 ms (+3.34%), 48 to 49 custom draw calls, +17,002 decoded first-party bytes. Edge SwiftShader, same route/camera, ABBA. Nearby tree integration requires its own additional measurement; isolated +2.62% street and +2.12% district results must not be summed as the combined cost.

## Remaining release gates

1. Inspect KITT front/side/rear/three-quarter against references. Accurate wheelbase alone cannot pass shape fidelity. Wheels must visibly rotate/reverse and steer at their centres; scanner must move; no panel/road clipping.
2. Inspect whole frontage from road and helicopter, including kerbs, texture scale, roads and building surfaces. Repeated OSM massing and low-poly trees remain quality limits. No claim that all buildings are surveyed.
3. Validate full-world local/remote driving, touchdown/ground contact, manual auto-roam takeover, saved names and room join/resume.
4. Measure candidate vs baseline without concurrent rendering. The software renderer can establish relative regressions, not real-phone FPS. Intended mobile hardware needs its own 30 FPS playability check.
5. Only reviewed runtime assets enter a versioned release. New candidate GLBs and studio images stay workshop-only until visual gate passes. No room protocol migration or engine migration is implied.

## Asset fallback research

A professionally authored KITT model is listed at https://3dmodels.org/3d-models/pontiac-firebird-knight-rider/ with separated parts and Blender/GLB formats, 481,000 source polygons and a displayed base price around US$95 at inspection. This is a candidate to evaluate, not an owned asset. Appropriate interactive-use license, actual topology, optimization and total purchase price are unverified. No purchase, account creation or new Meshy spend has been performed. A purchased asset would still need optimized LODs, material conversion and wheel rig checks.
