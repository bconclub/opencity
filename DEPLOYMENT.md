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
