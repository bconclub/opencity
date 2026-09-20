# Vidhana street surface pass

The existing 2,130-triangle OSM2World street patch has no UVs or texture maps. Its four material batches were rendered with single flat colours. This pass supplies metric UVs and two small original procedural textures, so aggregate remains at a consistent scale instead of stretching across road triangles. Paint stays an independent pale batch. Dry surfaces use matte diffuse lighting and mipmapped texture filtering, with no extra geometry or draw calls.

## Scope preserved

- No roads, kerbs, signal positions, crossing polygons or routes were moved.
- Existing geometry remains the collision-height source, including all 1,416 projected triangles.
- No duplicate ground overlay or depth offset was added; there are no new coplanar surfaces to flicker.
- Two 256-square RGBA textures are generated once locally. Their source code is about 3 KB; no external image download occurs. Base texture storage is 512 KiB, approximately 683 KiB including mipmaps.
- `street-patch.js` disposes generated textures and supports reinstallation.

## Evidence

`verify-street-patch.cjs` checks four draw calls, 2,130 triangles, all height samples, and dispose/reinstall. `qc/verify-street-surfaces.cjs` produces before/after street-level screenshots and an ABBA timing audit using the same 1100x760 Edge SwiftShader device. That isolated timing result does not establish full-city performance or mobile GPU performance. Do not run the benchmark while Blender renders or other GPU/CPU tests run concurrently.

Final uncontended run: baseline mean 22.2505 ms, candidate mean 22.8335 ms, **+2.62%**. Draw calls remain four and triangles remain 2,130. No browser errors. This follows a failed +13.14% trilinear-filter test; switching to single-mip bilinear filtering retained mipmaps and reduced sampling cost. Final screenshots are `qc/street-surfaces-before.png` and `qc/street-surfaces-after.png`; numerical evidence is `qc/street-surfaces-audit.json`. Neutral daylight removes the previous yellow cast. Surface grain is intentionally subtle at distance, visible close to the road, with no decorative paving grid invented.

## Remaining fidelity limits

This is a material improvement, not a completed photorealistic reconstruction. The patch covers approximately 423 by 439 metres, not a 500-metre radius. Geometry elevations are 0 to 10 cm and are not surveyed. Its source includes concrete-coloured broad road surfaces; the underlying export flattened material names into four colour batches. Textures follow those audited colour groups without claiming photographic material identification. Paving joints, potholes, road wear, drainage, precise sidewalk cross-sections and monument shapes need surveyed or photographed references. No guessed surface markings or invented crossings were added.

Full-scene acceptance still requires actual driving-camera screenshots at the Vidhana frontage, hardware mobile checks, and comparison against the user-approved reference quality. Isolated patch screenshots alone cannot pass that broader gate.
