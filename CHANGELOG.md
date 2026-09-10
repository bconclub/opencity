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
