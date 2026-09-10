# OpenCity survey drone

Original quadcopter design created for this project, no third-party asset dependencies or textures. Asset creation is complete; vehicle selection and playable drone physics are not integrated.

- Runtime fallback: `drone-model.js`, `createDrone(THREE)`.
- Editable authoring recipe: `assets-source/drone.py`.
- Actual Blender project: `D:/CodexTools/Blender/projects/drone/opencity-drone.blend`.
- Blender studio preview: `D:/CodexTools/Blender/projects/drone/preview.png`.
- Runtime preview: `D:/CodexTools/Blender/projects/drone/runtime-preview.png`.
- Animated web asset: `assets/drone/opencity-drone.glb`, about 179 KB.

Run authoring script using Blender 4.5.9 LTS `--background --python assets-source/drone.py`. Large source and render outputs stay on D drive because C drive is nearly full. GLB contains mesh asset and four propeller animation clips, with no studio camera or lights. Three.js GLTFLoader import uses normal glTF Y-up coordinates; rotate its root by +PI/2 around X to restore this project's Z-up coordinate system. Verify heading during integration.

Runtime factory uses metres, X right, Y forward and Z up. Returns `group`, `body`, four `rotors`, four `rotorDiscs`, alternating `rotorDirections`, `gimbal`, `cameraLens`. Animate each rotor around local Z with its matching direction. Blur disc opacity starts at zero, can be increased during flight. Drone measures approximately 1.53 by 1.43 by 0.435 metres. No rotor shares another rotor's pivot.

Validation: `node --check drone-model.js`; `node verify-drone.cjs`. Checks finite geometry, four independent rotors, alternating spin directions, dimensions, valid GLB header and four exported propeller nodes, and at least one animation. Measured fallback render: 54 calls, 3,484 triangles on Three.js 0.169. This is a prototype asset, not a measured performance improvement. Blender export and CPU Cycles render completed successfully. Studio preview visually inspected.
