# OpenCity request register

Status as of this working build. “Implemented” describes code, not proof of physical-device compatibility or public deployment.

| Request | Status / next work |
| --- | --- |
| Central Bengaluru CBD first, bounded by a Wakanda-style dome | Pilot bounds and dome implemented; accuracy and coverage need refinement. |
| Recognizable buildings, varied windows, colours and roofs | Limited illustrative materials exist. More variation requested, not completed. |
| Accurate Vidhana Soudha and domes | Approximate OSM part reconstruction only. Photo-faithful model unfinished. |
| Kingfisher Towers rooftop mansion first | Confirmed priority, replacing earlier UB Tower target. Not built. |
| Use Blender and Blender MCP | Blender installed; reference export script exists. Final game-ready mansion and reliable live MCP verification outstanding. |
| Google Maps / Street View imagery and image-to-3D | No key located or integration completed. Dataset coverage, permissions and geometry suitability require verification. |
| Auto, helicopter, supercar, cab and Yulu | Auto/helicopter playable; remaining three are coming-soon cards. |
| Use linked Sketchfab animated helicopter | Asset license/download/import still unresolved; existing helicopter remains original procedural model. |
| Nimble physics, arrow keys, mouse, Space and gamepad | Arcade dynamics and inputs implemented. USB controller recognized by Windows; browser signal issue unresolved. |
| Grab/scroll camera while riding | Camera mode buttons exist. Free camera orbit/zoom request unfinished. |
| Engine, rotor, braking and tire sounds | Not implemented. |
| Research real helipads and add many landing locations | Initial research found ITC Gardenia, UB City and Ritz-Carlton references. Rooftop network not implemented; two virtual ground pads remain. |
| Mobile layout and phone tilt steering | Responsive controls and tilt code exist; physical phone verification outstanding. |
| Bottom mobile speedometers / gauges, uncluttered view | New dashboard implemented; visual review in progress. |
| Only visual vehicle choices, one-click entry | Implemented; old explorer controls hidden and inert for compatibility. |
| Version at top with three base-100 components | Implemented. 0.0.99 → 0.1.0; 0.99.99 → 1.0.0. Counts released builds, not edits. |
| Aim pointer, dwell circle, building name/details | Two-second camera-center building inspection implemented; visual/raycast validation outstanding. |
| Invite-only multiplayer, team players and name tags | Architecture in MULTIPLAYER-PLAN.md; no multiplayer implementation. |
| Luma-style meetup/event admin later | Deferred architecture covers events, RSVPs, invites, roles and rooms; no backend yet. |
| GitHub repository bconclub/opencity | Initial 0.0.2 source push succeeded. Later working changes need push. |
| Take live on Hostinger/domain; VPS or Vercel possible | Hostinger access verified; opencity.world found pending_setup. No confirmed live deployment. |
| Cache city data locally in Chrome | Own-asset service-worker cache added; cache lifecycle verification outstanding. External tiles remain provider-managed. GPU frames still redraw as camera moves. |

Next priority after release plumbing: Kingfisher mansion, then vehicle fidelity/lineup. This register preserves unfinished requests when new steering arrives.

- 2026-09-09: Controller status always visible with current device and live axes/buttons. Simulated monitor and both vehicle tests pass; physical browser activation still unverified. Hostinger preview deployed v0.0.11; opencity.world pending setup.

- 2026-09-10: Controller troubleshooting paused by user. Vercel production v0.0.12 live at https://opencity-two.vercel.app. Auto/helicopter public smoke tests pass. Cycle/drone source models included; not playable. opencity.world attached to Vercel; Hostinger registration being completed with saved owner details.

- 2026-09-10: Multiplayer v0.0.13 deployed: enter name, create room, join code/link, live vehicle/name rendering, roster, reconnect and leave. Auto and helicopter supported, maximum eight guests. Room state is ephemeral. Added visible Resume overlay for paused rides. Full public two-client verification in progress.

- 2026-09-10: Public two-browser multiplayer v0.0.13 passed all integration checks (room/invite/name, movement, both models, resume, reload/rejoin, leave cleanup). Mobile HUD repair in progress after actual phone screenshot. Large tools/downloads must use D:; Blender already installed there.

- 2026-09-10: User requires tools/downloads on D:. Recorded in INSTALLATION.md. Mobile v0.0.14 reconciles late controls into closed settings and compacts gauges; portrait/landscape verification underway.

- VERIFIED v0.0.14: actual public mobile helicopter at330x633 HUD162px,12px gap above tothumbcontrols, no loosegamepad/tilt controls, roomclosed, settingshidden. Rendered layouttests bothvehicletypes330/390/landscape pass.

- v0.0.15: Mobile icon bar for rides, room, settings, performance. Single panel at a time; closing panel exposes Resume after pause. Desktop layout preserved. Verified narrow live game and panel switching.

## Active requests, 2026-09-10
- Mobile map first: floating movement/view pads, double-tap hover, short first-ride tutorial; hide pads on release. Compact automatic gauges, menu-only secondary panels.
- Persistent Chrome player name; room create/join and meetup host/browse with topics, dates and attendance, up to 8 players per room.
- Supabase wiring only. Owner supplies project and keys; no project creation. Ride/flight time and favorite vehicle stats.
- Reduce late asset loading; preload city/ride resources and retain versioned local assets. Moving camera still renders frames.
- Compact attribution behind info control; preserve access to source credits.
- Fix moving name-tag flicker; publish verified changes for live testing.
- Audio planned: room text/Hi/Hello first, optional WebRTC voice later with explicit microphone opt-in.
- Custom domain opencity.world and www.opencity.world verified live; model cache moved to D with verified C junction.
