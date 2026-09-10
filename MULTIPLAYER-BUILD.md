# Live multiplayer build plan

Goal: enter a name, create or join a room, share its link, and see other players' named vehicles in the same Bengaluru city.

1. Guest entry: require a display name, create room or join by code/link. Names are plain text; identity uses server IDs. A random invite link grants room access, not admin rights.
2. Realtime service: Node WebSocket service on existing Hostinger VPS. Up to eight guests per room. Validate protocol, world version, messages, pose bounds and rates; isolate room traffic; expire empty rooms.
3. Rendering: reuse auto and helicopter models, interpolate remote poses and headings, animate remote rotors, project name tags above vehicles. Each guest retains independent camera and input.
4. Lifecycle: show connection state and roster, remove departed vehicles, reconnect after connection loss. Returning from another tab shows Resume and preserves the local vehicle position.
5. Verification: actual two-client room communication, room isolation, invalid input, capacity, reconnect and cleanup; two browser contexts showing both models and labels; mobile join/Resume checks.
6. Release: secure WebSocket endpoint behind existing VPS nginx with TLS, Vercel static frontend, explicit runtime staging and version bump. Verify the public frontend and backend together.

First release is social free roam. Vehicle physics remain local and server validates reported poses; this is not a cheat-resistant competitive simulation. Players do not collide with each other. Accounts, voice, persistent saved worlds and event administration remain separate follow-up work from the earlier meetup plan.

Deployment: frontend opencity-two.vercel.app. Realtime endpoint opencity-rooms.bconclub.com on existing VPS, independent of the pending opencity.world registration. Only the new subdomain/service is configured.

## Later build phases

- Integrate cycle/drone assets as playable vehicles, then build cab, Yulu and supercar.
- Rebuild Kingfisher rooftop mansion and accurate CBD landmarks in Blender; import optimized assets into the existing renderer.
- Add accounts and host moderation, saved events, invitations/RSVPs, then multiplayer event administration.
- Evaluate Unity Web export separately against browser load, memory and mobile performance before replacing the current client.
- Measure an eight-person session on real devices before increasing room capacity. No real-device load claim follows from protocol capacity tests.


## 2026-09-10: rooms, events, stats and audio

Entry actions: Create room, Join room, Host a meetup, Meetups. Quick rooms have a maximum of 8 players. Meetups need topic, host, schedule, expected attendance and an RSVP flow. Local drafts are not published events. Supabase project and keys will be supplied by the owner; do not create a project. Persist browser display name and collect local ride time/favorite vehicle until cloud wiring is configured.

Audio delivery plan:
1. Room-scoped text chat with Hi/Hello quick replies, safe text rendering, length/rate limits, no cross-room delivery, and an unread badge inside the collapsed mobile menu. Messages remain ephemeral initially.
2. Optional Join audio, Mute and Leave audio. Explicit microphone permission, speaking badges, reconnect and device-change handling. Never auto-enable the microphone.
3. Use a WebRTC media service with TURN support and room-scoped, expiring tokens minted by the backend. Authorize room membership before issuing tokens. Do not route raw media through the existing pose socket. Select provider after testing 8 concurrent users and costs.
4. Meetup host mute/remove controls and tests for room isolation, denied microphone permission, mobile backgrounding and interrupted connections. Recording/music streaming are separate scope, not enabled by this plan.

Not yet implemented: text-chat transport or live voice. Supabase cloud connection awaits owner-provided configuration.
