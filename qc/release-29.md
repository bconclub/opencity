# OpenCity 0.0.29 release checks

## Scope

- Use the user-selected original Meshy Cybercab appearance for the player and a 6,000-triangle NPC version. No additional generation or recolouring. Player: 24,848 triangles, one material, 1K textures, 4,535,896 bytes. Traffic: 3,864,428 bytes. Wheels remain joined and static. This is a reconstruction, not manufacturer CAD.
- Replace six vehicle-picker SVG illustrations with WebP renders of the actual game assets. Combined previews: 99,608 bytes. No extra live WebGL contexts in the picker.
- Resolve intersection deadlocks using fair junction admission, signal eligibility and clearance. Restrict NPC choices to directed legal-turn cycles and exclude carriageways too narrow for two-way cabs. Keep physical stopping and 20 desktop / 8 mobile limits.

## Verified locally

- Approved Cybercab loads, correct dimensions (1.855 x 4.45 x 1.362 m), single material, no page errors. Remote Cybercab and KITT render; removing one remote player does not dispose shared model geometry.
- Actual model thumbnails load at 330, 390 and 430 px. Opened through mobile control center, no horizontal overflow. Screenshots: qc/picker-330.png, picker-390.png, picker-430.png.
- Vehicle physics, boost reserves, auto-roam, prior car/flight dynamics, dome and noisy gamepad regression checks pass. Six multiplayer server tests pass.

Completed traffic, rendered-world and performance checks follow.
- Live production WebSocket checks accepted Auto, Cybercab, Knight Rider and Cybertruck. The probe now fails on a rejected pose instead of merely printing it.
- NPC stress test: 600 simulated seconds, 20 vehicles, zero overlaps or route ends; every car travelled 1.23–1.89 km; longest wait 34.45 s. Four simultaneous approaches all cleared. Red approach did not block green; priority released for the next green.
- New model plus thumbnails adds 8,279,896 bytes versus the previous single 220,036-byte Cybercab. Downloaded assets remain in the versioned local cache.
- Browser checking caught a separate player auto-roam bug: its road graph ignored one-way direction, allowing head-on stops. Repaired and subsequently verified in the browser as recorded below.
- Same-host Edge SwiftShader, 1100 x 760, A/B/B/A with 180 frames per run: mean frame time 201.75 ms before / 219.76 ms after (+8.93%); median 200.0 / 216.7 ms (+8.35%). Both below the 10% regression limit. P95 varied in both sets (before 233.3 / 383.3 ms, after 250.1 / 416.6 ms). These software-renderer timings do not establish mobile or hardware-GPU FPS. NPC rendering dropped from four draw calls to one. Data: qc/release-29-performance.json.

- Fixed the metallic-black render issue with a generated 128 x 64 daylight reflection field, prefiltered once per renderer. Same original material maps in player, remote and NPC scenes. No external lighting asset or per-frame environment generation. Actual-model thumbnails regenerated under this lighting.
- Final desktop/mobile browser checks pass after legal spawn and auto-roam direction repair: actual ground movement, manual takeover, helicopter auto takeoff, 20 desktop / 8 mobile NPCs, one NPC draw call, no page errors. Daylight-lit NPC screenshot inspected; full body visible rather than black. Remaining tiny creases and static wheels are source-model limitations.

- Final controlled NPC-renderer comparison with daylight reflection lighting: baseline mean 212.09 ms / candidate 220.91 ms (+4.16%), medians 216.6 / 216.7 ms. Same viewport, departure and device; player lighting held constant between modes. No page errors. qc/release-29-lighting-performance.json records the final run. All visual and functional release checks above passed.
