# Vehicle asset pipeline

## Source and shape before texture

1. Gather manufacturer dimensions and front, side and rear references. Record which dimensions are estimates. Keep source licensing and provenance with the asset.
2. Generate three consistent closed-door clay views using the same master image. Keep light neutral shading so depth is visible. Outlines alone do not describe curved surfaces. Use orthographic side view and restrained perspective for front/rear. No scenery or hard reflections.
3. Save images under `assets-source/meshy-references/<asset>/geometry/{front,side,rear}.png`. Save coloured material references under the parallel `texture/` directory. Include prompts and provenance.
4. Run `node assets-source/vehicles/geometry-first-pipeline.mjs geometry submit <asset>`, with MESHY_API_KEY supplied through the environment. This generates geometry only. Status/download commands reuse the recorded task. Interrupted POSTs are never automatically resubmitted.
5. Raw output and job state stay on D:/CodexTools/Meshy/<asset>. Import into Blender. Check silhouette, symmetry, wheel arches, ground contact, glass boundaries, doors and panel seams at road and chase-camera distances. Reject warped geometry. Smoothing is not a replacement for retopology of hard surfaces.
6. Correct/retopologize where necessary. Separate wheels, glass, paint and lamps if the mesh permits clean segmentation. Never animate a whole joined vehicle as if it were a wheel. Save geometry-reviewed.glb and an editable .blend on D:.
7. Write geometry-review.json with status "passed", sha256 of that GLB, keepUv boolean, and evidence array of actual review render paths. The texture stage rejects stale geometry hashes or missing evidence.
8. Run the texture submit/status/download stage. It textures the reviewed geometry using all three coloured references. The stages never run automatically back-to-back.
9. Optimize a separate game asset, at most25,000 triangles, four materials and1K textures. Create a traffic LOD of at most6,000 triangles; batch shared material instances. Inspect normal maps before keeping them. Do not replace clear glass/paint boundaries with random face-colour classification.
10. Validate local and remote loading, directions, bounds, ground placement, wheel rig, colour policy and download size. Compare actual game screenshots and frame times on the same device. Version, commit and deploy only reviewed exports.

## Cybercab experiment, 2026-09-10

One combined Meshy7 task was run before the geometry-first change:01a08c35-1c29-708c-95c8-21bf911b2491,30 credits. It used three generated gold references. Closed doors and silhouette improved over the supplied open-door mesh. Generated normals and surface topology still required cleanup. This is an original approximation from generated references, not Tesla CAD. The final source file has joined static wheels and is not a complete vehicle rig.

Scripts prepare-meshy-candidate.py, clean-candidate.py, finish-cybercab.py and polish-cybercab-texture.py reproduce the comparison treatments. None passed the requested hard-surface quality target. After comparing all three, the user selected the original Meshy output for the current game preview. export-approved-cybercab.py copies that exact player mesh and creates a 6,000-triangle traffic LOD; the rejected material treatments remain comparison-only. Smoothing softened panels; recolouring damaged window boundaries. Stop material-only iterations and correct hard-surface geometry before any new texture job. User-supplied GLBs are never overwritten.

Official API references: https://docs.meshy.ai/en/api/multi-image-to-3d and https://docs.meshy.ai/en/api/retexture.
