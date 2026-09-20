const fs=require('node:fs'),assert=require('node:assert/strict');let s=fs.readFileSync('qc/final-aa-performance.cjs','utf8');const replace=(a,b)=>{assert(s.includes(a),a);s=s.replace(a,b);};
replace("['baseline','candidate','candidate','baseline'].entries()","['candidate'].entries()");replace("for(const pose of ['road','aerial','close'])","for(const pose of ['road','aerial'])");replace('frames.length<240','frames.length<10');
s=s.replaceAll('final-aa-','final-aa-repair-transition-').replaceAll('final-aa-repair-transition-snapshots','final-aa-snapshots');
// This is a two-pose transition diagnostic, not a frame-time acceptance run.
s=s.replace('if(runs.length!==12||Object.values(comparisons).some(c=>!c.passed))process.exitCode=1;','if(runs.length!==2)process.exitCode=1;');
fs.writeFileSync('qc/final-aa-repair-transition.cjs',s);
