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
