# OpenCity current delivery plan

Priority 1: Vidhana Soudha frontage, 500 m radius before expansion to 1 km. Pavements, lane markings, mapped zebra crossings, junction continuity, material variation and accurate monuments. Payments was a transcription error; no checkout work.

## Ready for next publication
- Five ground entry areas, two helicopter pads, explicit per-ride choice.
- Spectrum colour picker; validated hex colours persisted and sent to room peers.
- Local ambient cabs: 20 desktop / 8 mobile, one instanced draw call, distance culling. Original placeholder shape, not downloaded Tesla. No passenger boarding or synchronized traffic yet.
- Auto-roam for existing ground vehicles and helicopter. Road-following tour mode; manual movement cancels immediately. Ground tours require proximity to a connected road.
- First raw OSM 500m street pass, not final pristine claim. 21 tagged zebras, mapped paths and lane-count-based lines. Road widths often estimated. Memorials are only location markers.

## Completed live in v0.0.25
Unified control center; cyclist and pedal animation; sidewalk contact height; double swipe boost and double tap stop/hover; three road starts (five next).

## Next, in order
1. Compare frontage and junctions against current imagery, use OSM2World conversion for richer prebuilt pavement/kerb geometry after reviewing isolated probe.
2. Align gameplay road routes to the same new OSM street dataset, including one-way direction and turn constraints; current routes use vector-tile roads. NPCs presently local ambience, without collision/traffic signals.
3. Accurate Vidhana Soudha / UB Tower / Kingfisher mansion and sculpture models. Geometry must match references; procedural placeholders do not satisfy this.
4. Import and optimise Labrador: downloadable CC BY by kenchoo, based on Dog by all of life. Browser blocked download; file not obtained. Idle clip only, walking gait still needed. Sparse park placement.
5. Vehicle target lineup: Cybertruck, Knight Rider, Auto, Helicopter, Cybercab. Owner supplied auto imported. Other linked vehicles not downloadable: obtain usable originals/permission or produce original designs. Cybercab fixed gold; other vehicles customizable. Never rename the current sports coupe as an imported Tesla/KITT.
6. Optional passenger cab tours and Bengaluru 2070 fictional infill around recognizable landmarks.

## Repository findings
OSM2World is suitable for offline/prebuilt street meshes; isolated conversion probe underway. Streets GL uses a custom renderer, heavy postprocessing and recommends discrete graphics; extract techniques selectively, not entire app. Godot 3D Tiles currently lists Web support as future work, so it does not fit the present browser game.

## Existing external blockers
Supabase migration requires access to owner's project; currently wired but not applied. GitHub feature branch is local after credential prompt hang; Vercel direct deploy works. Physical controller not verified. No payments integration requested.
