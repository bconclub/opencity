const fs=require('node:fs');
let source=fs.readFileSync('qc/street-depth-diagnose.cjs','utf8');
source=source.replace(/const variants=\[[^\n]+;/,"const variants=['accepted-baseline','accepted-markings-red','accepted-markings-hidden'];")
.replace(/await page\.route\('\*\*\/assets\/streets\/\*'[\s\S]*?\nawait page\.goto/,'await page.goto')
.replace('window.streetDepthMaterials.push({material,map:material.map})','window.streetDepthMaterials.push({material,map:material.map,color:material.color.clone()})')
.replace('for(const {material,map:texture}of window.streetDepthMaterials){',"for(const {material,map:texture,color}of window.streetDepthMaterials){material.visible=!(variant==='accepted-markings-hidden'&&material.userData.streetSurfaceRole==='marking');material.color.copy(color);if(variant==='accepted-markings-red'&&material.userData.streetSurfaceRole==='marking')material.color.set(0xff0000);")
.replace("'qc/street-depth-results.json'","'qc/street-depth-accepted-results.json'");
new Function('require',source)(require);
