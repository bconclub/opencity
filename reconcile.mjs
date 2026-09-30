import fs from 'node:fs';import zlib from 'node:zlib';
const parts=[];for(let i=1;fs.existsSync(`vidhana-street-data.json.gz.b64.part${i}`);i++)parts.push(fs.readFileSync(`vidhana-street-data.json.gz.b64.part${i}`,'utf8').trim());
const data=JSON.parse(zlib.gunzipSync(Buffer.from(parts.join(''),'base64')));if(data.features.length<1000)throw Error('Incomplete road data');fs.writeFileSync('vidhana-street-data.json',JSON.stringify(data));console.log('Street features',data.features.length);
let s=fs.readFileSync('vehicle-shell.js','utf8').replace("['cybertruck','cybercab','auto','kitt','yulu','delivery','helicopter']","['helicopter','cybercab','cybertruck','auto','kitt','yulu','delivery']").replace("let selectedRide='cybertruck'","let selectedRide='helicopter'");fs.writeFileSync('vehicle-shell.js',s);
s=fs.readFileSync('blender-vehicle.js','utf8').replace('cybercab:{length:4.45,yaw:Math.PI/2}','cybercab:{length:4.45,yaw:-Math.PI/2}');fs.writeFileSync('blender-vehicle.js',s);
s=fs.readFileSync('sw.js','utf8').replace("const allowed=","files.push('street-data.js');\nconst allowed=");fs.writeFileSync('sw.js',s);
for(const f of ['package.json','release.json']){const j=JSON.parse(fs.readFileSync(f));j.version='0.0.41';if(f==='release.json'){j.date='2026-09-19';j.name='Restore supplied fleet and showroom with Devaraj road improvements';}fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n');}
s=fs.readFileSync('server.mjs','utf8').replace(".listen(4173,", ".listen(Number(process.env.PORT)||4173,");fs.writeFileSync('server.mjs',s);
