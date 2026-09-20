const fs=require('node:fs'),r=JSON.parse(fs.readFileSync('qc/vidhana-architecture-integration-performance.json'));
for(const view of ['road','front','aerial','close'])for(const mode of ['before','after']){
 const rows=r.rows.filter(x=>x.view===view&&x.mode===mode),a=rows.flatMap(x=>x.frames).sort((x,y)=>x-y),q=p=>{const x=(a.length-1)*p,i=Math.floor(x);return a[i]+(a[Math.ceil(x)]-a[i])*(x-i);},npc=rows.flatMap(x=>x.npc);
 r.comparisons[view][mode]={meanMs:a.reduce((x,y)=>x+y)/a.length,medianMs:q(.5),p95Ms:q(.95),maxMs:Math.max(...a),over30Budget:a.filter(x=>x>1000/30).length,visibleRange:[Math.min(...npc.map(x=>x.visible)),Math.max(...npc.map(x=>x.visible))],nearRange:[Math.min(...npc.map(x=>x.near)),Math.max(...npc.map(x=>x.near))],firstPartyUniqueBytes:rows.map(x=>x.firstPartyUniqueBytes)};
}
fs.writeFileSync('qc/vidhana-architecture-integration-performance.json',JSON.stringify(r,null,2));console.log(JSON.stringify({passed:r.passed,comparisons:r.comparisons}));
