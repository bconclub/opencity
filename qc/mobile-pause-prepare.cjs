const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const files=['mobile-drive.js','auto-mode.js','flight.js'],manifest=[];
function once(s,before,after){assert.equal(s.split(before).length-1,1,before);return s.replace(before,after);}
for(const file of files){const source=fs.readFileSync(file,'utf8');let next=source;
 if(file==='mobile-drive.js'){
  next=once(next,"const ride=()=>window.autoState?.().active?'auto':window.flightState?.().active?'flight':'';","const ride=()=>window.autoState?.().active?'auto':window.flightState?.().active?'flight':'';\nconst ridePaused=()=>{const auto=window.autoState?.();return auto?.active?auto.paused:!!window.flightState?.()?.paused;};");
  next=once(next,"e.preventDefault();e.stopImmediatePropagation();const side=e.clientX<innerWidth/2?'left':'right';","e.preventDefault();e.stopImmediatePropagation();if(ridePaused())return;const side=e.clientX<innerWidth/2?'left':'right';");
  next=once(next,"window.addEventListener('blur',release);","window.addEventListener('opencity:release-input',release);window.addEventListener('blur',release);");
 }else{
  next=once(next,'function release(){',"function release(){window.dispatchEvent(new Event('opencity:release-input'));");
 }
 const candidate='qc/mobile-pause-'+file;fs.writeFileSync(candidate,next);manifest.push({file,candidate,sourceSha256:hash(source),candidateSha256:hash(next)});
}
fs.writeFileSync('qc/mobile-pause-candidates.json',JSON.stringify({files:manifest,api:'window event opencity:release-input, synchronous, no payload',runtimeChanged:false},null,2));
console.log(JSON.stringify(manifest,null,2));
