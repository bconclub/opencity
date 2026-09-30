const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source='qc/vidhana-stair-analytic-v2-bundle.js',file='qc/vidhana-stair-analytic-v2-shadow-on-bundle.js',original=fs.readFileSync(source,'utf8');
assert.equal(original.split('stair.receiveShadow=false;').length,2);
const body=original.replace('stair.receiveShadow=false;','stair.receiveShadow=true;').replace('review-stair-analytic-coverage-v2-visible','review-stair-analytic-coverage-v2-visible-shadow-on');
fs.writeFileSync(file,body);const path='qc/vidhana-stair-analytic-v2-manifest.json',m=JSON.parse(fs.readFileSync(path));m.entries=m.entries.filter(e=>e.mode!=='analyticShadowOn');m.entries.push({mode:'analyticShadowOn',file,sha256:crypto.createHash('sha256').update(body).digest('hex')});fs.writeFileSync(path,JSON.stringify(m,null,2));console.log(file);
