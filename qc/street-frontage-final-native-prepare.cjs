const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const old='qc/street-frontage-final',dir='qc/street-frontage-final-native',manifest=JSON.parse(fs.readFileSync(old+'/manifest.json'));assert(!fs.existsSync(dir+'/manifest.json'));fs.mkdirSync(dir,{recursive:true});
manifest.workingByteReceipt=[];manifest.parentManifestSHA256=sha(fs.readFileSync(old+'/manifest.json'));
for(const[mode,v]of Object.entries(manifest.variants))for(const f of v.files){const prior=fs.readFileSync(f.file);assert.equal(sha(prior),f.sha256);let body=prior;
 if(mode==='after'&&!f.source){body=fs.readFileSync(f.path);if(/\.(js|json|geojson|html|css)$/.test(f.path))assert.equal(body.toString().replace(/\r\n/g,'\n'),prior.toString().replace(/\r\n/g,'\n'),'Working content differs from 9df5546: '+f.path);else assert.deepEqual(body,prior);manifest.workingByteReceipt.push({path:f.path,gitSHA256:f.sha256,workingSHA256:sha(body),lineEndingOnly:f.sha256!==sha(body)});}
 const file=dir+'/'+mode+'/'+f.path;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,body);f.file=file;f.bytes=body.length;f.sha256=sha(body);
}
fs.writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));
for(const base of ['performance','join-auto']){const s=fs.readFileSync('qc/street-frontage-final-'+base+'.cjs','utf8').replaceAll('qc/street-frontage-final','qc/street-frontage-final-native');fs.writeFileSync('qc/street-frontage-final-native-'+base+'.cjs',s);}
console.log({manifestSHA256:sha(fs.readFileSync(dir+'/manifest.json')),workingFiles:manifest.workingByteReceipt.length,lineEndingOnly:manifest.workingByteReceipt.filter(f=>f.lineEndingOnly).length});
