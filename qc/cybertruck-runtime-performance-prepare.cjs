const fs=require('node:fs'),assert=require('node:assert/strict');
let src=fs.readFileSync('qc/kitt-runtime-performance.cjs','utf8').replaceAll('kitt','cybertruck').replaceAll('KITT','Cybertruck');
src=src.replace("oldAsset='assets/vehicles/cybertruck-review/runtime-before-promotion.glb'","oldAsset='qc/cybertruck-runtime-before.glb'")
 .replace("'assets/vehicles/cybertruck-review/cybertruck-reference.glb'","'assets/vehicles/cybertruck-review/revision2/cybertruck-reference.glb'")
 .replace("localStorage.setItem('opencity-vehicle-color','black')","localStorage.setItem('opencity-vehicle-color','white')");
const tuning=fs.readFileSync('vehicle-tuning.js','utf8');
fs.writeFileSync('qc/cybertruck-runtime-before-tuning.js',tuning);
src=src.replace("assert.notEqual(hashes.baseline,hashes.candidate,", "assert.equal(hashes.candidate,'e6ad2ff4ffc3b4ee4de73600f28eb264e2fc3b3fac65f31ebb0d4f50cda4fc05');assert.notEqual(hashes.baseline,hashes.candidate,");
src=src.replace(" await page.goto('http://127.0.0.1:4173/');",` const baselineTuning=fs.readFileSync('qc/cybertruck-runtime-before-tuning.js','utf8');
 const selectedTuning=mode==='baseline'?baselineTuning:baselineTuning.replace(/cybertruck:\\{([^}]+)\\}/,(_,body)=>'cybertruck:{'+body.replace(/wheelbase:[\\d.]+/,'wheelbase:3.635').replace(/wheelRadius:[\\d.]+/,'wheelRadius:.43925')+'}');
 await page.route('**/vehicle-tuning.js',r=>r.fulfill({contentType:'text/javascript',body:selectedTuning}));
 await page.goto('http://127.0.0.1:4173/');`);
src=src.replace("const report={scope:","const report={assetHashes:hashes,scope:");
fs.writeFileSync('qc/cybertruck-runtime-performance.cjs',src);
