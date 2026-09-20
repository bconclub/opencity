import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('.'),cache='D:/CodexTools/OSM2World';
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let file;
 if(url.pathname==='/__three.js')file=cache+'/three.module.js';
 else if(url.pathname==='/__addons/loaders/GLTFLoader.js')file=cache+'/GLTFLoader.js';
 else if(url.pathname==='/__addons/utils/BufferGeometryUtils.js')file=cache+'/BufferGeometryUtils.js';
 else {file=resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+sep))throw Error('Path');}
 const body=await readFile(file);res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.glb':'model/gltf-binary','.png':'image/png','.json':'application/json','.css':'text/css'})[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404).end();}}).listen(4175,'127.0.0.1',()=>console.log('Tyre review http://127.0.0.1:4175/qc/tyre-effects-review.html'));
