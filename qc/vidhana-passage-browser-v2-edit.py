from pathlib import Path
p=Path('qc/vidhana-passage-browser-v2-prepare.cjs')
s=p.read_text().replace('vidhana-passage-browser-snapshot','vidhana-passage-browser-v2-snapshot')
needle="const entries=[];"
addition="""
overrides['district.js']=fs.readFileSync('qc/landmark-focus-district-candidate.js','utf8');
overrides['landmark-focus.js']=fs.readFileSync('qc/landmark-focus-candidate.js','utf8');
overrides['auto-mode.js']=replace(overrides['auto-mode.js'],'window.__passageStaticCollision=staticCollision;','window.__passageStaticCollision=staticCollision;window.__passageGraphs=()=>({manual:graph,tour:tourGraph});');
"""
assert needle in s;s=s.replace(needle,addition+needle)
p.write_text(s)
p=Path('qc/vidhana-passage-browser-v2.cjs');s=p.read_text()
s=s.replace('vidhana-passage-browser-snapshot','vidhana-passage-browser-v2-snapshot')
s=s.replace('vidhana-passage-browser-results','vidhana-passage-browser-v2-results').replace('vidhana-passage-browser-failure','vidhana-passage-browser-v2-failure')
s=s.replace('let browser,rooms,driver,observer;','let browser,rooms,driver,observer,fixture;const transport=[];let origin,endpoint;')
start="rooms=createRoomServer({allowedOrigins:'http://127.0.0.1:4173'});"
end="browser=await chromium.launch({channel:'msedge',headless:true});"
i=s.index(start);j=s.index(end,i)
s=s[:i]+"""fixture=require('node:http').createServer((req,res)=>{
const url=new URL(req.url,origin),file=decodeURIComponent(url.pathname.slice(1))||'index.html';
let body=assets.get(file),type=({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream';
if(file==='multiplayer-config.json'){body=Buffer.from(JSON.stringify({url:endpoint}));type='application/json';}
if(file==='local-cache.js')body=Buffer.from('');
if(!body){misses.push(file);res.writeHead(404).end('Not in immutable fixture');return;}
res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);});
await new Promise(r=>fixture.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+fixture.address().port;
rooms=createRoomServer({allowedOrigins:origin});rooms.server.on('upgrade',req=>transport.push({event:'upgrade',url:req.url,origin:req.headers.origin}));
await new Promise(r=>rooms.server.listen(0,'127.0.0.1',r));endpoint='ws://127.0.0.1:'+rooms.server.address().port+'/ws';
"""+s[j:]
i=s.index("await p.route('http://127.0.0.1:4173/**'");j=s.index('return p;}',i)
s=s[:i]+"p.on('websocket',ws=>{transport.push({event:'websocket',url:ws.url()});ws.on('socketerror',error=>transport.push({event:'socketerror',error}));});"+s[j:]
s=s.replace("driver.goto('http://127.0.0.1:4173/')","driver.goto(origin+'/')").replace("observer.goto('http://127.0.0.1:4173/?room='+room)","observer.goto(origin+'/?room='+room)")
s=s.replace('checks,samples,remote,errors,misses,snapshot','checks,samples,remote,errors,misses,transport,snapshot')
s=s.replace('checks,errors,misses,samples,state','checks,errors,misses,samples,transport,state')
s=s.replace('if(rooms)await rooms.close();','if(rooms)await rooms.close();if(fixture)await new Promise(r=>fixture.close(r));')
p.write_text(s)
