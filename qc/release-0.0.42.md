# OpenCity 0.0.42 release reconciliation

Source: fetched `origin/release-0.0.41-complete` at 31e9bec on 2026-09-20. The simultaneous `main` upload at 9afdcba is incomplete: its npm check references a missing file and vehicle uploads are incomplete Base64 fragments.

Restored the exact supplied vehicle binaries and previews from local release b9b689f (0.0.40), including Yulu, delivery scooter and Knight Rider. Restored their runtime integration, retained the newer street furniture/Devaraj work, and replaced incomplete street-data uploads with generated local JSON. Removed partial vehicle upload fragments. Staging now fails when a required asset is missing. Helicopter sorts first, including when Yulu and delivery are present.

Validation: npm check; car physics; flight dynamics; dome; gamepad noise; vehicle physics; auto-roam; traffic simulation; all six multiplayer server tests passed. Desktop Chromium opened the picker and Cybercab ride with no uncaught page errors. ArrowUp produced positive speed and distance. Picker had no horizontal overflow at 330, 390, 430 and 1280 pixels. Screenshots were inspected. Cab orientation was reversed after observing its rendered ends.

Limits: source vehicle meshes still have fused wheels. Wheel animation, authentic rear-light geometry and higher world fidelity are not completed by this release. Physical mobile/gamepad and multi-device production voice have not been retested. Source vehicles are approximately 60-71 MB each; no fidelity reduction was applied. This is a reconciled test release, not completion of the full world plan.

Deployment must use the staged `public-release` folder and verified OpenCity Vercel project prj_4ADxALOAmBxNJTKqOJ0ZhOPIerRA. Do not deploy the Jamaican Kitchen folder into this project. No room-server deployment is included.
