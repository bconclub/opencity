const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const zlib = require('node:zlib');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const server = http.createServer((req,res) => {
  const files = {'/module.mjs':'D:/CodexTools/OSM2World/osm2world-core-web.mjs','/input.osm':path.join(root,'vidhana-streets.osm')};
  if (files[req.url]) {res.setHeader('Content-Type',req.url.endsWith('.mjs')?'text/javascript':'text/xml'); res.end(fs.readFileSync(files[req.url]));}
  else if(req.url === '/style.properties') {res.setHeader('Content-Type','text/plain');res.end('lod = 2\n');}
  else {res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>OSM2World isolated probe</title>');}
});
(async()=>{
 await new Promise(r=>server.listen(4188,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage();
  const logs=[];page.on('console',m=>logs.push(m.text()));page.on('pageerror',e=>logs.push(e.message));
  await page.goto('http://127.0.0.1:4188');
  const result=await page.evaluate(async()=>{
   const start=performance.now();
   const {O2WConverter,loadO2WConfig}=await import('/module.mjs');
   const xml=new DOMParser().parseFromString(await (await fetch('/input.osm')).text(),'text/xml');
   const origin={lon:77.5908,lat:12.9798};
   const nodes=new Map([...xml.querySelectorAll('osm > node')].map(n=>[n.getAttribute('id'),n]));
   const inside=n=>Math.hypot((Number(n.getAttribute('lon'))-origin.lon)*108480,(Number(n.getAttribute('lat'))-origin.lat)*111320)<180;
   let ways=[...xml.querySelectorAll('osm > way')].filter(w=>[...w.querySelectorAll('nd')].every(n=>nodes.has(n.getAttribute('ref')))&&[...w.querySelectorAll('nd')].some(n=>inside(nodes.get(n.getAttribute('ref')))));
   ways=ways.filter(w=>[...w.querySelectorAll('tag')].some(t=>t.getAttribute('k')==='highway'));
   for(const w of ways){const nds=[...w.querySelectorAll('nd')];const keep=new Set();nds.forEach((n,i)=>{if(inside(nodes.get(n.getAttribute('ref')))){keep.add(i);if(i)keep.add(i-1);if(i+1<nds.length)keep.add(i+1)}});nds.forEach((n,i)=>{if(!keep.has(i))n.remove()});}
   ways=ways.filter(w=>w.querySelectorAll('nd').length>=2);
   const refs=new Set(ways.flatMap(w=>[...w.querySelectorAll('nd')].map(n=>n.getAttribute('ref'))));
   const selected=[...nodes.values()].filter(n=>refs.has(n.getAttribute('id')));
   const tags=n=>Object.fromEntries([...n.querySelectorAll('tag')].map(t=>[t.getAttribute('k'),t.getAttribute('v')]));
   const input={version:0.6,elements:[...selected.map(n=>({type:'node',id:Number(n.getAttribute('id')),lat:Number(n.getAttribute('lat')),lon:Number(n.getAttribute('lon')),tags:tags(n)})),...ways.map(w=>({type:'way',id:Number(w.getAttribute('id')),nodes:[...w.querySelectorAll('nd')].map(n=>Number(n.getAttribute('ref'))),tags:tags(w)}))]};
   const inputBounds={minlon:Math.min(...input.elements.filter(e=>e.type==='node').map(n=>n.lon)),maxlon:Math.max(...input.elements.filter(e=>e.type==='node').map(n=>n.lon)),minlat:Math.min(...input.elements.filter(e=>e.type==='node').map(n=>n.lat)),maxlat:Math.max(...input.elements.filter(e=>e.type==='node').map(n=>n.lat))}; const config=await new Promise((resolve,reject)=>loadO2WConfig(location.origin+'/style.properties',{lod:'2',mapProjection:'MetricMapProjection'},resolve,reject));
   const converter=new O2WConverter();converter.setConfig(config);
   const conversionStart=performance.now();
   const meshes=await new Promise((resolve,reject)=>converter.convertJson(JSON.stringify(input),resolve,reject));
   const geometry=meshes.map(m=>({positions:Array.from(m.positions()),normals:Array.from(m.normals()),indices:Array.from(m.indices()),uvs:Array.from(m.uvs()),color:Array.from(m.color()),texture:m.baseColorTexture()}));
   return {input,geometry,stats:{selectionCenter:origin,projection:'MetricMapProjection',projectionOrigin:{lon:(inputBounds.minlon+inputBounds.maxlon)/2,lat:(inputBounds.minlat+inputBounds.maxlat)/2},inputBounds,selectionRadiusM:180,nodes:selected.length,ways:ways.length,meshCount:meshes.length,vertices:geometry.reduce((a,m)=>a+m.positions.length/3,0),triangles:geometry.reduce((a,m)=>a+m.indices.length/3,0),conversionMs:performance.now()-conversionStart,totalMs:performance.now()-start}};
  });
  const bytes=Buffer.from(JSON.stringify(result.geometry));
  fs.writeFileSync(path.join(__dirname,'sample-meshes.json'),bytes);
  fs.writeFileSync(path.join(__dirname,'sample-input.json'),JSON.stringify(result.input));
  result.stats.geometryJsonBytes=bytes.length;result.stats.geometryGzipBytes=zlib.gzipSync(bytes).length;result.stats.logs=logs;
  fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(result.stats,null,2));
  console.log(JSON.stringify(result.stats));
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});



