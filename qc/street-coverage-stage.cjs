// Explicitly stage the reviewed atlas against exact accepted GLB bytes.
const fs=require('node:fs'),crypto=require('node:crypto');
const meta=JSON.parse(fs.readFileSync('assets/streets/vidhana-streets.json')),atlas=JSON.parse(fs.readFileSync('qc/street-coverage-atlas.json'));
const png=fs.readFileSync('qc/street-coverage-atlas.png'),glb=fs.readFileSync('assets/streets/vidhana-streets.glb');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
if(hash(glb)!=='87fe720941fc52856fd04f8ffa47f16df1bd363c56017530af65e6436a46b0dc'||atlas.sourceSha256!=='b01a80ad9c87d6df1bb9eca3faf79b4859d1d6c43b0b2a9e0232aba15693c93d')throw Error('Atlas staging requires the reviewed accepted geometry and original source; regenerate and review other patches separately');
fs.writeFileSync('assets/streets/vidhana-coverage.png',png);
meta.surfaceCoverage={version:1,encoding:'premultiplied-linear-rgba8',geometrySha256:crypto.createHash('sha256').update(glb).digest('hex'),atlasSha256:crypto.createHash('sha256').update(png).digest('hex'),atlasURL:'vidhana-coverage.png',atlasBytes:png.length,size:atlas.size,origin:meta.origin,bounds:atlas.bounds};
fs.writeFileSync('assets/streets/vidhana-streets.json',JSON.stringify(meta,null,2)+'\n');
console.log(meta.surfaceCoverage);
