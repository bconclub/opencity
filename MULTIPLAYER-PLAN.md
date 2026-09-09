# Shared Bengaluru sessions and future meetups

Status: design only. No multiplayer server, login, event backend or admin UI is implemented. Current game runs locally. Public access needs a hosted HTTPS client and authenticated secure WebSocket server; sharing a localhost URL will not work remotely.

## Player journey

Host creates private session → invites guests → each guest signs in under their own identity → chooses display name and vehicle → joins the same CBD instance. Name tags identify nearby players; a compact roster shows team and connection state. Players keep independent cameras and controls.

Start with a target of eight concurrent players per room, subject to measured performance. Keep auto and helicopter first; add supercar, cab and Yulu only when playable. Default to ghost collisions between players for the first multiplayer release. Environment collision behavior remains vehicle-specific and must be communicated accurately.

## Proposed architecture

Browser: existing Three.js / MapLibre scene, local input and responsive camera. Transport adapter isolates network code from vehicle rendering and physics.

Game service: proposed Node.js / Colyseus rooms. Server validates membership and vehicle actions, owns canonical position and vehicle state, and broadcasts updates. Share pure vehicle physics modules between client prediction and server simulation. Smooth remote movement through interpolation; reconcile local prediction to server results. Start with 30 Hz simulation and 10–20 Hz updates, then profile before committing these rates.

Application service: HTTPS API for identities, organizations, events, invitations and permissions. PostgreSQL stores durable records. Keep high-frequency vehicle transforms in room memory, not database writes every frame. Room snapshots may support bounded reconnects; they are not attendance records.

Every client and room declares protocolVersion and worldVersion. Reject incompatible world versions with a reload message instead of allowing mismatched geometry. Display release.json version in the client; release tracking does not yet imply public deployment.

## Future meetup layer

Meetups are optional durable events that can launch one or more ephemeral game sessions. Keep eventId nullable so ad-hoc play does not require creating an event.

Data relationships:

Organization → memberships (owner / admin / host / member)

Organization → events → RSVPs and invitations

Event → one or more game sessions → participants

Event → configured venue, spawn point, allowed vehicles and capacity

An event has title, description, start/end timestamps stored in UTC, display timezone (default Asia/Kolkata), visibility, capacity, lifecycle state and host. The venue may reference the Kingfisher mansion asset once built; it must not depend on a hard-coded mesh name.

Admin later: create/edit/cancel events, choose venue and allowed vehicles, invite or approve guests, review RSVPs, manage hosts, lock a room, revoke access and remove participants. Payments, public discovery, email campaigns and voice chat are outside the first implementation.

## Reserved API boundaries, not live endpoints

- POST /api/events; GET/PATCH /api/events/:eventId
- POST /api/events/:eventId/invitations
- PUT /api/events/:eventId/rsvp
- POST /api/sessions (optional eventId)
- POST /api/sessions/:sessionId/join-ticket
- DELETE /api/sessions/:sessionId/participants/:participantId
- GET /api/me/memberships

Join tickets are short-lived, single-use and bound to identity, room and permissions. The game server validates them before admitting anyone. Invite links must not grant administrator rights. Enforce roles on the server, not by hiding buttons. Revoking access invalidates reconnect eligibility as well as future joins.

Display names are plain text, length-limited and escaped. Store stable player IDs separately from names. Distinguish duplicate names with a short suffix. Name tags fade with distance and avoid exposing email addresses. Roster and name tags work on mobile without covering controls.

RSVP accepted, room connected and event attended are different states. Attendance criteria and retention policy must be decided before reporting attendance. Audit event edits, role changes and removals without storing raw auth tokens.

## Implementation order

1. Finish local vehicle entry, visual models and input reliability.
2. Two-client local room proof: independent vehicles, smooth remote movement, name tags, reconnect and no cross-room leakage.
3. Hosted private rooms: individual login, invitations, permissions, capacity, host removal and version compatibility.
4. Eight-player validation across separate networks with latency, packet loss, mobile and controller input.
5. Optional event/admin service connected through the reserved API boundaries.

## Acceptance checks

Unauthorized or expired invitations fail. A copied room ID alone grants no access. Clients cannot promote themselves, control another vehicle or teleport by reporting arbitrary positions. Disconnected players stop receiving input, reconnect under the same identity and expire after a defined grace period. Host departure has a defined policy: keep room alive for remaining authorized players until idle timeout, without automatically granting them admin rights.

Late joins receive full current state. Camera changes stay local. Names and selected vehicles update for other participants. Local controls remain responsive under test latency. Different events and organizations cannot read each other's participants. Event capacity checks are atomic. Cancellation blocks new joins and notifies active participants according to an explicit host policy.

## Sources

- https://docs.colyseus.io/room
- https://docs.colyseus.io/state
- https://docs.colyseus.io/auth/room
