const fs=require('node:fs'),assert=require('node:assert/strict');
const path='qc/npc-detail-hardware-performance.json',raw='qc/npc-detail-hardware-raw.json';
if(!fs.existsSync(raw))fs.copyFileSync(path,raw);
const data=JSON.parse(fs.readFileSync(raw));
assert.equal(data.runs.length,12);
for(const run of data.runs){
 const sorted=[...run.frames].sort((a,b)=>a-b),q=p=>{const x=(sorted.length-1)*p,a=Math.floor(x),b=Math.ceil(x);return sorted[a]+(sorted[b]-sorted[a])*(x-a);};
 assert.equal(sorted.length,60);
 run.medianMs=q(.5);run.p95Ms=q(.95);
}
data.quantiles='Per-run and pooled frame intervals, linear interpolation at p*(N-1)';
data.summaryCorrection={rawSource:raw,description:'Recalculated per-run median/p95 from unchanged raw frames to match pooled type-7 quantiles. Original approximate sorted[30]/sorted[57] summaries preserved in raw file. No browser rerun; measurements unchanged.'};
fs.writeFileSync(path,JSON.stringify(data,null,2));
console.log(JSON.stringify({comparisons:data.comparisons,runs:data.runs.map(r=>({index:r.index,mode:r.mode,pose:r.pose,mean:r.meanMs,median:r.medianMs,p95:r.p95Ms,renderer:r.rendererCapabilities.renderer,browser:r.browserVersion,context:r.rendererCapabilities.contextAttributes}))},null,2));
