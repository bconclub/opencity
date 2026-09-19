import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root=resolve(import.meta.dirname);
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.b64':'text/plain'};
const partRe=/\.part\d+$/;
http.createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const file=path===root?resolve(root,'index.html'):path;
    const ext=extname(file),type=types[ext]||(partRe.test(file)?'text/plain':null);
    if(!type){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});
    res.end(await readFile(file));
  } catch {if(!res.headersSent)res.writeHead(404).end('Not found');else res.end();}
}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`Bengaluru: http://127.0.0.1:${Number(process.env.PORT)||4173}`));
