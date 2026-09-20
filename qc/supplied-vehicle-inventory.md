# Supplied vehicle inventory

**No missed materially better supplied KITT, Cybertruck or ready-to-use Cybercab found in the requested directories.** Confidence: high for inventory and GLB hierarchy; quality of unopened Blender interiors is not newly assessed. CPU metadata inspection only, no Blender/import/render/conversion.

## Supplied files

| Exact path | Bytes | Triangles | Meshes / materials | Relevant structure |
|---|---:|---:|---:|---|
| `D:/Brands BCON/OpenCity/Models/CyberCAB Textured.glb` | 61,515,104 | 1,952,024 | 1 / 1 | One fused node, three embedded images; no separate wheel, glass or body objects |
| `D:/Brands BCON/OpenCity/Models/CyberCAB.glb` | 35,136,888 | 1,952,024 | 1 / 0 | One fused node, no material/image definitions; no independent parts |
| `D:/Brands BCON/OpenCity/Models/Auto Driver.glb` | 28,595,672 | 498,494 | 1 / 1 | Already-audited standalone stylized seated character; unrelated to these car bodies |
| `D:/Brands BCON/OpenCity/Models/auto-rickshaw.zip` | 2,711,391 | Not re-imported | Not re-imported | Contains `source/Auto.fbx` plus three texture PNGs; no KITT/Cybertruck/Cybercab hidden in archive |

The textured Cybercab is already explicitly named as the input in `assets-source/vehicles/import-meshy-cybercab.py` and `assets/vehicles/cybercab-meshy-validation.json`. Its higher polygon count does not establish a cleaner authored surface or separable parts. The untextured file reports generator `meshy-scene`; the textured file reports `pygltflib@v1.16.5`. Neither declares copyright metadata. These generator fields are metadata, not proof of manufacturer provenance. Equal triangle counts alone do not prove identical vertex buffers.

## Accepted runtime and saved sources

| Runtime file | Triangles / materials | Separate parts | Corresponding saved source |
|---|---|---|---|
| `assets/vehicles/kitt.glb` | 24,512 / 4 | Body, glass, lamps/scanner, four wheel/steering hierarchies | `D:/CodexTools/Blender/projects/kitt-reference/kitt-reference.blend` |
| `assets/vehicles/cybertruck.glb` | 9,072 / 4 | Body, canopy glass, lamps, four wheels | `D:/CodexTools/Blender/projects/cybertruck-reference/cybertruck-reference-revision2.blend` |
| `assets/vehicles/cybercab-rigged.glb` | 24,667 / 3 | Original textured body, rebuilt wheels/rims, fixed liners; glass remains baked into body material | `D:/CodexTools/Blender/projects/cybercab-wheel-review/cybercab-repaired-review.blend` |

KITT and Cybertruck are original reference-led reconstructions, not manufacturer CAD. Runtime Cybertruck hash exactly matches the already-reviewed revision 2, despite an older source README still saying unpromoted. KITT source README already records runtime acceptance.

Other saved Cybercab files (`cybercab-meshy-review.blend`, `cybercab-v2-review.blend`, `cybercab-v2-clean.blend`, `cybercab-refined-review.blend`, `cybercab-final.blend`, `cybercab-polished.blend`) are documented outputs of existing import/surface/recolour scripts. For example, `polish-cybercab-texture.py` opens `cybercab-final.blend` and repaints selected texture pixels. They are not evidence of newly supplied better models. Recent KITT wheel and NPC LOD outputs are explicitly rejected review candidates, not quality upgrades.

Full paths, file sizes, SHA256 hashes, cheap GLB node/material/triangle counts and generator fields: `qc/supplied-vehicle-inventory.json`. Saved Blender metadata and hashes: `qc/vehicle-blend-inventory.json`. No Blender geometry was inferred from filename alone.

## Concrete next quality step

Do not promote an old polished file or repeat global decimation. No local drop-in asset solves the body-quality gap. Obtain one clean, authored vehicle source with real panel geometry and separately identifiable glass/wheels, then inspect its original hierarchy before any reduction or integration. Prior `qc/kitt-source-audit.md` records the external Nieve KITT download blocked by Chrome and no acquired file; that model's geometry and separability remain unknown, not a verified replacement. No bypass, download, paid generation or external-source refresh occurred here.

For Cybercab, the available fused high-resolution source can support a future manual panel retopology/reference task, but this audit does not establish that it can meet the current budget and fidelity requirement. Existing exact wheel rigs can be retained when a better body is actually available. Antialiasing cannot repair missing panel geometry or baked texture defects.
