# Knight Rider runtime replacement checks

11 September 2026. Revised original Blender reconstruction, not licensed KITT CAD or a claim of photorealistic fidelity.

Candidate SHA256: `b4247a09d36ec41fa1a550374d50e11d7006a124cafc03cc8decc4a83cc4393d`.
Previous runtime SHA256: `498f019da73b071b7cacf54f06daa5a5ad0536a14bd27739a3df97f368ecd339`.

## Functional evidence

`kitt-runtime-inspection-attempt1.json` preserves the initial failed harness attempt: it tried clicking a reset control hidden by the current UI. The corrected harness records programmatic reset separately from visible controls; this is not evidence of a working reset button in the menu.

`kitt-runtime-inspection-attempt2.json` preserves the passing full-app comparison before the default-paint correction. Two fresh clients used an actual temporary local room server. Manual driving, steering, reverse, auto-roam, pause/resume, remote wheel movement and scanner animation passed. Independent named blue/red paint reached each remote model without altering glass, trim or lamps. Color-picker UI itself was not exercised. Custom spectrum colours remain quantized to the legacy server's named palette.

That run exposed an appearance mismatch: with no saved choice, the local model was black but the remote replica green. The subsequent minimal fix chooses a model-local black default for KITT, publishes black for KITT with no stored choice, and leaves other vehicles' defaults and saved preferences alone. It does not save the automatic choice.

`kitt-runtime-default-paint-results.json` passes CPU checks of local paint, wire colours, saved choices and vehicle switching. `kitt-runtime-default-paint-browser.json` passes the focused two-client browser check after that fix, with no page errors. Both body materials report `303b3e`; no saved paint is created.

## Visual review

Root inspected the old and candidate driver/observer images and the final `kitt-runtime-default-paint-driver.png` and `...-observer.png`. Candidate has a more proportionate rear body, transparent rear hatch with visible seats, red tail lamps and lower spoiler instead of the previous oversized body and white rear light bar. The final default matches between clients. Observer is still a distant view, so it establishes consistency rather than fine surface quality. Earlier two-client painted screenshot has a pause overlay and is not used as clear visual proof.

This is a bounded improvement suitable for the review build. Broad glossy surfaces, simplified details and the surrounding city still fall short of the user's high-fidelity target. No physical-phone visual acceptance is claimed.

## Bumper clearance

The player-to-NPC collision helper now uses 4.89 m for KITT, enclosing the measured 4.8845 m body length instead of the previous 4.6 m proxy. Width remains the conservative existing 1.9 m body proxy, excluding mirrors. `kitt-contact-test.mjs` demonstrates a bumper overlap missed by the old length and caught by the replacement, then checks boosted approaches at four headings using actual KITT physics and the runtime contact function. All stop before the measured bumpers overlap. This is not a mesh-exact collision system or a fix for every road/junction issue.

## Relative performance

`kitt-runtime-performance.json`: actual full-city static chase view, 1100 x 800, Edge SwiftShader, 60 frames per run in baseline/candidate/candidate/baseline order. NPC traffic retained; multiplayer disabled for this timing comparison.

Baseline mean 203.4725 ms; candidate 218.4717 ms, **7.37% slower**, below the specified 10% gate. Custom-layer calls decreased 113 to 67; triangles increased 350,082 to 365,564. Candidate download grows 473,028 to 1,074,240 bytes. Baseline runs varied, so these are relative measurements on this test device, not representative physical-phone FPS or an eight-player benchmark.

Comparison scripts preserve the old baseline path and reject identical before/after hashes. The stable runtime path now contains the verified candidate bytes. `node qc/render-vehicle-previews.cjs kitt` loaded that path with the actual runtime model factory and produced the refreshed 640 x 420 picker image, 19,984 bytes, without browser errors. Root inspected the preview, including front scanner, hatch, wheels and body silhouette. Other vehicle previews were not regenerated. No production deployment or room-server change is implied by these results.
