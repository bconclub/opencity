OpenCity 0.0.31 improves mobile driving, vehicle materials and wheel motion, and removes the diagonal shadow bands across Vidhana Soudha. Cybercab retains the selected Meshy body and textures while its repaired wheels spin and steer independently. Landmark domes preserve smooth normals, facade rows differ, and exterior/courtyard wall normals face correctly.

The shadow map now concentrates on the Vidhana frontage. This keeps architectural shadows in the tested area but reduces shadow coverage outside that fixed light-space volume. No room-server protocol changes or new vehicle IDs are included.

The separate KITT workshop includes revised rear glass, spoiler and rim proportions with working wheel and scanner controls. It remains an original reconstruction, and does not replace the gameplay KITT. Architecture and 500 m street candidates are saved as review work only. Street integration is held because its audit found non-road objects in height sampling, route gaps and material-classification issues.

Validation: classic browser-entry checks, mobile layouts and input, vehicle physics/auto-roam/traffic tests, two-client room and remote-vehicle checks, actual GLB wheel tests, matched visual captures, and controlled full-scene ABBA benchmarks. The final shadow-only comparison measured 249.446 to 248.473 ms with unchanged 45 custom draw calls; these are relative SwiftShader measurements, not physical-phone FPS. The KITT browser retry passed with zero page errors and failed requests.

Detailed evidence and unresolved launch work: `qc/release-31.md` and `qc/LAUNCH-READINESS.md`. This remains an incremental review release, not a claim of a complete high-fidelity district.
