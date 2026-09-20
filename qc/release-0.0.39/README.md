# Original supplied vehicles, release 0.0.39

Cybertruck and Cybercab player assets are exact byte copies of user-supplied D-drive GLBs. SHA256, triangle counts, normalized bounds and file sizes are recorded in original-validation.json. No decimation, texture resizing, remeshing, added panels or replacement wheels.

Runtime changes only orientation, uniform scale, centering and ground placement. Original textures and proportions retained. Matching picker previews rendered directly from original source in Blender.

Player originals load on selection and cache on demand. They are excluded from install-time precaching so the approximately 122 MB combined download cannot block initial city load. Existing lighter NPC geometry retained; original player geometry is not multiplied across traffic.

Checks: exact byte/hash equality, >1.9M original triangles per model, normalized length and ground Z=0, runtime module syntax. Browser fixture loaded both models using actual Three.js renderer. Cybertruck fixture measured 16.68ms average frame interval on current desktop at 1280x720 before responsive check; not a physical-phone performance claim.

Limitations: supplied files have fused meshes, so original wheels are static until proper nondestructive rigging. Body remains visually intact. Source open side windows remain; no unsafe tint overlays. Geometry fidelity is preserved, not an assertion that user-generated shapes match manufacturer CAD.

Yulu/delivery and other pending asset edits are excluded from this release. HUD 0.0.37 and Free roam wording 0.0.38 retained.
