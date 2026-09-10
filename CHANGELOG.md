# Releases

## 0.0.0 · 2026-09-09

First explicitly versioned local build. Earlier prototypes were unversioned.

- Version visible at the top, sourced from release.json.
- Vehicle picker replaces explorer sidebar. Auto and helicopter enter directly.
- Supercar, cab and Yulu shown as coming soon until implemented.
- Explorer settings removed from the user interface. Underlying controls retained internally for existing map dependencies.
- Includes gamepad support and trigger dead-zone fix from the prototype.

This records local builds, not a public deployment.

## 0.0.1 · 2026-09-09

- Original vehicle illustrations replace text-only picker rows.
- Multiplayer and optional meetup/admin architecture documented in MULTIPLAYER-PLAN.md; backend implementation deferred.

Version policy: each released build increments the last number. 0.0.99 rolls to 0.1.0; 0.99.99 rolls to 1.0.0. This is a base-100 release counter, not semantic versioning or a Git commit count. Earlier 0.2.x labels were corrected to this policy.

## 0.0.2 · 2026-09-09

- Helicopter center reticle with a two-second building focus ring and mapped details.
- GitHub Pages deployment workflow; core simulation checks run before deployment.
- Auto and helicopter playable. Other vehicle cards remain coming soon. Multiplayer/admin remains a documented plan.

## 0.0.3 · 2026-09-09

- Bottom mobile speed gauge and compact flight instruments.
- Controller details moved into expandable Controls panel.

## 0.0.7 · 2026-09-09 (local)

- Hold Shift, touch Boost, or RB/R1 to boost auto/helicopter movement.
- Includes bottom mobile gauges, performance telemetry, own-asset cache and forward reticle from local iterations 0.0.3–0.0.6.
- Core and boost physics checks passed. Mobile auto UI visually reviewed at 390×844. Reticle flight verification remains open.

## 0.0.13 (2026-09-10)
- Shareable guest rooms with player names and realtime auto/helicopter rendering.
- Resume overlay on return to a paused vehicle.
- Separate secure room service deployed on existing VPS; frontend on Vercel.


## 0.0.14 (2026-09-10)
- Fixed late-loading controller and tilt controls expanding the mobile cockpit.
- Compact bottom gauges and separated touch controls; room panels collapse on vehicle entry.
- Mobile performance panel starts collapsed; unavailable gamepad badge hidden while riding.


## 0.0.16 (2026-09-10)
- Floating dual-touch driving/view controls, double-tap hover and a short mobile tutorial.
- Compact mobile ride instruments/menu, persisted player names, four room/meetup entry actions.
- Live-pose player name anchors avoid network-echo jitter; own-tag movement test passes.
- CBD exterior mask and boundary geometry filtering; textured spawn roads and raised sidewalks.
- Preload vehicle resources and compile district shaders; retain versioned local asset cache.
- Local ride/flight stats and supplied Supabase browser wiring. Database migration awaits authorized account; live voice is planned, not shipped.

## 0.0.17 (2026-09-10)
- Start attribution collapsed behind the info button; retain source credits on tap.

## 0.0.18 (2026-09-10)
- Redesigned room entry: Create room, Join room, Free room. Removed meetup choices from onboarding; Free room uses public matchmaking.
- Clear action icons, supporting labels, mobile spacing and remembered-name focus.
- Verified 330/390/1280 pixel layouts, invalid invite feedback and real public-room connection.

## 0.0.21 (2026-09-10)
- LiveKit voice with explicit Join/Mute/Leave; verified bidirectional synthetic-microphone RTP.
- Room Hi greetings, paint selection and speaking indicators.
- Owner-provided auto-rickshaw FBX converted in Blender and loaded as GLB locally/remotely; original joined wheels remain static.
- Playable original Yulu-style e-bike, commuter bike, delivery bike and cycle with distinct driving profiles.
- Mobile left-thumb-only movement, automatic chase view, camera pulled back and menu Take off repaired.
- Light exterior road line art, closer mobile CBD opening frame.
- Includes automatic idle cache refresh and no automatic room-panel opening from 0.0.19/20 hotfixes.

## 0.0.22 (2026-09-10)
- Removed opaque exterior mask that could cut across the 3D skyline.
- Removed tinted dome surface; retained faint boundary lines and the light 2D map outside.
- Browser verification: custom buildings remain present, no exterior mask layer, no startup errors; skyline screenshot inspected.

## 0.0.23 (2026-09-10)
- Picker reduced to Cycle, Helicopter, Auto and playable original Supercar.
- Paint swatches fixed against card CSS, compact and visible above vehicles.
- Room panel lists active public rooms with occupancy, capacity, Join and Refresh. Private rooms remain invite-only.
- Verified supercar acceleration/braking/remote rendering, paint UI and real mobile public-room join; backend six-suite regression pass.

## 0.0.24
- Enlarged aiming dot with dark outline, light guide ring and clearer focus progress.


## 0.0.25
- Unified desktop/mobile control center for rides, rooms, voice, Hi, settings and performance.
- Per-ride departure prompt: three connected CBD road areas and two helicopter pads.
- Helmeted cyclist with animated legs, geometry-based sidewalk/kerb height for local and remote vehicles.
- Double upward swipe gives two-second boost; double tap brakes/hover; input cleanup on blur.

## 0.0.26
- Direct tap/drag vehicle colour spectrum with native accessible colour input and saved choice. Legacy room server receives nearest preset; exact custom colour remains local.
- Five distinct road-area starts, including Vidhana frontage, MG Road area and Kasturba Road area.
- One control center on desktop/mobile; compact desktop instruments.

## 0.0.27
- Finished first 500 m Vidhana Soudha street pass with mapped road ribbons, kerbs, explicit zebra crossings, lamps and signal heads.
- Added original Blender reconstructions for Cybertruck, Cybercab and Knight Rider. Cybercab keeps fixed gold paint; other authored vehicles retain saved paint.
- Added shared authored Cybercab NPC batches with desktop/mobile culling, plus OSM2World-aligned street patch height queries for driving and roaming.
- Anchored rider tags above the actual cyclist helmet and capped overlap displacement at 24 px.
- Added per-vehicle CBD handling profiles and retained auto-roam/manual takeover paths.
- Local ambient NPC cabs: shared 108-triangle shape, 20 desktop/8 mobile, distance culled, one instanced draw call. Original placeholder, not Tesla asset.
- Road-guided auto-roam for current ground rides and CBD helicopter tour, with manual takeover.
- First 500m Vidhana Soudha street layer from raw OSM: mapped footways, lane-count-based lines, 21 explicitly zebra-marked crossings, clipped path/road overlaps, memorial markers. Widths and dash spacing still schematic; not a pristine-completion claim.
