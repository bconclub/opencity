# Shapespark tree candidate, review only

Source: [Shapespark's exterior plants kit](https://github.com/shapespark/shapespark-assets/tree/main/shapespark-low-poly-plants-kit), released by its author under CC0 1.0. Full license is saved beside the GLB. This candidate is not installed into OpenCity's district.

`shapespark-tree-01-1.glb` contains exactly one original tree: 646 triangles, three materials, 1,563,176 bytes. It was extracted without mesh, UV, texture or material modification. Only its presentation-grid translation was removed. Height is approximately 7.389 metres. Species is not identified, and it is not claimed to reproduce a particular Bengaluru tree.

Reproduce with `node qc/extract-shapespark-tree.mjs`. The script reads bounded HTTP ranges from the author's embedded glTF and reconstructs only the referenced buffers and images. It refuses servers that ignore the range request. This extraction transferred 2,219,112 bytes of encoded ranges, not the full 27,040,185-byte plant pack. `provenance.json` contains the output checksum, source URL and author-declared source Git LFS checksum.

## Visual check

Open `/qc/tree-review.html`. Three views compare the existing trunk/two-icosahedron construction, original blended materials, and a review-only cutout configuration. All use the same scale and lighting. Desktop front/three-quarter/side controls and a mobile single-tree selector are available.

The cutout test changes the two foliage materials in memory: `transparent=false`, `alphaTest=0.3`, `depthWrite=true`, `alphaToCoverage=true`; a small emissive texture fill (`0.09` linear) avoids fully black back-facing leaf cards. It does not alter the saved GLB. At 0.5, foliage looked overly sparse and edges harsh, so that threshold was rejected. Original alpha blend appears softer but can produce ordering/overdraw problems in an instanced forest.

`qc/verify-tree-review.cjs` verifies decode and captures desktop, side and 390px mobile screenshots. Both foliage images decode to 1024×1024 RGBA with real clear/solid/soft alpha pixels. Their green leaf and branch outlines are visible in the rendered preview, with no opaque rectangular backgrounds. No browser errors were observed.

Per-tree render submission, excluding the review ground:

| Configuration | Draw calls | Submitted triangles |
| --- | ---: | ---: |
| Existing primitive geometry, batched crowns | 2 | 64 |
| Original author alpha blend | 5 | 1,070 |
| Cutout candidate | 3 | 646 |

These counts do **not** establish acceptable full-city frame time. No timing benchmark ran during this review. Candidate triangle cost is roughly ten times the existing geometry per tree, and leaf-card pixel overdraw is a separate cost. A bounded set of nearby instanced trees, distance culling and cheaper distant representations must be measured before broad replacement. Three materials can be shared across instances; do not create separate materials or renderers per tree.

## Quality decision

This is a clear botanical silhouette improvement over solid canopy polyhedra and a viable near/middle-distance candidate. It is not a high-detail hero tree: branches are texture cards, their flatness remains visible from some angles, and close-up leaf shading can be harsh. It cannot by itself establish high-fidelity city completion. The near-LOD integration was tested and rejected for this release: actual road foliage had pale sparkling edges, near/far silhouettes were inconsistent, and the 32-tree desktop test added 10.20% frame time over the combined pre-LOD candidate. Disabling alpha-to-coverage removed the sparkling edges in a diagnostic capture but was not benchmarked or accepted. Runtime integration and asset preloading were removed. Keep this asset in review; see `qc/NEARBY-TREE-LOD.md` and its before/after evidence. Real mobile GPU timing remains unverified.
