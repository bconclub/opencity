# Original Sketchfab source availability

Checked 2026-09-11 through live public Sketchfab model metadata and official documentation. No browser/GPU render, model download, purchase, paid API or runtime change. Live API response saved in `qc/original-sketchfab-api-audit.json`.

**Neither original link currently provides a verified obtainable, reusable OpenCity game source.** Confidence: high for live metadata; source-part separability and eventual game-budget fidelity remain unknown because no model file was obtained.

| Original model | Author | Exact model counts | Current access/license evidence |
|---|---|---|---|
| [Knight Rider KITT (Supercar)](https://sketchfab.com/3d-models/knight-rider-kitt-supercar-e6c147a0d2c54bdbb101b56fa61646fe) | FG, account FGraphic | 988,509 triangles; 503,467 vertices | `isDownloadable:false`; license object empty. Author says their Hum3D purchase was modified and is displayed for illustration, not sale. No formats/archive exposed. [Live primary metadata](https://api.sketchfab.com/v3/models/e6c147a0d2c54bdbb101b56fa61646fe). |
| [Tesla - Cybertruck](https://sketchfab.com/3d-models/tesla-cybertruck-5a86defda4b24836a504fe5e597fdb17) | bubelrobert | 121,332 triangles; 64,469 vertices | `isDownloadable:false`; license label **Editorial**. No formats/archive exposed. Author identifies it as an unofficial interpretation with possible proportion differences. [Live primary metadata](https://api.sketchfab.com/v3/models/5a86defda4b24836a504fe5e597fdb17). |

KITT's original creator points to a [Hum3D source product](https://hum3d.com/it/3d-models/pontiac-firebird-knight-rider/). That is an attribution lead, not a source obtained here or a license granted by viewing FG's page. No purchase pathway was used or verified in this task.

Cybertruck's indexed page still has a historical store-style title and mentions an additional back-cover file. Those statements do not establish a working free download or current checkout. Live metadata has no purchase-status value or archive list. No matching live Fab entitlement or author-granted game license was verified. Sketchfab's [license agreement](https://sketchfab.com/licenses) restricts Editorial assets to qualifying commentary/news/public-interest uses and excludes commercial/promotional use; it does not establish permission for this general playable-city integration.

## Actual barriers

The web text fetch returned HTTP 403 for both model pages, but the official public metadata API succeeded without authentication. This is a fetch-tool limitation, not evidence that the user is logged out. No signed-in UI checkout or new download dialog was tested.

Both models themselves report downloads disabled. Logging in is not demonstrated to resolve that. For models that are downloadable, Sketchfab's [official download flow](https://sketchfab.com/developers/download-api/downloading-models) requires an authenticated Sketchfab account and an authorized download request. Its [API overview](https://sketchfab.com/developers/download-api) lists glTF/GLB/USDZ generally, not the available formats of these two disabled models. Do not infer FBX/OBJ/GLB availability for either original link.

Next concrete path is an actual source file supplied with suitable reuse rights or a creator-provided authorized download/license. Until then, these pages remain references; clean panels, separate glass/wheels and quality after reduction cannot be promised. No viewer-resource extraction or access-control bypass attempted.
