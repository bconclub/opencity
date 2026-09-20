# OpenCity shared rooms

Run `npm ci && npm start` with Node 22+. Run `npm test` for actual websocket integration checks. Health: `GET /health`. Websocket: `/ws`. Default port 8787. Override `PORT` and comma-separated `ALLOWED_ORIGINS` as needed.

This is a single-instance, in-memory social multiplayer service. Vehicles are client-controlled ghosts; they do not collide with other players. Server validates messages and geographic bounds, not driving physics. Restarting server invalidates rooms. Empty rooms expire after ten minutes. Maximum eight guests per room. Rooms use random 128-bit link capabilities, which grant access to anyone holding that link. There are no accounts, passwords, persistent profiles or moderation console yet.

Protocol 1, world `cbd-1`:

* Send `{type:'create',name,protocol:1,world:'cbd-1'}` to create a private invite room, or `{type:'join',room,name,protocol:1,world:'cbd-1'}` to join a known room.
* Send `{type:'open',name,protocol:1,world:'cbd-1'}` to enter a public room. Server chooses an existing public room with space, or creates a new one. Private invite rooms are never matched. A full eight-player public room overflows into another public room. Public rooms can also be joined by their invite link.
* Receive `{type:'welcome',room,id,protocol:1,world:'cbd-1',public,players:[{id,name,pose}]}`. `public` is a boolean. Reconnection requires joining again and receives a new ID.
* Send `{type:'pose',pose:{vehicle,lng,lat,altitude,heading,pitch,roll,speed}}` at 10 Hz.
* Receive `{type:'snapshot',players:[{id,name,pose}]}` at 10 Hz. Missing IDs have disconnected.
* Errors: `{type:'error',code}`. Codes include `room_not_found`, `room_full`, `server_full`, `version_mismatch`, `invalid_name`, `invalid_pose`, `invalid_message`, `not_joined`, `already_joined`, `unknown_message`.

Supported vehicles: auto, helicopter, spectator. Coordinates: longitude 77.57..77.62; latitude 12.95..13; altitude 0..1000 metres; heading -360..360 degrees; pitch/roll -180..180 degrees; speed -150..150 metres/sec. Names are normalized and limited to 24 characters; clients must render them as text. Network controls: 2 KB messages, 30 messages/sec replenishment with burst capacity 60, 64 KB outgoing backlog cutoff, ping/pong heartbeat, unjoined timeout, finite server/room/connection limits. Per-IP limits at reverse proxy are also necessary. Origin allowlist is a browser defense, not authentication.

Deploy Docker compose behind a TLS reverse proxy supporting WebSocket Upgrade and a dedicated hostname such as rooms.opencity.world. Configure the frontend with the resulting `wss://.../ws` endpoint. Do not expose the raw port publicly. Use one replica; multiple replicas need a room router/shared presence design. No database or paid third-party service is required for this first social-room release.
