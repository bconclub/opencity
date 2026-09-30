const fs=require('node:fs'),assert=require('node:assert/strict');let s=fs.readFileSync('qc/final-aa-performance.cjs','utf8');
const replace=(a,b)=>{assert(s.includes(a),a);s=s.replace(a,b);};
replace("for(const [index,mode]of ['baseline','candidate','candidate','baseline'].entries()){for(const isolatedPose of ['road','aerial','close']){","for(const [index,mode]of ['candidate'].entries()){");
replace("if(isolatedPose==='road'){","if(true){");replace('for(const pose of [isolatedPose]){',"for(const pose of ['road','aerial']){");
replace("if(pose==='aerial'){", "if(pose==='aerial'){await page.evaluate(()=>document.getElementById('exit-auto').click());await page.waitForFunction(()=>!map.isMoving()&&map.areTilesLoaded());");
replace('await page.close();\n }}\n }finally','await page.close();\n }\n }finally');replace('frames.length<240','frames.length<10');
s=s.replaceAll('final-aa-','final-aa-transition-').replaceAll('final-aa-transition-snapshots','final-aa-snapshots');
fs.writeFileSync('qc/final-aa-transition.cjs',s);
