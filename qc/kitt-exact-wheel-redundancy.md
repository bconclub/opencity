# Exact KITT wheel redundancy audit

Read-only CPU inspection of accepted `assets/vehicles/kitt.glb`. No Blender, rendering, candidate generation, or runtime edits. Previous reduced-detail candidate remains rejected; root verdict is recorded in `kitt-wheel-optimization-review.md`.

**High confidence: 256 zero-area triangles can be removed without changing visible surfaces. No substantial exact simplification was established.** These are 64 collapsed triangles at each BodyPaint rim dish's repeated zero-radius pole. Removing their index triplets retains every tyre circumference sample, tread tube, nondegenerate triangle, vertex attribute, and pivot. Total would fall from 24,512 to 24,256, only 1.04%; this is not a measured performance improvement.

All four `Wheel_*_RubberTrim` meshes have zero exact zero-area triangles, zero attribute-identical same-winding duplicate triangles, zero wholly collinear vertex stars, and zero coplanar interior vertex stars. Connected components are the 864-triangle tyre, forty 16-triangle tread tubes, 252-triangle barrel, twenty-four 12-triangle vents, five 60-triangle lug wells, and 92-triangle cap. Coplanar triangulation diagonals alone cannot lower triangle count without removing a boundary or interior vertex.

Each BodyPaint dish also has one geometrically coplanar centre vertex. Removing this fan centre could save two triangles per wheel geometrically, but does not preserve its exported normal field: centre normal is exactly (+/-1,0,0), whereas neighboring axial normal magnitudes range approximately 0.9996465 to 0.9996488, with radial components up to 0.0265013. The existing centre normal is not an affine interpolation of those boundary normals. Do not claim an identical-normal simplification from that retriangulation.

Evidence: `qc/kitt-exact-wheel-redundancy.json`, including exact triangle ordinals and normal ranges; reproducible CPU script `qc/audit-kitt-exact-wheel-redundancy.py`. Tests use exact exported coordinates and all vertex attributes, without tolerance-based welding. This is a bounded local-topology audit, not proof that no possible global equivalent tessellation exists. No 4,000-triangle exact reduction found.
