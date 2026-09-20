const fs=require('node:fs');
const lm=fs.readFileSync('landmarks.js','utf8').replace('rings=f.geometry.coordinates.map(r=>r.slice(0,-1).map(xy))','rings=f.geometry.coordinates.map((r,index)=>{const points=r.slice(0,-1).map(xy);const area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0);if((index===0&&area<0)||(index>0&&area>0))points.reverse();return points;})');
fs.writeFileSync('qc/landmark-stripe-diagnosis-winding-module.js',lm);
let s=fs.readFileSync('qc/landmark-stripe-diagnosis.cjs','utf8');
s=s.replace("await p.goto('http://127.0.0.1:4173/')","await p.route('**/landmarks.js',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('qc/landmark-stripe-diagnosis-winding-module.js','utf8')}));await p.goto('http://127.0.0.1:4173/')");
s=s.replace("['baseline','landmark-no-receive','bias-negative','normal-bias-zero','bias-zero']","['baseline','landmark-no-receive']").replaceAll('diagnosis-${mode}','diagnosis-winding-${mode}').replace('diagnosis.json','diagnosis-winding.json');
fs.writeFileSync('qc/landmark-stripe-diagnosis-winding.cjs',s);
