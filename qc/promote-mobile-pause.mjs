import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync('qc/mobile-pause-candidates.json'));
const smoke=JSON.parse(fs.readFileSync('qc/final-aa-final-smoke.json'));
assert.equal(smoke.passed,true);
for(const mode of ['software','mobile-330','mobile-390','mobile-430']){
 const row=smoke.rows.find(r=>r.mode===mode);assert(row&&row.passed,mode);
 assert.deepEqual(row.errors,[]);assert.deepEqual(row.missing,[]);
 if(mode.startsWith('mobile'))for(const check of ['leftAnalog','leftMoves','release','rightInert','pauseClearsHeld','uiExcluded','flightHeld','flightPauseClears','pausedTouchIgnored','flightResumeAcceptsFresh','flightRelease','noOverflow'])assert.equal(row.checks[check],true,mode+':'+check);
}
const checked=manifest.files.map(f=>{
 const bytes=fs.readFileSync(f.candidate),current=sha(fs.readFileSync(f.file));
 assert.equal(sha(bytes),f.candidateSha256,f.candidate);
 assert(current===f.sourceSha256||current===f.candidateSha256,'Unreviewed runtime change: '+f.file);
 assert.equal(smoke.overrides.changes.find(c=>c.file===f.file)?.sha256,f.candidateSha256);
 return {...f,bytes};
});
for(const file of ['app.js','sw.js','index.html']){
 const expected=smoke.overrides.changes.find(f=>f.file===file)||smoke.snapshot.files.find(f=>f.path===file);
 assert.equal(sha(fs.readFileSync(file)),expected.sha256,file+' differs from reviewed smoke');
}
for(const f of checked)fs.writeFileSync(f.file,f.bytes);
fs.writeFileSync('qc/mobile-pause-promotion.json',JSON.stringify({passed:true,files:checked.map(({bytes,...f})=>f),smokeSha256:sha(fs.readFileSync('qc/final-aa-final-smoke.json')),scope:'Exact reviewed input-only fixes; graphics AA experiment excluded. Software and three touch viewports verified, no physical-phone performance claim.'},null,2));
console.log('Promoted three reviewed mobile pause-input files.');
