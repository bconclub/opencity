# CBD reconstruction evidence

This is a work in progress, not a photorealistic or survey-accurate model.

## Scope

The current detailed work area is the captured central pilot, 77.585–77.604 E and 12.966–12.985 N. This includes Vidhana Soudha, Cubbon Park, UB City, the High Court and the stadium. It does not cover the entire commonly described CBD, including the full MG Road / Brigade Road area. Destinations and aircraft movement are now restricted to this pilot. No work is being added elsewhere.

## Geometry

`landmark-data.json` is derived from the OpenStreetMap API on 2026-09-09, with raw extracts in `vidhana-osm.xml` and `ub-osm.xml`. ODbL attribution applies. Each polygon retains its OSM identifier and original tags. `prepare-landmarks.py` joins relation members and preserves courtyards. `landmarks.js` renders building parts, roof profiles and approximate repeated window bays. These are parametric approximations, not scans or purchased landmark assets.

Vidhana Soudha has six small domes and one central dome in the source. The supplied frontal, oblique and aerial images guide the pale granite tone, muted terracotta roof tone and tiered dome profile. The supplied night image is a lighting reference only. None of the user images, including the watermarked image, are embedded as app textures.

## Primary references and discrepancies

- Karnataka Legislature: https://kla.kar.nic.in/council/vds.htm . Gives overall 700 ft north–south by 350 ft east–west, 150 ft to the central dome, 60 ft dome diameter, twelve 40 ft entrance columns, 45 steps and granite materials. Its northern and southern wing heights differ. The OSM part heights do not consistently match these dimensions. They remain uncorrected pending a coordinated model calibration.
- UB City operator: https://ubcitybangalore.in/about/ . Gives UB Tower 123 m, Concorde 115 m and Canberra 105 m. The mapped building-part heights are substantially lower. The model retains mapped values and must not be presented as height-verified.
- Bengaluru Urban tourism: https://bengaluruurban.nic.in/en/tourism/ . Identifies the High Court's red brick and stone appearance. Its custom model has not yet been reconstructed.

## Required before claiming high fidelity

Reconcile landmark dimensions, roof silhouette and orientation against multiple references. Model entrance stairs, capitals, cornices, parapet ornament, dome ribs and the State Emblem faithfully. Create reference-matched stone, glazing and roof materials with normal/roughness maps. Validate each landmark from matching photo angles. Complete neighbouring streets and facades using building-specific references rather than arbitrary variety. Current repeated bays, surrounding facades, trees and rooftop equipment remain illustrative.

## 4K output

`node render-cbd-4k.cjs vidhana` renders a 3840×2160 image. `ub` and `cbd` select other cameras. The script requires the running local server and this workstation's Playwright/Edge installation. Pixel dimensions do not certify geometry or material accuracy.
