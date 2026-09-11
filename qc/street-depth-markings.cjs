const fs=require('node:fs');
let source=fs.readFileSync('qc/street-depth-diagnose.cjs','utf8');
source=source.replace(/const variants=\[[^\n]+;/,"const variants=['markings-baseline','markings-red','markings-hidden'];")
.replace('window.streetDepthMaterials.push({material,map:material.map})','window.streetDepthMaterials.push({material,map:material.map,color:material.color.clone()})')
.replace('for(const {material,map:texture}of window.streetDepthMaterials){',"for(const {material,map:texture,color}of window.streetDepthMaterials){material.visible=!(variant==='markings-hidden'&&material.userData.streetSurfaceRole==='marking');material.color.copy(color);if(variant==='markings-red'&&material.userData.streetSurfaceRole==='marking')material.color.set(0xff0000);")
.replace("'qc/street-depth-results.json'","'qc/street-depth-markings-results.json'");
new Function('require',source)(require);
