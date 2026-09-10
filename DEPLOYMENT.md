# Production

Vercel project: `bconclub/opencity`.
Production URL: https://opencity-two.vercel.app
Release: 0.0.12, 2026-09-10.

Stage and publish from this directory:

```powershell
node stage-production.mjs
vercel link --yes --project opencity --cwd public-release
vercel deploy --prod --yes --cwd public-release
```

`public-release` contains only runtime files and is ignored by Git.
Auto and helicopter are playable. Cycle and drone model modules are included,
but their ride integration remains unfinished. Other vehicle cards remain upcoming.

`opencity.world` is attached to the Vercel project. Hostinger registration requires
owner phone verification before DNS can be finalized. Vercel currently requests
an apex A record pointing to `76.76.21.21`; recheck Vercel before applying.

Previous Hostinger preview remains at https://beige-rail-895905.hostingersite.com
on release 0.0.11.

## Multiplayer release

Version 0.0.13 adds named guest rooms and Resume. Backend: https://opencity-rooms.bconclub.com/health, secure socket /ws. VPS service lives under /opt/opencity-rooms, bound to loopback port 8790 behind a dedicated nginx site. TLS renewal is managed by certbot. Service restarts erase rooms. Empty rooms expire after ten minutes. Invite links grant guest access; no accounts or event admin yet.


## Current production, 2026-09-10
Both https://opencity.world and https://www.opencity.world are active on Vercel with verified TLS. The earlier registration/phone-verification blocker above is resolved. Apex points to 76.76.21.21 and www aliases apex. The Vercel fallback remains available. Backend supports private rooms and public open-room matching, maximum eight players.

## Voice service wiring
OpenCity reuses the existing LiveKit endpoint wss://livekit.goproxe.com. Rooms are named opencity-<room id>. The OpenCity room backend reads LIVEKIT_URL/API_KEY/API_SECRET from /opt/opencity-rooms/voice.env (mode0600). Secrets stay on VPS. Existing LiveKit and other projects were not restarted. Game sockets mint short-lived microphone-only tokens for their own player/room; disconnect attempts participant removal. TURN/media network settings remain the existing service configuration. Actual synthetic-microphone audio was received in two browser contexts with mute/leave cleanup verified. Corporate firewall coverage and real headset/mobile audio still need device testing.
