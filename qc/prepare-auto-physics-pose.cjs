const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source='auto-physics.js',original=fs.readFileSync(source,'utf8');
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
let candidate=once(original,'s.heading=(s.heading+s.yaw*h*180/Math.PI+360)%360;','const priorHeading=s.heading;\n  s.heading=(s.heading+s.yaw*h*180/Math.PI+360)%360;');
candidate=once(candidate,'if(hit){const vn=','if(hit){s.heading=priorHeading;const vn=');
const file='qc/auto-physics-pose-candidate.js';fs.writeFileSync(file,candidate);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
fs.writeFileSync('qc/auto-physics-pose-manifest.json',JSON.stringify({source:{file:source,sha256:sha(original)},candidate:{file,sha256:sha(candidate)},scope:'Rollback proposed heading together with rejected translation; preserve collision response, yaw damping and all accepted movement. Review only.'},null,2));console.log(file);
