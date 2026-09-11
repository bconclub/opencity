const fs=require('node:fs'),assert=require('node:assert/strict');
for(const tier of ['fullhd-off','compact-on']){
 let s=fs.readFileSync('qc/final-aa-performance.cjs','utf8');
 assert(s.includes('frames.length<240'));s=s.replace('frames.length<240','frames.length<120').replaceAll('240forced repaint frames/run','120forced repaint frames/run');
 if(tier==='compact-on'){s=s.replace('width:1920,height:1080','width:1100,height:760').replaceAll('1920x1080','1100x760');}
 else{s=s.replace("assert.equal(rendererCapabilities.contextAttributes.antialias,mode==='candidate'","assert.equal(rendererCapabilities.contextAttributes.antialias,false").replace("assert(mode==='candidate'?rendererCapabilities.samples>=4:rendererCapabilities.samples===0","assert(rendererCapabilities.samples===0");}
 s=s.replaceAll('final-aa-',`final-aa-${tier}-`).replaceAll(`final-aa-${tier}-snapshots`,'final-aa-snapshots');
 fs.writeFileSync(`qc/final-aa-${tier}-performance.cjs`,s);
}
